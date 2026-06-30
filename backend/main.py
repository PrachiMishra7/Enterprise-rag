from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv

load_dotenv()

from database import engine, SessionLocal
from models.database import Base
from auth.auth_handler import AuthHandler
from rag.document_processor import DocumentProcessor
from api.v1 import api_router

# Keep this for now, will be removed when Alembic is fully configured
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

app.include_router(api_router)

@app.on_event("startup")
def on_startup():
    db = SessionLocal()
    try:
        auth_handler = AuthHandler()
        doc_processor = DocumentProcessor()
        
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

@app.get("/health")
async def health():
    return {"status": "healthy", "version": "1.0.0"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
