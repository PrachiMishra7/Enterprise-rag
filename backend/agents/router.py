import re
import os
import requests
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
    """Route query to the best specialized agent using LLM Intent Classification."""
    groq_api_key = os.environ.get("GROQ_API_KEY", "")
    if not groq_api_key:
        return "general"  # Fallback if no key

    prompt = f"""Classify the following enterprise query into exactly one department.
Departments:
hr
finance
legal
it
general

Query: {query}
Return only the department name in lowercase, nothing else."""

    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {groq_api_key}", "Content-Type": "application/json"},
            json={
                "model": "llama-3.1-8b-instant",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.0,
                "max_tokens": 10
            },
            timeout=10,
            verify=False
        )
        if response.status_code == 200:
            agent = response.json()["choices"][0]["message"]["content"].strip().lower()
            # Clean up the response in case it outputs extra punctuation
            agent = ''.join(c for c in agent if c.isalpha())
            if agent in AGENT_SYSTEM_PROMPTS:
                return agent
    except Exception:
        pass
    
    return "general"


def format_context(chunks: List[dict]) -> str:
    parts = []
    for i, chunk in enumerate(chunks, 1):
        parts.append(f"[Source {i}: {chunk['source']}]\n{chunk['text']}")
    return "\n\n---\n\n".join(parts)


def generate_response(query: str, context: str, agent: str, chunks: List[dict]) -> dict:
    """
    Generate a response using local Ollama API.
    """
    # Build citations
    citations = []
    for i, chunk in enumerate(chunks[:3]):
        snippet = chunk["text"][:200].strip()
        citations.append({
            "text": snippet + ("..." if len(chunk["text"]) > 200 else ""),
            "source": chunk["source"],
            "page": chunk.get("chunk_index", 0) + 1
        })

    groq_api_key = os.environ.get("GROQ_API_KEY", "")
    
    system_prompt = AGENT_SYSTEM_PROMPTS.get(agent, AGENT_SYSTEM_PROMPTS["general"])
    prompt = f"Context from documents:\n\n{context}\n\nUser Query: {query}"

    if not groq_api_key:
        return {
            "answer": "⚠️ **Groq API Key Missing!**\n\nPlease set the `GROQ_API_KEY` environment variable in your `.env` or terminal to use the Groq free-tier AI.",
            "agent": agent,
            "citations": citations
        }

    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {groq_api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.1-8b-instant",  # Updated to Groq's active Llama 3.1 model
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.2,
                "stream": False
            },
            timeout=30,
            verify=False
        )
        response.raise_for_status()
        answer = response.json()["choices"][0]["message"]["content"]
        
        if not answer:
            answer = "Groq returned an empty response. Please try again."
            
    except requests.exceptions.HTTPError as e:
        if response.status_code == 401:
            answer = "⚠️ **Invalid Groq API Key.** Please verify your key."
        else:
            answer = f"⚠️ **Groq API Error:** {response.text}"
    except Exception as e:
        answer = f"⚠️ **Error generating response with Groq:** {str(e)}"

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
