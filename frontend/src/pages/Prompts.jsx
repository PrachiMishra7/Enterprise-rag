import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TerminalSquare, Search, Copy, CheckCircle2, Edit3, 
  Bot, ArrowRight, Landmark, Monitor, Scale, Users, 
  RefreshCw, Save, X, RotateCcw, AlertTriangle 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/api';

const PROMPT_META = {
  hr: { icon: Users, color: 'emerald', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', tags: ['HR', 'Policies', 'Onboarding'] },
  legal: { icon: Scale, color: 'purple', bg: 'bg-purple-500/10', border: 'border-purple-500/30', tags: ['Legal', 'Compliance', 'NDAs'] },
  finance: { icon: Landmark, color: 'amber', bg: 'bg-amber-500/10', border: 'border-amber-500/30', tags: ['Finance', 'Budgets', 'Expenses'] },
  it: { icon: Monitor, color: 'orange', bg: 'bg-orange-500/10', border: 'border-orange-500/30', tags: ['IT', 'Support', 'Hardware'] },
  general: { icon: Bot, color: 'blue', bg: 'bg-blue-500/10', border: 'border-blue-500/30', tags: ['General', 'Fallback'] },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
};

export default function Prompts() {
  const { token, user } = useAuth();
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  
  // Editing states
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchPrompts = async () => {
    setLoading(true);
    try {
      const data = await apiCall('GET', '/prompts/list', null, false, token);
      setPrompts(data.prompts || []);
    } catch (e) {
      console.error('Error fetching prompts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, [token]);

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openEditModal = (prompt) => {
    setEditingPrompt({ ...prompt });
    setErrorMsg('');
  };

  const closeEditModal = () => {
    if (!updating && !resetting) {
      setEditingPrompt(null);
      setErrorMsg('');
    }
  };

  const handleUpdatePrompt = async () => {
    if (!editingPrompt) return;
    setUpdating(true);
    setErrorMsg('');
    try {
      await apiCall('PUT', `/prompts/${editingPrompt.id}`, { system_prompt: editingPrompt.system_prompt }, false, token);
      
      // Update local state
      setPrompts(prev => prev.map(p => p.id === editingPrompt.id ? { ...p, system_prompt: editingPrompt.system_prompt } : p));
      setEditingPrompt(null);
    } catch (e) {
      console.error(e);
      setErrorMsg(e.message || 'Failed to update system prompt. Do you have sufficient permissions?');
    } finally {
      setUpdating(false);
    }
  };

  const handleResetPrompt = async (id) => {
    if (!window.confirm('Are you sure you want to reset this agent prompt to its default system template?')) return;
    setResetting(true);
    setErrorMsg('');
    try {
      await apiCall('POST', `/prompts/${id}/reset`, null, false, token);
      
      // Refresh list to pull default values
      const data = await apiCall('GET', '/prompts/list', null, false, token);
      setPrompts(data.prompts || []);
      
      // If we are currently editing, close/refresh it
      if (editingPrompt && editingPrompt.id === id) {
        const resetObj = (data.prompts || []).find(p => p.id === id);
        if (resetObj) {
          setEditingPrompt({ ...resetObj });
        }
      }
    } catch (e) {
      console.error(e);
      setErrorMsg(e.message || 'Failed to reset system prompt.');
    } finally {
      setResetting(false);
    }
  };

  const filteredPrompts = prompts.filter(p => {
    const meta = PROMPT_META[p.id] || PROMPT_META.general;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.system_prompt.toLowerCase().includes(search.toLowerCase()) ||
                          meta.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchesSearch;
  });

  const canEdit = ['admin', 'manager', 'hr_admin', 'legal_admin', 'finance_admin', 'it_admin'].includes(user?.role);

  return (
    <div className="flex-1 flex flex-col bg-[#060913] text-white overflow-y-auto relative">
      
      {/* Dynamic Backgrounds */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto w-full p-6 md:p-10 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <TerminalSquare className="w-6 h-6 text-purple-400" />
              <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">Prompt Library</h1>
            </div>
            <p className="text-sm text-[#8b92a5] font-bold tracking-widest uppercase">Manage system instructions and AI behavior templates.</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search prompts or tags..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-medium focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder:text-slate-500"
              />
            </div>
            <button 
              onClick={fetchPrompts}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-slate-300 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Prompts Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20">
            <RefreshCw className="w-10 h-10 text-purple-500 animate-spin mb-4" />
            <p className="text-slate-400 text-sm font-bold tracking-widest uppercase">Fetching Active Prompt Configuration...</p>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {filteredPrompts.map(prompt => {
              const meta = PROMPT_META[prompt.id] || PROMPT_META.general;
              const Icon = meta.icon;
              const isCopied = copiedId === prompt.id;
              
              return (
                <motion.div 
                  key={prompt.id}
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                  className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-3xl p-6 flex flex-col gap-4 relative overflow-hidden group shadow-xl hover:shadow-2xl transition-all"
                >
                  <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-[60px] -mr-20 -mt-20 opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity ${meta.bg.split(' ')[0].replace('/10', '/30')}`}></div>
                  
                  <div className="flex justify-between items-start relative z-10">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner ${meta.bg} ${meta.border}`}>
                        <Icon className={`w-6 h-6 text-${meta.color}-400`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-white tracking-tight">{prompt.name}</h3>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className={`w-2 h-2 rounded-full bg-${meta.color}-400 animate-pulse`}></span>
                          <span className="text-[10px] font-bold text-[#8b92a5] uppercase tracking-widest">Active Agent</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleCopy(prompt.id, prompt.system_prompt)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors"
                        title="Copy Prompt"
                      >
                        {isCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 bg-black/20 rounded-2xl p-4 border border-white/5 relative z-10 group-hover:border-white/10 transition-colors">
                    <p className="text-sm text-slate-300 font-mono leading-relaxed line-clamp-4">
                      {prompt.system_prompt}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-2 relative z-10">
                    <div className="flex flex-wrap gap-2">
                      {meta.tags.map(tag => (
                        <span key={tag} className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    {canEdit && (
                      <button 
                        onClick={() => openEditModal(prompt)}
                        className="text-[11px] font-bold uppercase tracking-widest text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
                      >
                        Edit <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {!loading && filteredPrompts.length === 0 && (
          <div className="flex flex-col items-center justify-center p-20 text-center">
            <TerminalSquare className="w-16 h-16 text-slate-700 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No prompts found</h3>
            <p className="text-slate-500">Try adjusting your search criteria.</p>
          </div>
        )}

      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeEditModal}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            ></motion.div>

            {/* Modal Body */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b1020] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative z-10"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <Edit3 className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-black text-white">Edit {editingPrompt.name} System Prompt</h3>
                </div>
                <button 
                  onClick={closeEditModal}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 flex flex-col gap-4">
                {errorMsg && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex gap-3 text-red-200 text-sm">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-[#8b92a5] uppercase tracking-wider">System Instruction</label>
                  <textarea 
                    rows={8}
                    value={editingPrompt.system_prompt}
                    onChange={e => setEditingPrompt(prev => ({ ...prev, system_prompt: e.target.value }))}
                    className="w-full p-4 bg-black/40 border border-white/10 rounded-2xl text-sm font-mono leading-relaxed focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 text-slate-200"
                    placeholder="Enter the system behavior instructions for this agent..."
                  />
                </div>
              </div>

              <div className="p-6 bg-black/20 border-t border-white/5 flex flex-col sm:flex-row gap-3 items-center justify-between">
                <button
                  onClick={() => handleResetPrompt(editingPrompt.id)}
                  disabled={updating || resetting}
                  className="w-full sm:w-auto px-4 py-2.5 bg-white/5 hover:bg-red-500/10 hover:text-red-400 border border-white/5 hover:border-red-500/20 text-slate-400 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Default
                </button>

                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    onClick={closeEditModal}
                    disabled={updating || resetting}
                    className="w-1/2 sm:w-auto px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdatePrompt}
                    disabled={updating || resetting}
                    className="w-1/2 sm:w-auto px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 transition-all"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {updating ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

