from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import uvicorn
import os
from dotenv import load_dotenv

load_dotenv()

from database import engine, get_db, SessionLocal
from models.database import Base
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
        user_role=current_user["role"]
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

    return QueryResponse(
        answer=final_answer,
        agent=agent_response["agent"],
        confidence_score=hallucination_result["confidence_score"],
        citations=agent_response["citations"],
        hallucination_detected=hallucination_result["hallucination_detected"],
        sources=[c["source"] for c in retrieved_chunks]
    )


@app.get("/health")
async def health():
    return {"status": "healthy", "version": "1.0.0"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
