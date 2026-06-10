from pydantic import BaseModel, EmailStr
from typing import Optional, List


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    role: str
    name: str


class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str = "employee"  # employee | manager | hr_admin | legal_admin | finance_admin | it_admin | admin
    department: str = "general"


class QueryRequest(BaseModel):
    query: str
    department: Optional[str] = None


class Citation(BaseModel):
    text: str
    source: str
    page: Optional[int] = None


class QueryResponse(BaseModel):
    answer: str
    agent: str
    confidence_score: float
    citations: List[Citation]
    hallucination_detected: bool
    sources: List[str]


class DocumentUploadResponse(BaseModel):
    document_id: str
    filename: str
    chunks_created: int
    department: str
    message: str
