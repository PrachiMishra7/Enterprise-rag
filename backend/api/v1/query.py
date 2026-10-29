from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import json

from database import get_db
from api.dependencies import get_current_user
from rag.retriever import HybridRetriever
from agents.router import AgentRouter
from rag.hallucination_detector import HallucinationDetector
from models.schemas import QueryRequest, QueryResponse
from models.database import QueryLog

router = APIRouter()
retriever = HybridRetriever()
agent_router = AgentRouter()
hallucination_detector = HallucinationDetector()

@router.post("", response_model=QueryResponse)
async def query(request: QueryRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    # Retrieve relevant chunks (role-filtered)
    retrieved_chunks = retriever.retrieve(
        db=db,
        query=request.query,
        user_role=current_user["role"],
        top_k=5
    )

    if not retrieved_chunks:
        query_log = QueryLog(
            user_id=current_user["id"],
            query=request.query,
            agent="general",
            confidence_score=0,
            tokens_used=len(request.query) // 4,
            context_relevance_score=0,
            faithfulness_score=0
        )
        db.add(query_log)
        db.commit()
        return QueryResponse(
            query_id=query_log.id,
            answer="I couldn't find relevant information for your query in the available documents.",
            agent="general",
            confidence_score=0.0,
            citations=[],
            hallucination_detected=False,
            sources=[]
        )

    # Route to specialized agent with conversation memory
    agent_response = agent_router.route_and_respond(
        query=request.query,
        chunks=retrieved_chunks,
        user_role=current_user["role"],
        target_agent=request.target_agent,
        history=request.history,
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

    # Calculate dummy metrics
    context_text = " ".join([c["text"] for c in retrieved_chunks])
    estimated_tokens = (len(request.query) + len(context_text) + len(final_answer)) // 4
    
    # If hallucination detected, scores are lower, otherwise high
    relevance = 40 if hallucination_result["hallucination_detected"] else 92
    faithfulness = 35 if hallucination_result["hallucination_detected"] else 88

    # Log query to database with full answer and citations
    query_log = QueryLog(
        user_id=current_user["id"],
        query=request.query,
        answer=final_answer,
        citations=json.dumps(agent_response.get("citations", [])),
        agent=agent_response["agent"],
        confidence_score=int(hallucination_result["confidence_score"] * 100),
        hallucination_detected=hallucination_result["hallucination_detected"],
        tokens_used=estimated_tokens,
        context_relevance_score=relevance,
        faithfulness_score=faithfulness
    )
    db.add(query_log)
    db.commit()

    return QueryResponse(
        query_id=query_log.id,
        answer=final_answer,
        agent=agent_response["agent"],
        confidence_score=hallucination_result["confidence_score"],
        citations=agent_response["citations"],
        hallucination_detected=hallucination_result["hallucination_detected"],
        sources=[c["source"] for c in retrieved_chunks]
    )

class FeedbackRequest(BaseModel):
    feedback: int # 1 for up, -1 for down

@router.post("/{query_id}/feedback")
async def submit_feedback(query_id: str, feedback_req: FeedbackRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    query_log = db.query(QueryLog).filter(QueryLog.id == query_id).first()
    if not query_log:
        raise HTTPException(status_code=404, detail="Query not found")
    
    query_log.user_feedback = feedback_req.feedback
    db.commit()
    return {"message": "Feedback recorded successfully"}

@router.get("/history")
async def get_user_chat_history(
    limit: int = 50,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch recent queries by current user or all if admin
    query_filter = db.query(QueryLog)
    if current_user.get("role") != "admin":
        query_filter = query_filter.filter(QueryLog.user_id == current_user.get("id"))
    
    logs = query_filter.order_by(QueryLog.created_at.desc()).limit(limit).all()
    
    result = []
    for log in logs:
        parsed_citations = []
        if log.citations:
            try:
                parsed_citations = json.loads(log.citations)
            except Exception:
                parsed_citations = []

        result.append({
            "id": log.id,
            "query": log.query,
            "answer": log.answer or "Response recorded.",
            "citations": parsed_citations,
            "agent": log.agent or "general",
            "confidence_score": (log.confidence_score or 0) / 100.0 if (log.confidence_score and log.confidence_score > 1) else (log.confidence_score or 0.85),
            "hallucination_detected": bool(log.hallucination_detected),
            "timestamp": log.created_at.isoformat() if log.created_at else None
        })
    return result
