import re
from typing import List, Dict, Any


AGENT_KEYWORDS = {
    "hr": [
        "leave", "vacation", "holiday", "sick", "maternity", "paternity", "attendance",
        "salary", "payroll", "onboarding", "resign", "resignation", "hr", "employee policy",
        "conduct", "dress code", "performance review", "appraisal", "benefits", "pf", "esi"
    ],
    "legal": [
        "contract", "nda", "non-disclosure", "agreement", "legal", "compliance",
        "lawsuit", "liability", "ip", "intellectual property", "confidential", "clause",
        "terms", "termination clause", "gdpr", "data protection", "privacy law"
    ],
    "finance": [
        "expense", "reimbursement", "invoice", "budget", "allowance", "claim",
        "travel cost", "mobile allowance", "finance", "payment", "receipt", "reimburse",
        "deduction", "tax", "gst", "tds", "perks", "cost", "bill"
    ],
    "it": [
        "software", "hardware", "password", "ticket", "helpdesk", "support",
        "laptop", "network", "vpn", "install", "access", "account", "security",
        "email setup", "system", "reset", "it policy", "device", "equipment"
    ]
}

AGENT_SYSTEM_PROMPTS = {
    "hr": "You are an HR specialist assistant. Answer questions about leave policies, employee conduct, payroll, attendance, onboarding, and HR procedures based strictly on the provided company documents.",
    "legal": "You are a Legal compliance assistant. Answer questions about contracts, NDAs, compliance requirements, and legal procedures based strictly on the provided company documents.",
    "finance": "You are a Finance assistant. Answer questions about expense reimbursements, budgets, allowances, invoices, and financial procedures based strictly on the provided company documents.",
    "it": "You are an IT Support assistant. Answer questions about software, hardware, passwords, support tickets, and IT procedures based strictly on the provided company documents.",
    "general": "You are a general enterprise assistant. Answer questions based strictly on the provided company documents."
}


def detect_agent(query: str) -> str:
    """Route query to the best specialized agent using keyword matching."""
    query_lower = query.lower()
    scores = {agent: 0 for agent in AGENT_KEYWORDS}

    for agent, keywords in AGENT_KEYWORDS.items():
        for kw in keywords:
            if kw in query_lower:
                scores[agent] += 1

    best_agent = max(scores, key=scores.get)
    if scores[best_agent] == 0:
        return "general"
    return best_agent


def format_context(chunks: List[dict]) -> str:
    parts = []
    for i, chunk in enumerate(chunks, 1):
        parts.append(f"[Source {i}: {chunk['source']}]\n{chunk['text']}")
    return "\n\n---\n\n".join(parts)


def generate_response(query: str, context: str, agent: str, chunks: List[dict]) -> dict:
    """
    Generate a response from context without an LLM API.
    In production, replace this with actual LLM call (OpenAI/Llama/Mistral).
    """
    # Extract the most relevant sentences from context
    query_words = set(re.findall(r'\b\w{4,}\b', query.lower()))
    context_sentences = re.split(r'(?<=[.!?])\s+|\n', context)

    scored_sentences = []
    for sent in context_sentences:
        sent = sent.strip()
        if len(sent) < 20:
            continue
        sent_words = set(re.findall(r'\b\w{4,}\b', sent.lower()))
        overlap = len(query_words & sent_words)
        if overlap > 0:
            scored_sentences.append((overlap, sent))

    scored_sentences.sort(key=lambda x: x[0], reverse=True)
    top_sentences = [s[1] for s in scored_sentences[:5]]

    # Build citations
    citations = []
    for i, chunk in enumerate(chunks[:3]):
        snippet = chunk["text"][:200].strip()
        citations.append({
            "text": snippet + ("..." if len(chunk["text"]) > 200 else ""),
            "source": chunk["source"],
            "page": chunk.get("chunk_index", 0) + 1
        })

    if not top_sentences:
        answer = (
            f"Based on the available {agent.upper()} documents, I found relevant information "
            f"but could not extract a specific answer to your query. "
            f"Please refer to the cited source documents for more details."
        )
    else:
        intro = f"Based on company {agent.upper() if agent != 'general' else ''} policy documents:\n\n"
        answer = intro + "\n".join(f"• {s}" for s in top_sentences)
        answer += f"\n\n*Please refer to the cited source documents for complete policy details.*"

    return {
        "answer": answer,
        "agent": agent,
        "citations": citations
    }


class AgentRouter:
    def route_and_respond(self, query: str, chunks: List[dict], user_role: str) -> dict:
        agent = detect_agent(query)

        # Further filter chunks by detected department if possible
        dept_chunks = [c for c in chunks if c.get("department") == agent]
        relevant_chunks = dept_chunks if dept_chunks else chunks

        context = format_context(relevant_chunks)
        result = generate_response(query, context, agent, relevant_chunks)
        return result
