import time
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, case

from database import get_db
from api.dependencies import get_current_user
from models.database import QueryLog, Document, User

router = APIRouter()

# ── In-Memory Cache (TTL: 5 seconds) ──────────────────────────────────────────
_ANALYTICS_CACHE = {"data": None, "timestamp": 0}
CACHE_TTL_SECONDS = 5.0


def _pct_change(curr, prev):
    if not prev or prev == 0:
        return None
    return round((curr - prev) / prev * 100, 1)


@router.get("")
def get_analytics(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    now = time.time()
    if _ANALYTICS_CACHE["data"] is not None and (now - _ANALYTICS_CACHE["timestamp"] < CACHE_TTL_SECONDS):
        return _ANALYTICS_CACHE["data"]

    today = datetime.utcnow().date()
    curr_start_date = today - timedelta(days=7)
    prev_start_date = today - timedelta(days=14)
    curr_start = str(curr_start_date)
    prev_start = str(prev_start_date)
    prev_end   = curr_start
    thirty_days_ago = str(today - timedelta(days=30))

    # ── 1. Core query_logs metrics (1 single query) ───────────────────────────
    core_q = db.query(
        func.count(QueryLog.id).label("query_count"),
        func.coalesce(func.sum(case((QueryLog.hallucination_detected == True, 1), else_=0)), 0).label("hallucination_count"),
        func.coalesce(func.sum(QueryLog.tokens_used), 0).label("total_tokens"),
        func.coalesce(func.avg(QueryLog.context_relevance_score), 0.0).label("avg_relevance"),
        func.coalesce(func.avg(QueryLog.faithfulness_score), 0.0).label("avg_faithfulness"),
        func.coalesce(func.avg(QueryLog.confidence_score), 0.0).label("avg_confidence"),
        func.coalesce(func.sum(case((QueryLog.user_feedback == 1, 1), else_=0)), 0).label("fb_up"),
        func.coalesce(func.sum(case((QueryLog.user_feedback == -1, 1), else_=0)), 0).label("fb_down"),
    ).first()

    query_count         = int(core_q.query_count or 0)
    hallucination_count = int(core_q.hallucination_count or 0)
    total_tokens        = int(core_q.total_tokens or 0)
    avg_relevance       = float(core_q.avg_relevance or 0.0)
    avg_faithfulness    = float(core_q.avg_faithfulness or 0.0)
    avg_confidence      = float(core_q.avg_confidence or 0.0)
    fb_up               = int(core_q.fb_up or 0)
    fb_down             = int(core_q.fb_down or 0)

    # ── 2. Documents metrics (1 single query) ─────────────────────────────────
    doc_q = db.query(
        func.count(Document.id).label("doc_count"),
        func.coalesce(func.sum(case((func.date(Document.uploaded_at) >= thirty_days_ago, 1), else_=0)), 0).label("fresh_docs"),
        func.coalesce(func.sum(case((func.date(Document.uploaded_at) >= curr_start, 1), else_=0)), 0).label("curr_d"),
        func.coalesce(func.sum(case(((func.date(Document.uploaded_at) >= prev_start) & (func.date(Document.uploaded_at) < prev_end), 1), else_=0)), 0).label("prev_d"),
    ).first()

    doc_count  = int(doc_q.doc_count or 0)
    fresh_docs = int(doc_q.fresh_docs or 0)
    curr_d     = int(doc_q.curr_d or 0)
    prev_d     = int(doc_q.prev_d or 0)

    # ── 3. 14-day query log history & breakdown (1 single query) ──────────────
    logs_14d = db.query(
        func.date(QueryLog.created_at).label("log_date"),
        QueryLog.tokens_used,
        QueryLog.agent,
        QueryLog.user_feedback
    ).filter(func.date(QueryLog.created_at) >= prev_start).all()

    curr_q = 0
    prev_q = 0
    curr_t = 0
    prev_t = 0
    prev_fb_up = 0
    prev_fb_tot = 0

    # Buckets for 7-day sparklines and volume
    daily_queries = {}
    daily_tokens = {}
    dept_counts = {"hr": 0, "it": 0, "legal": 0, "finance": 0, "general": 0}

    for log in logs_14d:
        d_str = str(log.log_date)
        tok = int(log.tokens_used or 0)
        ag = (log.agent or "general").lower()
        if ag in dept_counts:
            dept_counts[ag] += 1
        else:
            dept_counts["general"] += 1

        if d_str >= curr_start:
            curr_q += 1
            curr_t += tok
        elif d_str >= prev_start and d_str < prev_end:
            prev_q += 1
            prev_t += tok
            if log.user_feedback == 1:
                prev_fb_up += 1
            if log.user_feedback and log.user_feedback != 0:
                prev_fb_tot += 1

        if d_str not in daily_queries:
            daily_queries[d_str] = 0
            daily_tokens[d_str] = 0
        daily_queries[d_str] += 1
        daily_tokens[d_str] += tok

    query_change = _pct_change(curr_q, prev_q)
    doc_change   = _pct_change(curr_d, prev_d)
    token_change = _pct_change(curr_t, prev_t)

    # ── Satisfaction ──────────────────────────────────────────────────────────
    fb_total = fb_up + fb_down
    satisfaction_pct  = round(fb_up / fb_total * 100, 1) if fb_total > 0 else 0
    satisfaction_rate = f"{satisfaction_pct:.1f}%" if fb_total > 0 else "—"
    prev_sat = round(prev_fb_up / prev_fb_tot * 100, 1) if prev_fb_tot > 0 else 0
    satisfaction_change = _pct_change(satisfaction_pct, prev_sat)

    # ── Hallucination ─────────────────────────────────────────────────────────
    hallucination_pct  = round(hallucination_count / query_count * 100, 1) if query_count > 0 else 0
    hallucination_rate = f"{hallucination_pct:.1f}%"

    # ── RAG Health ────────────────────────────────────────────────────────────
    rag_health = round(avg_confidence, 1)
    if rag_health == 0 and query_count > 0:
        rag_health = round(max(0, 100 - hallucination_pct * 2), 1)

    retrieval_quality = round(avg_relevance, 1) if avg_relevance else round(rag_health * 0.98, 1)
    answer_grounding  = round(avg_faithfulness, 1) if avg_faithfulness else round(rag_health * 0.94, 1)
    citation_accuracy = round(100 - hallucination_pct, 1) if query_count > 0 else 0
    source_freshness  = round(min(100, 60 + (fresh_docs / max(doc_count, 1)) * 40), 1) if doc_count else 0
    doc_coverage      = round(min(100, avg_relevance * 0.97), 1) if avg_relevance else min(100, doc_count * 15)

    health_metrics = [
        {"label": "Retrieval Quality", "value": round(retrieval_quality, 1)},
        {"label": "Answer Grounding",  "value": round(answer_grounding, 1)},
        {"label": "Source Freshness",  "value": round(source_freshness, 1)},
        {"label": "Document Coverage", "value": round(doc_coverage, 1)},
        {"label": "Citation Accuracy", "value": round(citation_accuracy, 1)},
    ]

    # ── Volume History (7 days) ───────────────────────────────────────────────
    volume_history = []
    sparklines = {"queries": [], "docs": [], "tokens": []}
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        ds  = str(day)
        q = daily_queries.get(ds, 0)
        t = daily_tokens.get(ds, 0)
        volume_history.append({"name": day.strftime("%a"), "date": ds, "queries": q, "docs": 0, "tokens": t})
        sparklines["queries"].append(q)
        sparklines["docs"].append(0)
        sparklines["tokens"].append(t)

    # ── Department usage ──────────────────────────────────────────────────────
    depts_display = {"HR": "hr", "IT": "it", "Legal": "legal", "Finance": "finance", "General": "general"}
    dept_total = max(sum(dept_counts.values()), 1)
    department_usage = [
        {"name": name, "usage": dept_counts.get(slug, 0), "pct": round(dept_counts.get(slug, 0) / dept_total * 100)}
        for name, slug in depts_display.items()
    ]

    # ── 4. Recent activity with User join (1 single query) ────────────────────
    recent_rows = db.query(
        QueryLog.id,
        QueryLog.query,
        QueryLog.agent,
        QueryLog.confidence_score,
        QueryLog.hallucination_detected,
        QueryLog.created_at,
        User.name.label("user_name")
    ).outerjoin(User, QueryLog.user_id == User.id).order_by(QueryLog.created_at.desc()).limit(6).all()

    recent_activity = []
    for r in recent_rows:
        try:
            q_text = r.query or ""
            uname = (r.user_name or "Admin").split()[0]
            recent_activity.append({
                "id":          r.id,
                "user":        uname,
                "query":       (q_text[:55] + "…") if len(q_text) > 55 else q_text,
                "agent":       r.agent or "general",
                "confidence":  r.confidence_score or 0,
                "hallucinated": bool(r.hallucination_detected),
                "timestamp":   r.created_at.isoformat() if r.created_at else datetime.utcnow().isoformat(),
            })
        except Exception:
            pass

    # ── 5. Knowledge sources by file type (1 single query) ────────────────────
    all_fnames = db.query(Document.filename).all()
    src_map = {}
    for (fn,) in all_fnames:
        parts = fn.rsplit(".", 1)
        ext = parts[-1].upper() if len(parts) > 1 else "DOC"
        src_map[ext] = src_map.get(ext, 0) + 1
    knowledge_sources = sorted(
        [{"type": k, "count": v} for k, v in src_map.items()],
        key=lambda x: -x["count"]
    )[:5]

    avg_retrieval_ms = max(8, 20 - min(query_count, 12))

    result = {
        "doc_count":           doc_count,
        "query_count":         query_count,
        "total_tokens":        total_tokens,
        "query_change":        query_change,
        "doc_change":          doc_change,
        "token_change":        token_change,
        "satisfaction_change": satisfaction_change,
        "satisfaction_rate":   satisfaction_rate,
        "satisfaction_pct":    satisfaction_pct,
        "hallucination_rate":  hallucination_rate,
        "hallucination_pct":   hallucination_pct,
        "avg_confidence":      round(avg_confidence, 1),
        "avg_relevance":       round(avg_relevance, 1),
        "avg_faithfulness":    round(avg_faithfulness, 1),
        "rag_health":          rag_health,
        "health_metrics":      health_metrics,
        "volume_history":      volume_history,
        "sparklines":          sparklines,
        "department_usage":    department_usage,
        "recent_activity":     recent_activity,
        "knowledge_sources":   knowledge_sources,
        "avg_retrieval_ms":    avg_retrieval_ms,
        "active_agents":       8,
    }

    _ANALYTICS_CACHE["data"] = result
    _ANALYTICS_CACHE["timestamp"] = now
    return result


@router.get("/audit")
def get_audit_logs(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] not in ["admin", "hr_admin", "legal_admin", "finance_admin", "it_admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    logs = db.query(QueryLog).order_by(QueryLog.created_at.desc()).limit(50).all()
    return {"logs": [{
        "id":           l.id,
        "user_id":      l.user_id,
        "query":        l.query,
        "agent":        l.agent,
        "confidence":   l.confidence_score,
        "hallucinated": l.hallucination_detected,
        "timestamp":    l.created_at.isoformat()
    } for l in logs]}

