import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/api';
import WebGLShaderBackground from '../components/WebGLShaderBackground';
import { 
  AlertCircle, 
  ArrowRight, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Cpu,
  KeyRound,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');

    try {
      const data = await apiCall('POST', '/auth/login', { email, password });
      login(
        { id: data.user_id, role: data.role, name: data.name, email, department: data.department },
        data.access_token
      );
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row relative text-slate-100 font-sans selection:bg-[#10B981]/30 overflow-hidden">
      
      {/* ── REALTIME WEBGL LATENT EMBEDDING SHADER ── */}
      <WebGLShaderBackground />

      {/* ── LEFT SHOWCASE PANEL ── */}
      <div className="w-full lg:w-[48%] min-h-[440px] lg:min-h-screen flex flex-col justify-between p-8 sm:p-14 relative z-10 border-b lg:border-b-0 lg:border-r border-white/10 backdrop-blur-[1px] bg-gradient-to-b from-[#080E14]/15 via-[#04080C]/25 to-[#020508]/35">
        
        {/* Top Minimal Pill */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-medium backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            <span>Enterprise Knowledge Platform</span>
          </div>
        </motion.div>

        {/* Central Animated Logo & Orbital System */}
        <div className="relative z-10 my-auto py-10 flex flex-col items-center text-center">
          
          <div className="relative w-[300px] h-[300px] sm:w-[380px] sm:h-[380px] flex items-center justify-center">
            
            {/* Outer Orbit with Rotating Nodes */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 42, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border border-dashed border-[#10B981]/25"
            >
              <motion.div 
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-6 right-16 w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-[0_0_12px_#10B981]" 
              />
              <div className="absolute bottom-12 left-10 w-2.5 h-2.5 rounded-full bg-[#34D399] shadow-[0_0_10px_#34D399]" />
            </motion.div>

            {/* Mid Orbit in Reverse with Pulsing Nodes */}
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute inset-[38px] sm:inset-[46px] rounded-full border border-dashed border-[#10B981]/30"
            >
              <div className="absolute bottom-8 right-16 w-3 h-3 rounded-full bg-[#10B981] shadow-[0_0_14px_#10B981]" />
              <motion.div 
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute top-12 left-12 w-2 h-2 rounded-full bg-[#6EE7B7]" 
              />
            </motion.div>

            {/* Inner Ring */}
            <div className="absolute inset-[78px] sm:inset-[92px] rounded-full border border-[#10B981]/35" />

            {/* Levitating Logo Card with Subtle Breathing Glow */}
            <motion.div 
              animate={{ y: [-5, 6, -5] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-20 w-36 h-36 sm:w-44 sm:h-44 rounded-3xl bg-slate-900/90 border border-[#10B981]/40 p-5 shadow-[0_0_55px_rgba(16,185,129,0.3)] backdrop-blur-xl flex items-center justify-center transition-all duration-300 hover:scale-105 hover:border-[#10B981]"
            >
              <motion.div 
                animate={{ opacity: [0.15, 0.35, 0.15] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-2 rounded-2xl bg-[#10B981]/20 blur-xl pointer-events-none" 
              />
              <img
                src="/logo.jpg"
                alt="VeriRAG Logo"
                className="w-full h-full object-contain relative z-10 filter drop-shadow-[0_4px_18px_rgba(16,185,129,0.4)]"
              />
            </motion.div>
          </div>

          {/* Title & Modern SaaS Tagline */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 max-w-sm"
          >
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-['Outfit',sans-serif]">
              Veri<span className="text-[#10B981]">RAG</span>
            </h1>

            {/* Accent Divider */}
            <div className="flex items-center justify-center gap-2 my-2.5">
              <div className="w-8 h-[1px] bg-[#10B981]/40" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]" />
              <div className="w-8 h-[1px] bg-[#10B981]/40" />
            </div>

            <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              Enterprise search and intelligence for modern teams.
            </p>
          </motion.div>

        </div>

        {/* Clean Footer Brand Info */}
        <div className="relative z-10 text-[11px] text-slate-400 flex items-center justify-between border-t border-white/5 pt-4">
          <span>© 2026 VeriRAG Inc.</span>
          <span className="text-slate-400">Security & Privacy First</span>
        </div>

      </div>

      {/* ── RIGHT AUTH PANEL: Premium Glassmorphism Card ── */}
      <div className="w-full lg:w-[52%] flex flex-col items-center justify-center p-6 sm:p-12 relative z-10">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-[420px] relative z-10"
        >
          {/* Card Container */}
          <div className="relative rounded-3xl bg-[#09121B]/80 border border-[#10B981]/30 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.85)] backdrop-blur-2xl p-7 sm:p-9 overflow-hidden">
            
            {/* Top Emerald Accent Beam with animated shine */}
            <motion.div 
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#10B981] to-transparent" 
            />

            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Sign In
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter your work credentials to access your workspace.
              </p>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, y: -6 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -6 }}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-medium mb-5"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              
              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-[#10B981] transition-colors" />
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#050B10]/80 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 focus:border-[#10B981] transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs font-medium text-[#34D399] hover:text-[#6EE7B7] transition-colors hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative group">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-[#10B981] transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-[#050B10]/80 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 focus:border-[#10B981] transition-all font-mono"
                  />
                  <button
                    type="button"
                    aria-label="Toggle password visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                type="submit"
                disabled={loading || !email || !password}
                className="w-full mt-3 py-3 px-4 rounded-xl font-semibold text-sm text-slate-950 flex items-center justify-center gap-2 bg-[#10B981] hover:bg-[#059669] hover:text-white transition-all shadow-lg shadow-[#10B981]/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 animate-spin text-slate-900" />
                    Signing In...
                  </span>
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>

            </form>

          </div>

          {/* Under-Card Clean Note */}
          <div className="mt-5 text-center text-xs text-slate-400">
            Protected by corporate role-based access control.
          </div>

        </motion.div>

      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-[#09121B] border border-[#10B981]/30 rounded-2xl p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setShowForgotModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 text-[#34D399]">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Reset Credentials</h3>
                  <p className="text-xs text-slate-400">Account Recovery</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Passwords can be reset through your corporate workspace administrator or by using the demo credentials in <code className="text-[#34D399] font-mono">README.md</code>.
              </p>

              <div className="p-3 rounded-lg bg-black/40 border border-slate-800 text-xs text-slate-400 mb-5 font-mono">
                Admin: <span className="text-[#34D399]">admin@company.com</span> / <span className="text-[#34D399]">Admin@123</span>
              </div>

              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-950 bg-[#10B981] hover:bg-[#34D399] transition-colors cursor-pointer"
              >
                Return to Sign In
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
