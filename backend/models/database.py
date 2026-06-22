from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from database import Base

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

    document = relationship("Document", back_populates="chunks")

class QueryLog(Base):
    __tablename__ = "query_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    query = Column(String, nullable=False)
    agent = Column(String, default="general")
    confidence_score = Column(Integer, default=0) # Storing as 0-100 integer for simplicity
    hallucination_detected = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")

class AgentPrompt(Base):
    __tablename__ = "agent_prompts"

    id = Column(String, primary_key=True) # e.g. 'hr', 'legal', 'finance', 'it', 'general'
    name = Column(String, nullable=False)
    system_prompt = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

