import { useState, useEffect } from "react";
import { Menu, Sun, Moon, Bell, Shield, User } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function Header({ page, setSidebarOpen, setPage }) {
  const { user } = useAuth();
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
    overview:   { title: "Dashboard",          sub: "Enterprise knowledge metrics, retrieval health, and recent operations" },
    chat:       { title: "Ask AI",             sub: "RAG-grounded retrieval with hallucination detection and citations" },
    documents:  { title: "Document Library",   sub: "Role-scoped documents and indexed vector chunks" },
    upload:     { title: "Upload Center",       sub: "Ingest and embed new enterprise files into vector storage" },
    agents:     { title: "AI Flow Builder",     sub: "Multi-agent LangGraph workflow pipelines" },
    tools:      { title: "AI Utilities",        sub: "Specialized generation utilities and document comparison" },
    prompts:    { title: "Prompt Library",      sub: "System instructions and domain expert configurations" },
    connectors: { title: "Data Connectors",    sub: "Manage enterprise repository sync and integrations" },
    users:      { title: "User Management",    sub: "Administer corporate access and role-based permissions (RBAC)" },
    audit:      { title: "Audit & Security",   sub: "System compliance logs and retrieval monitoring" },
    evaluation: { title: "System Evaluation",  sub: "Automated RAG benchmarking suite" },
    kg:         { title: "Knowledge Graph",     sub: "Entity-relationship graph across all documents" },
    settings:   { title: "Settings",           sub: "System chunking, retrieval depth, and model configurations" },
  };

  const h = titles[page] || titles.overview;

  return (
    <header className="flex items-center justify-between px-6 h-14 border-b border-border bg-card sticky top-0 shrink-0 z-30">
      <div className="flex items-center gap-3">
        <button 
          className="md:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer" 
          onClick={() => setSidebarOpen(true)}
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <img 
          src="/logo.jpg" 
          alt="EnterpriseRAG logo" 
          className="w-7 h-7 rounded-lg object-cover md:hidden shrink-0" 
        />
        <div>
          <div className="text-sm font-semibold text-foreground tracking-tight">{h.title}</div>
          <div className="text-[11px] text-muted-foreground hidden sm:block">{h.sub}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* System Status Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary text-[11px] font-medium text-muted-foreground border border-border">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>System Healthy</span>
        </div>

        {/* Audit link / Notifications */}
        <button 
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
          onClick={() => setPage?.('audit')}
          title="Security & Audit Logs"
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* Theme Switcher Button */}
        <button 
          onClick={toggleTheme} 
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border bg-card hover:bg-secondary text-foreground transition-colors cursor-pointer text-xs font-medium" 
          aria-label="Toggle Theme"
          title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
        >
          {isDark ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[11px]">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px]">Dark</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
