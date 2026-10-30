import io
import csv
from datetime import datetime
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any, Optional

from models.database import QueryLog, User
from database import get_db
from api.dependencies import get_current_user

router = APIRouter()

@router.get("")
async def get_audit_logs(
    start_date: Optional[str] = Query(None, description="Start date filter YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="End date filter YYYY-MM-DD"),
    agent: Optional[str] = Query(None, description="Filter by agent"),
    status: Optional[str] = Query(None, description="Filter by security status (safe, flagged)"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(QueryLog, User.name.label("user_name"), User.department.label("user_dept")).outerjoin(User, QueryLog.user_id == User.id)

    # Department scoping: Non-admins can only see logs from their department
    if current_user["role"] != "admin":
        user_dept = (current_user.get("department") or "general").lower()
        if user_dept != "general":
            query = query.filter(User.department == user_dept)

    # Datewise filtering
    if start_date:
        query = query.filter(func.date(QueryLog.created_at) >= start_date)
    if end_date:
        query = query.filter(func.date(QueryLog.created_at) <= end_date)
    if agent and agent != "All":
        query = query.filter(QueryLog.agent == agent.lower())
    if status and status != "All":
        if status == "flagged":
            query = query.filter(QueryLog.hallucination_detected == True)
        elif status == "safe":
            query = query.filter(QueryLog.hallucination_detected == False)

    logs = query.order_by(QueryLog.created_at.desc()).limit(200).all()

    formatted_logs = []
    for item in logs:
        log = item[0]
        uname = item[1] or "Unknown"
        udept = item[2] or "general"
        formatted_logs.append({
            "id": log.id,
            "timestamp": log.created_at.isoformat() if log.created_at else "",
            "date": log.created_at.strftime("%Y-%m-%d") if log.created_at else "",
            "user": uname,
            "department": udept,
            "query": log.query,
            "agent": log.agent or "general",
            "confidence": round(float(log.confidence_score or 0.0), 3),
            "tokens_used": int(log.tokens_used or 0),
            "hallucinated": bool(log.hallucination_detected)
        })

    return {"logs": formatted_logs, "total": len(formatted_logs)}


@router.get("/export")
async def export_audit_report(
    format: str = Query("csv", regex="^(csv|json)$"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate downloadable datewise enterprise audit reports directly from database.
    Only authorized administrative roles can export.
    """
    query = db.query(QueryLog, User.name.label("user_name"), User.department.label("user_dept")).outerjoin(User, QueryLog.user_id == User.id)

    if current_user["role"] != "admin":
        user_dept = (current_user.get("department") or "general").lower()
        if user_dept != "general":
            query = query.filter(User.department == user_dept)

    if start_date:
        query = query.filter(func.date(QueryLog.created_at) >= start_date)
    if end_date:
        query = query.filter(func.date(QueryLog.created_at) <= end_date)

    logs = query.order_by(QueryLog.created_at.desc()).all()

    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Query ID", "Timestamp", "User", "Department", "Agent", "Confidence", "Tokens Used", "Hallucinated", "Query Content"])
        for item in logs:
            l = item[0]
            writer.writerow([
                l.id,
                l.created_at.isoformat() if l.created_at else "",
                item[1] or "System",
                item[2] or "general",
                l.agent or "general",
                f"{l.confidence_score:.3f}" if l.confidence_score else "0.0",
                l.tokens_used or 0,
                "YES" if l.hallucination_detected else "NO",
                l.query
            ])
        csv_content = output.getvalue()
        filename = f"VeriRAG_Audit_Report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    # JSON report
    data = [{
        "id": l[0].id,
        "timestamp": l[0].created_at.isoformat() if l[0].created_at else "",
        "user": l[1] or "System",
        "department": l[2] or "general",
        "agent": l[0].agent or "general",
        "confidence": l[0].confidence_score,
        "tokens": l[0].tokens_used,
        "hallucinated": l[0].hallucination_detected,
        "query": l[0].query
    } for l in logs]
    return {"report_generated_at": datetime.utcnow().isoformat(), "total_records": len(data), "data": data}
