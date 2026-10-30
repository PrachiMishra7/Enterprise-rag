# EnterpriseRAG

EnterpriseRAG is a comprehensive Retrieval-Augmented Generation (RAG) system built for enterprise knowledge bases. It seamlessly integrates a powerful backend with an interactive frontend to provide intelligent document search and AI-assisted insights.

## ✨ Features
- **Intelligent Search**: Vector-based semantic search powered by LangChain and ChromaDB.
- **Generative AI Integration**: Powered by Groq for blazing fast, high-quality responses.
- **Enterprise-Ready**: Includes role-based access, audit logs, and analytics.
- **Modern UI**: A responsive, highly animated interface built with React 19, Tailwind CSS 4, and Framer Motion.

## 🚀 Tech Stack
### Backend
- **Framework**: FastAPI
- **Database**: PostgreSQL (SQLAlchemy) + ChromaDB (Vector Store)
- **AI/ML**: LangChain, Groq, Sentence-Transformers, FAISS

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS 4, shadcn/ui
- **Animations & Charts**: Framer Motion, Recharts, tw-animate-css

## 🛠️ Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL (if running outside SQLite)

### 1. Environment Setup
Before starting the backend, make sure to set up your environment variables. 
Create a `.env` file in the `backend/` directory:
```bash
# Example backend/.env
GROQ_API_KEY=your_groq_api_key_here
DATABASE_URL=sqlite:///./enterprise_rag.db # or your postgres URL
```

### 2. Start the Backend
Navigate to the backend directory, set up the virtual environment, and run the FastAPI server:
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
python main.py
```
The backend will typically run on `http://localhost:8000`.

### 3. Start the Frontend
In a new terminal window, navigate to the frontend directory and start the Vite development server:
```bash
cd frontend
npm install
npm run dev
https://enterprise-rag-ui-gsek.onrender.com
https://enterprise-rag-zds6.onrender.com
The frontend will typically run on `http://localhost:5173`.

## 🔐 Demo Credentials

Use any of the pre-configured accounts below to test role-based access control (RBAC), departmental boundaries, and multi-agent features:

| Role | Email | Password | Department | Permissions & Data Isolation |
| :--- | :--- | :--- | :--- | :--- |
| **Enterprise Admin** | `admin@company.com` | `Admin@123` | General / IT | Full access across all departmental vector partitions, audit logs, models |
| **HR Admin** | `hr@company.com` | `Hr@123` | HR | HR vector store, employee policies, onboarding pipelines, audit access |
| **Legal Admin** | `legal@company.com` | `Legal@123` | Legal | Legal briefs, contract review, compliance policies, legal audit logs |
| **Finance Admin** | `finance@company.com` | `Finance@123` | Finance | Financial reports, spreadsheets, audit trails, budget analytics |
| **Team Manager** | `manager@company.com` | `Manager@123` | General | Multi-agent workflows, cross-document query, evaluation suites |
| **HR Employee** | `employee_hr@company.com` | `Employee@123` | HR | Can query **HR + General** documents; **cannot** access Legal or Finance |
| **Legal Employee** | `employee_legal@company.com` | `Employee@123` | Legal | Can query **Legal + General** documents; **cannot** access HR or Finance |
| **Finance Employee** | `employee_finance@company.com` | `Employee@123` | Finance | Can query **Finance + General** documents; **cannot** access HR or Legal |
| **General Employee** | `employee@company.com` | `Employee@123` | General | Standard semantic search across general company handbook & policies only |

### 🔒 Departmental Data Segregation Rules:
1. **Department Isolation**: An employee in the **Legal** department cannot retrieve, read, or ask the AI about documents tagged under **HR** or **Finance**.
2. **Dual-Gate Filtering**: Retrieval queries filter by both `access_level in allowed_roles` **AND** `department in [user_department, 'general']`.
3. **Cross-Department Protection**: Agents cannot leak cross-department context because forbidden chunks are eliminated in the vector retrieval stage before prompt generation.

> **Note**: Seed accounts are automatically initialized when the backend starts up (`auth_handler.py`). Passwords are case-sensitive.

## 📁 Project Structure
- `/backend`: FastAPI application, Langchain RAG logic, Database models, and API endpoints.
- `/frontend`: React application, UI components, pages (Overview, Agents, AuditLogs, etc.).

## 📄 License
This project is licensed under the MIT License.
