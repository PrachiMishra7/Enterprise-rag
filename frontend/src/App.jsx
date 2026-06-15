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

  if (!user) {
    return <Login onLoginSuccess={(data) => {
      // In AuthContext this will set user and token
    }} />;
  }

  const renderPlaceholder = (title, desc) => (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#0a0f1d] p-8 text-center h-full">
      <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-6 border border-primary/20">
        <div className="w-10 h-10 bg-primary/20 rounded-xl animate-pulse"></div>
      </div>
      <h2 className="text-3xl font-extrabold text-white mb-2">{title}</h2>
      <p className="text-slate-400 max-w-md">{desc}</p>
      <button 
        onClick={() => setPage('overview')}
        className="mt-8 px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-lg border border-white/10 transition-colors"
      >
        Return to Dashboard
      </button>
    </div>
  );

  const renderContent = () => {
    switch (page) {
      case 'overview': return <Overview navigateTo={(p, q) => { setPage(p); if(q) setQueryInput(q); }} />;
      case 'chat': return <Chat queryInput={queryInput} setQueryInput={setQueryInput} />;
      case 'documents': return <Documents documents={documents} loadDocuments={setDocuments} />;
      case 'upload': return <Upload showToast={showToast} loadDocuments={setDocuments} />;
      case 'agents': return <Agents navigateTo={(p, q) => { setPage(p); if(q) setQueryInput(q); }} />;
      case 'prompts': return renderPlaceholder('Prompt Library', 'Create, save, and manage enterprise-grade system prompts and templates for the AI agents.');
      case 'connectors': return renderPlaceholder('Data Connectors', 'Connect external data sources like Google Drive, Confluence, Jira, and Slack to the vector index.');
      case 'users': return renderPlaceholder('User Management', 'Manage enterprise users, departments, and Role-Based Access Control (RBAC) permissions.');
      case 'audit': return renderPlaceholder('Audit & Security Logs', 'Track detailed logs of all AI interactions, document retrievals, and flagged hallucination events.');
      case 'settings': return renderPlaceholder('System Settings', 'Configure LLM endpoints, embedding models, and global security policies.');
      default: return <Overview navigateTo={(p, q) => { setPage(p); if(q) setQueryInput(q); }} />;
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden relative bg-background text-foreground ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity md:hidden ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => setSidebarOpen(false)}
      ></div>
      <Sidebar currentPage={page} setPage={(p) => { setPage(p); setSidebarOpen(false); }} />
      <div className="flex-1 flex flex-col overflow-hidden relative z-10 bg-background">
        <Header page={page} setSidebarOpen={setSidebarOpen} />
        {renderContent()}
      </div>
      {toast && (
        <div className={`fixed bottom-8 right-8 px-5 py-3 rounded-md text-sm font-medium animate-in slide-in-from-bottom-5 z-50 shadow-lg bg-surface border ${
          toast.type === 'success' ? 'border-l-4 border-l-green-600 text-foreground' : 'border-l-4 border-l-red-600 text-foreground'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

export default App;
