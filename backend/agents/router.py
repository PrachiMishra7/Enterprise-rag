import os
import requests
from typing import List, Dict, Any, TypedDict, Literal
from langgraph.graph import StateGraph, START, END

AGENT_SYSTEM_PROMPTS = {
    "hr": "You are an HR specialist assistant. Answer questions about leave policies, employee conduct, payroll, attendance, onboarding, and HR procedures based strictly on the provided company documents.",
    "legal": "You are a Legal compliance assistant. Answer questions about contracts, NDAs, compliance requirements, and legal procedures based strictly on the provided company documents.",
    "finance": "You are a Finance assistant. Answer questions about expense reimbursements, budgets, allowances, invoices, and financial procedures based strictly on the provided company documents.",
    "it": "You are an IT Support assistant. Answer questions about software, hardware, passwords, support tickets, and IT procedures based strictly on the provided company documents.",
    "general": "You are a general enterprise assistant. Answer questions based strictly on the provided company documents."
}

class AgentState(TypedDict):
    query: str
    chunks: List[dict]
    user_role: str
    target_agent: str
    agent: str
    context: str
    answer: str
    citations: List[dict]

def route_query(state: AgentState) -> AgentState:
    """Determine which agent should handle the query."""
    if state.get("target_agent") and state["target_agent"] != "auto" and state["target_agent"] in AGENT_SYSTEM_PROMPTS:
        state["agent"] = state["target_agent"]
        return state

    query = state["query"]
    groq_api_key = os.environ.get("GROQ_API_KEY", "")
    state["agent"] = "general"
    
    if groq_api_key:
        prompt = f"""Classify the following enterprise query into exactly one department.
Departments: hr, finance, legal, it, general
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
                agent = ''.join(c for c in agent if c.isalpha())
                if agent in AGENT_SYSTEM_PROMPTS:
                    state["agent"] = agent
        except Exception:
            pass

    return state

def format_context(state: AgentState) -> AgentState:
    """Format the retrieved chunks into a context string."""
    agent = state["agent"]
    chunks = state["chunks"]
    
    # Filter by department if possible
    dept_chunks = [c for c in chunks if c.get("department") == agent]
    relevant_chunks = dept_chunks if dept_chunks else chunks
    
    parts = []
    for i, chunk in enumerate(relevant_chunks, 1):
        parts.append(f"[Source {i}: {chunk['source']}]\n{chunk['text']}")
        
    state["context"] = "\n\n---\n\n".join(parts)
    state["chunks"] = relevant_chunks # update to filtered
    
    # Build citations
    citations = []
    for i, chunk in enumerate(relevant_chunks[:3]):
        snippet = chunk["text"][:200].strip()
        citations.append({
            "text": snippet + ("..." if len(chunk["text"]) > 200 else ""),
            "source": chunk["source"],
            "page": chunk.get("chunk_index", 0) + 1
        })
    state["citations"] = citations
    
    return state

def generate_answer(state: AgentState) -> AgentState:
    """Generate the response using the LLM."""
    query = state["query"]
    context = state["context"]
    agent = state["agent"]
    
    groq_api_key = os.environ.get("GROQ_API_KEY", "")
    system_prompt = AGENT_SYSTEM_PROMPTS.get(agent, AGENT_SYSTEM_PROMPTS["general"])
    prompt = f"Context from documents:\n\n{context}\n\nUser Query: {query}"

    if not groq_api_key:
        state["answer"] = "⚠️ **Groq API Key Missing!**\n\nPlease set the `GROQ_API_KEY` environment variable in your `.env` or terminal to use the Groq free-tier AI."
        return state

    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {groq_api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.1-8b-instant",
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

    state["answer"] = answer
    return state

class AgentRouter:
    def route_and_respond(self, query: str, chunks: List[dict], user_role: str, target_agent: str = "auto") -> dict:
        state = {
            "query": query,
            "chunks": chunks,
            "user_role": user_role,
            "target_agent": target_agent,
            "agent": "general",
            "context": "",
            "answer": "",
            "citations": []
        }
        
        # Execute the agent workflow sequentially
        state = route_query(state)
        state = format_context(state)
        state = generate_answer(state)
        
        return {
            "answer": state["answer"],
            "agent": state["agent"],
            "citations": state["citations"]
        }
