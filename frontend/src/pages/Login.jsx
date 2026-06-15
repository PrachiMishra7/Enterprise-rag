import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/api';
import { Bot, AlertCircle, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const DEMO_ACCOUNTS = [
  { email: 'admin@company.com', password: 'AdminPass!2024', label: 'Administrator', icon: ShieldCheck, color: 'text-amber-500' },
  { email: 'carol@company.com', password: 'EnterprisePass!2024', label: 'HR Director', icon: Zap, color: 'text-primary' },
  { email: 'alice@company.com', password: 'EnterprisePass!2024', label: 'Employee', icon: Bot, color: 'text-green-500' },
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
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden selection:bg-primary/30">
      
      {/* Premium Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10 p-6"
      >
        <div className="bg-card/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
          
          {/* Top Edge Glow */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
          
          <div className="text-center mb-10 relative">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/25 border border-white/20">
              <Bot className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 font-sans">EnterpriseRAG</h1>
            <p className="text-sm text-muted-foreground font-medium">Secure AI Document Intelligence</p>
          </div>
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium rounded-xl mb-6"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </motion.div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
              <input 
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all" 
                type="email" 
                placeholder="name@company.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Password</label>
              <input 
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all" 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
              />
            </div>
            <button 
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-white hover:bg-gray-100 text-black rounded-xl text-sm font-bold transition-all shadow-lg shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed mt-4 group" 
              type="submit"
              disabled={loading}
            >
              {loading ? 'Authenticating securely...' : 'Sign In'}
              {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-white/5">
            <div className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest mb-4 text-center">Demo Access Points</div>
            <div className="grid gap-2.5">
              {DEMO_ACCOUNTS.map(a => {
                const Icon = a.icon;
                return (
                  <div 
                    key={a.email} 
                    className="flex justify-between items-center px-4 py-3 bg-black/10 border border-white/5 hover:border-white/20 hover:bg-white/5 rounded-xl cursor-pointer transition-all group" 
                    onClick={() => { setEmail(a.email); setPassword(a.password); }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg bg-black/20 flex items-center justify-center border border-white/5 ${a.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="font-semibold text-white text-xs">{a.label}</span>
                        <span className="text-[10px] text-muted-foreground">{a.email}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
