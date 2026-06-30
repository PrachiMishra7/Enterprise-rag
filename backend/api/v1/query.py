from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

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
