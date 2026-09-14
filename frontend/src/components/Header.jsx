import { useState, useEffect } from "react";
import { Menu, Sun, Moon, Bell } from "lucide-react";

export default function Header({ page, setSidebarOpen }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    setIsDark(root.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.remove("dark");
      setIsDark(false);
    } else {
      root.classList.add("dark");
      setIsDark(true);
    }
  };

  const titles = {
    overview: { title: "Dashboard Overview", sub: "System health and document statistics" },
    chat: { title: "Ask the AI", sub: "RAG-powered answers with hallucination detection" },
    documents: { title: "Document Library", sub: "Available to your role" },
    upload: { title: "Upload Document", sub: "Index new enterprise documents" },
    agents: { title: "AI Agents", sub: "Specialized agents per department" },
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
        <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
          <Bell className="w-4 h-4" />
        </button>
        <button onClick={toggleTheme} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" aria-label="Toggle Theme">
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
