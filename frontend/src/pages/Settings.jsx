import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, Key, Sliders, Shield, Save, Eye, EyeOff, 
  Cpu, HardDrive, RefreshCw, CheckCircle2 
} from 'lucide-react';

export default function SystemSettings() {
  const [apiKey, setApiKey] = useState('gsk_yF8jW9L••••••••••••••••••••');
  const [showKey, setShowKey] = useState(false);
  const [chunkSize, setChunkSize] = useState(1000);
  const [chunkOverlap, setChunkOverlap] = useState(200);
  const [topK, setTopK] = useState(5);
  const [minSimilarity, setMinSimilarity] = useState(0.65);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 1500);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#060913] text-white overflow-y-auto relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto w-full p-6 md:p-10 relative z-10 space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Settings className="w-8 h-8 text-indigo-400" />
              <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white via-blue-100 to-indigo-200 bg-clip-text text-transparent">System Settings</h1>
            </div>
            <p className="text-sm text-[#8b92a5] font-bold tracking-widest uppercase">Configure embedding strategies, model connections, and global access limits.</p>
          </div>
        </div>

        {/* Form sections */}
        <div className="grid grid-cols-1 gap-6">

          {/* API Key Config */}
          <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 md:p-8 space-y-6">
            <h3 className="text-md font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-400" /> API Connections
            </h3>
            
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-[#8b92a5] uppercase tracking-wider">Groq API Private Key</label>
              <div className="relative">
                <input 
                  type={showKey ? 'text' : 'password'} 
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500/50 text-white font-mono"
                />
                <button 
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* RAG Strategy parameters */}
          <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 md:p-8 space-y-6">
            <h3 className="text-md font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-400" /> Vector Index & RAG Strategy
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-[10px] font-bold text-[#8b92a5] uppercase tracking-wider">
                  <span>Chunk Size (chars)</span>
                  <span className="text-white font-mono">{chunkSize}</span>
                </div>
                <input 
                  type="range" min="200" max="3000" step="100" value={chunkSize}
                  onChange={e => setChunkSize(parseInt(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-[10px] font-bold text-[#8b92a5] uppercase tracking-wider">
                  <span>Chunk Overlap (chars)</span>
                  <span className="text-white font-mono">{chunkOverlap}</span>
                </div>
                <input 
                  type="range" min="0" max="800" step="50" value={chunkOverlap}
                  onChange={e => setChunkOverlap(parseInt(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-[10px] font-bold text-[#8b92a5] uppercase tracking-wider">
                  <span>Top K retrieved Chunks</span>
                  <span className="text-white font-mono">{topK}</span>
                </div>
                <input 
                  type="range" min="1" max="15" step="1" value={topK}
                  onChange={e => setTopK(parseInt(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-[10px] font-bold text-[#8b92a5] uppercase tracking-wider">
                  <span>Min Retrieval Similarity</span>
                  <span className="text-white font-mono">{(minSimilarity * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range" min="0.30" max="0.95" step="0.05" value={minSimilarity}
                  onChange={e => setMinSimilarity(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Model Options */}
          <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 md:p-8 space-y-6">
            <h3 className="text-md font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-400" /> Default Embedding Engine
            </h3>
            
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-[#8b92a5] uppercase tracking-wider">Embedding Model</label>
              <select className="w-full px-3 py-3 bg-[#0a0f1d] border border-white/10 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500/50 text-white">
                <option>all-MiniLM-L6-v2 (Local HuggingFace CPU/Fast)</option>
                <option>text-embedding-3-small (OpenAI Cloud)</option>
                <option>text-embedding-3-large (OpenAI Cloud)</option>
              </select>
            </div>
          </div>

        </div>

        {/* Save button bar */}
        <div className="flex justify-end gap-3 pt-4">
          {saved && (
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest mr-4">
              <CheckCircle2 className="w-4 h-4" /> Config saved!
            </div>
          )}
          <button 
            disabled={saving}
            onClick={handleSave}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition-all"
          >
            {saving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Save Configuration
          </button>
        </div>

      </div>
    </div>
  );
}
