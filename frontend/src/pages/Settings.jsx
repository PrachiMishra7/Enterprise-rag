import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, Key, Sliders, Shield, Save, Eye, EyeOff, 
  Cpu, HardDrive, RefreshCw, CheckCircle2, Loader2, Database, AlertCircle 
} from 'lucide-react';
import { apiCall } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

export default function SystemSettings() {
  const { token, user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [settings, setSettings] = useState({
    chunk_size: '1000',
    chunk_overlap: '200',
    top_k: '5',
    min_similarity: '0.65',
    groq_model: 'llama-3.1-70b-versatile',
    embedding_model: 'all-MiniLM-L6-v2',
    strict_grounding: 'true'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await apiCall('GET', '/settings', null, false, token);
      if (data) setSettings(prev => ({ ...prev, ...data }));
    } catch (e) {
      console.error('Failed to load settings:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchSettings();
  }, [token]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Only Superadmins can modify system configuration.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiCall('POST', '/settings', settings, false, token);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e.message || 'Failed to persist settings in database');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background text-foreground overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full p-4 sm:p-8 space-y-6 flex-1 flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Settings className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">System & Model Settings</h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">Global vector chunking, similarity thresholds, and LLM orchestration parameters stored in database.</p>
          </div>
        </div>

        {saved && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings saved successfully in Supabase PostgreSQL!</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 text-muted-foreground space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm">Loading system settings...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            
            {/* RAG & Chunking Parameters */}
            <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Sliders className="w-4 h-4 text-primary" /> RAG Chunking & Retrieval Parameters
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Chunk Size (Characters)</label>
                  <input 
                    type="number"
                    value={settings.chunk_size}
                    onChange={e => setSettings(prev => ({ ...prev, chunk_size: e.target.value }))}
                    className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                  />
                  <span className="text-[10px] text-muted-foreground mt-1 block">Maximum size of text chunks indexed per document.</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Chunk Overlap</label>
                  <input 
                    type="number"
                    value={settings.chunk_overlap}
                    onChange={e => setSettings(prev => ({ ...prev, chunk_overlap: e.target.value }))}
                    className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                  />
                  <span className="text-[10px] text-muted-foreground mt-1 block">Overlap between sequential chunks to preserve sentence boundaries.</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Top-K Context Depth</label>
                  <input 
                    type="number"
                    value={settings.top_k}
                    onChange={e => setSettings(prev => ({ ...prev, top_k: e.target.value }))}
                    className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                  />
                  <span className="text-[10px] text-muted-foreground mt-1 block">Number of relevant document chunks retrieved per user query.</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Min Similarity Threshold</label>
                  <input 
                    type="number"
                    step="0.05"
                    max="1"
                    min="0"
                    value={settings.min_similarity}
                    onChange={e => setSettings(prev => ({ ...prev, min_similarity: e.target.value }))}
                    className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                  />
                  <span className="text-[10px] text-muted-foreground mt-1 block">Minimum cosine similarity required to inject context into the LLM.</span>
                </div>
              </div>
            </div>

            {/* Model & Security Orchestration */}
            <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Cpu className="w-4 h-4 text-primary" /> Orchestration & AI Models
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Primary LLM Engine</label>
                  <select 
                    value={settings.groq_model}
                    onChange={e => setSettings(prev => ({ ...prev, groq_model: e.target.value }))}
                    className="w-full px-3 py-2 bg-card border border-border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground cursor-pointer"
                  >
                    <option value="llama-3.1-70b-versatile">Llama 3.1 70B Versatile (Recommended)</option>
                    <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant (Ultra Fast)</option>
                    <option value="mixtral-8x7b-32768">Mixtral 8x7B (Deep Reasoning)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Vector Embedding Architecture</label>
                  <input 
                    disabled
                    value={settings.embedding_model}
                    className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-xl text-xs font-medium text-muted-foreground cursor-not-allowed"
                  />
                  <span className="text-[10px] text-muted-foreground mt-1 block">SentenceTransformers 384-dimensional vector embedding space.</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={saving || !isAdmin}
                className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                <Save className="w-4 h-4" /> Save System Settings
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
