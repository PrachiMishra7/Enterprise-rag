import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/api';

const DEMO_ACCOUNTS = [
  { email: 'admin@company.com', password: 'AdminPass!2024', label: 'Admin (All Access)' },
  { email: 'carol@company.com', password: 'EnterprisePass!2024', label: 'HR Admin' },
  { email: 'alice@company.com', password: 'EnterprisePass!2024', label: 'Employee' },
];

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');
    
    try {
      const data = await apiCall('POST', '/auth/login', { email, password });
      login({ id: data.user_id, role: data.role, name: data.name, email }, data.access_token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">🤖</div>
          <div className="login-title">EnterpriseRAG</div>
          <div className="login-sub">AI-Powered Document Intelligence</div>
        </div>
        
        {error && <div className="error-msg">⚠️ {error}</div>}
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input 
              className="form-input" 
              type="email" 
              placeholder="your@company.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              className="form-input" 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
            />
          </div>
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', justifyContent: 'center', padding: '12px' }} 
            type="submit"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In →'}
          </button>
        </form>

        <div className="demo-accounts">
          <div className="demo-title">Demo Accounts (click to fill)</div>
          {DEMO_ACCOUNTS.map(a => (
            <div 
              key={a.email} 
              className="demo-item" 
              onClick={() => { setEmail(a.email); setPassword(a.password); }}
            >
              <span className="demo-email">{a.email}</span>
              <span>{a.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
