export default function Agents({ navigateTo }) {
  const agents = [
    { id:'hr', icon:'👥', name:'HR Agent', color:'#22c55e', desc:'Handles leave policies, payroll, attendance, employee guidelines, onboarding, and performance reviews.' },
    { id:'legal', icon:'⚖️', name:'Legal Agent', color:'#7c5cfc', desc:'Handles NDAs, contracts, compliance documents, data protection, IP agreements, and legal policies.' },
    { id:'finance', icon:'💰', name:'Finance Agent', color:'#f59e0b', desc:'Handles expense claims, reimbursements, travel allowances, invoices, and budgeting procedures.' },
    { id:'it', icon:'🖥️', name:'IT Support Agent', color:'#3b82f6', desc:'Handles helpdesk tickets, password resets, software requests, equipment policies, and SOPs.' },
  ];

  return (
    <div className="page">
      <div style={{ marginBottom: '20px', color: 'var(--text2)', fontSize: '13px', maxWidth: '640px' }}>
        Queries are automatically routed to the correct specialized agent using intent classification. Each agent retrieves context only from its relevant department documents.
      </div>
      <div className="agents-grid">
        {agents.map(a => (
          <div key={a.id} className="agent-card">
            <div className="agent-header">
              <div style={{ fontSize: '28px' }}>{a.icon}</div>
              <div>
                <div className="agent-name">{a.name}</div>
                <div style={{ width: '24px', height: '3px', background: a.color, borderRadius: '2px', marginTop: '4px' }}></div>
              </div>
            </div>
            <div className="agent-desc">{a.desc}</div>
            <button 
              className="btn btn-ghost btn-sm" 
              style={{ marginTop: '12px', width: '100%', justifyContent: 'center' }}
              onClick={() => navigateTo('chat', `What can you help me with regarding \${a.id}?`)}
            >
              Ask this Agent →
            </button>
          </div>
        ))}
      </div>

      <div className="section-title" style={{ marginTop: '28px' }}>Hallucination Detection</div>
      <div className="doc-card" style={{ maxWidth: '640px' }}>
        <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.8 }}>
          <p>Every response goes through a multi-signal hallucination detection pipeline:</p>
          <br/>
          <p>🔍 <strong>Word Overlap Score</strong> — measures how much response vocabulary is grounded in retrieved context</p>
          <p>🎯 <strong>Specific Claim Verification</strong> — checks if figures, numbers, and explicit claims appear in source documents</p>
          <p>📏 <strong>Coverage Score</strong> — verifies n-gram overlap between response and retrieved chunks</p>
          <br/>
          <p>Responses with confidence below 45% are flagged with a ⚠️ warning banner.</p>
        </div>
      </div>
    </div>
  );
}
