from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from database import get_db
from api.dependencies import get_current_user
from models.database import QueryLog, Document

router = APIRouter()

@router.get("")
async def get_analytics(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    # Basic analytics
    doc_count = db.query(Document).count()
    query_count = db.query(QueryLog).count()
    hallucination_count = db.query(QueryLog).filter(QueryLog.hallucination_detected == True).count()
    
    # Department usage
    hr_count = db.query(QueryLog).filter(QueryLog.agent == "hr").count()
    it_count = db.query(QueryLog).filter(QueryLog.agent == "it").count()
    legal_count = db.query(QueryLog).filter(QueryLog.agent == "legal").count()
    finance_count = db.query(QueryLog).filter(QueryLog.agent == "finance").count()
    
    hallucination_rate = f"{(hallucination_count / query_count * 100):.1f}%" if query_count > 0 else "0%"
    
    total_tokens = db.query(func.sum(QueryLog.tokens_used)).scalar() or 0
    avg_relevance = db.query(func.avg(QueryLog.context_relevance_score)).scalar() or 0
    avg_faithfulness = db.query(func.avg(QueryLog.faithfulness_score)).scalar() or 0
    
    feedback_up = db.query(QueryLog).filter(QueryLog.user_feedback == 1).count()
    feedback_down = db.query(QueryLog).filter(QueryLog.user_feedback == -1).count()
    total_feedback = feedback_up + feedback_down
    satisfaction_rate = f"{(feedback_up / total_feedback * 100):.1f}%" if total_feedback > 0 else "N/A"
    
    volume_history = []
    today = datetime.utcnow().date()
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_str = day.strftime("%a")
        day_str_full = day.strftime("%Y-%m-%d")
        
        q_count = db.query(QueryLog).filter(func.date(QueryLog.created_at) == day_str_full).count()
        d_count = db.query(Document).filter(func.date(Document.uploaded_at) == day_str_full).count()
        
        volume_history.append({
            "name": day_str,
            "queries": q_count,
            "docs": d_count
        })

    return {
        "doc_count": doc_count,
        "query_count": query_count,
        "hallucination_rate": hallucination_rate,
        "active_agents": 8,
        "total_tokens": total_tokens,
        "avg_relevance": f"{avg_relevance:.1f}%" if avg_relevance else "0%",
        "avg_faithfulness": f"{avg_faithfulness:.1f}%" if avg_faithfulness else "0%",
        "satisfaction_rate": satisfaction_rate,
        "volume_history": volume_history,
        "department_usage": [
            {"name": "HR", "usage": hr_count},
            {"name": "IT", "usage": it_count},
            {"name": "Legal", "usage": legal_count},
            {"name": "Finance", "usage": finance_count},
        ]
    }

@router.get("/audit")
async def get_audit_logs(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] not in ["admin", "hr_admin", "legal_admin", "finance_admin", "it_admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    logs = db.query(QueryLog).order_by(QueryLog.created_at.desc()).limit(50).all()
    return {"logs": [{
        "id": l.id,
        "user_id": l.user_id,
        "query": l.query,
        "agent": l.agent,
        "confidence": l.confidence_score,
        "hallucinated": l.hallucination_detected,
        "timestamp": l.created_at.isoformat()
    } for l in logs]}
