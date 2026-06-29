from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
import uvicorn
import os
from dotenv import load_dotenv

load_dotenv()

from database import engine, get_db, SessionLocal
from models.database import Base, QueryLog, Document
from auth.auth_handler import AuthHandler
from rag.document_processor import DocumentProcessor
from rag.retriever import HybridRetriever
from rag.hallucination_detector import HallucinationDetector
from agents.router import AgentRouter
from models.schemas import (
    LoginRequest, LoginResponse, QueryRequest, QueryResponse,
    DocumentUploadResponse, UserCreate
)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Enterprise RAG Assistant API",
    description="Hallucination-Aware Multi-Agent Enterprise RAG with RBAC",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

auth_handler = AuthHandler()
doc_processor = DocumentProcessor()
retriever = HybridRetriever()
hallucination_detector = HallucinationDetector()
agent_router = AgentRouter()

security = HTTPBearer()


@app.on_event("startup")
def on_startup():
    db = SessionLocal()
    try:
        auth_handler.seed_demo_users(db)
        doc_processor.seed_demo_documents(db)
        
        # Seed prompts if they do not exist
        from models.database import AgentPrompt
        from agents.router import AGENT_SYSTEM_PROMPTS
        names = {
            "hr": "HR Specialist",
            "legal": "Legal Counsel",
            "finance": "Finance Expert",
            "it": "IT Support",
            "general": "General Assistant"
        }
        for pid, default_prompt in AGENT_SYSTEM_PROMPTS.items():
            existing = db.query(AgentPrompt).filter(AgentPrompt.id == pid).first()
            if not existing:
                prompt_obj = AgentPrompt(
                    id=pid,
                    name=names.get(pid, pid.upper()),
                    system_prompt=default_prompt
                )
                db.add(prompt_obj)
        db.commit()
    finally:
        db.close()

@app.get("/", include_in_schema=False)
async def root():
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/docs")


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    user = auth_handler.decode_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user


# ─── Auth Endpoints ───────────────────────────────────────────────────────────

@app.post("/auth/register", response_model=dict)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    result = auth_handler.register_user(db, user)
    if not result:
        raise HTTPException(status_code=400, detail="User already exists")
    return {"message": "User registered successfully", "user_id": result}


@app.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = auth_handler.authenticate_user(db, request.email, request.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = auth_handler.create_token(user)
    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user_id=user["id"],
        role=user["role"],
        name=user["name"]
    )


# ─── Document Endpoints ───────────────────────────────────────────────────────

@app.post("/documents/upload", response_model=DocumentUploadResponse)
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


@app.get("/documents/list")
async def list_documents(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    docs = doc_processor.list_documents(db, current_user["role"])
    return {"documents": docs}


@app.post("/documents/{doc_id}/summarize")
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



# ─── Query Endpoint ───────────────────────────────────────────────────────────

@app.post("/query", response_model=QueryResponse)
async def query(request: QueryRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    # Retrieve relevant chunks (role-filtered)
    retrieved_chunks = retriever.retrieve(
        db=db,
        query=request.query,
        user_role=current_user["role"],
        top_k=5
    )

    if not retrieved_chunks:
        return QueryResponse(
            answer="I couldn't find relevant information for your query in the available documents.",
            agent="general",
            confidence_score=0.0,
            citations=[],
            hallucination_detected=False,
            sources=[]
        )

    # Route to specialized agent
    agent_response = agent_router.route_and_respond(
        query=request.query,
        chunks=retrieved_chunks,
        user_role=current_user["role"],
        target_agent=request.target_agent,
        db=db
    )

    # Hallucination detection
    hallucination_result = hallucination_detector.verify(
        query=request.query,
        response=agent_response["answer"],
        context_chunks=retrieved_chunks
    )

    final_answer = agent_response["answer"]
    if hallucination_result["hallucination_detected"]:
        final_answer = (
            "⚠️ Low confidence response — the information below may not be fully supported by available documents.\n\n"
            + final_answer
        )

    # Log query to database
    query_log = QueryLog(
        user_id=current_user["id"],
        query=request.query,
        agent=agent_response["agent"],
        confidence_score=int(hallucination_result["confidence_score"] * 100),
        hallucination_detected=hallucination_result["hallucination_detected"]
    )
    db.add(query_log)
    db.commit()

    return QueryResponse(
        answer=final_answer,
        agent=agent_response["agent"],
        confidence_score=hallucination_result["confidence_score"],
        citations=agent_response["citations"],
        hallucination_detected=hallucination_result["hallucination_detected"],
        sources=[c["source"] for c in retrieved_chunks]
    )


@app.get("/analytics")
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
    
    volume_history = []
    today = datetime.utcnow().date()
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_str = day.strftime("%a")
        
        q_count = db.query(QueryLog).filter(func.date(QueryLog.created_at) == day).count()
        d_count = db.query(Document).filter(func.date(Document.uploaded_at) == day).count()
        
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
        "volume_history": volume_history,
        "department_usage": [
            {"name": "HR", "usage": hr_count},
            {"name": "IT", "usage": it_count},
            {"name": "Legal", "usage": legal_count},
            {"name": "Finance", "usage": finance_count},
        ]
    }


@app.get("/audit")
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


# ─── Prompts Endpoints ────────────────────────────────────────────────────────
from models.schemas import PromptUpdate, PromptResponse

@app.get("/prompts/list")
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

@app.put("/prompts/{prompt_id}")
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

@app.post("/prompts/{prompt_id}/reset")
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


@app.get("/health")
async def health():
    return {"status": "healthy", "version": "1.0.0"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
