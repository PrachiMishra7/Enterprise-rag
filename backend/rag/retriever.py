import os
from typing import List, Dict, Any
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document

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
    """Enterprise-grade RAG Retriever using LangChain and ChromaDB."""

    def __init__(self, model_name: str = 'all-MiniLM-L6-v2', persist_directory: str = "./chroma_db"):
        self.embeddings = HuggingFaceEmbeddings(model_name=model_name)
        self.persist_directory = persist_directory
        self.vectorstore = None
        self._initialized = False

    def _get_all_chunks(self, db):
        from rag.document_processor import DocumentProcessor
        return DocumentProcessor().get_all_chunks(db)

    def _build_index(self, db):
        # Try to load existing persistent DB first
        if os.path.exists(self.persist_directory) and os.listdir(self.persist_directory):
            try:
                self.vectorstore = Chroma(
                    persist_directory=self.persist_directory, 
                    embedding_function=self.embeddings
                )
                self._initialized = True
                return
            except Exception as e:
                print(f"Failed to load persistent Chroma DB: {e}")

        chunks = self._get_all_chunks(db)
        if not chunks:
            self._initialized = True
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
            
        self.vectorstore = Chroma.from_documents(
            documents=documents,
            embedding=self.embeddings,
            persist_directory=self.persist_directory
        )
        self._initialized = True

    def add_documents(self, new_chunks: List[dict], metadata: dict):
        if not self.vectorstore:
            # We don't have a vector store yet, just mark as not initialized
            # to rebuild the next time retrieve is called.
            self._initialized = False
            return
            
        documents = []
        for c in new_chunks:
            # Check if this is a dictionary from the DB or a raw dict
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
            
        self.vectorstore.add_documents(documents)

    def retrieve(self, db, query: str, user_role: str, top_k: int = 5) -> List[dict]:
        if not self._initialized:
            self._build_index(db)

        if not self.vectorstore:
            return []

        allowed_access = ROLE_ACCESS_MAP.get(user_role, ["employee"])
        
        # LangChain Chroma doesn't natively support "IN" queries cleanly with basic filtering 
        # for multiple possible access levels in the open-source version, so we retrieve more
        # and post-filter, or build a complex filter. Post-filtering is safer for now.
        
        results = self.vectorstore.similarity_search_with_relevance_scores(query, k=top_k * 3)
        
        filtered_results = []
        for doc, score in results:
            if doc.metadata.get("access_level") in allowed_access:
                filtered_results.append({
                    "id": doc.metadata.get("id"),
                    "document_id": doc.metadata.get("document_id"),
                    "source": doc.metadata.get("source"),
                    "department": doc.metadata.get("department"),
                    "access_level": doc.metadata.get("access_level"),
                    "text": doc.page_content,
                    "chunk_index": doc.metadata.get("chunk_index"),
                    "score": score
                })
                
                if len(filtered_results) >= top_k:
                    break
                    
        return filtered_results
