import re
import os
import requests
from typing import List, Dict, Any

class HallucinationDetector:
    """
    Verifies if a generated response is grounded in retrieved context.
    Uses LLM as a judge alongside overlap and coverage signals to compute confidence.
    """

    def __init__(self, confidence_threshold: float = 0.45):
        self.confidence_threshold = confidence_threshold
        self.high_risk_patterns = [
            r'\b(always|never|guaranteed|100%|definitely|certainly|absolutely)\b',
            r'\b(everyone|nobody|all employees|no employee)\b',
            r'\binr\s*[\d,]+\b',      # specific monetary amounts
            r'\b\d+\s*days?\b',        # specific day counts
            r'\b\d+\s*%\b',            # specific percentages
        ]

    def verify(self, query: str, response: str, context_chunks: List[dict]) -> dict:
        if not context_chunks:
            return {
                "confidence_score": 0.0,
                "hallucination_detected": True,
                "reason": "No context retrieved — response may be fabricated",
                "overlap_score": 0.0,
                "claim_score": 0.0,
                "coverage_score": 0.0
            }

        context_text = " ".join(c["text"] for c in context_chunks).lower()
        response_lower = response.lower()

        # Signal 1: Word overlap
        overlap_score = self._compute_overlap(response_lower, context_text)

        # Signal 2: Specific claims
        claim_score = self._check_specific_claims(response, context_text)

        # Signal 3: Context coverage
        coverage_score = self._compute_coverage(response_lower, context_text)

        # Signal 4: LLM Judge
        llm_score = self._llm_judge(query, response, context_text)

        # Weighted confidence incorporating LLM if successful
        if llm_score is not None:
            confidence = (
                0.20 * overlap_score +
                0.20 * claim_score +
                0.20 * coverage_score +
                0.40 * llm_score
            )
        else:
            # Fallback to local scoring if LLM judge fails
            confidence = (
                0.40 * overlap_score +
                0.35 * claim_score +
                0.25 * coverage_score
            )
            
        confidence = round(min(1.0, max(0.0, confidence)), 3)
        hallucination_detected = confidence < self.confidence_threshold

        return {
            "confidence_score": confidence,
            "hallucination_detected": hallucination_detected,
            "overlap_score": round(overlap_score, 3),
            "claim_score": round(claim_score, 3),
            "coverage_score": round(coverage_score, 3),
            "reason": self._generate_reason(confidence, hallucination_detected)
        }

    def _llm_judge(self, query: str, response: str, context: str) -> float | None:
        """Uses an LLM to evaluate if the response is supported by the context."""
        groq_api_key = os.environ.get("GROQ_API_KEY", "")
        if not groq_api_key:
            return None

        prompt = f"""You are an objective evaluator fact-checking an AI assistant's response against retrieved documents.
Context from documents:
{context[:2000]}  # Trim to avoid exceeding limits

User Query: {query}
AI Response: {response}

Analyze if the AI Response is FULLY SUPPORTED by the Context.
Return ONLY a floating point number between 0.0 and 1.0 representing your confidence that the response is factually grounded in the context.
0.0 = completely hallucinated or contradicted
0.5 = partially supported
1.0 = fully supported and factual
Do not output anything else but the number.
"""
        try:
            res = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {groq_api_key}", "Content-Type": "application/json"},
                json={
                    "model": "llama-3.1-8b-instant",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.0,
                    "max_tokens": 5
                },
                timeout=5,
                verify=False
            )
            if res.status_code == 200:
                score_str = res.json()["choices"][0]["message"]["content"].strip()
                match = re.search(r"0\.\d+|1\.0", score_str)
                if match:
                    return float(match.group(0))
        except Exception:
            pass
            
        return None

    def _tokenize(self, text: str) -> set:
        stopwords = {"the", "a", "an", "is", "are", "was", "were", "be", "been",
                     "being", "have", "has", "had", "do", "does", "did", "will",
                     "would", "could", "should", "may", "might", "shall", "can",
                     "to", "of", "in", "for", "on", "with", "at", "by", "from",
                     "and", "or", "but", "if", "this", "that", "it", "its",
                     "as", "all", "not", "no", "so", "up", "out", "about"}
        tokens = set(re.findall(r'\b\w{3,}\b', text.lower()))
        return tokens - stopwords

    def _compute_overlap(self, response: str, context: str) -> float:
        r_tokens = self._tokenize(response)
        c_tokens = self._tokenize(context)
        if not r_tokens:
            return 0.0
        overlap = len(r_tokens & c_tokens)
        return min(1.0, overlap / max(len(r_tokens), 1))

    def _check_specific_claims(self, response: str, context: str) -> float:
        claims_found = 0
        claims_verified = 0

        for pattern in self.high_risk_patterns:
            matches = re.findall(pattern, response, re.IGNORECASE)
            for match in matches:
                claims_found += 1
                match_clean = match.strip().lower()
                if match_clean in context:
                    claims_verified += 1

        if claims_found == 0:
            return 0.75  # No specific claims = moderate confidence
        return claims_verified / claims_found

    def _compute_coverage(self, response: str, context: str) -> float:
        # Check key phrases (2-grams) from response appear in context
        words = re.findall(r'\b\w+\b', response.lower())
        if len(words) < 2:
            return 0.5

        bigrams = [f"{words[i]} {words[i+1]}" for i in range(len(words) - 1)]
        meaningful = [bg for bg in bigrams if len(bg) > 8]

        if not meaningful:
            return 0.5

        found = sum(1 for bg in meaningful if bg in context)
        return found / len(meaningful)

    def _generate_reason(self, confidence: float, hallucination: bool) -> str:
        if confidence >= 0.8:
            return "High confidence — response well-grounded in retrieved documents"
        elif confidence >= 0.6:
            return "Moderate confidence — most claims supported by context"
        elif confidence >= 0.45:
            return "Borderline confidence — some claims may lack source support"
        else:
            return "Low confidence — response may contain unsupported or hallucinated information"
