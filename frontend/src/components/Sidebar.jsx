import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { LayoutDashboard, MessageSquare, Folder, Bot, Upload, LogOut, TerminalSquare, Plug, Users, ShieldAlert, Settings, Zap } from 'lucide-react';

export default function Sidebar({ currentPage, setPage, sidebarOpen }) {
  const { user, logout } = useAuth();

  const SECTIONS = [
    { title: "Dashboard", items: [{ id: "overview", icon: LayoutDashboard, label: "Overview" }] },
    { title: "AI & Workflows", items: [
      { id: "chat", icon: MessageSquare, label: "Ask AI" },
      { id: "agents", icon: Bot, label: "AI Flow Builder" },
      { id: "tools", icon: TerminalSquare, label: "AI Utilities" },
      { id: "prompts", icon: Zap, label: "Prompt Library" },
    ]},
    { title: "Knowledge Base", items: [
      { id: "documents", icon: Folder, label: "Document Library" },
      { id: "connectors", icon: Plug, label: "Data Connectors" },
    ]},
    { title: "Administration", items: [
      { id: "upload", icon: Upload, label: "Upload Center" },
      { id: "users", icon: Users, label: "User Management" },
      { id: "audit", icon: ShieldAlert, label: "Audit & Security" },
      { id: "settings", icon: Settings, label: "Settings" },
    ]},
  ];

  return (
    <div className={`fixed inset-y-0 left-0 md:relative w-60 min-w-[240px] bg-card border-r border-border flex flex-col z-50 h-full transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      <div className="px-5 h-14 flex items-center gap-3 border-b border-border shrink-0">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Bot className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-semibold text-[15px] tracking-tight text-foreground">EnterpriseRAG</span>
      </div>

      <div className="flex-1 flex flex-col gap-5 px-3 py-4 overflow-y-auto no-scrollbar">
        {SECTIONS.map((section, idx) => (
          <div key={idx} className="flex flex-col gap-0.5">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-1">{section.title}</div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors text-left ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
                  onClick={() => setPage(item.id)}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                  {isActive && (
                    <motion.div layoutId="activeIndicator" className="ml-auto w-1 h-4 rounded-full bg-primary" transition={{ type: "spring", stiffness: 350, damping: 30 }} />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="px-3 py-3 border-t border-border shrink-0">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-secondary transition-colors group">
          <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-bold shrink-0">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-foreground truncate">{user?.name}</div>
            <div className="text-[10px] text-muted-foreground truncate capitalize">{user?.role?.replace("_", " ")}</div>
          </div>
          <button onClick={logout} className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100" title="Logout">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
