import { useEffect } from 'react';
import { apiCall } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Shield, HardDrive, Inbox } from 'lucide-react';

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

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 md:p-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">Document Library</h1>
        <p className="text-muted-foreground max-w-2xl text-base mb-10">
          Secure enterprise document repository. These files are actively indexed and searchable via the AI agents. You can only view documents available to your role.
        </p>

        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 bg-card border border-border rounded-xl border-dashed">
            <div className="w-16 h-16 bg-secondary text-muted-foreground rounded-full flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No documents found</h3>
            <p className="text-muted-foreground mt-1">There are currently no documents indexed for your access level.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map(d => (
              <div key={d.filename} className="group bg-card border border-border rounded-xl p-6 transition-all hover:shadow-md hover:border-border/80 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                </div>
                
                <h3 className="text-base font-semibold text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors" title={d.filename}>
                  {d.filename}
                </h3>
                
                <div className="flex flex-col gap-2 mb-6 flex-1">
                  <div className="flex items-center text-xs text-muted-foreground gap-2">
                    <HardDrive className="w-3.5 h-3.5" />
                    <span>{d.chunk_count} chunks indexed</span>
                    <span className="text-border">•</span>
                    <span>{formatBytes(d.file_size)}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-auto pt-4 border-t border-border/50">
                  <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-secondary text-muted-foreground border border-border">
                    {d.department}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <Shield className="w-3 h-3" />
                    {d.access_level.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
