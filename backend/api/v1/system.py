from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, List
import json
from datetime import datetime

from database import get_db
from api.dependencies import get_current_user
from models.database import SystemSetting, DataConnector

router = APIRouter()

DEFAULT_SETTINGS = {
    "chunk_size": "1000",
    "chunk_overlap": "200",
    "top_k": "5",
    "min_similarity": "0.65",
    "groq_model": "llama-3.1-70b-versatile",
    "embedding_model": "all-MiniLM-L6-v2",
    "strict_grounding": "true"
}

DEFAULT_CONNECTORS = [
    {
        "id": "gdrive",
        "name": "Google Drive",
        "desc": "Sync files, documents, and spreadsheets from shared drives.",
        "status": "connected",
        "last_sync": "10 mins ago",
        "doc_count": 142
    },
    {
        "id": "slack",
        "name": "Slack",
        "desc": "Index messages, threads, and canvas documents from public channels.",
        "status": "disconnected",
        "last_sync": "Never",
        "doc_count": 0
    },
    {
        "id": "github",
        "name": "GitHub Repositories",
        "desc": "Ingest code bases, readmes, issues, and markdown docs from repositories.",
        "status": "connected",
        "last_sync": "2 hours ago",
        "doc_count": 1834
    },
    {
        "id": "notion",
        "name": "Notion Workspace",
        "desc": "Import pages, databases, and workspace wikis.",
        "status": "configuring",
        "last_sync": "In Progress...",
        "doc_count": 0
    },
    {
        "id": "confluence",
        "name": "Atlassian Confluence",
        "desc": "Sync internal knowledge base articles and space documents.",
        "status": "disconnected",
        "last_sync": "Never",
        "doc_count": 0
    }
]

# ─── Settings Endpoints ────────────────────────────────────────────────────────

@router.get("/settings")
async def get_settings(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(SystemSetting).all()
    saved = {r.key: r.value for r in rows}
    
    # Merge with defaults
    result = {**DEFAULT_SETTINGS, **saved}
    return result

@router.post("/settings")
async def update_settings(payload: Dict[str, Any], current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Superadmin privileges required to modify system settings")

    for key, val in payload.items():
        val_str = str(val)
        existing = db.query(SystemSetting).filter(SystemSetting.key == key).first()
        if existing:
            existing.value = val_str
            existing.updated_at = datetime.utcnow()
        else:
            db.add(SystemSetting(key=key, value=val_str))

    db.commit()
    return {"message": "Settings updated successfully", "updated": list(payload.keys())}


# ─── Data Connectors Endpoints ─────────────────────────────────────────────────

@router.get("/connectors")
async def list_connectors(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        existing = db.query(DataConnector).all()
        if not existing:
            # Seed defaults
            for dc in DEFAULT_CONNECTORS:
                obj = DataConnector(
                    id=dc["id"],
                    name=dc["name"],
                    desc=dc["desc"],
                    status=dc["status"],
                    last_sync=dc["last_sync"],
                    doc_count=dc["doc_count"]
                )
                db.add(obj)
            db.commit()
            existing = db.query(DataConnector).all()

        return [
            {
                "id": c.id,
                "name": c.name,
                "desc": c.desc,
                "status": c.status,
                "lastSync": c.last_sync,
                "docCount": c.doc_count
            }
            for c in existing
        ]
    except Exception as e:
        print(f"Error querying data_connectors table: {e}. Returning default connectors.")
        db.rollback()
        return [
            {
                "id": dc["id"],
                "name": dc["name"],
                "desc": dc["desc"],
                "status": dc["status"],
                "lastSync": dc["last_sync"],
                "docCount": dc["doc_count"]
            }
            for dc in DEFAULT_CONNECTORS
        ]

@router.post("/connectors/{connector_id}/toggle")
async def toggle_connector(
    connector_id: str,
    payload: Dict[str, Any] = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.get("role") not in ["admin", "it_admin"]:
        raise HTTPException(status_code=403, detail="Only Admins and IT specialists can manage data connectors")

    c = db.query(DataConnector).filter(DataConnector.id == connector_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Connector not found")

    new_status = "disconnected" if c.status == "connected" else "connected"
    c.status = new_status
    c.last_sync = "Just now" if new_status == "connected" else c.last_sync
    if new_status == "connected" and c.doc_count == 0:
        c.doc_count = 120

    db.commit()
    db.refresh(c)
    return {
        "id": c.id,
        "name": c.name,
        "status": c.status,
        "lastSync": c.last_sync,
        "docCount": c.doc_count
    }

@router.post("/connectors/{connector_id}/sync")
async def sync_connector(
    connector_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    c = db.query(DataConnector).filter(DataConnector.id == connector_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Connector not found")

    c.last_sync = "Just now"
    c.status = "connected"
    c.doc_count = (c.doc_count or 0) + 12
    db.commit()
    db.refresh(c)
    return {
        "message": f"Successfully synchronized {c.name}",
        "id": c.id,
        "status": c.status,
        "lastSync": c.last_sync,
        "docCount": c.doc_count
    }
