import { useState, useRef } from 'react';
import { apiCall } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  CloudUpload, FileUp, FileText, CheckCircle2, AlertCircle, 
  Layers, Shield, ArrowRight, Loader2, RefreshCw 
} from 'lucide-react';

export default function Upload({ showToast, loadDocuments }) {
  const { token } = useAuth();
  const [department, setDepartment] = useState('general');
  const [accessLevel, setAccessLevel] = useState('employee');
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);

  const handleUpload = async (file) => {
    const fileToUpload = file || selectedFile;
    if (!fileToUpload) return;

    // Check size (max 10MB)
    if (fileToUpload.size > 10 * 1024 * 1024) {
      const err = 'File size exceeds maximum permitted limit of 10MB.';
      setErrorMessage(err);
      if (showToast) showToast(`❌ ${err}`, 'error');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setUploadResult(null);
    
    const form = new FormData();
    form.append('file', fileToUpload);
    form.append('department', department);
    form.append('access_level', accessLevel);

    try {
      const data = await apiCall('POST', '/documents/upload', form, true, token);
      setUploadResult(data);
      setSelectedFile(null);
      if (showToast) showToast(`✅ "${data.filename}" indexed (${data.chunks_created} vector chunks)`, 'success');
      if (loadDocuments) loadDocuments();
    } catch (e) {
      setErrorMessage(e.message || 'Failed to process document upload');
      if (showToast) showToast(`❌ ${e.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-background text-foreground">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Page Header */}
        <div className="pb-5 border-b border-border">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Upload & Ingest Knowledge
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Ingest corporate documents into vector embeddings with automated chunking and role-based access assignment.
          </p>
        </div>

        {/* Feedback Alerts */}
        {uploadResult && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-semibold text-foreground">
                  Document Successfully Indexed: {uploadResult.filename}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Generated {uploadResult.chunks_created} vector chunks for semantic retrieval.
                </p>
              </div>
            </div>
            <button 
              onClick={() => setUploadResult(null)} 
              className="text-xs underline text-emerald-600 dark:text-emerald-400 font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Configuration Row */}
        <div className="bg-card border border-border p-5 rounded-xl shadow-xs">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Ingestion Metadata & Permissions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground">Target Department Scope</label>
              <select 
                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow" 
                value={department} 
                onChange={e => setDepartment(e.target.value)}
                disabled={loading}
              >
                <option value="general">General (Company-Wide)</option>
                <option value="hr">Human Resources</option>
                <option value="legal">Legal & Compliance</option>
                <option value="finance">Finance</option>
                <option value="it">IT Support</option>
              </select>
              <p className="text-[11px] text-muted-foreground">Determines which domain-specific agents can query this document.</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground">Minimum Access Role Required (RBAC)</label>
              <select 
                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow" 
                value={accessLevel} 
                onChange={e => setAccessLevel(e.target.value)}
                disabled={loading}
              >
                <option value="employee">All Employees</option>
                <option value="manager">Managers & Up</option>
                <option value="hr_admin">HR Admins Only</option>
                <option value="legal_admin">Legal Admins Only</option>
                <option value="finance_admin">Finance Admins Only</option>
                <option value="it_admin">IT Admins Only</option>
                <option value="admin">System Superadmins Only</option>
              </select>
              <p className="text-[11px] text-muted-foreground">Restricts document retrieval to users with this role or higher.</p>
            </div>
          </div>
        </div>

        {/* Ingestion Dropzone */}
        <div 
          className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all bg-card ${
            dragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50'
          }`}
          onDragOver={e => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">Vectorizing & Chunking Document...</p>
                <p className="text-xs text-muted-foreground mt-0.5">Generating text embeddings and indexing into vector database.</p>
              </div>
            </div>
          ) : selectedFile ? (
            <div className="flex flex-col items-center justify-center py-2 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready for vectorization
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button 
                  onClick={() => setSelectedFile(null)}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-secondary"
                >
                  Choose Different File
                </button>
                <button 
                  onClick={() => handleUpload()}
                  className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-xs flex items-center gap-1.5"
                >
                  <FileUp className="w-3.5 h-3.5" />
                  <span>Start Ingestion</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-secondary text-muted-foreground flex items-center justify-center">
                <CloudUpload className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Drag and drop files here, or <button type="button" onClick={() => fileInputRef.current?.click()} className="text-primary hover:underline font-semibold">browse</button>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supported formats: PDF, DOCX, TXT • Maximum file size: 10MB
                </p>
              </div>
            </div>
          )}

          <input 
            ref={fileInputRef}
            type="file" 
            className="hidden" 
            onChange={handleFileChange} 
            disabled={loading}
            accept=".pdf,.docx,.txt"
          />
        </div>

        {/* Security & Ingestion Guidelines */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-3.5 rounded-lg border border-border bg-card text-xs space-y-1">
            <span className="font-semibold text-foreground block">Automatic Chunking</span>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              Documents are partitioned into 500-token chunks with 50-token semantic overlap for optimal retrieval.
            </p>
          </div>
          <div className="p-3.5 rounded-lg border border-border bg-card text-xs space-y-1">
            <span className="font-semibold text-foreground block">Vector Embeddings</span>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              Embeddings are indexed in PostgreSQL pgvector / SQLite vector tables with HNSW cosine similarity.
            </p>
          </div>
          <div className="p-3.5 rounded-lg border border-border bg-card text-xs space-y-1">
            <span className="font-semibold text-foreground block">Tenant Security</span>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              All documents are tagged with RBAC metadata and filtered at the query layer before prompt injection.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
