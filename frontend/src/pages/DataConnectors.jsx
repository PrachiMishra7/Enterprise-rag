import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plug, Search, RefreshCw, CheckCircle2, AlertCircle, 
  ArrowRight, ToggleLeft, ToggleRight, Settings, Plus, Slack, 
  Github, Database, HelpCircle, HardDrive, Compass
} from 'lucide-react';

const CONNECTOR_TEMPLATES = [
  { id: 'gdrive', name: 'Google Drive', desc: 'Sync files, documents, and spreadsheets from shared drives.', status: 'connected', lastSync: '10 mins ago', docCount: 142, icon: HardDrive, color: '#34a853', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  { id: 'slack', name: 'Slack', desc: 'Index messages, threads, and canvas documents from public channels.', status: 'disconnected', lastSync: 'Never', docCount: 0, icon: Slack, color: '#e01e5a', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
  { id: 'github', name: 'GitHub Repositories', desc: 'Ingest code bases, readmes, issues, and markdown docs from repositories.', status: 'connected', lastSync: '2 hours ago', docCount: 1834, icon: Github, color: '#ffffff', bg: 'bg-white/10', border: 'border-white/30' },
  { id: 'notion', name: 'Notion Workspace', desc: 'Import pages, databases, and workspace wikis.', status: 'configuring', lastSync: 'In Progress...', docCount: 0, icon: Compass, color: '#f59e0b', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  { id: 'confluence', name: 'Atlassian Confluence', desc: 'Sync internal knowledge base articles and space documents.', status: 'disconnected', lastSync: 'Never', docCount: 0, icon: Database, color: '#0052cc', bg: 'bg-blue-500/10', border: 'border-blue-500/30' }
];

export default function DataConnectors() {
  const [connectors, setConnectors] = useState(CONNECTOR_TEMPLATES);
  const [search, setSearch] = useState('');
  const [loadingId, setLoadingId] = useState(null);
  const [showConfig, setShowConfig] = useState(null);

  const handleToggle = (id) => {
    setLoadingId(id);
    setTimeout(() => {
      setConnectors(prev => prev.map(c => {
        if (c.id === id) {
          const newStatus = c.status === 'connected' ? 'disconnected' : 'connected';
          return {
            ...c,
            status: newStatus,
            lastSync: newStatus === 'connected' ? 'Just now' : 'Never',
            docCount: newStatus === 'connected' ? Math.floor(Math.random() * 200) + 10 : 0
          };
        }
        return c;
      }));
      setLoadingId(null);
    }, 1200);
  };

  const filteredConnectors = connectors.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.desc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col bg-[#060913] text-white overflow-y-auto relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto w-full p-6 md:p-10 relative z-10 flex-1 flex flex-col">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Plug className="w-8 h-8 text-blue-400 animate-pulse" />
              <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">Data Connectors</h1>
            </div>
            <p className="text-sm text-[#8b92a5] font-bold tracking-widest uppercase">Connect external data platforms directly to your vector storage.</p>
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search cloud databases..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Connectors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredConnectors.map(conn => {
            const Icon = conn.icon;
            const isConnected = conn.status === 'connected';
            const isConfiguring = conn.status === 'configuring';
            
            return (
              <motion.div 
                key={conn.id}
                whileHover={{ y: -4 }}
                className="bg-white/[0.02] backdrop-blur-2xl border border-white/10 hover:border-blue-500/30 rounded-3xl p-6 flex flex-col gap-4 relative overflow-hidden transition-all shadow-lg hover:shadow-2xl"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[40px] -mr-16 -mt-16 opacity-10 pointer-events-none`} style={{ backgroundColor: conn.color }}></div>
                
                <div className="flex justify-between items-start z-10">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner ${conn.bg} ${conn.border}`} style={{ color: conn.color }}>
                    <Icon className="w-6 h-6" />
                  </div>
                  
                  <button 
                    disabled={loadingId === conn.id || isConfiguring}
                    onClick={() => handleToggle(conn.id)}
                    className="p-1 rounded-xl transition-opacity hover:opacity-85 disabled:opacity-50"
                  >
                    {loadingId === conn.id ? (
                      <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
                    ) : isConnected ? (
                      <ToggleRight className="w-9 h-9 text-blue-500 cursor-pointer" />
                    ) : (
                      <ToggleLeft className="w-9 h-9 text-slate-600 cursor-pointer" />
                    )}
                  </button>
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-2">{conn.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed min-h-[48px]">{conn.desc}</p>
                </div>

                <div className="flex flex-col gap-2 pt-4 border-t border-white/5 text-[10px] font-bold text-[#8b92a5] uppercase tracking-wider">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={isConnected ? 'text-emerald-400' : isConfiguring ? 'text-amber-400 animate-pulse' : 'text-slate-500'}>
                      {conn.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Indexed Pages:</span>
                    <span className="text-white">{conn.docCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Synced:</span>
                    <span className="text-white">{conn.lastSync}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-2 pt-2 z-10">
                  <button 
                    onClick={() => setShowConfig(conn)}
                    className="px-3.5 py-1.5 rounded-lg bg-white/5 border border-white/5 hover:border-blue-500/30 hover:bg-white/10 text-[10px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1 transition-all"
                  >
                    <Settings className="w-3.5 h-3.5" /> Configure
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Configuration Modal */}
        <AnimatePresence>
          {showConfig && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowConfig(null)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              ></motion.div>

              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[#0b1020] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative z-10"
              >
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-md font-black tracking-tight text-white uppercase flex items-center gap-2">
                    <Plug className="w-5 h-5 text-blue-400" />
                    Configure {showConfig.name}
                  </h3>
                  <button 
                    onClick={() => setShowConfig(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-[#8b92a5] uppercase tracking-wider">Access Token / API Key</label>
                    <input 
                      type="password" 
                      placeholder="••••••••••••••••••••••••"
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500/50 text-white"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-[#8b92a5] uppercase tracking-wider">Folder ID / Target Channel</label>
                    <input 
                      type="text" 
                      placeholder="root"
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500/50 text-white"
                    />
                  </div>
                </div>

                <div className="p-6 bg-black/20 border-t border-white/5 flex justify-end gap-3">
                  <button 
                    onClick={() => setShowConfig(null)}
                    className="px-4 py-2 bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-white/10 text-slate-300"
                  >
                    Close
                  </button>
                  <button 
                    onClick={() => {
                      handleToggle(showConfig.id);
                      setShowConfig(null);
                    }}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/20"
                  >
                    Save & Sync
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
