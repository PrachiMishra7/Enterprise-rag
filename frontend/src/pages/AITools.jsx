import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, FileText, HelpCircle, Layers, Mail, Play, FileCheck, CheckCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function AITools() {
  const { token } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [activeTab, setActiveTab] = useState('faq');
  
  // State for form inputs
  const [selectedDoc1, setSelectedDoc1] = useState('');
  const [selectedDoc2, setSelectedDoc2] = useState('');
  const [question, setQuestion] = useState('');
  const [scenario, setScenario] = useState('');
  const [topic, setTopic] = useState('');
  
  // State for outputs
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  
  useEffect(() => {
    if (token) {
      apiCall('GET', '/documents/list', null, false, token)
        .then(data => {
            setDocuments(data.documents || []);
            if (data.documents && data.documents.length > 0) {
                setSelectedDoc1(data.documents[0].id);
                if (data.documents.length > 1) setSelectedDoc2(data.documents[1].id);
                else setSelectedDoc2(data.documents[0].id);
            }
        })
        .catch(e => console.error("Error fetching docs:", e));
    }
  }, [token]);

  const handleGenerateFAQ = async () => {
    if (!selectedDoc1) return;
    setLoading(true);
    setResult('');
    try {
      const data = await apiCall('POST', '/tools/generate-faq', { document_id: selectedDoc1 }, false, token);
      setResult(data.result);
    } catch (e) {
      setResult(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async () => {
    if (!selectedDoc1 || !selectedDoc2) return;
    setLoading(true);
    setResult('');
    try {
      const data = await apiCall('POST', '/tools/compare-policies', { document_id_1: selectedDoc1, document_id_2: selectedDoc2 }, false, token);
      setResult(data.result);
    } catch (e) {
      setResult(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleQA = async () => {
    if (!selectedDoc1 || !question) return;
    setLoading(true);
    setResult('');
    try {
      const data = await apiCall('POST', '/tools/document-qa', { document_id: selectedDoc1, question }, false, token);
      setResult(data.result);
    } catch (e) {
      setResult(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDraftEmail = async () => {
    if (!scenario) return;
    setLoading(true);
    setResult('');
    try {
      const data = await apiCall('POST', '/tools/draft-email', { document_id: selectedDoc1 || null, scenario }, false, token);
      setResult(data.result);
    } catch (e) {
      setResult(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!topic || documents.length === 0) return;
    setLoading(true);
    setResult('');
    try {
      // Just pass up to 3 document IDs for the report
      const docIds = documents.slice(0, 3).map(d => d.id);
      const data = await apiCall('POST', '/tools/generate-report', { document_ids: docIds, topic }, false, token);
      setResult(data.result);
    } catch (e) {
      setResult(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'faq':
        return (
          <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold">Automated FAQ Generator</h3>
            <p className="text-sm text-slate-400 mb-2">Select a document to automatically generate a 5-question FAQ.</p>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Source Document</label>
              <select 
                value={selectedDoc1} 
                onChange={(e) => setSelectedDoc1(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500/50"
              >
                {documents.map(d => <option key={d.id} value={d.id} className="bg-slate-900">{d.filename}</option>)}
              </select>
            </div>
            <button 
              onClick={handleGenerateFAQ} disabled={loading || !selectedDoc1}
              className="mt-4 flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold transition-all disabled:opacity-50"
            >
              <Sparkles className="w-5 h-5" /> {loading ? 'Generating...' : 'Generate FAQ'}
            </button>
          </div>
        );
      case 'compare':
        return (
          <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold">Policy Comparator</h3>
            <p className="text-sm text-slate-400 mb-2">Select two documents to compare their policies and highlight differences.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Document 1</label>
                <select 
                    value={selectedDoc1} onChange={(e) => setSelectedDoc1(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500/50"
                >
                    {documents.map(d => <option key={d.id} value={d.id} className="bg-slate-900">{d.filename}</option>)}
                </select>
                </div>
                <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Document 2</label>
                <select 
                    value={selectedDoc2} onChange={(e) => setSelectedDoc2(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500/50"
                >
                    {documents.map(d => <option key={d.id} value={d.id} className="bg-slate-900">{d.filename}</option>)}
                </select>
                </div>
            </div>
            <button 
              onClick={handleCompare} disabled={loading || !selectedDoc1 || !selectedDoc2}
              className="mt-4 flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold transition-all disabled:opacity-50"
            >
              <Layers className="w-5 h-5" /> {loading ? 'Comparing...' : 'Compare Policies'}
            </button>
          </div>
        );
      case 'qa':
        return (
          <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold">Targeted Document Q&A</h3>
            <p className="text-sm text-slate-400 mb-2">Ask a question directly against a single selected document.</p>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Target Document</label>
              <select 
                value={selectedDoc1} onChange={(e) => setSelectedDoc1(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500/50"
              >
                {documents.map(d => <option key={d.id} value={d.id} className="bg-slate-900">{d.filename}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Question</label>
              <input 
                type="text" value={question} onChange={e => setQuestion(e.target.value)}
                placeholder="What does this document say about..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <button 
              onClick={handleQA} disabled={loading || !selectedDoc1 || !question}
              className="mt-4 flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white rounded-xl font-bold transition-all disabled:opacity-50"
            >
              <HelpCircle className="w-5 h-5" /> {loading ? 'Thinking...' : 'Ask Question'}
            </button>
          </div>
        );
      case 'email':
        return (
          <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold">AI Email Drafter</h3>
            <p className="text-sm text-slate-400 mb-2">Draft a professional email based on a scenario, optionally grounded in a document.</p>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Reference Document (Optional)</label>
              <select 
                value={selectedDoc1} onChange={(e) => setSelectedDoc1(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500/50"
              >
                <option value="" className="bg-slate-900">-- None --</option>
                {documents.map(d => <option key={d.id} value={d.id} className="bg-slate-900">{d.filename}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email Scenario</label>
              <textarea 
                value={scenario} onChange={e => setScenario(e.target.value)}
                placeholder="e.g. Reject a vendor proposal based on the NDA guidelines..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500/50 h-32 resize-none"
              />
            </div>
            <button 
              onClick={handleDraftEmail} disabled={loading || !scenario}
              className="mt-4 flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white rounded-xl font-bold transition-all disabled:opacity-50"
            >
              <Mail className="w-5 h-5" /> {loading ? 'Drafting...' : 'Draft Email'}
            </button>
          </div>
        );
      case 'report':
        return (
          <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold">Report Generation</h3>
            <p className="text-sm text-slate-400 mb-2">Generate a comprehensive report leveraging your top workspace documents.</p>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Report Topic</label>
              <input 
                type="text" value={topic} onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Employee onboarding process overview..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <button 
              onClick={handleGenerateReport} disabled={loading || !topic}
              className="mt-4 flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold transition-all disabled:opacity-50"
            >
              <FileCheck className="w-5 h-5" /> {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 relative">
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* Left Side: Tool Configuration */}
        <div className="w-full lg:w-5/12 flex flex-col gap-6">
            <div className="mb-2">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-8 h-8 text-indigo-400" />
                <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-transparent">
                  AI Utilities
                </h1>
              </div>
              <p className="text-sm text-slate-400 font-medium">
                Advanced AI workflows to accelerate your daily tasks.
              </p>
            </div>
            
            {/* Tabs */}
            <div className="flex flex-wrap gap-2">
                {[
                    { id: 'faq', icon: HelpCircle, label: 'FAQ' },
                    { id: 'compare', icon: Layers, label: 'Compare' },
                    { id: 'qa', icon: FileText, label: 'Q&A' },
                    { id: 'email', icon: Mail, label: 'Email' },
                    { id: 'report', icon: FileCheck, label: 'Report' }
                ].map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); setResult(''); }}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}
                    >
                        <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                ))}
            </div>

            {/* Form Area */}
            <div className="glass-panel p-6 rounded-3xl relative overflow-hidden">
                {renderTabContent()}
            </div>
        </div>

        {/* Right Side: Results */}
        <div className="w-full lg:w-7/12 flex flex-col">
            <div className="glass-panel rounded-3xl flex-1 min-h-[500px] flex flex-col overflow-hidden relative">
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400" /> Output Result
                    </span>
                    {loading && <div className="text-xs text-indigo-400 animate-pulse font-bold">Processing...</div>}
                </div>
                
                <div className="flex-1 p-6 overflow-y-auto">
                    {result ? (
                        <div className="prose prose-invert prose-blue max-w-none text-sm">
                            <ReactMarkdown>{result}</ReactMarkdown>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4 opacity-50">
                            <Sparkles className="w-12 h-12" />
                            <p className="text-sm font-medium">Configure and run a tool to see results here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
