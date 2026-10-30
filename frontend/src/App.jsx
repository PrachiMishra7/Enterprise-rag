import { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Overview from './pages/Overview';
import Chat from './pages/Chat';
import Documents from './pages/Documents';
import Upload from './pages/Upload';
import Agents from './pages/Agents';
import AuditLogs from './pages/AuditLogs';
import Prompts from './pages/Prompts';
import DataConnectors from './pages/DataConnectors';
import UserManagement from './pages/UserManagement';
import Settings from './pages/Settings';
import AITools from './pages/AITools';
import RunEvaluation from './pages/RunEvaluation';
import KnowledgeGraph from './pages/KnowledgeGraph';
import { hasPageAccess } from './utils/permissions';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

function App() {
  const { user, token } = useAuth();
  const [page, setPage] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState(null);
  
  // Shared state for chat and documents
  const [documents, setDocuments] = useState([]);
  const [queryInput, setQueryInput] = useState('');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (token) {
      import('./utils/api').then(({ apiCall }) => {
        apiCall('GET', '/documents/list', null, false, token)
          .then(data => setDocuments(data.documents || []))
          .catch(e => console.error(e));
      });
    }
  }, [token]);

  // If user role changes (e.g. switch account), ensure current page is accessible
  useEffect(() => {
    if (user && !hasPageAccess(user.role, page)) {
      setPage('overview');
    }
  }, [user, page]);

  if (!user) {
    return <Login onLoginSuccess={() => {}} />;
  }

  // Fallback for unauthorized direct route attempts
  const renderAccessDenied = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full bg-background">
      <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mb-5 border border-destructive/20">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">Access Restricted by RBAC Policy</h2>
      <p className="text-muted-foreground text-sm max-w-md mb-6">
        Your role (<span className="font-semibold text-foreground uppercase">{user.role?.replace("_", " ")}</span>) does not have authorization to view this administrative module.
      </p>
      <button 
        onClick={() => setPage('overview')}
        className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-lg transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Dashboard
      </button>
    </div>
  );

  const renderContent = () => {
    // RBAC Gateway Guard
    if (!hasPageAccess(user.role, page)) {
      return renderAccessDenied();
    }

    switch (page) {
      case 'overview': return <Overview navigateTo={(p, q) => { setPage(p); if(q) setQueryInput(q); }} />;
      case 'chat': return <Chat queryInput={queryInput} setQueryInput={setQueryInput} />;
      case 'documents': return <Documents documents={documents} loadDocuments={setDocuments} />;
      case 'upload': return <Upload showToast={showToast} loadDocuments={setDocuments} />;
      case 'agents': return <Agents navigateTo={(p, q) => { setPage(p); if(q) setQueryInput(q); }} />;
      case 'tools': return <AITools />;
      case 'prompts': return <Prompts />;
      case 'evaluation': return <RunEvaluation />;
      case 'kg': return <KnowledgeGraph />;
      case 'connectors': return <DataConnectors />;
      case 'users': return <UserManagement />;
      case 'audit': return <AuditLogs />;
      case 'settings': return <Settings />;
      default: return <Overview navigateTo={(p, q) => { setPage(p); if(q) setQueryInput(q); }} />;
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden bg-background text-foreground ${sidebarOpen ? 'sidebar-open' : ''}`}>

      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity md:hidden ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => setSidebarOpen(false)}
      />
      
      <Sidebar currentPage={page} setPage={(p) => { setPage(p); setSidebarOpen(false); }} sidebarOpen={sidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden relative z-10 bg-transparent">
        <Header page={page} setSidebarOpen={setSidebarOpen} setPage={setPage} />
        {renderContent()}
      </div>
      
      {toast && (
        <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl text-sm font-semibold animate-in slide-in-from-bottom-5 z-50 shadow-lg bg-card border border-border ${toast.type === 'success' ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-red-500'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

export default App;
