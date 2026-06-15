import { useEffect } from 'react';
import { apiCall } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

export default function Documents({ documents, loadDocuments }) {
  const { token } = useAuth();
  
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const data = await apiCall('GET', '/documents/list', null, false, token);
        if (loadDocuments) loadDocuments(data.documents || []);
      } catch (e) {
        console.error(e);
      }
    };
    fetchDocs();
  }, [token]);

  return (
    <div className="page">
      <div className="section-title">Document Library</div>
      <div style={{ marginBottom: '24px', color: 'var(--text2)', fontSize: '13px', maxWidth: '600px' }}>
        These are the documents your role has permission to access. They are indexed and searchable by the AI agents.
      </div>

      {documents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text3)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
          <div>No documents available for your role.</div>
        </div>
      ) : (
        <div className="docs-grid">
          {documents.map(d => (
            <div key={d.filename} className="doc-card">
              <div className="doc-icon">📄</div>
              <div className="doc-name">{d.filename}</div>
              <div className="doc-meta">
                Indexed • {d.chunk_count} chunks • Size: {d.file_size} bytes
              </div>
              <div className="doc-tags">
                <span className={`tag tag-${d.department}`}>{d.department}</span>
                <span className="tag tag-general" style={{ background: 'rgba(255,255,255,0.1)' }}>{d.access_level}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
