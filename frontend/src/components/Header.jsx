import { useAuth } from '../contexts/AuthContext';

export default function Header({ page, setSidebarOpen }) {
  const titles = {
    overview: { title: 'Dashboard Overview', sub: 'System health and document statistics' },
    chat: { title: 'Ask the AI', sub: 'RAG-powered answers with hallucination detection' },
    documents: { title: 'Document Library', sub: `Available to your role` },
    upload: { title: 'Upload Document', sub: 'Index new enterprise documents' },
    agents: { title: 'AI Agents', sub: 'Specialized agents per department' },
  };
  
  const h = titles[page] || titles.overview;

  return (
    <div className="header">
      <div className="header-left">
        <button className="menu-btn" onClick={() => setSidebarOpen(true)}>☰</button>
        <div>
          <div className="header-title">{h.title}</div>
          <div className="header-sub">{h.sub}</div>
        </div>
      </div>
      {/* For chat page, clear chat button would be here or inside chat component */}
    </div>
  );
}
