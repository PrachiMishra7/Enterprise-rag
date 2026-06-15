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

  const renderContent = () => {
    switch (page) {
      case 'overview': return <Overview documents={documents} navigateTo={(p, q) => { setPage(p); if(q) setQueryInput(q); }} />;
      case 'chat': return <Chat queryInput={queryInput} setQueryInput={setQueryInput} />;
      case 'documents': return <Documents documents={documents} loadDocuments={setDocuments} />;
      case 'upload': return <Upload showToast={showToast} loadDocuments={setDocuments} />;
      case 'agents': return <Agents navigateTo={(p, q) => { setPage(p); if(q) setQueryInput(q); }} />;
      default: return <Overview documents={documents} navigateTo={(p, q) => { setPage(p); if(q) setQueryInput(q); }} />;
    }
  };

  return (
    <div className={`app \${sidebarOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
      <Sidebar currentPage={page} setPage={(p) => { setPage(p); setSidebarOpen(false); }} />
      <div className="main">
        <Header page={page} setSidebarOpen={setSidebarOpen} />
        {renderContent()}
      </div>
      {toast && <div className={`toast toast-\${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}

export default App;
