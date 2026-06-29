import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, MessageSquare, Folder, Bot, Upload, LogOut,
  TerminalSquare, Plug, Users, ShieldAlert, Settings
} from 'lucide-react';

export default function Sidebar({ currentPage, setPage, sidebarOpen }) {
  const { user, logout } = useAuth();
  
  const SECTIONS = [
    {
      title: "Dashboard",
      items: [
        { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
      ]
    },
    {
      title: "AI & Workflows",
      items: [
        { id: 'chat', icon: MessageSquare, label: 'Ask AI' },
        { id: 'agents', icon: Bot, label: 'AI Flow Builder' },
        { id: 'prompts', icon: TerminalSquare, label: 'Prompt Library' },
      ]
    },
    {
      title: "Knowledge Base",
      items: [
        { id: 'documents', icon: Folder, label: 'Document Library' },
        { id: 'connectors', icon: Plug, label: 'Data Connectors' },
      ]
    }
  ];

  const ADMIN_SECTION = {
    title: "Administration",
    items: [
      { id: 'upload', icon: Upload, label: 'Upload Center' },
      { id: 'users', icon: Users, label: 'User Management' },
      { id: 'audit', icon: ShieldAlert, label: 'Audit & Security' },
      { id: 'settings', icon: Settings, label: 'Settings' },
    ]
  };

  const sectionsToRender = [...SECTIONS, ADMIN_SECTION];

  return (
    <div className={`fixed inset-y-0 left-0 md:relative w-64 min-w-[256px] bg-[#0a0f1d] border-r border-white/5 flex flex-col z-50 h-full overflow-y-auto no-scrollbar transition-transform duration-300 ease-in-out shadow-2xl ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-full h-32 bg-primary/10 blur-[80px] pointer-events-none"></div>

      <div className="p-6 border-b border-white/5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-extrabold tracking-tight text-white">EnterpriseRAG</div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-6 p-4 relative z-10">
        {sectionsToRender.map((section, idx) => (
          <div key={idx} className="flex flex-col gap-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-1">
              {section.title}
            </div>
            {section.items.map((item, i) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 + i * 0.05 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  key={item.id}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all group relative overflow-hidden ${
                    isActive 
                      ? 'text-white bg-primary/10' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                  onClick={() => setPage(item.id)}
                >
                  {isActive && (
                    <motion.div layoutId="activeTab" className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-md shadow-[0_0_10px_#3b82f6]"></motion.div>
                  )}
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-primary' : 'group-hover:text-primary/70'}`} />
                  <div>{item.label}</div>
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="m-4 p-4 bg-[#151c33]/80 backdrop-blur-xl rounded-xl border border-white/5 flex flex-col gap-1 relative z-10">
        <div className="text-sm font-bold text-white">{user?.name}</div>
        <div className="text-xs text-slate-400 mb-2 truncate">{user?.email}</div>
        <span className="inline-block self-start text-[9px] px-2 py-1 rounded font-bold uppercase bg-primary/20 text-blue-300 border border-primary/30 tracking-wider">
          {user?.role.replace('_', ' ')}
        </span>
        <button 
          className="mt-4 flex items-center justify-center gap-2 w-full py-2 px-4 bg-white/5 border border-white/10 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/30 rounded-lg text-xs font-bold transition-all"
          onClick={logout}
        >
          <LogOut className="w-3.5 h-3.5" />
          Secure Logout
        </button>
      </div>
    </div>
  );
}
