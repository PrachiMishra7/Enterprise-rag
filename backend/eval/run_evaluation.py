import sys
import os
import json
import time

# Add backend to path so imports work
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from rag.document_processor import DocumentProcessor
from rag.retriever import HybridRetriever
from agents.router import AgentRouter
from rag.hallucination_detector import HallucinationDetector

def evaluate_baseline(db, dataset):
    """Evaluates Baseline RAG: no RBAC, no multi-agent, no validation"""
    retriever = HybridRetriever()
    # Mocking standard retriever behavior
    metrics = {"precision_at_5": [], "recall_at_5": [], "latencies": [], "hallucination_detected": []}
    
    for item in dataset:
        start_time = time.time()
        
        # Baseline RAG ignores user_role, passing "admin" to simulate no restrictions
        retrieved_chunks = retriever.retrieve(db, item["query"], user_role="admin", top_k=5)
        
        sources_retrieved = [c["source"] for c in retrieved_chunks]
        expected_source = item["expected_source"]
        
        # Precision@5: ratio of relevant chunks retrieved in top 5
        relevant_chunks_retrieved = sum(1 for src in sources_retrieved if src == expected_source)
        precision = relevant_chunks_retrieved / max(1, len(sources_retrieved))
        
        # Recall@5: Did we find the expected source in the top 5 at all?
        recall = 1.0 if expected_source in sources_retrieved else 0.0
        
        # Baseline doesn't have hallucination detection, but we measure its generation blindly
        # Just generating a mock answer to measure latency since we are doing an ablation
        # We can use the agent router with 'general' agent.
        router = AgentRouter()
        ans = router.route_and_respond(item["query"], retrieved_chunks, "admin", target_agent="general", db=db)
        
        detector = HallucinationDetector()
        val = detector.verify(item["query"], ans["answer"], retrieved_chunks)
        
        latency = time.time() - start_time
        
        metrics["precision_at_5"].append(precision)
        metrics["recall_at_5"].append(recall)
        metrics["latencies"].append(latency)
        metrics["hallucination_detected"].append(1.0 if val["hallucination_detected"] else 0.0)
        
    return {
        "precision": sum(metrics["precision_at_5"]) / len(dataset),
        "recall": sum(metrics["recall_at_5"]) / len(dataset),
        "hallucination_rate": sum(metrics["hallucination_detected"]) / len(dataset),
        "latency": sum(metrics["latencies"]) / len(dataset),
        "grounded_rate": 1 - (sum(metrics["hallucination_detected"]) / len(dataset))
    }

def evaluate_proposed(db, dataset):
    """Evaluates Proposed RAG: RBAC, multi-agent, validation, knowledge graph"""
    retriever = HybridRetriever()
    router = AgentRouter()
    detector = HallucinationDetector()
    
    metrics = {"precision_at_5": [], "recall_at_5": [], "latencies": [], "hallucination_detected": []}
    
    for item in dataset:
        start_time = time.time()
        
        retrieved_chunks = retriever.retrieve(db, item["query"], user_role=item["role"], top_k=5)
        
        sources_retrieved = [c["source"] for c in retrieved_chunks]
        expected_source = item["expected_source"]
        should_be_blocked = item.get("should_be_blocked", False)
        
        if should_be_blocked:
            precision = 1.0 if expected_source not in sources_retrieved else 0.0
            recall = 1.0 if expected_source not in sources_retrieved else 0.0
        else:
            relevant_chunks_retrieved = sum(1 for src in sources_retrieved if src == expected_source)
            precision = relevant_chunks_retrieved / max(1, len(sources_retrieved))
            recall = 1.0 if expected_source in sources_retrieved else 0.0
            
        ans = router.route_and_respond(item["query"], retrieved_chunks, item["role"], target_agent="auto", db=db)
        val = detector.verify(item["query"], ans["answer"], retrieved_chunks)
        
        latency = time.time() - start_time
        
        metrics["precision_at_5"].append(precision)
        metrics["recall_at_5"].append(recall)
        metrics["latencies"].append(latency)
        metrics["hallucination_detected"].append(1.0 if val["hallucination_detected"] else 0.0)
        
    return {
        "precision": sum(metrics["precision_at_5"]) / len(dataset),
        "recall": sum(metrics["recall_at_5"]) / len(dataset),
        "hallucination_rate": sum(metrics["hallucination_detected"]) / len(dataset),
        "latency": sum(metrics["latencies"]) / len(dataset),
        "grounded_rate": 1 - (sum(metrics["hallucination_detected"]) / len(dataset))
    }

def main():
    db = SessionLocal()
    
    # Ensure docs are seeded
    doc_processor = DocumentProcessor()
    doc_processor.seed_demo_documents(db)
    
    dataset_path = os.path.join(os.path.dirname(__file__), "dataset.json")
    with open(dataset_path, "r") as f:
        dataset = json.load(f)
        
    print("Running Baseline RAG Evaluation...")
    baseline_metrics = evaluate_baseline(db, dataset)
    
    print("Running Proposed Framework Evaluation...")
    proposed_metrics = evaluate_proposed(db, dataset)
    
    print("\n\n| Metric | Baseline RAG | Proposed Framework |")
    print("| --- | --- | --- |")
    print(f"| Precision@5 | {baseline_metrics['precision']:.3f} | {proposed_metrics['precision']:.3f} |")
    print(f"| Recall@5 | {baseline_metrics['recall']:.3f} | {proposed_metrics['recall']:.3f} |")
    print(f"| Hallucination Rate | {baseline_metrics['hallucination_rate']:.3f} | {proposed_metrics['hallucination_rate']:.3f} |")
    print(f"| Average Latency | {baseline_metrics['latency']:.3f}s | {proposed_metrics['latency']:.3f}s |")
    print(f"| Grounded Response Rate | {baseline_metrics['grounded_rate']:.3f} | {proposed_metrics['grounded_rate']:.3f} |")

if __name__ == "__main__":
    main()
