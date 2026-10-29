import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TerminalSquare, Search, Copy, CheckCircle2, Edit3, 
  Bot, ArrowRight, Landmark, Monitor, Scale, Users, 
  RefreshCw, Save, X, RotateCcw, AlertTriangle, Sparkles, Check
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/api';

const PROMPT_META = {
  hr: { icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10', tags: ['HR', 'Benefits', 'Onboarding'] },
  legal: { icon: Scale, color: 'text-primary', bg: 'bg-primary/10', tags: ['Legal', 'Compliance', 'NDAs'] },
  finance: { icon: Landmark, color: 'text-amber-500', bg: 'bg-amber-500/10', tags: ['Finance', 'Payroll', 'Budgets'] },
  it: { icon: Monitor, color: 'text-blue-500', bg: 'bg-blue-500/10', tags: ['IT', 'Hardware', 'Security'] },
  general: { icon: Bot, color: 'text-muted-foreground', bg: 'bg-secondary', tags: ['General', 'Fallback Router'] },
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
      setPrompts(prev => prev.map(p => p.id === editingPrompt.id ? { ...p, system_prompt: editingPrompt.system_prompt } : p));
      setEditingPrompt(null);
    } catch (e) {
      console.error(e);
      setErrorMsg(e.message || 'Failed to update system prompt. Insufficient permissions.');
    } finally {
      setUpdating(false);
    }
  };

  const handleResetPrompt = async (id) => {
    if (!window.confirm('Reset this agent prompt to the default enterprise template?')) return;
    setResetting(true);
    setErrorMsg('');
    try {
      const res = await apiCall('POST', `/prompts/${id}/reset`, null, false, token);
      setPrompts(prev => prev.map(p => p.id === id ? { ...p, system_prompt: res.system_prompt } : p));
      setEditingPrompt(null);
    } catch (e) {
      setErrorMsg(e.message || 'Failed to reset prompt');
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
    <div className="flex-1 flex flex-col bg-background text-foreground overflow-y-auto">
      <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6 flex-1 flex flex-col">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-border">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Prompt Library
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              System instructions, persona parameters, and grounding templates for domain agents.
            </p>
          </div>
          
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search templates or tags..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-card border border-border rounded-lg text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
              />
            </div>
            <button 
              onClick={fetchPrompts}
              disabled={loading}
              className="p-2 rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground transition-colors"
              title="Refresh templates"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-primary' : ''}`} />
            </button>
          </div>
        </div>

        {/* Prompts Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 text-muted-foreground space-y-2 bg-card border border-border rounded-xl">
            <RefreshCw className="w-5 h-5 text-primary animate-spin" />
            <p className="text-xs">Loading prompt configuration from database...</p>
          </div>
        ) : filteredPrompts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center text-muted-foreground bg-card border border-border rounded-xl">
            <TerminalSquare className="w-8 h-8 opacity-40 mb-2" />
            <p className="text-sm font-semibold text-foreground">No prompts match your criteria</p>
            <p className="text-xs mt-0.5">Try searching with a different keyword or department tag.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredPrompts.map(prompt => {
              const meta = PROMPT_META[prompt.id] || PROMPT_META.general;
              const Icon = meta.icon;
              const isCopied = copiedId === prompt.id;
              
              return (
                <div 
                  key={prompt.id}
                  className="bg-card border border-border hover:border-border/90 rounded-xl p-5 flex flex-col justify-between shadow-xs transition-shadow"
                >
                  <div>
                    <div className="flex justify-between items-start gap-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${meta.bg} ${meta.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">{prompt.name}</h3>
                          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block">
                            Active Agent Template
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => handleCopy(prompt.id, prompt.system_prompt)}
                          className="p-1.5 rounded-md border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                          title="Copy Prompt"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        {canEdit && (
                          <button 
                            onClick={() => openEditModal(prompt)}
                            className="px-2.5 py-1 rounded-md bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium border border-border transition-colors flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" /> Edit
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="bg-secondary/40 rounded-lg p-3 border border-border font-mono text-xs text-foreground/80 leading-relaxed max-h-32 overflow-y-auto">
                      {prompt.system_prompt}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border flex-wrap">
                    {meta.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded text-[10px] font-medium bg-secondary text-muted-foreground border border-border">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeEditModal}
              className="absolute inset-0 bg-black/60"
            />

            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-xl w-full max-w-xl overflow-hidden shadow-xl relative z-10 flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Edit System Instruction: {editingPrompt.name}</h3>
                </div>
                <button 
                  onClick={closeEditModal}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-3">
                {errorMsg && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground block">System Prompt & Grounding Rules</label>
                  <textarea 
                    rows={8}
                    value={editingPrompt.system_prompt}
                    onChange={e => setEditingPrompt(prev => ({ ...prev, system_prompt: e.target.value }))}
                    className="w-full p-3 bg-background border border-border rounded-lg text-xs font-mono leading-relaxed text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                    placeholder="Enter instructions..."
                  />
                </div>
              </div>

              <div className="p-3.5 bg-secondary/40 border-t border-border flex items-center justify-between text-xs">
                <button
                  onClick={() => handleResetPrompt(editingPrompt.id)}
                  disabled={updating || resetting}
                  className="px-3 py-1.5 bg-card hover:bg-destructive/10 hover:text-destructive border border-border rounded-lg text-xs font-medium text-muted-foreground flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Default</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={closeEditModal}
                    disabled={updating || resetting}
                    className="px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-muted-foreground hover:bg-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdatePrompt}
                    disabled={updating || resetting}
                    className="px-3.5 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{updating ? 'Saving...' : 'Save Instruction'}</span>
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
