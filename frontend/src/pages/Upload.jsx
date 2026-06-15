import { useState } from 'react';
import { apiCall } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

export default function Upload({ showToast, loadDocuments }) {
  const { token } = useAuth();
  const [department, setDepartment] = useState('hr');
  const [accessLevel, setAccessLevel] = useState('employee');
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

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
      loadDocuments();
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
    <div className="page" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="section-title">Upload Knowledge</div>
      <div style={{ marginBottom: '24px', color: 'var(--text2)', fontSize: '13px' }}>
        Add new documents to the Enterprise RAG system. The document will be chunked, embedded, and added to the vector store.
      </div>

      <div 
        className={`upload-zone ${dragActive ? 'dragging' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input').click()}
      >
        <div className="upload-icon">☁️</div>
        <div className="upload-title">Click or drag document here</div>
        <div className="upload-sub">Supports .txt, .pdf, .docx (Max 10MB)</div>
        <input 
          id="file-input" 
          type="file" 
          style={{ display: 'none' }} 
          onChange={e => handleUpload(e.target.files[0])} 
        />
        {loading && <div style={{ marginTop: '16px', color: 'var(--accent)', fontWeight: 600 }}>Uploading & Indexing...</div>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="form-group">
          <label className="form-label">Target Department</label>
          <select className="form-select" value={department} onChange={e => setDepartment(e.target.value)}>
            <option value="hr">Human Resources</option>
            <option value="legal">Legal & Compliance</option>
            <option value="finance">Finance</option>
            <option value="it">IT Support</option>
            <option value="general">General</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Minimum Access Level Required</label>
          <select className="form-select" value={accessLevel} onChange={e => setAccessLevel(e.target.value)}>
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
  );
}
