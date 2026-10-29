import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/api';
import Loader from '../components/Loader';
import { 
  Sparkles, FileText, HelpCircle, Layers, Mail, 
  FileCheck, CheckCircle2, Copy, Check, ArrowRight 
} from 'lucide-react';
import MarkdownRenderer from '../components/MarkdownRenderer';

export default function AITools() {
  const { token } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [activeTab, setActiveTab] = useState('faq');
  
  // Form state
  const [selectedDoc1, setSelectedDoc1] = useState('');
  const [selectedDoc2, setSelectedDoc2] = useState('');
  const [question, setQuestion] = useState('');
  const [scenario, setScenario] = useState('');
  const [topic, setTopic] = useState('');
  
  // Output state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  
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

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
      const docIds = documents.slice(0, 3).map(d => d.id);
      const data = await apiCall('POST', '/tools/generate-report', { document_ids: docIds, topic }, false, token);
      setResult(data.result);
    } catch (e) {
      setResult(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-background text-foreground">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Page Header */}
        <div className="pb-5 border-b border-border">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            AI Productivity Utilities
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Specialized workflows for automated FAQ generation, policy comparison, document Q&A, and correspondence drafting.
          </p>
        </div>

        {/* Workflow Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-secondary/50 border border-border rounded-lg overflow-x-auto w-fit">
          {[
            { id: 'faq', icon: HelpCircle, label: 'FAQ Generator' },
            { id: 'compare', icon: Layers, label: 'Policy Comparator' },
            { id: 'qa', icon: FileText, label: 'Targeted Q&A' },
            { id: 'email', icon: Mail, label: 'Email Drafter' },
            { id: 'report', icon: FileCheck, label: 'Report Generator' }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button 
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setResult(''); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive 
                    ? 'bg-card text-foreground shadow-xs border border-border' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Grid: Form Inputs (Left) and Output Panel (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Tool Form Configuration */}
          <div className="lg:col-span-5 bg-card border border-border rounded-xl p-5 shadow-xs space-y-4">
            {activeTab === 'faq' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Automated FAQ Generator</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Select a knowledge document to synthesize a concise, factual 5-question FAQ.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">Source Document</label>
                  <select 
                    value={selectedDoc1} 
                    onChange={(e) => setSelectedDoc1(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    {documents.map(d => <option key={d.id} value={d.id}>{d.filename}</option>)}
                  </select>
                </div>
                <button 
                  onClick={handleGenerateFAQ} 
                  disabled={loading || !selectedDoc1}
                  className="w-full py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-semibold shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{loading ? 'Synthesizing FAQ...' : 'Generate FAQ'}</span>
                </button>
              </div>
            )}

            {activeTab === 'compare' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Policy Comparator</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Select two documents to compare policies, highlight differences, and flag conflicts.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">Baseline Document</label>
                  <select 
                    value={selectedDoc1} 
                    onChange={(e) => setSelectedDoc1(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    {documents.map(d => <option key={d.id} value={d.id}>{d.filename}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">Comparison Document</label>
                  <select 
                    value={selectedDoc2} 
                    onChange={(e) => setSelectedDoc2(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    {documents.map(d => <option key={d.id} value={d.id}>{d.filename}</option>)}
                  </select>
                </div>
                <button 
                  onClick={handleCompare} 
                  disabled={loading || !selectedDoc1 || !selectedDoc2}
                  className="w-full py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-semibold shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{loading ? 'Comparing Documents...' : 'Compare Policies'}</span>
                </button>
              </div>
            )}

            {activeTab === 'qa' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Targeted Document Q&A</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Direct query execution isolated to a single enterprise document.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">Target Document</label>
                  <select 
                    value={selectedDoc1} 
                    onChange={(e) => setSelectedDoc1(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    {documents.map(d => <option key={d.id} value={d.id}>{d.filename}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">Question</label>
                  <input 
                    type="text" 
                    value={question} 
                    onChange={e => setQuestion(e.target.value)}
                    placeholder="e.g. What is the vesting schedule outlined in section 4?"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <button 
                  onClick={handleQA} 
                  disabled={loading || !selectedDoc1 || !question}
                  className="w-full py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-semibold shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{loading ? 'Analyzing Document...' : 'Execute Targeted Query'}</span>
                </button>
              </div>
            )}

            {activeTab === 'email' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">AI Email Drafter</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Draft executive correspondence grounded in indexed compliance policies.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">Reference Document (Optional)</label>
                  <select 
                    value={selectedDoc1} 
                    onChange={(e) => setSelectedDoc1(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">-- None (General Correspondence) --</option>
                    {documents.map(d => <option key={d.id} value={d.id}>{d.filename}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">Email Objective & Scenario</label>
                  <textarea 
                    value={scenario} 
                    onChange={e => setScenario(e.target.value)}
                    placeholder="e.g. Reject a vendor contract proposal politely, citing compliance requirements..."
                    rows={4}
                    className="w-full p-3 bg-background border border-border rounded-lg text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  />
                </div>
                <button 
                  onClick={handleDraftEmail} 
                  disabled={loading || !scenario}
                  className="w-full py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-semibold shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{loading ? 'Drafting Email...' : 'Draft Communication'}</span>
                </button>
              </div>
            )}

            {activeTab === 'report' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Synthesis Report Generator</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Compile cross-document findings into a structured executive briefing.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">Report Topic</label>
                  <input 
                    type="text" 
                    value={topic} 
                    onChange={e => setTopic(e.target.value)}
                    placeholder="e.g. Summary of IT security standards and access protocols..."
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <button 
                  onClick={handleGenerateReport} 
                  disabled={loading || !topic}
                  className="w-full py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-semibold shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>{loading ? 'Synthesizing Report...' : 'Generate Executive Report'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Result Output Panel */}
          <div className="lg:col-span-7 bg-card border border-border rounded-xl shadow-xs min-h-[420px] flex flex-col overflow-hidden">
            <div className="p-3.5 border-b border-border flex items-center justify-between bg-secondary/30">
              <span className="text-xs font-semibold text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>Synthesis Output</span>
              </span>
              {result && (
                <button 
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded-md border border-border bg-card hover:bg-secondary text-xs font-medium text-foreground flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>

            <div className="flex-1 p-5 overflow-y-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[260px] text-muted-foreground space-y-3">
                  <Loader size="md" />
                  <p className="text-xs">Processing document context and generating structured response...</p>
                </div>
              ) : result ? (
                <div className="text-xs leading-relaxed text-foreground">
                  <MarkdownRenderer>{result}</MarkdownRenderer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[260px] text-muted-foreground text-center space-y-2 opacity-60">
                  <Sparkles className="w-8 h-8 text-muted-foreground" />
                  <p className="text-xs font-medium">Select a tool and submit inputs to view verified AI output.</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
