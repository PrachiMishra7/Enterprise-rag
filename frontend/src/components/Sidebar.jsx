import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, MessageSquare, Folder, Bot, Upload, LogOut } from 'lucide-react';

export default function Sidebar({ currentPage, setPage }) {
  const { user, logout } = useAuth();
  
  const items = [
    { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
    { id: 'chat', icon: MessageSquare, label: 'Ask AI' },
    { id: 'documents', icon: Folder, label: 'Documents' },
    { id: 'agents', icon: Bot, label: 'AI Agents' },
  ];

  if (['admin','hr_admin','legal_admin','finance_admin','it_admin'].includes(user?.role)) {
    items.push({ id: 'upload', icon: Upload, label: 'Upload Docs' });
  }

  return (
    <div className="w-64 min-w-64 bg-card border-r border-border flex flex-col z-50 h-full overflow-y-auto transition-transform">
      <div className="p-6 border-b border-border">
        <div className="text-xl font-bold tracking-tight text-primary">EnterpriseRAG</div>
        <div className="text-xs text-muted-foreground mt-1 font-medium">AI Document Intelligence</div>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-1">
        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">Main Menu</div>
        {items.map(item => {
          const Icon = item.icon;
          return (
            <div 
              key={item.id}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors ${
                currentPage === item.id 
                  ? 'bg-secondary text-primary font-semibold' 
                  : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
              }`}
              onClick={() => setPage(item.id)}
            >
              <Icon className="w-4 h-4" />
              <div>{item.label}</div>
            </div>
          );
        })}
      </div>

      <div className="m-4 p-4 bg-background/50 rounded-lg border border-border flex flex-col gap-1">
        <div className="text-sm font-semibold text-foreground">{user?.name}</div>
        <div className="text-xs text-muted-foreground mb-2">{user?.email}</div>
        <span className="inline-block self-start text-[10px] px-2 py-0.5 rounded font-semibold uppercase bg-primary/10 text-primary border border-primary/20">
          {user?.role.replace('_', ' ')}
        </span>
        <button 
          className="mt-4 flex items-center justify-center gap-2 w-full py-2 px-4 bg-background border border-border hover:bg-secondary rounded-md text-xs font-medium transition-colors"
          onClick={logout}
        >
          <LogOut className="w-3 h-3" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
