import { useAuth } from '../contexts/AuthContext';

export default function Sidebar({ currentPage, setPage }) {
  const { user, logout } = useAuth();
  
  const items = [
    { id: 'overview', icon: '⊞', label: 'Overview' },
    { id: 'chat', icon: '💬', label: 'Ask AI' },
    { id: 'documents', icon: '📁', label: 'Documents' },
    { id: 'agents', icon: '🤖', label: 'AI Agents' },
  ];

  if (['admin','hr_admin','legal_admin','finance_admin','it_admin'].includes(user?.role)) {
    items.push({ id: 'upload', icon: '⬆️', label: 'Upload Docs' });
  }

  return (
    <div className="sidebar">
      <div className="logo">
        <div className="logo-title">EnterpriseRAG</div>
        <div className="logo-sub">AI Document Intelligence</div>
      </div>

      <div className="nav">
        <div className="nav-section">Main Menu</div>
        {items.map(item => (
          <div 
            key={item.id}
            className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => setPage(item.id)}
          >
            <div className="nav-icon">{item.icon}</div>
            <div>{item.label}</div>
          </div>
        ))}
      </div>

      <div className="user-card">
        <div className="user-name">{user?.name}</div>
        <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '8px' }}>{user?.email}</div>
        <span className={`user-role-badge badge-${user?.role}`}>
          {user?.role.replace('_', ' ')}
        </span>
        <button 
          className="btn btn-ghost btn-sm" 
          style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}
          onClick={logout}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
