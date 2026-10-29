import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Download, Copy, Check, X, Shield, Layers, 
  ExternalLink, Search, Clock, Building2, Eye, Loader2, AlertCircle
} from 'lucide-react';
import { apiCall, API_BASE } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

export default function DocumentPreviewModal({ docIdentifier, onClose }) {
  const { token } = useAuth();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('full'); // 'full' | 'chunks'
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!docIdentifier) return;
    setLoading(true);
    setError(null);

    // Support either object ({ id, filename }) or string ID / filename
    const id = typeof docIdentifier === 'object' ? (docIdentifier.id || docIdentifier.filename) : docIdentifier;

    apiCall('GET', `/documents/${encodeURIComponent(id)}/content`, null, false, token)
      .then(data => {
        setDoc(data);
      })
      .catch(err => {
        console.error('Failed to load document content:', err);
        setError(err.message || 'Unable to load original document');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [docIdentifier, token]);

  const handleCopy = () => {
    if (!doc?.content) return;
    navigator.clipboard.writeText(doc.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    if (!doc) return;
    setDownloading(true);
    try {
      const authToken = token || localStorage.getItem('enterprise_token');
      const res = await fetch(`${API_BASE}/documents/${encodeURIComponent(doc.id)}/download`, {
        headers: {
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        }
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.filename.endsWith('.txt') ? doc.filename : `${doc.filename}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message || 'Failed to download original document');
    } finally {
      setDownloading(false);
    }
  };

  if (!docIdentifier) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-xs"
      />

      {/* Modal Dialog */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 260 }}
        className="relative z-10 w-full max-w-4xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-border bg-secondary/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-foreground truncate" title={doc?.filename || 'Document Preview'}>
                  {doc?.filename || (typeof docIdentifier === 'object' ? docIdentifier.filename : docIdentifier)}
                </h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground border border-border uppercase shrink-0">
                  Original Document
                </span>
              </div>
              {doc && (
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 font-medium capitalize">
                    <Building2 className="w-3 h-3" /> {doc.department}
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 font-medium">
                    <Shield className="w-3 h-3" /> {doc.access_level?.replace('_', ' ')}
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 font-medium">
                    <Layers className="w-3 h-3" /> {doc.chunks_count} indexed chunks
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={handleCopy}
              disabled={loading || !doc?.content}
              className="p-2 sm:px-3 sm:py-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-foreground text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-40"
              title="Copy text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {doc?.file_url && (
              <a 
                href={doc.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:inline-flex p-2 sm:px-3 sm:py-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-foreground text-xs font-medium items-center gap-1.5 transition-colors shadow-xs"
                title="Open directly from Supabase Storage"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-500" />
                <span>Supabase File</span>
              </a>
            )}

            <button 
              onClick={handleDownload}
              disabled={loading || downloading || !doc}
              className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40 shadow-xs"
              title="Download original file from Supabase Storage"
            >
              {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Download</span>
            </button>

            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View mode toolbar & search */}
        {doc && (
          <div className="px-4 py-2.5 border-b border-border bg-card flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1 bg-secondary p-0.5 rounded-lg border border-border">
              <button
                onClick={() => setActiveTab('full')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${activeTab === 'full' ? 'bg-card text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Full Document Text
              </button>
              <button
                onClick={() => setActiveTab('chunks')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${activeTab === 'chunks' ? 'bg-card text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Chunk Segments ({doc.chunks?.length || 0})
              </button>
            </div>

            <div className="relative flex-1 max-w-xs hidden sm:block">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Find in document..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1 bg-background border border-border rounded-md text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
            </div>
          </div>
        )}

        {/* Document Body Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-background">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-3">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
              <p className="text-xs font-medium">Reconstructing full document from encrypted vector chunks...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Access Denied or Not Found</p>
                <p className="text-xs text-muted-foreground max-w-sm mt-1">{error}</p>
              </div>
            </div>
          ) : activeTab === 'full' ? (
            <div className="bg-card border border-border rounded-xl p-4 sm:p-6 font-mono text-xs leading-relaxed text-foreground whitespace-pre-wrap select-text selection:bg-primary/20 shadow-xs">
              {searchTerm ? (
                // Highlight search matches
                doc.content.split(new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')).map((part, i) =>
                  part.toLowerCase() === searchTerm.toLowerCase() ? (
                    <mark key={i} className="bg-amber-500/30 text-amber-900 dark:text-amber-200 px-0.5 rounded font-bold">
                      {part}
                    </mark>
                  ) : part
                )
              ) : (
                doc.content || 'Document content is empty.'
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {doc.chunks?.map((chunk, idx) => (
                <div key={idx} className="bg-card border border-border rounded-xl p-4 shadow-xs">
                  <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground uppercase pb-2 mb-2 border-b border-border">
                    <span className="text-primary font-bold">Chunk #{chunk.index + 1}</span>
                    <span>{chunk.text.length} characters</span>
                  </div>
                  <p className="text-xs font-mono text-foreground leading-relaxed whitespace-pre-wrap selection:bg-primary/20">
                    {chunk.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="p-3 bg-secondary/40 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span className="text-[11px] font-medium flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-500" /> Grounded in enterprise vector database
          </span>
          <button 
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-card border border-border hover:bg-secondary text-foreground text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
