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
                "model": os.environ.get("GROQ_MODEL", "openai/gpt-oss-20b"),
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

@router.patch("/{doc_id}/access")
async def update_document_access(
    doc_id: str,
    payload: dict,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from models.database import Document, DocumentChunk
    allowed_roles = ["admin", "hr_admin", "manager"]
    if current_user.get("role") not in allowed_roles:
        raise HTTPException(status_code=403, detail="Insufficient permissions to change document access policies")

    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    new_access = payload.get("access_level")
    new_dept = payload.get("department")

    if new_access:
        doc.access_level = new_access
        db.query(DocumentChunk).filter(DocumentChunk.document_id == doc_id).update({"access_level": new_access})

    if new_dept:
        doc.department = new_dept
        db.query(DocumentChunk).filter(DocumentChunk.document_id == doc_id).update({"department": new_dept})

    db.commit()
    db.refresh(doc)
    return {
        "message": "Access policy updated successfully",
        "document_id": doc.id,
        "access_level": doc.access_level,
        "department": doc.department
    }

@router.delete("/{doc_id}")
async def delete_document(
    doc_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from models.database import Document, DocumentChunk
    allowed_roles = ["admin", "hr_admin"]
    if current_user.get("role") not in allowed_roles:
        raise HTTPException(status_code=403, detail="Only admins can delete enterprise documents")

    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    db.query(DocumentChunk).filter(DocumentChunk.document_id == doc_id).delete()
    db.delete(doc)
    db.commit()
    return {"message": "Document deleted from RAG index", "document_id": doc_id}

@router.get("/{doc_id}/content")
async def get_document_content(
    doc_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve full reconstructed text and chunk segments of a document (with RBAC enforcement)."""
    from models.database import Document, DocumentChunk
    from rag.document_processor import ROLE_ACCESS_MAP

    # Support looking up either by UUID doc_id or by filename
    doc = db.query(Document).filter((Document.id == doc_id) | (Document.filename == doc_id)).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    user_role = current_user.get("role", "employee")
    allowed_access = ROLE_ACCESS_MAP.get(user_role, ["employee"])
    if doc.access_level not in allowed_access and user_role != "admin":
        raise HTTPException(status_code=403, detail="You do not have clearance to view this document")

    chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).order_by(DocumentChunk.chunk_index).all()
    full_text = "\n\n".join([c.text for c in chunks]) if chunks else ""

    return {
        "id": doc.id,
        "filename": doc.filename,
        "department": doc.department,
        "access_level": doc.access_level,
        "chunks_count": len(chunks),
        "uploaded_at": doc.uploaded_at.isoformat() if doc.uploaded_at else None,
        "content": full_text,
        "chunks": [{"index": c.chunk_index, "text": c.text} for c in chunks],
        "file_url": doc.file_url,
        "storage_path": doc.storage_path,
        "file_size": doc.file_size or len(full_text.encode('utf-8')),
        "mime_type": doc.mime_type or "text/plain"
    }

@router.get("/{doc_id}/download")
async def download_document(
    doc_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download the actual original binary file from Supabase Storage, or fallback to reconstructed text."""
    from fastapi.responses import Response
    from models.database import Document, DocumentChunk
    from rag.document_processor import ROLE_ACCESS_MAP
    from rag.storage import SupabaseStorageManager
    import mimetypes

    doc = db.query(Document).filter((Document.id == doc_id) | (Document.filename == doc_id)).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    user_role = current_user.get("role", "employee")
    allowed_access = ROLE_ACCESS_MAP.get(user_role, ["employee"])
    if doc.access_level not in allowed_access and user_role != "admin":
        raise HTTPException(status_code=403, detail="You do not have clearance to download this document")

    # Attempt to retrieve real original binary file from Supabase Storage
    if doc.storage_path:
        storage_mgr = SupabaseStorageManager()
        raw_bytes = storage_mgr.download_file(doc.storage_path)
        if raw_bytes is not None:
            mime = doc.mime_type or mimetypes.guess_type(doc.filename)[0] or "application/octet-stream"
            return Response(
                content=raw_bytes,
                media_type=mime,
                headers={"Content-Disposition": f'attachment; filename="{doc.filename}"'}
            )

    # Fallback: serve reconstructed text from chunks
    chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).order_by(DocumentChunk.chunk_index).all()
    full_text = "\n\n".join([c.text for c in chunks]) if chunks else ""

    filename = doc.filename if doc.filename.endswith((".txt", ".md", ".json")) else f"{doc.filename}.txt"
    return Response(
        content=full_text,
        media_type="text/plain; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

