import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, MessageSquare, Folder, Upload, LogOut, 
  TerminalSquare, Plug, Users, ShieldAlert, Settings, Zap, 
  FlaskConical, Share2, Bot, ChevronRight 
} from 'lucide-react';

export default function Sidebar({ currentPage, setPage, sidebarOpen }) {
  const { user, logout } = useAuth();

  const SECTIONS = [
    { 
      title: "Dashboard", 
      items: [
        { id: "overview", icon: LayoutDashboard, label: "Overview" }
      ] 
    },
    { 
      title: "AI & Workflows", 
      items: [
        { id: "chat", icon: MessageSquare, label: "Ask AI" },
        { id: "agents", icon: Bot, label: "AI Flow Builder" },
        { id: "tools", icon: TerminalSquare, label: "AI Utilities" },
        { id: "prompts", icon: Zap, label: "Prompt Library" },
      ]
    },
    { 
      title: "Knowledge Base", 
      items: [
        { id: "documents", icon: Folder, label: "Document Library" },
        { id: "connectors", icon: Plug, label: "Data Connectors" },
        { id: "kg", icon: Share2, label: "Knowledge Graph" },
      ]
    },
    { 
      title: "Administration", 
      items: [
        { id: "upload", icon: Upload, label: "Upload Center" },
        { id: "users", icon: Users, label: "User Management" },
        { id: "audit", icon: ShieldAlert, label: "Audit & Security" },
        { id: "evaluation", icon: FlaskConical, label: "System Evaluation" },
        { id: "settings", icon: Settings, label: "Settings" },
      ]
    },
  ];

  return (
    <aside 
      className={`fixed inset-y-0 left-0 md:relative w-64 min-w-[256px] bg-card border-r border-border flex flex-col z-50 h-full transition-transform duration-200 ease-in-out ${
        sidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full md:translate-x-0'
      }`}
    >
      {/* Brand Header */}
      <div className="px-4 h-14 flex items-center gap-3 border-b border-border shrink-0">
        <img
          src="/logo.jpg"
          alt="EnterpriseRAG logo"
          className="w-8 h-8 rounded-lg object-cover shrink-0 shadow-xs"
        />
        <div className="flex flex-col">
          <span className="font-bold text-sm tracking-tight text-foreground">EnterpriseRAG</span>
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Workspace</span>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 flex flex-col gap-5 px-3 py-4 overflow-y-auto no-scrollbar">
        {SECTIONS.map((section, idx) => (
          <div key={idx} className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold text-muted-foreground/80 uppercase tracking-wider px-2.5 mb-1.5">
              {section.title}
            </span>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setPage(item.id)}
                  className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-md text-xs font-medium cursor-pointer transition-colors text-left group ${
                    isActive 
                      ? 'bg-primary/10 text-primary font-semibold' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                  <span className="truncate">{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1 h-3.5 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-border shrink-0 bg-secondary/30">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-secondary/60 transition-colors group">
          <div className="w-7 h-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-semibold shrink-0">
            {user?.name?.[0]?.toUpperCase() || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-foreground truncate">{user?.name || "Enterprise User"}</div>
            <div className="text-[10px] text-muted-foreground truncate uppercase font-mono">{user?.role?.replace("_", " ") || "Member"}</div>
          </div>
          <button 
            onClick={logout} 
            className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" 
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
