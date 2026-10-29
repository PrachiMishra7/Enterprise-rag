import { useState, useEffect } from 'react';
import { 
  Settings, Sliders, Shield, Save, 
  Cpu, CheckCircle2, Loader2, AlertCircle 
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
      alert('Only administrators can modify system settings.');
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
      <div className="max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6 flex-1 flex flex-col">
        
        {/* Page Header */}
        <div className="pb-5 border-b border-border">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            System & RAG Configuration
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Global vector chunking, cosine similarity thresholds, and multi-agent inference parameters.
          </p>
        </div>

        {saved && (
          <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Settings successfully persisted in enterprise database.</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 text-muted-foreground space-y-2 bg-card border border-border rounded-xl">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <p className="text-xs">Loading configuration parameters...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            
            {/* RAG & Chunking Parameters */}
            <div className="bg-card border border-border rounded-xl p-5 sm:p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 pb-3 border-b border-border">
                <Sliders className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Retrieval & Chunking Parameters
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground block">Chunk Size (Characters)</label>
                  <input 
                    type="number"
                    value={settings.chunk_size}
                    onChange={e => setSettings(prev => ({ ...prev, chunk_size: e.target.value }))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
                  />
                  <span className="text-[11px] text-muted-foreground block">Maximum size of partitioned text chunks per document.</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground block">Chunk Overlap</label>
                  <input 
                    type="number"
                    value={settings.chunk_overlap}
                    onChange={e => setSettings(prev => ({ ...prev, chunk_overlap: e.target.value }))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
                  />
                  <span className="text-[11px] text-muted-foreground block">Semantic character overlap between sequential chunks.</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground block">Top-K Context Depth</label>
                  <input 
                    type="number"
                    value={settings.top_k}
                    onChange={e => setSettings(prev => ({ ...prev, top_k: e.target.value }))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
                  />
                  <span className="text-[11px] text-muted-foreground block">Number of relevant chunks injected into prompt context.</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground block">Min Similarity Threshold</label>
                  <input 
                    type="number"
                    step="0.05"
                    max="1"
                    min="0"
                    value={settings.min_similarity}
                    onChange={e => setSettings(prev => ({ ...prev, min_similarity: e.target.value }))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
                  />
                  <span className="text-[11px] text-muted-foreground block">Minimum cosine similarity required for vector inclusion.</span>
                </div>
              </div>
            </div>

            {/* Model & Orchestration */}
            <div className="bg-card border border-border rounded-xl p-5 sm:p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 pb-3 border-b border-border">
                <Cpu className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Inference & Embedding Architecture
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground block">Default Inference Model</label>
                  <select 
                    value={settings.groq_model}
                    onChange={e => setSettings(prev => ({ ...prev, groq_model: e.target.value }))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground cursor-pointer"
                  >
                    <option value="llama-3.1-70b-versatile">Llama 3.1 70B Versatile (Recommended)</option>
                    <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant (Low Latency)</option>
                    <option value="mixtral-8x7b-32768">Mixtral 8x7B (MoE Architecture)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground block">Embedding Vector Dimension</label>
                  <input 
                    disabled
                    value={settings.embedding_model}
                    className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-xs font-medium text-muted-foreground cursor-not-allowed"
                  />
                  <span className="text-[11px] text-muted-foreground block">SentenceTransformers 384-dimensional dense embeddings.</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <button
                type="submit"
                disabled={saving || !isAdmin}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <Save className="w-3.5 h-3.5" />
                <span>Save System Settings</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
