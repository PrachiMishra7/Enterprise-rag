import os
import requests
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from database import get_db
from api.dependencies import get_current_user
from models.database import Document, DocumentChunk

router = APIRouter()

def get_groq_response(system_prompt: str, user_prompt: str, max_tokens: int = 1000) -> str:
    groq_api_key = os.environ.get("GROQ_API_KEY", "")
    if not groq_api_key:
        return f"*(Mock Response: GROQ_API_KEY not set)*\n\nSystem: {system_prompt}\nUser: {user_prompt}"
        
    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {groq_api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.1-8b-instant",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": 0.2,
                "max_tokens": max_tokens
            },
            timeout=30
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

def get_document_text(db: Session, doc_id: str, max_chunks: int = 10) -> str:
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail=f"Document {doc_id} not found")
        
    chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc_id).order_by(DocumentChunk.chunk_index).limit(max_chunks).all()
    if not chunks:
        return "No text available."
    return "\n\n".join([c.text for c in chunks])

class FAQRequest(BaseModel):
    document_id: str

@router.post("/generate-faq")
async def generate_faq(request: FAQRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    text = get_document_text(db, request.document_id)
    system_prompt = "You are an enterprise AI. Generate a professional 5-question FAQ based on the provided document. Format as Markdown with clear Q&A."
    user_prompt = f"Document content:\n{text}"
    result = get_groq_response(system_prompt, user_prompt)
    return {"result": result}

class CompareRequest(BaseModel):
    document_id_1: str
    document_id_2: str

@router.post("/compare-policies")
async def compare_policies(request: CompareRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    text1 = get_document_text(db, request.document_id_1)
    text2 = get_document_text(db, request.document_id_2)
    system_prompt = "You are an enterprise analyst. Compare the two provided documents. Highlight similarities, differences, and key policy changes. Format as Markdown."
    user_prompt = f"Document 1:\n{text1}\n\nDocument 2:\n{text2}"
    result = get_groq_response(system_prompt, user_prompt, max_tokens=1500)
    return {"result": result}

class QARequest(BaseModel):
    document_id: str
    question: str

@router.post("/document-qa")
async def document_qa(request: QARequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    text = get_document_text(db, request.document_id)
    system_prompt = "You are a highly precise AI assistant. Answer the user's question concisely and accurately using ONLY the provided document context. Do not include any extra conversational filler, unrelated policy details, or information not found in the text. If the answer is not in the document, reply exactly with 'The provided document does not contain this information.'"
    user_prompt = f"Context:\n{text}\n\nQuestion: {request.question}"
    result = get_groq_response(system_prompt, user_prompt)
    return {"result": result}

class EmailRequest(BaseModel):
    document_id: Optional[str] = None
    scenario: str

@router.post("/draft-email")
async def draft_email(request: EmailRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    text = ""
    if request.document_id:
        text = get_document_text(db, request.document_id)
        
    system_prompt = "You are an AI assistant helping draft a professional corporate email based on the user's scenario and context provided."
    user_prompt = f"Scenario: {request.scenario}\n\nContext (if any):\n{text}"
    result = get_groq_response(system_prompt, user_prompt)
    return {"result": result}

class ReportRequest(BaseModel):
    document_ids: List[str]
    topic: str

@router.post("/generate-report")
async def generate_report(request: ReportRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if not request.document_ids:
        raise HTTPException(status_code=400, detail="Must provide at least one document ID")
        
    texts = []
    for d_id in request.document_ids[:3]:
        texts.append(get_document_text(db, d_id, max_chunks=5))
        
    combined_text = "\n\n---\n\n".join(texts)
    system_prompt = "You are an expert corporate strategist. Write a comprehensive, structured report (with executive summary, key findings, and recommendations) on the requested topic using the provided documents."
    user_prompt = f"Topic: {request.topic}\n\nSource Documents:\n{combined_text}"
    result = get_groq_response(system_prompt, user_prompt, max_tokens=2000)
    return {"result": result}
