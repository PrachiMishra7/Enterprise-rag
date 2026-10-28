"""
Migration script: Exports all data from SQLite enterprise_rag.db and pushes it directly into Supabase PostgreSQL.
Run:
    python migrate_to_supabase.py "postgresql://postgres:[YOUR-PASSWORD]@db.rxzlolfajonozvvszumt.supabase.co:5432/postgres"
"""
import sys
import json
import sqlite3
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

def migrate(supabase_url: str):
    print("Connecting to Supabase PostgreSQL...")
    engine_pg = create_engine(
        supabase_url,
        connect_args={"connect_timeout": 30},
        pool_pre_ping=True
    )
    
    # Enable pgvector if not enabled
    with engine_pg.connect() as conn:
        print("Ensuring pgvector extension...")
        try:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            conn.commit()
            print("pgvector extension ready.")
        except Exception as e:
            print("Extension note:", e)

    # Import Base and models to build schema in Supabase
    from models.database import Base, User, Document, DocumentChunk, QueryLog, AgentPrompt
    Base.metadata.create_all(bind=engine_pg)
    print("Schema created in Supabase PostgreSQL.")

    # Source SQLite session
    from database import SessionLocal as SQLiteSession
    src_db = SQLiteSession()
    
    SessionPG = sessionmaker(bind=engine_pg)
    dest_db = SessionPG()

    try:
        # 1. Users
        users = src_db.query(User).all()
        for u in users:
            if not dest_db.query(User).filter(User.id == u.id).first():
                dest_db.merge(User(
                    id=u.id,
                    name=u.name,
                    email=u.email,
                    password_hash=u.password_hash,
                    role=u.role,
                    department=u.department,
                    created_at=u.created_at
                ))
        dest_db.commit()
        print(f"Migrated {len(users)} Users.")

        # 2. Documents
        docs = src_db.query(Document).all()
        for d in docs:
            if not dest_db.query(Document).filter(Document.id == d.id).first():
                dest_db.merge(Document(
                    id=d.id,
                    filename=d.filename,
                    department=d.department,
                    access_level=d.access_level,
                    uploaded_by=d.uploaded_by,
                    uploaded_at=d.uploaded_at,
                    chunks_count=d.chunks_count
                ))
        dest_db.commit()
        print(f"Migrated {len(docs)} Documents.")

        # 3. Document Chunks (with embeddings)
        chunks = src_db.query(DocumentChunk).all()
        for c in chunks:
            if not dest_db.query(DocumentChunk).filter(DocumentChunk.id == c.id).first():
                emb = c.embedding
                if isinstance(emb, str):
                    try:
                        emb = json.loads(emb)
                    except Exception:
                        pass
                dest_db.merge(DocumentChunk(
                    id=c.id,
                    document_id=c.document_id,
                    source=c.source,
                    department=c.department,
                    access_level=c.access_level,
                    text=c.text,
                    chunk_index=c.chunk_index,
                    embedding=emb
                ))
        dest_db.commit()
        print(f"Migrated {len(chunks)} Document Chunks.")

        # 4. Agent Prompts
        prompts = src_db.query(AgentPrompt).all()
        for p in prompts:
            if not dest_db.query(AgentPrompt).filter(AgentPrompt.id == p.id).first():
                dest_db.merge(AgentPrompt(
                    id=p.id,
                    name=p.name,
                    system_prompt=p.system_prompt,
                    updated_at=p.updated_at
                ))
        dest_db.commit()
        print(f"Migrated {len(prompts)} Agent Prompts.")

        # 5. Query Logs
        logs = src_db.query(QueryLog).all()
        for q in logs:
            if not dest_db.query(QueryLog).filter(QueryLog.id == q.id).first():
                dest_db.merge(QueryLog(
                    id=q.id,
                    user_id=q.user_id,
                    query=q.query,
                    agent=q.agent,
                    confidence_score=q.confidence_score,
                    hallucination_detected=q.hallucination_detected,
                    tokens_used=q.tokens_used,
                    user_feedback=q.user_feedback,
                    context_relevance_score=q.context_relevance_score,
                    faithfulness_score=q.faithfulness_score,
                    created_at=q.created_at
                ))
        dest_db.commit()
        print(f"Migrated {len(logs)} Query Logs.")

        print("\nAll data successfully migrated to Supabase PostgreSQL!")
    finally:
        src_db.close()
        dest_db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python migrate_to_supabase.py <SUPABASE_POSTGRES_DATABASE_URL>")
        sys.exit(1)
    migrate(sys.argv[1])
