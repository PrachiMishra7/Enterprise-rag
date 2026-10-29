import { useEffect, useState } from 'react';
import { apiCall } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Shield, HardDrive, Inbox, Search, Filter, 
  Layers, FolderOpen, AlertCircle, RefreshCw, Sparkles, 
  X, Settings2, Trash2, Check, Loader2, LayoutGrid, List, FileCode, CheckCircle2,
  Eye, Download
} from 'lucide-react';
import DocumentPreviewModal from '../components/DocumentPreviewModal';

export default function Documents({ documents = [], loadDocuments }) {
  const { user, token } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'hr_admin';

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedAccess, setSelectedAccess] = useState('All');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  // Document preview state
  const [previewDoc, setPreviewDoc] = useState(null);

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
      setSummaryText(`Failed to generate summary: ${e.message || 'Unknown error.'}`);
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
    if (window.confirm(`Permanently remove "${doc.filename}" from the enterprise vector index?`)) {
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
  const departments = ['All', ...new Set(documents.map(d => d.department).filter(Boolean))];
  const accessLevels = ['All', ...new Set(documents.map(d => d.access_level).filter(Boolean))];

  // Filter logic
  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.filename.toLowerCase().includes(search.toLowerCase());
    const matchesDept = selectedDept === 'All' || doc.department === selectedDept;
    const matchesAccess = selectedAccess === 'All' || doc.access_level === selectedAccess;
    return matchesSearch && matchesDept && matchesAccess;
  });

  const totalChunks = documents.reduce((acc, curr) => acc + (curr.chunk_count || 0), 0);

  const getFormatBadge = (filename) => {
    const ext = filename?.split('.').pop()?.toUpperCase() || 'DOC';
    return (
      <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-secondary text-muted-foreground border border-border">
        {ext}
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-background text-foreground overflow-y-auto">
      <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6 flex-1 flex flex-col">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Document Library
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Centralized repository of indexed enterprise documents, vector embeddings, and RBAC policies.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={fetchDocs}
              className="px-3 py-1.5 rounded-lg bg-card border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 text-xs font-medium shadow-xs"
              title="Refresh document repository"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-primary' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Indexed Documents</p>
              <p className="text-2xl font-bold tracking-tight text-foreground mt-1">{documents.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-primary flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Vector Chunks</p>
              <p className="text-2xl font-bold tracking-tight text-foreground mt-1">{totalChunks}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Current Access Scope</p>
              <p className="text-base font-bold tracking-tight text-foreground mt-1 capitalize">
                {isAdmin ? 'Superadmin Full' : (user?.role || 'Restricted')}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Search, Filter Toolbar & View Mode Toggle */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Filter by filename or keyword..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-card border border-border rounded-lg text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground">
              <Filter className="w-3.5 h-3.5" />
              <select 
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
                className="bg-transparent text-foreground outline-none text-xs font-medium cursor-pointer"
              >
                {departments.map(d => (
                  <option key={d} value={d} className="bg-card text-foreground">{d === 'All' ? 'All Departments' : d.toUpperCase()}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground">
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

            <div className="flex items-center border border-border rounded-lg bg-card p-0.5">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content View: Table or Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 text-muted-foreground space-y-3 bg-card border border-border rounded-xl">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-xs">Fetching enterprise document registry...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center text-muted-foreground space-y-2 border border-border rounded-xl bg-card">
            <Inbox className="w-10 h-10 opacity-40 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">No documents found</p>
            <p className="text-xs">Adjust search parameters or upload files in the Upload Center.</p>
          </div>
        ) : viewMode === 'table' ? (
          /* Enterprise High-Density Table */
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-secondary/50 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="py-3 px-4">Document Name</th>
                    <th className="py-3 px-4">Format</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Required Access</th>
                    <th className="py-3 px-4 text-center">Chunks</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {filteredDocs.map((d) => (
                    <tr key={d.id || d.filename} className="hover:bg-secondary/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5 max-w-md">
                          <FileText className="w-4 h-4 text-primary shrink-0" />
                          <span className="font-medium text-foreground truncate" title={d.filename}>
                            {d.filename}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getFormatBadge(d.filename)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-secondary text-foreground border border-border">
                          {d.department || 'general'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                          <Shield className="w-3 h-3 text-muted-foreground" />
                          {d.access_level?.replace('_', ' ') || 'employee'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-muted-foreground">
                        {d.chunk_count || 0}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Indexed
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setPreviewDoc(d)}
                            className="px-2.5 py-1 rounded-md bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium transition-colors flex items-center gap-1 border border-border"
                            title="View original document content"
                          >
                            <Eye className="w-3.5 h-3.5 text-primary" />
                            <span>View Original</span>
                          </button>
                          <button
                            onClick={() => handleSummarize(d)}
                            className="px-2.5 py-1 rounded-md bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium transition-colors flex items-center gap-1 border border-border"
                            title="Generate AI summary"
                          >
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            <span>Summarize</span>
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => openPolicyModal(d)}
                              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                              title="Edit RBAC Policy"
                            >
                              <Settings2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteDoc(d)}
                              className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              title="Remove Document"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map((d) => (
              <div 
                key={d.id || d.filename}
                className="bg-card border border-border hover:border-primary/40 rounded-xl p-4 flex flex-col justify-between transition-all shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-secondary text-foreground border border-border">
                        {d.department || 'general'}
                      </span>
                      {isAdmin && (
                        <button 
                          onClick={() => openPolicyModal(d)}
                          className="p-1 rounded-md text-muted-foreground hover:text-foreground"
                          title="Edit Policy"
                        >
                          <Settings2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {isAdmin && (
                        <button 
                          onClick={() => handleDeleteDoc(d)}
                          className="p-1 rounded-md text-muted-foreground hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="text-xs font-semibold text-card-foreground line-clamp-2 leading-snug mb-1" title={d.filename}>
                    {d.filename}
                  </h3>

                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-2">
                    <Layers className="w-3 h-3 text-muted-foreground" />
                    <span>{d.chunk_count || 0} chunks</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border mt-3 text-xs">
                  <span className="text-[10px] text-muted-foreground uppercase font-medium">
                    {d.access_level?.replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setPreviewDoc(d)}
                      className="text-[11px] font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-1"
                      title="View original document"
                    >
                      <Eye className="w-3 h-3 text-primary" /> View
                    </button>
                    <button 
                      onClick={() => handleSummarize(d)}
                      className="text-[11px] font-semibold text-muted-foreground hover:text-amber-500 transition-colors flex items-center gap-1"
                      title="AI Summary"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" /> Summary
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Document Summarize Modal */}
        <AnimatePresence>
          {summarizingDoc && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                onClick={() => setSummarizingDoc(null)}
                className="absolute inset-0 bg-black/60" 
              />

              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-card border border-border rounded-xl w-full max-w-xl overflow-hidden shadow-xl relative z-10 flex flex-col max-h-[85vh]"
              >
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 pr-3">
                    <Sparkles className="w-4 h-4 text-primary shrink-0" />
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      Executive Summary: {summarizingDoc.filename}
                    </h3>
                  </div>
                  <button 
                    onClick={() => setSummarizingDoc(null)} 
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 sm:p-5 overflow-y-auto flex-1 text-xs leading-relaxed text-foreground space-y-3">
                  {loadingSummary ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-2 text-muted-foreground">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <p>Generating grounded summary via RAG summarizer...</p>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap font-sans">{summaryText}</div>
                  )}
                </div>

                <div className="p-3 bg-secondary/40 border-t border-border flex justify-between items-center text-xs">
                  <span className="text-[11px] text-muted-foreground">Verified against indexed chunks</span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={copySummary} 
                      disabled={loadingSummary}
                      className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-foreground text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button 
                      onClick={() => setSummarizingDoc(null)}
                      className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Edit Access Policy Modal (Admin) */}
        <AnimatePresence>
          {editingPolicyDoc && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                onClick={() => setEditingPolicyDoc(null)}
                className="absolute inset-0 bg-black/60" 
              />

              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-card border border-border rounded-xl w-full max-w-md overflow-hidden shadow-xl relative z-10"
              >
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">Document Access Policy</h3>
                  </div>
                  <button 
                    onClick={() => setEditingPolicyDoc(null)} 
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSavePolicy}>
                  <div className="p-4 sm:p-5 space-y-4">
                    <div className="p-3 rounded-lg bg-secondary/50 border border-border text-xs text-muted-foreground">
                      <p className="font-semibold text-foreground truncate">{editingPolicyDoc.filename}</p>
                      <p className="text-[11px] mt-0.5">{editingPolicyDoc.chunk_count || 0} vector chunks will inherit this policy</p>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1">Assigned Department</label>
                      <select 
                        value={policyForm.department}
                        onChange={e => setPolicyForm(prev => ({ ...prev, department: e.target.value }))}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
                      >
                        <option value="general">General (Company-wide)</option>
                        <option value="hr">Human Resources</option>
                        <option value="finance">Finance</option>
                        <option value="legal">Legal & Compliance</option>
                        <option value="it">IT Support</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1">Required Access Level (RBAC)</label>
                      <select 
                        value={policyForm.access_level}
                        onChange={e => setPolicyForm(prev => ({ ...prev, access_level: e.target.value }))}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
                      >
                        <option value="employee">Employee (General Staff)</option>
                        <option value="manager">Manager (Managers & Admins)</option>
                        <option value="hr_admin">HR Admin (Restricted to HR & Superadmin)</option>
                        <option value="legal_admin">Legal Admin (Restricted to Legal & Superadmin)</option>
                        <option value="finance_admin">Finance Admin (Restricted to Finance & Superadmin)</option>
                        <option value="it_admin">IT Admin (Restricted to IT & Superadmin)</option>
                        <option value="admin">System Superadmin (Executive Only)</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3.5 bg-secondary/40 border-t border-border flex justify-end gap-2 text-xs">
                    <button 
                      type="button" 
                      onClick={() => setEditingPolicyDoc(null)}
                      className="px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-muted-foreground hover:bg-secondary"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={savingPolicy}
                      className="px-3.5 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5"
                    >
                      {savingPolicy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Save Policy
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Document Original Viewer Modal */}
        <AnimatePresence>
          {previewDoc && (
            <DocumentPreviewModal 
              docIdentifier={previewDoc} 
              onClose={() => setPreviewDoc(null)} 
            />
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
