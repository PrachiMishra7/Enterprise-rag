from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey, Text, event
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from database import Base, engine

# Use pgvector's Vector type for PostgreSQL, plain Text for SQLite
def _get_embedding_column():
    if engine.dialect.name == "postgresql":
        try:
            from pgvector.sqlalchemy import Vector
            return Column(Vector(384))
        except Exception:
            pass
    return Column(Text, nullable=True)  # SQLite fallback: store as JSON string

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="employee")
    department = Column(String, default="general")
    created_at = Column(DateTime, default=datetime.utcnow)

    documents = relationship("Document", back_populates="uploader")

class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=generate_uuid)
    filename = Column(String, nullable=False)
    department = Column(String, default="general", index=True)
    access_level = Column(String, default="employee", index=True)
    uploaded_by = Column(String, ForeignKey("users.id"))
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    chunks_count = Column(Integer, default=0)
    storage_path = Column(String, nullable=True)
    file_url = Column(String, nullable=True)
    file_size = Column(Integer, default=0)
    mime_type = Column(String, nullable=True)

    uploader = relationship("User", back_populates="documents")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(String, primary_key=True, default=generate_uuid)
    document_id = Column(String, ForeignKey("documents.id"))
    source = Column(String, nullable=False)
    department = Column(String, default="general", index=True)
    access_level = Column(String, default="employee", index=True)
    text = Column(Text, nullable=False)
    chunk_index = Column(Integer, default=0)
    embedding = _get_embedding_column()  # Vector(384) on PG, Text on SQLite

    document = relationship("Document", back_populates="chunks")

class QueryLog(Base):
    __tablename__ = "query_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    query = Column(String, nullable=False)
    answer = Column(Text, nullable=True) # Full AI response stored in DB
    citations = Column(Text, nullable=True) # JSON serialized citations stored in DB
    agent = Column(String, default="general")
    confidence_score = Column(Integer, default=0) # Storing as 0-100 integer for simplicity
    hallucination_detected = Column(Boolean, default=False)
    tokens_used = Column(Integer, default=0)
    user_feedback = Column(Integer, default=0)
    context_relevance_score = Column(Integer, default=0)
    faithfulness_score = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")

class AgentPrompt(Base):
    __tablename__ = "agent_prompts"

    id = Column(String, primary_key=True) # e.g. 'hr', 'legal', 'finance', 'it', 'general'
    name = Column(String, nullable=False)
    system_prompt = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class SystemSetting(Base):
    __tablename__ = "system_settings"

    key = Column(String, primary_key=True)
    value = Column(Text, nullable=False)
    description = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class DataConnector(Base):
    __tablename__ = "data_connectors"

    id = Column(String, primary_key=True) # e.g. 'gdrive', 'slack', 'github', 'notion', 'confluence'
    name = Column(String, nullable=False)
    desc = Column(String, nullable=False)
    status = Column(String, default="disconnected") # 'connected', 'disconnected', 'configuring'
    last_sync = Column(String, default="Never")
    doc_count = Column(Integer, default=0)
    config = Column(Text, nullable=True) # JSON configuration
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

