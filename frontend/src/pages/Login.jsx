import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/api';
import { ShieldCheck, AlertCircle, ArrowRight, Bot, Lock, Mail, CheckCircle2, UserCheck } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { email: 'admin@company.com', password: 'Admin@123', label: 'Administrator', role: 'Full Access', badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  { email: 'hr@company.com', password: 'Hr@123', label: 'HR Admin', role: 'HR & People Ops', badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  { email: 'employee@company.com', password: 'Employee@123', label: 'Employee', role: 'General Workspace', badge: 'bg-secondary text-muted-foreground border-border' },
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
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background px-4 py-12 relative text-foreground selection:bg-primary/20">
      
      {/* Central Login Card */}
      <div className="w-full max-w-[420px]">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <img
            src="/logo.jpg"
            alt="EnterpriseRAG logo"
            className="w-14 h-14 rounded-2xl object-cover shrink-0 mx-auto mb-4 shadow-sm"
          />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            EnterpriseRAG
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enterprise Knowledge Retrieval & Multi-Agent Intelligence
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-card border border-border rounded-xl p-6 sm:p-8 shadow-xs">
          
          <div className="mb-6">
            <h2 className="text-base font-semibold text-card-foreground">Sign In</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Enter your corporate credentials to access the workspace.</p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium mb-5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input 
                  className="w-full pl-9 pr-3.5 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow" 
                  type="email" 
                  placeholder="name@company.com" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-foreground">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input 
                  className="w-full pl-9 pr-3.5 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow" 
                  type="password" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required
                />
              </div>
            </div>

            <button 
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-semibold transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed mt-2" 
              type="submit"
              disabled={loading || !email || !password}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-8 pt-5 border-t border-border">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Quick Access Demo Accounts
            </div>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  type="button"
                  key={a.email} 
                  className="w-full flex items-center justify-between p-2.5 rounded-lg border border-border bg-secondary/40 hover:bg-secondary hover:border-border/80 transition-all text-left group"
                  onClick={() => { setEmail(a.email); setPassword(a.password); }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <UserCheck className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    <div className="truncate">
                      <div className="text-xs font-semibold text-foreground">{a.label}</div>
                      <div className="text-[11px] text-muted-foreground font-mono truncate">{a.email}</div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border shrink-0 ${a.badge}`}>
                    {a.role}
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Security Footer */}
        <div className="mt-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Protected by Enterprise RBAC & Audit Trails</span>
        </div>

      </div>
    </div>
  );
}
