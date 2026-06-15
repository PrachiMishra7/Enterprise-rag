import { useAuth } from '../contexts/AuthContext';

export default function Overview({ documents, navigateTo }) {
  const { user } = useAuth();
  const deptCounts = {};
  documents.forEach(d => { deptCounts[d.department] = (deptCounts[d.department] || 0) + 1; });

  const depts = [
    { dept: 'hr', icon: '👥', name: 'Human Resources', desc: 'Leave policies, payroll, onboarding, conduct' },
    { dept: 'legal', icon: '⚖️', name: 'Legal & Compliance', desc: 'Contracts, NDAs, compliance, agreements' },
    { dept: 'finance', icon: '💰', name: 'Finance', desc: 'Expenses, reimbursements, invoices, budgets' },
    { dept: 'it', icon: '🖥️', name: 'IT Support', desc: 'Help desk, software, hardware, security' },
  ];

  return (
    <div className="page">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📄</div>
          <div className="stat-value">{documents.length}</div>
          <div className="stat-label">Documents Available</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🤖</div>
          <div className="stat-value">4</div>
          <div className="stat-label">Specialized Agents</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔒</div>
          <div className="stat-value">{user?.role.replace('_',' ').toUpperCase()}</div>
          <div className="stat-label">Your Access Level</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-value">Active</div>
          <div className="stat-label">Hallucination Guard</div>
        </div>
      </div>

      <div className="section-title">Access-Controlled Departments</div>
      <div className="docs-grid">
        {depts.map(d => (
          <div 
            key={d.dept} 
            className="doc-card" 
            style={{ cursor: 'pointer' }}
            onClick={() => navigateTo('chat', `Tell me about ${d.dept} policies`)}
          >
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>{d.icon}</div>
            <div className="doc-name">{d.name}</div>
            <div className="doc-meta">{d.desc}</div>
            <div className="doc-tags" style={{ marginTop: '10px' }}>
              <span className={`tag tag-${d.dept}`}>{deptCounts[d.dept] || 0} docs</span>
            </div>
          </div>
        ))}
      </div>

      <div className="section-title" style={{ marginTop: '28px' }}>System Architecture</div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px', fontSize: '12px', color: 'var(--text2)', lineHeight: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {['User Query','→','Auth + RBAC','→','Agent Router','→','Hybrid Retrieval (BM25 + Dense)','→','LLM Processing','→','Hallucination Detection','→','Response + Citations'].map((s,i) =>
            s === '→'
              ? <span key={i} style={{ color: 'var(--accent)', fontSize: '16px' }}>→</span>
              : <span key={i} style={{ padding: '4px 10px', background: 'var(--surface2)', borderRadius: '6px', border: '1px solid var(--border)' }}>{s}</span>
          )}
        </div>
      </div>
    </div>
  );
}
