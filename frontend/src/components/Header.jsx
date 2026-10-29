import { useState, useEffect } from "react";
import { Menu, Sun, Moon, Bell } from "lucide-react";

export default function Header({ page, setSidebarOpen, setPage }) {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const titles = {
    overview:   { title: "Dashboard Overview",  sub: "System health and document statistics" },
    chat:       { title: "Ask the AI",          sub: "RAG-powered answers with hallucination detection" },
    documents:  { title: "Document Library",   sub: "Available to your role" },
    upload:     { title: "Upload Center",       sub: "Index new enterprise documents" },
    agents:     { title: "AI Flow Builder",     sub: "Design and manage multi-agent pipelines" },
    tools:      { title: "AI Utilities",        sub: "Advanced AI workflows to accelerate daily tasks" },
    prompts:    { title: "Prompt Library",      sub: "Manage and customize agent system prompts" },
    connectors: { title: "Data Connectors",    sub: "Connect external knowledge sources" },
    users:      { title: "User Management",    sub: "Manage users and role-based access control" },
    audit:      { title: "Audit & Security",   sub: "System logs and compliance tracking" },
    evaluation: { title: "System Evaluation",  sub: "Automated RAG benchmarking suite" },
    kg:         { title: "Knowledge Graph",     sub: "Entity-relationship graph across all documents" },
    settings:   { title: "Settings",           sub: "Configure system preferences" },
  };

  const h = titles[page] || titles.overview;

  return (
    <div className="flex items-center justify-between px-6 h-14 border-b border-border bg-card/80 backdrop-blur-sm z-20 sticky top-0 shrink-0">
      <div className="flex items-center gap-3">
        <button className="md:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary" onClick={() => setSidebarOpen(true)}>
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <div className="text-sm font-semibold text-foreground">{h.title}</div>
          <div className="text-xs text-muted-foreground hidden sm:block">{h.sub}</div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button 
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          onClick={() => setPage?.('audit')}
          title="Notifications & Audit"
        >
          <Bell className="w-4 h-4" />
        </button>
        <button 
          onClick={toggleTheme} 
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border/70 bg-card hover:bg-secondary/80 text-foreground transition-all duration-200 cursor-pointer shadow-xs text-xs font-medium" 
          aria-label="Toggle Theme"
          title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
        >
          {isDark ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline text-xs">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline text-xs">Dark</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
