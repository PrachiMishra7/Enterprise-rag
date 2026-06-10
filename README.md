# 🤖 EnterpriseRAG — Hallucination-Aware Multi-Agent Enterprise RAG Assistant

> **B.Tech Project | Christ University | AI & Data Analytics**

A production-ready Enterprise AI Assistant with **RAG**, **Multi-Agent Routing**, **Hallucination Detection**, and **Role-Based Access Control (RBAC)**.

---

## 🏗️ Architecture

```
User Query
    ↓
Authentication & Role Verification  (JWT + RBAC)
    ↓
Intent Classification / Agent Routing  (Keyword + NLP)
    ↓
Hybrid Document Retrieval  (BM25 + TF-IDF Cosine)
    ↓
Context Re-ranking  (Score fusion)
    ↓
Response Generation  (LLM or extractive — pluggable)
    ↓
Hallucination Detection  (Overlap + Claim Verification + Coverage)
    ↓
Response + Citations + Confidence Score
```

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
git clone https://github.com/yourusername/enterprise-rag.git
cd enterprise-rag
docker-compose up --build
```

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

### Option 2: Run Both Locally (Windows)

Simply run the batch script provided:
```bash
.\start_all.bat
```
This will start both the backend API and the frontend server in separate command prompt windows.

---

## 🔑 Demo Accounts

| Email | Password | Role |
|-------|----------|------|
| alice@company.com | EnterprisePass!2024 | Employee |
| bob@company.com | EnterprisePass!2024 | Manager |
| carol@company.com | EnterprisePass!2024 | HR Admin |
| dave@company.com | EnterprisePass!2024 | Legal Admin |
| eve@company.com | EnterprisePass!2024 | Finance Admin |
| admin@company.com | AdminPass!2024 | Admin |

---

## 🗂️ Project Structure

```
enterprise-rag/
├── backend/
│   ├── main.py                    # FastAPI app, all endpoints
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── auth/
│   │   └── auth_handler.py        # JWT auth + RBAC permissions
│   ├── rag/
│   │   ├── document_processor.py  # Upload, parse, chunk documents
│   │   ├── retriever.py           # Hybrid BM25 + dense retrieval
│   │   └── hallucination_detector.py  # Confidence scoring
│   ├── agents/
│   │   └── router.py              # Multi-agent routing (HR/Legal/Finance/IT)
│   └── models/
│       └── schemas.py             # Pydantic models
│
├── frontend/
│   └── index.html                 # Full SPA (vanilla JS, no build step)
│
└── docker-compose.yml
```

---

## 🤖 AI Agents

| Agent | Handles | Keywords |
|-------|---------|---------|
| 👥 HR Agent | Leave, payroll, onboarding, attendance, conduct | leave, salary, hr, employee, maternity... |
| ⚖️ Legal Agent | Contracts, NDAs, compliance, IP, privacy | contract, nda, compliance, agreement, gdpr... |
| 💰 Finance Agent | Expenses, reimbursements, invoices, allowances | expense, reimbursement, allowance, invoice... |
| 🖥️ IT Agent | Helpdesk, software, passwords, equipment | password, ticket, software, hardware, vpn... |

---

## 🔒 RBAC Permission Levels

| Role | Departments | Can Upload |
|------|-------------|------------|
| Employee | HR (basic), General | ❌ |
| Manager | HR, Finance, IT, General | ❌ |
| HR Admin | HR (all), General | ✅ |
| Legal Admin | Legal (all), General | ✅ |
| Finance Admin | Finance (all), General | ✅ |
| IT Admin | IT (all), General | ✅ |
| Admin | All departments | ✅ |

---

## 🧪 Hallucination Detection

Three-signal scoring:

1. **Word Overlap (40%)** — How much response vocabulary is grounded in retrieved context
2. **Specific Claim Verification (35%)** — Whether figures, numbers, named claims appear in source chunks  
3. **Coverage Score (25%)** — N-gram overlap between response and retrieved context

Responses with **confidence < 45%** are flagged with a warning banner.

---

## 🔌 API Endpoints

```
POST   /auth/login          Login, get JWT token
POST   /auth/register       Register new user
POST   /documents/upload    Upload + index document (admin roles only)
GET    /documents/list      List role-accessible documents
POST   /query               RAG query with agent routing
GET    /health              Health check
GET    /docs                Swagger UI
```

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11, FastAPI |
| Authentication | JWT (PyJWT), bcrypt |
| Retrieval | BM25 (custom), TF-IDF Cosine |
| Agent Routing | Keyword intent classification |
| Hallucination | Custom overlap + claim scoring |
| Frontend | Vanilla JS, HTML5, CSS3 |
| Deployment | Docker, Docker Compose |

### Upgrade Path (Production)
- **LLM:** Replace `generate_response()` in `agents/router.py` with OpenAI / Llama / Mistral API call
- **Vector DB:** Replace in-memory storage with FAISS / ChromaDB / Pinecone
- **Embeddings:** Add `sentence-transformers` for real dense embeddings
- **Database:** Replace `USERS_DB` / `CHUNKS_DB` dicts with PostgreSQL + SQLAlchemy

---

## 📝 Sample Queries to Try

- *"How many days of annual leave do I get?"*
- *"What is the process to claim travel expenses?"*
- *"How do I raise an IT support ticket?"*
- *"What are the NDA signing authority rules?"*
- *"What is the mobile allowance for employees?"*
- *"What is the sick leave policy?"*

---

## 🎓 Research Contribution Areas

- Enterprise AI Systems
- Retrieval-Augmented Generation (RAG)  
- Hallucination Reduction in LLMs
- Multi-Agent AI Systems
- Explainable AI (XAI)
- Role-Based Contextual Retrieval

---

## 📊 Evaluation Metrics

| Metric | Method |
|--------|--------|
| Retrieval Accuracy | Precision@K on labelled queries |
| Hallucination Rate | Human eval + automated scoring |
| Response Latency | API response time logging |
| Precision / Recall | Chunk relevance evaluation |
| User Satisfaction | Survey-based scoring |
