import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plug, Search, RefreshCw, CheckCircle2, AlertCircle, 
  ArrowRight, ToggleLeft, ToggleRight, Settings, Plus, MessageCircle, 
  Code2, Database, HelpCircle, HardDrive, Compass, X, Loader2
} from 'lucide-react';
import { apiCall } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const ICON_MAP = {
  gdrive: { icon: HardDrive, color: '#34a853', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  slack: { icon: MessageCircle, color: '#e01e5a', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
  github: { icon: Code2, color: '#6366f1', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30' },
  notion: { icon: Compass, color: '#f59e0b', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  confluence: { icon: Database, color: '#0052cc', bg: 'bg-blue-500/10', border: 'border-blue-500/30' }
};

export default function DataConnectors() {
  const { token, user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'it_admin';

  const [connectors, setConnectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [loadingId, setLoadingId] = useState(null);
  const [showConfig, setShowConfig] = useState(null);
  const [notice, setNotice] = useState('');

  const fetchConnectors = async () => {
    try {
      setLoading(true);
      const data = await apiCall('GET', '/connectors', null, false, token);
      setConnectors(data || []);
    } catch (e) {
      console.error('Failed to load connectors:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchConnectors();
  }, [token]);

  const handleToggle = async (id) => {
    setLoadingId(id);
    setNotice('');
    try {
      const res = await apiCall('POST', `/connectors/${id}/toggle`, null, false, token);
      setConnectors(prev => prev.map(c => c.id === id ? { ...c, ...res } : c));
      setNotice(`Updated status for ${res.name || 'connector'}`);
      setTimeout(() => setNotice(''), 3000);
    } catch (e) {
      alert(e.message || 'Failed to toggle connector');
    } finally {
      setLoadingId(null);
    }
  };

  const handleSync = async (id) => {
    setLoadingId(id);
    try {
      const res = await apiCall('POST', `/connectors/${id}/sync`, null, false, token);
      setConnectors(prev => prev.map(c => c.id === id ? { ...c, ...res } : c));
      setNotice(res.message || 'Sync complete');
      setTimeout(() => setNotice(''), 3000);
    } catch (e) {
      alert(e.message || 'Sync failed');
    } finally {
      setLoadingId(null);
    }
  };

  const filteredConnectors = connectors.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.desc?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col bg-background text-foreground overflow-y-auto">
      <div className="max-w-7xl mx-auto w-full p-4 sm:p-8 space-y-6 flex-1 flex flex-col">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Plug className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Enterprise Data Connectors</h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">Manage persistent integrations to sync remote enterprise repositories into vector embeddings.</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search platforms..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
              />
            </div>
            <button 
              onClick={fetchConnectors}
              className="p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground"
              title="Refresh integrations"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
            </button>
          </div>
        </div>

        {notice && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{notice}</span>
          </div>
        )}

        {/* Connectors Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 text-muted-foreground space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm">Connecting to data integrations registry...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredConnectors.map((c) => {
              const meta = ICON_MAP[c.id] || ICON_MAP.gdrive;
              const Icon = meta.icon;
              const isConn = c.status === 'connected';
              const isLoading = loadingId === c.id;

              return (
                <div 
                  key={c.id}
                  className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between transition-all hover:border-primary/40 shadow-xs space-y-4"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2.5 rounded-xl ${meta.bg} ${meta.border} border`}>
                        <Icon className="w-5 h-5" style={{ color: meta.color }} />
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isConn 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                          : 'bg-secondary text-muted-foreground border border-border'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isConn ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`} />
                        {c.status}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-card-foreground mb-1">{c.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{c.desc}</p>
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Indexed</span>
                      <span className="font-bold text-foreground">{c.docCount || 0} docs</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isConn && (
                        <button 
                          disabled={isLoading}
                          onClick={() => handleSync(c.id)}
                          className="px-2.5 py-1 rounded-lg border border-border bg-secondary/50 hover:bg-secondary text-[11px] font-medium text-foreground transition-colors flex items-center gap-1"
                        >
                          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                          Sync
                        </button>
                      )}

                      <button 
                        disabled={isLoading || !isAdmin}
                        onClick={() => handleToggle(c.id)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                          isConn 
                            ? 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border border-rose-500/20' 
                            : 'bg-primary text-primary-foreground hover:bg-primary/90'
                        }`}
                      >
                        {isLoading ? 'Updating...' : isConn ? 'Disconnect' : 'Connect'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
