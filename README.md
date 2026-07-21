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
```
The frontend will typically run on `http://localhost:5173`.

## 📁 Project Structure
- `/backend`: FastAPI application, Langchain RAG logic, Database models, and API endpoints.
- `/frontend`: React application, UI components, pages (Overview, Agents, AuditLogs, etc.).

## 📄 License
This project is licensed under the MIT License.