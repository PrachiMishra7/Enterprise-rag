"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { 
  LayoutDashboard, 
  MessageSquare, 
  FileText, 
  ShieldAlert, 
  Settings, 
  Users, 
  Bot, 
  Terminal,
  LogOut,
  Upload,
  Database
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  const navGroups = [
    {
      label: "Dashboard",
      items: [
        { name: "Overview", href: "/overview", icon: LayoutDashboard },
      ]
    },
    {
      label: "AI & Workflows",
      items: [
        { name: "Ask AI", href: "/chat", icon: MessageSquare },
        { name: "AI Flow Builder", href: "/agents", icon: Bot },
        { name: "Prompt Library", href: "/prompts", icon: Terminal },
      ]
    },
    {
      label: "Knowledge Base",
      items: [
        { name: "Document Library", href: "/documents", icon: FileText },
        { name: "Data Connectors", href: "/connectors", icon: Database },
      ]
    },
    {
      label: "Administration",
      items: [
        { name: "Upload Center", href: "/upload", icon: Upload },
        { name: "User Management", href: "/users", icon: Users },
        { name: "Audit & Security", href: "/audit", icon: ShieldAlert },
        { name: "Settings", href: "/settings", icon: Settings },
      ]
    }
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background text-white">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 glass-panel border-r border-white/5 flex flex-col relative z-20">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-black font-outfit shadow-lg shadow-indigo-500/20">E</div>
            <span className="font-outfit font-black text-xl text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-200 tracking-tight">EnterpriseRAG</span>
          </Link>
        </div>
        
        <div className="flex-1 overflow-y-auto py-2 px-3 flex flex-col gap-6">
          {navGroups.map((group) => (
            <div key={group.label}>
              <h4 className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{group.label}</h4>
              <div className="flex flex-col gap-1">
                {group.items.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  const Icon = item.icon;
                  
                  return (
                    <Link 
                      key={item.name} 
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group ${
                        isActive 
                          ? "bg-indigo-500/15 text-indigo-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-indigo-500/20" 
                          : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                      }`}
                    >
                      <Icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                      <span className="font-semibold text-sm">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-lg bg-white/5 border border-white/10">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate capitalize">{user.role}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-rose-400 hover:bg-rose-400/10 hover:text-rose-300 rounded-lg transition-colors border border-transparent"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Subtle glowing orb for main content area */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="flex-1 overflow-y-auto relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
