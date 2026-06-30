from fastapi import APIRouter

from .auth import router as auth_router
from .documents import router as documents_router
from .query import router as query_router
from .analytics import router as analytics_router
from .prompts import router as prompts_router
from .audit import router as audit_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(documents_router, prefix="/documents", tags=["documents"])
api_router.include_router(query_router, prefix="/query", tags=["query"])
api_router.include_router(analytics_router, prefix="/analytics", tags=["analytics"])
api_router.include_router(prompts_router, prefix="/prompts", tags=["prompts"])
api_router.include_router(audit_router, prefix="/audit", tags=["audit"])
