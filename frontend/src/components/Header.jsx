import { Menu } from 'lucide-react';

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
    <div className="flex items-center justify-between px-8 py-5 border-b border-border bg-card z-20">
      <div className="flex items-center gap-4">
        <button 
          className="md:hidden p-2 rounded-md border border-border bg-background hover:bg-secondary text-foreground" 
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <div className="text-lg font-semibold tracking-tight text-foreground">{h.title}</div>
          <div className="text-sm text-muted-foreground mt-0.5">{h.sub}</div>
        </div>
      </div>
    </div>
  );
}
