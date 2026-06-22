import { useEffect, useState } from 'react';
import { apiCall } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Shield, HardDrive, Inbox, Search, Filter, 
  Layers, FolderOpen, AlertCircle, RefreshCw, Database
} from 'lucide-react';

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

export default function Documents({ documents = [], loadDocuments }) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedAccess, setSelectedAccess] = useState('All');

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const data = await apiCall('GET', '/documents/list', null, false, token);
      if (loadDocuments) loadDocuments(data.documents || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [token]);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get unique departments and access levels for filter buttons
  const departments = ['All', ...new Set(documents.map(d => d.department))];
  const accessLevels = ['All', ...new Set(documents.map(d => d.access_level))];

  // Filter logic
  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.filename.toLowerCase().includes(search.toLowerCase());
    const matchesDept = selectedDept === 'All' || doc.department === selectedDept;
    const matchesAccess = selectedAccess === 'All' || doc.access_level === selectedAccess;
    return matchesSearch && matchesDept && matchesAccess;
  });

  // Calculate summary stats
  const totalChunks = documents.reduce((acc, curr) => acc + (curr.chunk_count || 0), 0);
  const totalBytes = documents.reduce((acc, curr) => acc + (curr.file_size || 0), 0);

  return (
    <div className="flex-1 flex flex-col bg-[#060913] text-white overflow-y-auto relative">
      
      {/* Dynamic Ambient Background Gradients */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[450px] h-[450px] bg-emerald-600/5 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto w-full p-6 md:p-10 relative z-10 flex-1 flex flex-col">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FolderOpen className="w-8 h-8 text-blue-400" />
              <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white via-blue-100 to-indigo-200 bg-clip-text text-transparent">
                Document Library
              </h1>
            </div>
            <p className="text-sm text-[#8b92a5] font-bold tracking-widest uppercase">
              Secure enterprise repository active in vector embeddings.
            </p>
          </div>

          <button 
            onClick={fetchDocs} 
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-300 transition-all hover:border-blue-500/30 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Quick Stats Grid */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10"
        >
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#8b92a5] uppercase tracking-wider">Total Documents</p>
              <h3 className="text-2xl font-black mt-0.5">{documents.length}</h3>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#8b92a5] uppercase tracking-wider">Indexed Chunks</p>
              <h3 className="text-2xl font-black mt-0.5">{totalChunks.toLocaleString()}</h3>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#8b92a5] uppercase tracking-wider">Storage Capacity</p>
              <h3 className="text-2xl font-black mt-0.5">{formatBytes(totalBytes)}</h3>
            </div>
          </div>
        </motion.div>

        {/* Filter & Search Bar */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 mb-8 flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search document name..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/5 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            {/* Department Filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-400">Dept:</span>
              <select 
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
                className="bg-white/5 border border-white/10 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500/50"
              >
                {departments.map(dept => (
                  <option key={dept} value={dept} className="bg-[#0b1020] text-white">{dept}</option>
                ))}
              </select>
            </div>

            {/* Access Level Filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-400">Access:</span>
              <select 
                value={selectedAccess}
                onChange={e => setSelectedAccess(e.target.value)}
                className="bg-white/5 border border-white/10 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500/50"
              >
                {accessLevels.map(lvl => (
                  <option key={lvl} value={lvl} className="bg-[#0b1020] text-white">
                    {lvl === 'All' ? 'All' : lvl.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Main Grid / Empty State */}
        {filteredDocs.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center p-16 bg-white/[0.01] border border-white/5 rounded-3xl border-dashed"
          >
            <div className="w-16 h-16 bg-white/5 border border-white/10 text-slate-400 rounded-2xl flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">No matching documents</h3>
            <p className="text-slate-500 mt-2 text-sm text-center max-w-sm">
              We couldn't find any documents matching your current filter selections or search query.
            </p>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {filteredDocs.map(d => (
                <motion.div 
                  key={d.filename}
                  variants={itemVariants}
                  layout
                  whileHover={{ y: -4 }}
                  className="group bg-white/[0.02] backdrop-blur-2xl border border-white/10 hover:border-blue-500/30 rounded-3xl p-6 flex flex-col gap-4 relative overflow-hidden transition-all shadow-lg hover:shadow-2xl"
                >
                  {/* Subtle Glow Overlay */}
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-blue-500/10 blur-[40px] -mr-16 -mt-16 opacity-30 group-hover:opacity-60 transition-opacity pointer-events-none"></div>

                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shadow-inner">
                      <FileText className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#8b92a5] bg-white/5 border border-white/5 px-2.5 py-1 rounded-md">
                      {formatBytes(d.file_size)}
                    </span>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug mb-2" title={d.filename}>
                      {d.filename}
                    </h3>

                    <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mt-3">
                      <Layers className="w-3.5 h-3.5 text-slate-500" />
                      <span>{d.chunk_count} indexed chunks</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t border-white/5 mt-auto">
                    <span className="text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md bg-white/5 border border-white/5 text-slate-300">
                      {d.department}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      <Shield className="w-3 h-3" />
                      {d.access_level.replace('_', ' ')}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}

