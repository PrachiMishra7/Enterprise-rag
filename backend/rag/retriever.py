import math
import os
import faiss
import numpy as np
from typing import List, Dict, Any
from sentence_transformers import SentenceTransformer
from rank_bm25 import BM25Okapi

# Access level hierarchy
ROLE_ACCESS_MAP = {
    "employee": ["employee"],
    "manager": ["employee", "manager"],
    "hr_admin": ["employee", "manager", "hr_admin"],
    "legal_admin": ["employee", "manager", "legal_admin"],
    "finance_admin": ["employee", "manager", "finance_admin"],
    "it_admin": ["employee", "manager", "it_admin"],
    "admin": ["employee", "manager", "hr_admin", "legal_admin", "finance_admin", "it_admin", "admin"]
}

class HybridRetriever:
    """Enterprise-grade Hybrid RAG using FAISS (Dense) and BM25 (Sparse)."""

    def __init__(self, model_name: str = 'all-MiniLM-L6-v2'):
        self.model = SentenceTransformer(model_name)
        self.dimension = self.model.get_sentence_embedding_dimension()
        
        self.chunks: List[dict] = []
        self.faiss_index = None
        self.bm25_index = None
        
        self._initialized = False

    def _get_all_chunks(self, db):
        from rag.document_processor import DocumentProcessor
        return DocumentProcessor().get_all_chunks(db)

    def _build_index(self, db):
        self.chunks = self._get_all_chunks(db)
        if not self.chunks:
            self._initialized = True
            return

        texts = [c["text"] for c in self.chunks]
        
        # Build BM25 Sparse Index
        tokenized_corpus = [doc.lower().split() for doc in texts]
        self.bm25_index = BM25Okapi(tokenized_corpus)
        
        # Build FAISS Dense Index
        embeddings = self.model.encode(texts, convert_to_numpy=True)
        # Normalize embeddings for cosine similarity using inner product
        faiss.normalize_L2(embeddings)
        self.faiss_index = faiss.IndexFlatIP(self.dimension)
        self.faiss_index.add(embeddings)
        
        self._initialized = True

    def add_documents(self, new_chunks: List[dict], metadata: dict):
        self._initialized = False  # Force re-index on next query

    def retrieve(self, db, query: str, user_role: str, top_k: int = 5) -> List[dict]:
        if not self._initialized:
            self._build_index(db)

        if not self.chunks:
            return []

        # 1. Sparse Search (BM25)
        tokenized_query = query.lower().split()
        bm25_scores = self.bm25_index.get_scores(tokenized_query)
        
        # 2. Dense Search (FAISS)
        query_embedding = self.model.encode([query], convert_to_numpy=True)
        faiss.normalize_L2(query_embedding)
        dense_scores, _ = self.faiss_index.search(query_embedding, len(self.chunks))
        
        # Map dense scores back to original indices since FAISS sorts the output
        # Wait, faiss search returns sorted by distance, but we need raw scores for each chunk.
        # Actually, `dense_scores` contains distances, let's just do a manual dot product for simplicity if k is small,
        # or map them properly. FAISS search returns (distances, indices).
        dense_scores_raw = np.zeros(len(self.chunks))
        distances, indices = self.faiss_index.search(query_embedding, len(self.chunks))
        for i, idx in enumerate(indices[0]):
            dense_scores_raw[idx] = distances[0][i]

        results = []
        allowed_access = ROLE_ACCESS_MAP.get(user_role, ["employee"])

        for i, chunk in enumerate(self.chunks):
            if chunk["access_level"] not in allowed_access:
                continue

            # Normalize scores roughly
            b_score = bm25_scores[i] / (max(bm25_scores) + 1e-6)
            d_score = dense_scores_raw[i]  # already between -1 and 1

            # Combine (50% Dense, 50% Sparse)
            hybrid_score = (0.5 * b_score) + (0.5 * d_score)
            
            results.append({**chunk, "score": hybrid_score})

        # Sort and return top_k
        results.sort(key=lambda x: x["score"], reverse=True)
        top = results[:top_k]

        return [r for r in top if r["score"] > 0.1]
