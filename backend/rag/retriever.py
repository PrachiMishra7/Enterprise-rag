import os
from typing import List, Dict, Any
from typing import List, Dict, Any
from langchain_core.documents import Document
from database import engine
from rag.knowledge_graph import KnowledgeGraph

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
    """Enterprise-grade RAG Retriever supporting PGVector and DB Fallback."""

    def __init__(self, model_name: str = 'all-MiniLM-L6-v2'):
        try:
            from langchain_huggingface import HuggingFaceEmbeddings
            self.embeddings = HuggingFaceEmbeddings(model_name=model_name)
        except Exception as e:
            print(f"Embeddings initialization note: {e}")
            self.embeddings = None

        self.collection_name = "enterprise_rag_docs"
        self.vectorstore = None
        
        if self.embeddings and not str(engine.url).startswith("sqlite"):
            try:
                from langchain_postgres.vectorstores import PGVector
                self.vectorstore = PGVector(
                    embeddings=self.embeddings,
                    collection_name=self.collection_name,
                    connection=engine,
                    use_jsonb=True,
                )
            except Exception as e:
                print(f"PGVector setup note: {e}")
                self.vectorstore = None

        self.kg = KnowledgeGraph()

    def _get_all_chunks(self, db):
        from rag.document_processor import DocumentProcessor
        return DocumentProcessor().get_all_chunks(db)

    def _build_index(self, db):
        if not self.vectorstore:
            return
            
        chunks = self._get_all_chunks(db)
        if not chunks:
            return

        documents = []
        for c in chunks:
            doc = Document(
                page_content=c["text"],
                metadata={
                    "id": c["id"],
                    "document_id": c["document_id"],
                    "source": c["source"],
                    "department": c["department"],
                    "access_level": c["access_level"],
                    "chunk_index": c["chunk_index"]
                }
            )
            documents.append(doc)
            
        try:
            self.vectorstore.add_documents(documents)
        except Exception as e:
            print(f"Add documents to vectorstore error: {e}")

    def add_documents(self, new_chunks: List[dict], metadata: dict):
        if hasattr(self, '_cache'):
            self._cache.clear()
            
        if not self.vectorstore:
            return
            
        documents = []
        for c in new_chunks:
            if "id" in c:
                doc = Document(
                    page_content=c["text"],
                    metadata={
                        "id": c["id"],
                        "document_id": c["document_id"],
                        "source": c["source"],
                        "department": c["department"],
                        "access_level": c["access_level"],
                        "chunk_index": c["chunk_index"]
                    }
                )
            else:
                doc = Document(
                    page_content=c["text"],
                    metadata={
                        "source": c.get("source", ""),
                        "department": metadata.get("department", "general"),
                        "access_level": metadata.get("access_level", "employee"),
                        "chunk_index": c.get("chunk_index", 0)
                    }
                )               
            documents.append(doc)
            
        try:
            self.vectorstore.add_documents(documents)
        except Exception as e:
            print(f"Vectorstore insert error: {e}")

    def retrieve(self, db, query: str, user_role: str, top_k: int = 5) -> List[dict]:
        if not hasattr(self, '_cache'):
            self._cache = {}
            
        cache_key = f"{query}_{user_role}_{top_k}"
        if cache_key in self._cache:
            return self._cache[cache_key]

        allowed_access = ROLE_ACCESS_MAP.get(user_role, ["employee"])
        
        boosted_chunks = self.kg.get_boosted_chunks(query, db)

        if self.vectorstore:
            try:
                results = self.vectorstore.max_marginal_relevance_search(query, k=top_k * 3, fetch_k=top_k * 6)
                filtered_results = []
                for doc in results:
                    if doc.metadata.get("access_level") in allowed_access:
                        chunk_id = doc.metadata.get("id")
                        base_score = 0.0
                        if chunk_id in boosted_chunks:
                            base_score += 10.0 # Boost from KG
                            
                        filtered_results.append({
                            "id": chunk_id,
                            "document_id": doc.metadata.get("document_id"),
                            "source": doc.metadata.get("source"),
                            "department": doc.metadata.get("department"),
                            "access_level": doc.metadata.get("access_level"),
                            "text": doc.page_content,
                            "chunk_index": doc.metadata.get("chunk_index"),
                            "score": base_score
                        })
                
                if filtered_results:
                    # Sort by our custom score (putting boosted chunks first)
                    filtered_results.sort(key=lambda x: x["score"], reverse=True)
                    filtered_results = filtered_results[:top_k]
                    self._cache[cache_key] = filtered_results
                    return filtered_results
            except Exception as e:
                print(f"Vectorstore query error, using DB fallback: {e}")

        # Database chunk retrieval fallback
        chunks = self._get_all_chunks(db)
        if not chunks:
            return []

        query_words = [w.lower() for w in query.split() if len(w) > 2]
        scored_chunks = []

        for c in chunks:
            if c.get("access_level") in allowed_access:
                text_lower = c["text"].lower()
                matches = sum(1 for w in query_words if w in text_lower)
                if c["id"] in boosted_chunks:
                    matches += 5  # Boost from KG
                scored_chunks.append((matches, c))

        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        
        # Take top matches, or default allowed chunks if no exact keyword match
        top_matches = [c for matches, c in scored_chunks if matches > 0][:top_k]
        if not top_matches:
            top_matches = [c for _, c in scored_chunks][:top_k]

        self._cache[cache_key] = top_matches
        return top_matches
