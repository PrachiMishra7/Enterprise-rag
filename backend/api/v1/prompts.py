from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from database import get_db
from api.dependencies import get_current_user
from models.schemas import PromptUpdate

router = APIRouter()

@router.get("/list")
async def list_prompts(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    from models.database import AgentPrompt
    prompts = db.query(AgentPrompt).all()
    return {
        "prompts": [
            {
                "id": p.id,
                "name": p.name,
                "system_prompt": p.system_prompt,
                "updated_at": p.updated_at.isoformat() if p.updated_at else datetime.utcnow().isoformat()
            } for p in prompts
        ]
    }

@router.put("/{prompt_id}")
async def update_prompt(
    prompt_id: str,
    payload: PromptUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user["role"] not in ["admin", "manager", "hr_admin", "legal_admin", "finance_admin", "it_admin"]:
        raise HTTPException(status_code=403, detail="Only admins or managers can edit system prompts")
        
    from models.database import AgentPrompt
    prompt_obj = db.query(AgentPrompt).filter(AgentPrompt.id == prompt_id).first()
    if not prompt_obj:
        raise HTTPException(status_code=404, detail="Prompt not found")
        
    prompt_obj.system_prompt = payload.system_prompt
    prompt_obj.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Prompt updated successfully", "prompt_id": prompt_id}

@router.post("/{prompt_id}/reset")
async def reset_prompt(
    prompt_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user["role"] not in ["admin", "manager", "hr_admin", "legal_admin", "finance_admin", "it_admin"]:
        raise HTTPException(status_code=403, detail="Only admins or managers can reset system prompts")
        
    from models.database import AgentPrompt
    from agents.router import AGENT_SYSTEM_PROMPTS
    
    prompt_obj = db.query(AgentPrompt).filter(AgentPrompt.id == prompt_id).first()
    if not prompt_obj:
        raise HTTPException(status_code=404, detail="Prompt not found")
        
    default_prompt = AGENT_SYSTEM_PROMPTS.get(prompt_id)
    if not default_prompt:
        raise HTTPException(status_code=400, detail="No default prompt defined for this agent")
        
    prompt_obj.system_prompt = default_prompt
    prompt_obj.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Prompt reset to default successfully", "prompt_id": prompt_id}
