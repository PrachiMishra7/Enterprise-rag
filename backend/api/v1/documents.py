from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
import os

from database import get_db
from api.dependencies import get_current_user
from rag.document_processor import DocumentProcessor
from rag.retriever import HybridRetriever
from models.schemas import DocumentUploadResponse

router = APIRouter()
doc_processor = DocumentProcessor()
retriever = HybridRetriever()

@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    department: str = "general",
    access_level: str = "employee",
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    allowed_roles = ["hr_admin", "manager", "admin"]
    if current_user["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Insufficient permissions to upload documents")

    content = await file.read()
    result = doc_processor.process_document(
        db=db,
        content=content,
        filename=file.filename,
        department=department,
        access_level=access_level,
        uploaded_by=current_user["id"]
    )
    retriever.add_documents(result["chunks"], result["metadata"])
    return DocumentUploadResponse(
        document_id=result["document_id"],
        filename=file.filename,
        chunks_created=result["chunks_count"],
        department=department,
        message="Document processed and indexed successfully"
    )

@router.get("/list")
async def list_documents(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    docs = doc_processor.list_documents(db, current_user["role"])
    return {"documents": docs}

@router.post("/{doc_id}/summarize")
async def summarize_document(
    doc_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from models.database import Document, DocumentChunk
    import requests
    
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc_id).order_by(DocumentChunk.chunk_index).all()
    if not chunks:
        raise HTTPException(status_code=404, detail="No chunks found for this document")
        
    full_text = "\n\n".join([c.text for c in chunks[:5]])
    
    groq_api_key = os.environ.get("GROQ_API_KEY", "")
    if not groq_api_key:
        return {"summary": f"### Document Summary: {doc.filename}\n\n*This is a mock summary because GROQ_API_KEY is not set.*\n\n- **Filename**: {doc.filename}\n- **Chunks**: {len(chunks)} segments indexed\n- **Department**: {doc.department.upper()}\n- **Access Level**: {doc.access_level.upper()}\n\n**Key Takeaway**: Ensure API keys are configured to unlock real-time Groq LLM summarization."}
        
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
                    {"role": "system", "content": "You are a professional enterprise document summarizer. Generate a concise, highly-structured executive summary of the document with 3-4 bullet points highlighting key insights, security scope, and corporate relevance."},
                    {"role": "user", "content": f"Document: {doc.filename}\nDepartment: {doc.department}\nAccess Level: {doc.access_level}\n\nContent:\n{full_text}"}
                ],
                "temperature": 0.3,
                "max_tokens": 400
            },
            timeout=30,
            verify=False
        )
        response.raise_for_status()
        summary = response.json()["choices"][0]["message"]["content"]
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate summary: {str(e)}")
