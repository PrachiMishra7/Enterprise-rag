from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from models.database import QueryLog
from database import get_db
from api.dependencies import get_current_user

router = APIRouter()

@router.get("")
async def get_audit_logs(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Only admins or specific roles might see all logs, but for now we'll just return all 
    # or limit to the user's department depending on original logic.
    # Let's return all logs ordered by newest first.
    
    logs = db.query(QueryLog).order_by(QueryLog.created_at.desc()).limit(100).all()
    
    formatted_logs = []
    for log in logs:
        formatted_logs.append({
            "id": log.id,
            "timestamp": log.created_at.isoformat(),
            "query": log.query,
            "agent": log.agent,
            "confidence": log.confidence_score,
            "hallucinated": log.hallucination_detected
        })
        
    return {"logs": formatted_logs}
