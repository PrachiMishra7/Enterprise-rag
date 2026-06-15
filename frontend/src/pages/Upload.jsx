import { useState, useRef } from 'react';
import { apiCall } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { CloudUpload, FileUp, Loader2 } from 'lucide-react';

export default function Upload({ showToast, loadDocuments }) {
  const { token } = useAuth();
  const [department, setDepartment] = useState('hr');
  const [accessLevel, setAccessLevel] = useState('employee');
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleUpload = async (file) => {
    if (!file) return;
    setLoading(true);
    
    const form = new FormData();
    form.append('file', file);
    form.append('department', department);
    form.append('access_level', accessLevel);

    try {
      const data = await apiCall('POST', '/documents/upload', form, true, token);
      showToast(`✅ "${data.filename}" uploaded — ${data.chunks_created} chunks indexed`, 'success');
      if (loadDocuments) loadDocuments();
    } catch (e) {
      showToast(`❌ ${e.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 md:p-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">Upload Knowledge</h1>
        <p className="text-muted-foreground text-base mb-10">
          Add new documents to the Enterprise RAG system. The document will be chunked, embedded, and securely added to the vector store.
        </p>

        <div 
          className={`border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-all duration-200 mb-8 ${
            dragActive 
              ? 'border-primary bg-primary/5 scale-[1.01]' 
              : 'border-border bg-card hover:border-primary/50 hover:bg-secondary/50'
          }`}
          onDragOver={e => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-16 h-16 bg-secondary text-muted-foreground rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
            {loading ? <Loader2 className="w-8 h-8 animate-spin text-primary" /> : <CloudUpload className="w-8 h-8" />}
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            {loading ? 'Uploading & Indexing...' : 'Click or drag document here'}
          </h3>
          <p className="text-sm text-muted-foreground">Supports .txt, .pdf, .docx (Max 10MB)</p>
          <input 
            ref={fileInputRef}
            type="file" 
            className="hidden" 
            onChange={e => handleUpload(e.target.files[0])} 
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card border border-border p-6 rounded-xl shadow-sm">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">Target Department</label>
            <select 
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow" 
              value={department} 
              onChange={e => setDepartment(e.target.value)}
              disabled={loading}
            >
              <option value="hr">Human Resources</option>
              <option value="legal">Legal & Compliance</option>
              <option value="finance">Finance</option>
              <option value="it">IT Support</option>
              <option value="general">General</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">Minimum Access Level Required</label>
            <select 
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow" 
              value={accessLevel} 
              onChange={e => setAccessLevel(e.target.value)}
              disabled={loading}
            >
              <option value="employee">All Employees</option>
              <option value="manager">Managers & Up</option>
              <option value="hr_admin">HR Admins</option>
              <option value="legal_admin">Legal Admins</option>
              <option value="finance_admin">Finance Admins</option>
              <option value="it_admin">IT Admins</option>
              <option value="admin">Admin Only</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
