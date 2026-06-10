import math
import re
from typing import List, Dict, Any
from collections import Counter

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

# Department-specific keyword boosting
DEPARTMENT_KEYWORDS = {
    "hr": ["leave", "holiday", "salary", "payroll", "attendance", "employee", "onboarding", "policy", "conduct", "maternity", "paternity"],
    "legal": ["contract", "nda", "compliance", "agreement", "legal", "liability", "terms", "clause", "confidential"],
    "finance": ["expense", "reimbursement", "invoice", "budget", "payment", "finance", "allowance", "claim", "travel"],
    "it": ["software", "hardware", "password", "ticket", "support", "network", "security", "laptop", "install", "vpn"],
    "general": []
}


class BM25:
    """Lightweight BM25 implementation for sparse retrieval."""

    def __init__(self, k1=1.5, b=0.75):
        self.k1 = k1
        self.b = b
        self.corpus = []
        self.tokenized = []
        self.idf = {}
        self.avg_dl = 0

    def fit(self, corpus: List[str]):
        self.corpus = corpus
        self.tokenized = [self._tokenize(doc) for doc in corpus]
        self.avg_dl = sum(len(t) for t in self.tokenized) / max(len(self.tokenized), 1)
        self._compute_idf()

    def _tokenize(self, text: str) -> List[str]:
        return re.findall(r'\b\w+\b', text.lower())

    def _compute_idf(self):
        n = len(self.tokenized)
        df = {}
        for tokens in self.tokenized:
            for token in set(tokens):
                df[token] = df.get(token, 0) + 1
        self.idf = {
            term: math.log((n - freq + 0.5) / (freq + 0.5) + 1)
            for term, freq in df.items()
        }

    def score(self, query: str) -> List[float]:
        query_tokens = self._tokenize(query)
        scores = []
        for doc_tokens in self.tokenized:
            tf = Counter(doc_tokens)
            dl = len(doc_tokens)
            score = 0
            for token in query_tokens:
                if token not in self.idf:
                    continue
                freq = tf.get(token, 0)
                numerator = freq * (self.k1 + 1)
                denominator = freq + self.k1 * (1 - self.b + self.b * dl / self.avg_dl)
                score += self.idf[token] * (numerator / denominator)
            scores.append(score)
        return scores


def cosine_similarity_tfidf(query: str, doc: str) -> float:
    """Simple TF-IDF cosine similarity for semantic-like dense retrieval."""
    def tokenize(text):
        return re.findall(r'\b\w+\b', text.lower())

    q_tokens = tokenize(query)
    d_tokens = tokenize(doc)
    all_terms = set(q_tokens + d_tokens)

    q_vec = {t: q_tokens.count(t) for t in all_terms}
    d_vec = {t: d_tokens.count(t) for t in all_terms}

    dot = sum(q_vec[t] * d_vec[t] for t in all_terms)
    q_norm = math.sqrt(sum(v ** 2 for v in q_vec.values()))
    d_norm = math.sqrt(sum(v ** 2 for v in d_vec.values()))

    if q_norm == 0 or d_norm == 0:
        return 0.0
    return dot / (q_norm * d_norm)


class HybridRetriever:
    def __init__(self):
        self.chunks: List[dict] = []
        self.bm25 = BM25()
        self._initialized = False

    def _get_all_chunks(self):
        from rag.document_processor import CHUNKS_DB
        return CHUNKS_DB

    def _build_index(self):
        self.chunks = self._get_all_chunks()
        if self.chunks:
            self.bm25.fit([c["text"] for c in self.chunks])
        self._initialized = True

    def add_documents(self, new_chunks: List[dict], metadata: dict):
        self._initialized = False  # Force re-index

    def retrieve(self, query: str, user_role: str, top_k: int = 5) -> List[dict]:
        self._build_index()

        if not self.chunks:
            return []

        allowed_access = ROLE_ACCESS_MAP.get(user_role, ["employee"])
        accessible = [c for c in self.chunks if c["access_level"] in allowed_access]

        if not accessible:
            return []

        # BM25 sparse scores
        all_texts = [c["text"] for c in self.chunks]
        bm25_all = self.bm25.score(query)
        chunk_id_to_bm25 = {c["id"]: bm25_all[i] for i, c in enumerate(self.chunks)}

        results = []
        for chunk in accessible:
            bm25_score = chunk_id_to_bm25.get(chunk["id"], 0)
            dense_score = cosine_similarity_tfidf(query, chunk["text"])

            # Combine scores (50/50 hybrid)
            hybrid_score = 0.5 * self._normalize(bm25_score, 0, 10) + 0.5 * dense_score

            # Department keyword boost
            dept = chunk.get("department", "general")
            keywords = DEPARTMENT_KEYWORDS.get(dept, [])
            query_lower = query.lower()
            boost = sum(0.05 for kw in keywords if kw in query_lower)
            hybrid_score += boost

            results.append({**chunk, "score": hybrid_score})

        # Sort and return top_k
        results.sort(key=lambda x: x["score"], reverse=True)
        top = results[:top_k]

        # Filter out very low relevance
        threshold = 0.01
        return [r for r in top if r["score"] > threshold]

    def _normalize(self, value: float, min_val: float, max_val: float) -> float:
        if max_val == min_val:
            return 0.0
        return min(1.0, max(0.0, (value - min_val) / (max_val - min_val)))
