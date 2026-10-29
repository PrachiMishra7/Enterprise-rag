import { useEffect, useState } from 'react';
import { apiCall } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import Loader from '../components/Loader';
import { 
  FileText, Shield, HardDrive, Inbox, Search, Filter, 
  Layers, FolderOpen, AlertCircle, RefreshCw, Database, 
  Sparkles, X, FileEdit, ClipboardCheck, Copy, Settings2, Trash2, Check, Loader2
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
  const { user, token } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'hr_admin';

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedAccess, setSelectedAccess] = useState('All');

  // Summarization states
  const [summarizingDoc, setSummarizingDoc] = useState(null);
  const [summaryText, setSummaryText] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [copied, setCopied] = useState(false);

  // Access policy edit state
  const [editingPolicyDoc, setEditingPolicyDoc] = useState(null);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [policyForm, setPolicyForm] = useState({ access_level: 'employee', department: 'general' });

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

  const handleSummarize = async (doc) => {
    setSummarizingDoc(doc);
    setLoadingSummary(true);
    setSummaryText('');
    setCopied(false);
    try {
      const response = await apiCall('POST', `/documents/${doc.id}/summarize`, null, false, token);
      setSummaryText(response.summary || 'No summary could be generated.');
    } catch (e) {
      console.error('Failed to summarize document:', e);
      setSummaryText(`Failed to generate summary: ${e.message || 'Unknown backend error.'}`);
    } finally {
      setLoadingSummary(false);
    }
  };

  const copySummary = () => {
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openPolicyModal = (doc) => {
    setEditingPolicyDoc(doc);
    setPolicyForm({
      access_level: doc.access_level || 'employee',
      department: doc.department || 'general'
    });
  };

  const handleSavePolicy = async (e) => {
    e.preventDefault();
    if (!editingPolicyDoc) return;
    try {
      setSavingPolicy(true);
      await apiCall('PATCH', `/documents/${editingPolicyDoc.id}/access`, policyForm, false, token);
      if (loadDocuments) {
        loadDocuments(documents.map(d => d.id === editingPolicyDoc.id ? { ...d, ...policyForm } : d));
      }
      setEditingPolicyDoc(null);
    } catch (err) {
      alert(err.message || 'Failed to update access policy');
    } finally {
      setSavingPolicy(false);
    }
  };

  const handleDeleteDoc = async (doc) => {
    if (window.confirm(`Permanently remove "${doc.filename}" from the enterprise RAG vector index?`)) {
      try {
        await apiCall('DELETE', `/documents/${doc.id}`, null, false, token);
        if (loadDocuments) {
          loadDocuments(documents.filter(d => d.id !== doc.id));
        }
      } catch (err) {
        alert(err.message || 'Failed to delete document');
      }
    }
  };

  // Unique filters
  const departments = ['All', ...new Set(documents.map(d => d.department))];
  const accessLevels = ['All', ...new Set(documents.map(d => d.access_level))];

  // Filter logic
  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.filename.toLowerCase().includes(search.toLowerCase());
    const matchesDept = selectedDept === 'All' || doc.department === selectedDept;
    const matchesAccess = selectedAccess === 'All' || doc.access_level === selectedAccess;
    return matchesSearch && matchesDept && matchesAccess;
  });

  const totalChunks = documents.reduce((acc, curr) => acc + (curr.chunk_count || 0), 0);

  return (
    <div className="flex-1 flex flex-col bg-background text-foreground overflow-y-auto">
      <div className="max-w-7xl mx-auto w-full p-4 sm:p-8 space-y-6 flex-1 flex flex-col">

        {/* Top Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-primary border border-primary/20">
                <FolderOpen className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Enterprise Knowledge Base</h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">Indexed company repositories, access control permissions, and semantic vector embeddings.</p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={fetchDocs}
              className="p-2 rounded-xl bg-card border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-all flex items-center gap-2 text-xs font-semibold shadow-xs"
              title="Refresh Repository"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Stat Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-card-foreground">{documents.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-semibold">Indexed Documents</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-card-foreground">{totalChunks}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-semibold">Vector Chunks</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3.5 col-span-2 sm:col-span-1">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-card-foreground">{isAdmin ? 'Superadmin Full' : (user?.role || 'Restricted')}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-semibold">Your Access Scope</p>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search by filename or keyword..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground placeholder:text-muted-foreground/70"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <div className="flex items-center gap-1.5 bg-card border border-border rounded-xl px-2.5 py-1.5 text-xs text-muted-foreground">
              <Filter className="w-3.5 h-3.5" />
              <select 
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
                className="bg-transparent text-foreground outline-none text-xs font-medium cursor-pointer"
              >
                {departments.map(d => (
                  <option key={d} value={d} className="bg-card text-foreground">{d === 'All' ? 'All Depts' : d.toUpperCase()}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-card border border-border rounded-xl px-2.5 py-1.5 text-xs text-muted-foreground">
              <Shield className="w-3.5 h-3.5" />
              <select 
                value={selectedAccess}
                onChange={e => setSelectedAccess(e.target.value)}
                className="bg-transparent text-foreground outline-none text-xs font-medium cursor-pointer"
              >
                {accessLevels.map(a => (
                  <option key={a} value={a} className="bg-card text-foreground">{a === 'All' ? 'All Roles' : a.replace('_', ' ').toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Documents Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 text-muted-foreground space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm">Fetching enterprise document registry...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center text-muted-foreground space-y-2 border border-dashed border-border rounded-2xl bg-card">
            <Inbox className="w-10 h-10 opacity-40 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">No documents found</p>
            <p className="text-xs">Adjust your search or upload new files in Upload Center.</p>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
          >
            <AnimatePresence>
              {filteredDocs.map(d => (
                <motion.div 
                  key={d.id || d.filename}
                  variants={itemVariants}
                  layout
                  className="bg-card border border-border hover:border-primary/40 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 shadow-xs hover:shadow-md relative group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-secondary text-foreground border border-border">
                          {d.department || 'general'}
                        </span>
                        {isAdmin && (
                          <button 
                            onClick={() => openPolicyModal(d)}
                            title="Edit Access Policy"
                            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                          >
                            <Settings2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isAdmin && (
                          <button 
                            onClick={() => handleDeleteDoc(d)}
                            title="Delete Document"
                            className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-card-foreground line-clamp-2 leading-snug mb-1" title={d.filename}>
                      {d.filename}
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                      <Layers className="w-3.5 h-3.5 text-primary" />
                      <span>{d.chunk_count || 0} indexed vector chunks</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                      <Shield className="w-3 h-3" />
                      {d.access_level?.replace('_', ' ')}
                    </span>

                    <button 
                      onClick={() => handleSummarize(d)}
                      className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-all flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-primary" /> Summarize
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Document Summarize Modal */}
        <AnimatePresence>
          {summarizingDoc && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSummarizingDoc(null)}
                className="absolute inset-0 bg-black/60 backdrop-blur-xs" />

              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="bg-card border border-border rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[85vh]">
                <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 pr-3">
                    <Sparkles className="w-4 h-4 text-primary shrink-0" />
                    <h3 className="text-sm font-bold text-foreground truncate">AI Summary: {summarizingDoc.filename}</h3>
                  </div>
                  <button onClick={() => setSummarizingDoc(null)} className="p-1 rounded-md text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 overflow-y-auto flex-1 text-xs leading-relaxed text-foreground space-y-3">
                  {loadingSummary ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-2 text-muted-foreground">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <p>Generating executive summary with Groq LLM...</p>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap font-sans">{summaryText}</div>
                  )}
                </div>

                <div className="p-3.5 bg-secondary/30 border-t border-border flex justify-between items-center">
                  <span className="text-[10px] text-muted-foreground">Powered by RAG Summarization Engine</span>
                  <div className="flex items-center gap-2">
                    <button onClick={copySummary} disabled={loadingSummary}
                      className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-foreground text-xs font-medium flex items-center gap-1.5 transition-colors">
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button onClick={() => setSummarizingDoc(null)}
                      className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
                      Close
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Edit Access Policy Modal (Superadmin) */}
        <AnimatePresence>
          {editingPolicyDoc && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setEditingPolicyDoc(null)}
                className="absolute inset-0 bg-black/60 backdrop-blur-xs" />

              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative z-10">
                <div className="p-5 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">Edit Document Policy</h3>
                  </div>
                  <button onClick={() => setEditingPolicyDoc(null)} className="p-1 rounded-md text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSavePolicy}>
                  <div className="p-5 space-y-4">
                    <div className="p-3 rounded-xl bg-secondary/50 border border-border text-xs text-muted-foreground">
                      <p className="font-semibold text-foreground truncate">{editingPolicyDoc.filename}</p>
                      <p className="text-[10px] mt-0.5">{editingPolicyDoc.chunk_count || 0} chunks will inherit this updated policy</p>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Assigned Department</label>
                      <select 
                        value={policyForm.department}
                        onChange={e => setPolicyForm(prev => ({ ...prev, department: e.target.value }))}
                        className="w-full mt-1 px-3 py-2 bg-card border border-border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                      >
                        <option value="general">General (Company-wide)</option>
                        <option value="hr">HR</option>
                        <option value="finance">Finance</option>
                        <option value="legal">Legal</option>
                        <option value="it">IT & Engineering</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Required Access Level (RBAC)</label>
                      <select 
                        value={policyForm.access_level}
                        onChange={e => setPolicyForm(prev => ({ ...prev, access_level: e.target.value }))}
                        className="w-full mt-1 px-3 py-2 bg-card border border-border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                      >
                        <option value="employee">Employee (Available to all staff)</option>
                        <option value="manager">Manager (Managers and Admins only)</option>
                        <option value="hr_admin">HR Admin (Restricted to HR & Superadmin)</option>
                        <option value="legal_admin">Legal Admin (Restricted to Legal & Superadmin)</option>
                        <option value="finance_admin">Finance Admin (Restricted to Finance & Superadmin)</option>
                        <option value="it_admin">IT Admin (Restricted to IT & Superadmin)</option>
                        <option value="admin">System Superadmin (Top-Secret / Exec only)</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-4 bg-secondary/30 border-t border-border flex justify-end gap-2.5">
                    <button type="button" onClick={() => setEditingPolicyDoc(null)}
                      className="px-3.5 py-1.5 border border-border rounded-lg text-xs font-semibold text-muted-foreground hover:bg-secondary">
                      Cancel
                    </button>
                    <button type="submit" disabled={savingPolicy}
                      className="px-4 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg shadow-sm flex items-center gap-2">
                      {savingPolicy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Save Policy
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
