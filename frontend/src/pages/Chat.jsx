import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/api';
import Loader from '../components/Loader';
import { 
  Send, User, Bot, AlertTriangle, FileText, Cpu, ChevronDown, 
  Users, Scale, Landmark, Monitor, Sparkles, Check, Zap, Server, 
  X, ThumbsUp, ThumbsDown, History, MessageSquare, Clock, Plus, 
  Trash2, ChevronRight, ArrowRight, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MarkdownRenderer from '../components/MarkdownRenderer';
import DocumentPreviewModal from '../components/DocumentPreviewModal';

const AGENTS = [
  { 
    id: 'auto', name: 'Auto-Detect Router', desc: 'Dynamically routes query to the best expert', 
    icon: Sparkles, color: 'text-blue-500', bg: 'bg-blue-500/10',
    provider: 'Enterprise Edge', model: 'Ensemble Routing', latency: '~1.2s', tag: 'Recommended'
  },
  { 
    id: 'hr', name: 'HR Expert', desc: 'Trained on company policies, benefits, and culture', 
    icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10',
    provider: 'Azure OpenAI', model: 'GPT-4o', latency: '~800ms', tag: 'High Quality'
  },
  { 
    id: 'legal', name: 'Legal Counsel', desc: 'Specialized in contracts, compliance, and NDAs', 
    icon: Scale, color: 'text-purple-500', bg: 'bg-purple-500/10',
    provider: 'AWS Bedrock', model: 'Claude 3.5 Sonnet', latency: '~900ms', tag: 'High Accuracy'
  },
  { 
    id: 'finance', name: 'Finance Analyst', desc: 'Access to payroll, expenses, and budgets', 
    icon: Landmark, color: 'text-amber-500', bg: 'bg-amber-500/10',
    provider: 'Groq', model: 'Llama 3.1 70B', latency: '~300ms', tag: 'Ultra Fast'
  },
  { 
    id: 'it', name: 'IT Support', desc: 'Hardware troubleshooting and tech policies', 
    icon: Monitor, color: 'text-orange-500', bg: 'bg-orange-500/10',
    provider: 'Groq', model: 'Llama 3.1 8B', latency: '~200ms', tag: 'Fast'
  },
];

export default function Chat({ queryInput, setQueryInput }) {
  const { user, token } = useAuth();
  const [targetAgent, setTargetAgent] = useState('auto');
  const [messages, setMessages] = useState([{
    role: 'ai',
    content: `Hello ${user?.name || 'there'}! I'm your Enterprise AI Assistant. I can help you find information from company documents. What would you like to know?`,
    agent: 'general',
    confidence: 0.9,
    hallucination: false,
    citations: []
  }]);
  const [typing, setTyping] = useState(false);
  const [isAgentDropdownOpen, setIsAgentDropdownOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typing]);

  // Load chat history from backend query logs
  const fetchChatHistory = async () => {
    try {
      setLoadingHistory(true);
      const data = await apiCall('GET', '/query/history', null, false, token);
      setHistoryItems(data || []);
    } catch (e) {
      console.error('Failed to load history:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchChatHistory();
    }
  }, [token]);

  const sendQuery = async (overrideText) => {
    const textToSend = typeof overrideText === 'string' ? overrideText : queryInput;
    const query = textToSend.trim();
    if (!query || typing) return;

    const newMessages = [...messages, { role: 'user', content: query }];
    setMessages(newMessages);
    if (!overrideText) setQueryInput('');
    setTyping(true);

    try {
      const data = await apiCall('POST', '/query', { query, target_agent: targetAgent }, false, token);
      setMessages([...newMessages, {
        role: 'ai',
        content: data.answer,
        agent: data.agent,
        confidence: data.confidence_score,
        hallucination: data.hallucination_detected,
        citations: data.citations || [],
        query_id: data.query_id
      }]);
      // Update history list in background
      fetchChatHistory();
    } catch (e) {
      setMessages([...newMessages, {
        role: 'ai',
        content: `Unable to reach the backend (${e.message}).`,
        agent: 'general', confidence: 0, hallucination: false, citations: []
      }]);
    } finally {
      setTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendQuery();
    }
  };

  const handleFeedback = async (queryId, value, index) => {
    if (!queryId) return;
    try {
      await apiCall('POST', `/query/${queryId}/feedback`, { feedback: value }, false, token);
      const newMessages = [...messages];
      newMessages[index].feedback = value;
      setMessages(newMessages);
    } catch (e) {
      console.error('Failed to submit feedback', e);
    }
  };

  const startNewChat = () => {
    setMessages([{
      role: 'ai',
      content: `Hello ${user?.name || 'there'}! Started a fresh conversation. How can I help you today?`,
      agent: 'general',
      confidence: 0.9,
      hallucination: false,
      citations: []
    }]);
  };

  const loadPastQuery = (item) => {
    // Restore both the user question and the stored AI answer into the chat messages
    setMessages([
      {
        role: 'user',
        content: item.query
      },
      {
        role: 'ai',
        content: item.answer || 'Response recorded.',
        agent: item.agent || 'general',
        confidence: item.confidence_score !== undefined ? item.confidence_score : 0.9,
        hallucination: Boolean(item.hallucination_detected),
        citations: item.citations || [],
        query_id: item.id
      }
    ]);
    if (item.agent && item.agent !== 'general') {
      setTargetAgent(item.agent);
    }
    setShowHistory(false);
  };

  const formatTimestamp = (iso) => {
    if (!iso) return '';
    const date = new Date(iso);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex h-full w-full bg-background text-foreground overflow-hidden relative">
      
      {/* ── Main Chat Container ── */}
      <div className="flex-1 flex flex-col h-full max-w-5xl mx-auto px-3 sm:px-6 relative z-10 w-full overflow-hidden">
        
        {/* Chat Control Toolbar */}
        <div className="flex items-center justify-between py-2.5 border-b border-border text-xs">
          <div className="flex items-center gap-2">
            <button 
              onClick={startNewChat}
              className="px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-foreground flex items-center gap-1.5 transition-colors font-medium shadow-xs"
              title="Start a new thread"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Thread</span>
            </button>

            <button 
              onClick={() => {
                setShowHistory(!showHistory);
                if (!showHistory) fetchChatHistory();
              }}
              className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all font-medium shadow-xs ${
                showHistory 
                  ? 'border-primary bg-primary/10 text-primary' 
                  : 'border-border bg-card hover:bg-secondary text-foreground'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Chat History</span>
              {historyItems.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-secondary text-muted-foreground font-bold">
                  {historyItems.length}
                </span>
              )}
            </button>
          </div>

          <div className="text-[11px] text-muted-foreground hidden sm:flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>RAG Grounded Retrieval Active</span>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto py-5 sm:py-6 flex flex-col gap-5 scroll-smooth relative z-10">
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                key={i} 
                className={`flex gap-3 sm:gap-4 max-w-full ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 border shadow-xs ${
                  m.role === 'user' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border/80'
                }`}>
                  {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-primary" />}
                </div>
                
                <div className={`flex flex-col max-w-[90%] sm:max-w-[82%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`text-sm leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-primary text-primary-foreground shadow-xs px-4 py-3 rounded-2xl rounded-tr-xs border border-transparent whitespace-pre-wrap' 
                      : 'bg-card border border-border px-4 sm:px-5 py-3.5 rounded-2xl rounded-tl-xs shadow-xs text-foreground w-full'
                  }`}>
                    {m.role === 'user' ? m.content : (
                      <MarkdownRenderer>{m.content}</MarkdownRenderer>
                    )}
                  </div>

                  {m.role === 'ai' && m.agent && m.agent !== 'general' && (
                    <div className="flex items-center gap-2.5 mt-2.5 flex-wrap">
                      <div className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-secondary text-muted-foreground border border-border tracking-wider">
                        {m.agent} Agent
                      </div>
                      {m.confidence !== undefined && (
                        <div className="flex items-center gap-2 bg-card px-2 py-0.5 rounded border border-border">
                          <span className="text-[9px] text-muted-foreground font-semibold">CONFIDENCE</span>
                          <div className="w-14 h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${m.confidence >= 0.7 ? 'bg-emerald-500' : m.confidence >= 0.45 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                              style={{ width: `${Math.round(m.confidence * 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-foreground font-bold">{Math.round(m.confidence * 100)}%</span>
                        </div>
                      )}
                    </div>
                  )}

                  {m.role === 'ai' && m.citations && m.citations.length > 0 && (
                    <div className="mt-3 flex flex-col gap-2 w-full">
                      <div className="text-[10px] font-bold uppercase text-muted-foreground flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <FileText className="w-3 h-3 text-primary" /> Sources & Citations:
                        </span>
                        <span className="text-[10px] font-normal text-muted-foreground/80 lowercase italic">
                          Click to view original doc
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {m.citations.map((c, ci) => (
                          <div 
                            key={ci} 
                            onClick={() => setPreviewDoc({ filename: c.source })}
                            className="bg-card border border-border hover:border-primary/50 p-2.5 rounded-xl text-xs flex flex-col justify-between shadow-xs cursor-pointer transition-all hover:bg-secondary/40 group"
                            title={`Click to view full original ${c.source}`}
                          >
                            <p className="text-foreground/90 italic line-clamp-2 leading-relaxed">"{c.text}"</p>
                            <div className="flex items-center justify-between mt-2 pt-1 border-t border-border/50">
                              <span className="text-[10px] font-semibold text-primary truncate">{c.source}</span>
                              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground group-hover:text-primary transition-colors font-medium">
                                <Eye className="w-3 h-3" /> View Doc
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {m.role === 'ai' && i > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <button 
                        onClick={() => handleFeedback(m.query_id, 1, i)} 
                        className={`p-1.5 rounded-lg border transition-colors ${m.feedback === 1 ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/40' : 'border-border text-muted-foreground hover:bg-secondary'}`}
                        title="Helpful"
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => handleFeedback(m.query_id, -1, i)} 
                        className={`p-1.5 rounded-lg border transition-colors ${m.feedback === -1 ? 'bg-rose-500/20 text-rose-500 border-rose-500/40' : 'border-border text-muted-foreground hover:bg-secondary'}`}
                        title="Inaccurate / Hallucinated"
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {typing && (
            <div className="flex gap-3 items-center text-muted-foreground text-xs p-2">
              <Loader size="sm" />
              <span>Synthesizing enterprise context across knowledge chunks...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Prompt Bar & Agent Selector */}
        <div className="p-3 sm:p-4 bg-card/90 backdrop-blur-md rounded-2xl border border-border mb-4 shadow-sm relative">
          
          {/* Agent Picker Header */}
          <div className="flex items-center justify-between mb-3 border-b border-border pb-2.5">
            <button 
              onClick={() => setIsAgentDropdownOpen(!isAgentDropdownOpen)}
              className="flex items-center gap-2 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-secondary/80 hover:bg-secondary text-foreground transition-colors"
            >
              <Cpu className="w-3.5 h-3.5 text-primary" />
              <span>Target Expert: <strong>{AGENTS.find(a => a.id === targetAgent)?.name}</strong></span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isAgentDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Textarea Input */}
          <div className="flex gap-2.5 items-end relative">
            <textarea 
              className="flex-1 min-h-[50px] max-h-32 p-3 pr-12 bg-background border border-border text-foreground placeholder:text-muted-foreground rounded-xl text-xs sm:text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow shadow-xs" 
              placeholder="Ask anything across indexed policies, contracts, or engineering docs..." 
              value={queryInput}
              onChange={e => setQueryInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows="1"
            />
            <button 
              className="absolute right-2.5 bottom-2.5 w-8 h-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg flex items-center justify-center transition-all disabled:opacity-40 shadow-xs" 
              onClick={() => sendQuery()} 
              disabled={!queryInput.trim() || typing}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Agent Selector Centered Modal (High z-index) ── */}
      <AnimatePresence>
        {isAgentDropdownOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsAgentDropdownOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Modal Dialog */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              className="bg-card border border-border rounded-2xl shadow-2xl z-10 w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-secondary/30">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Select AI Routing Agent</h3>
                    <p className="text-[11px] text-muted-foreground">Direct your question to a dedicated specialist or use auto-routing</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsAgentDropdownOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer transition-colors"
                  title="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5">
                {AGENTS.map(agent => {
                  const isSelected = targetAgent === agent.id;
                  return (
                    <button 
                      key={agent.id}
                      type="button"
                      onClick={() => {
                        setTargetAgent(agent.id);
                        setIsAgentDropdownOpen(false);
                      }}
                      className={`w-full p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3.5 ${
                        isSelected 
                          ? 'border-primary bg-primary/10 shadow-xs ring-2 ring-primary/30' 
                          : 'border-border hover:bg-secondary/70 bg-card hover:border-border/80'
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl shrink-0 ${agent.bg} ${agent.color}`}>
                        <agent.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-sm font-bold text-foreground">{agent.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-secondary text-muted-foreground border border-border">
                              {agent.tag}
                            </span>
                            {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">{agent.desc}</p>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono mt-2 pt-2 border-t border-border/60">
                          <span>{agent.provider} ({agent.model})</span>
                          <span className="text-amber-500 font-semibold">{agent.latency}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="p-3.5 bg-secondary/30 border-t border-border flex justify-end">
                <button 
                  type="button"
                  onClick={() => setIsAgentDropdownOpen(false)}
                  className="px-4 py-1.5 rounded-lg border border-border bg-card text-foreground text-xs font-semibold hover:bg-secondary transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Slide-over History Drawer ── */}
      <AnimatePresence>
        {showHistory && (
          <>
            {/* Backdrop for mobile */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 sm:hidden"
            />

            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed sm:relative right-0 top-0 bottom-0 w-80 sm:w-88 bg-card border-l border-border z-40 flex flex-col h-full shadow-2xl sm:shadow-none"
            >
              {/* History Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">Query History</h3>
                </div>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* History Content */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {loadingHistory ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground space-y-2">
                    <Loader size="sm" />
                    <span className="text-xs">Fetching past conversations...</span>
                  </div>
                ) : historyItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground space-y-2">
                    <MessageSquare className="w-8 h-8 opacity-40 text-muted-foreground" />
                    <p className="text-xs font-semibold text-foreground">No queries recorded yet</p>
                    <p className="text-[10px]">Your asked questions and grounded responses will be stored here.</p>
                  </div>
                ) : (
                  historyItems.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => loadPastQuery(item)}
                      className="p-3 rounded-xl border border-border hover:border-primary/40 bg-secondary/30 hover:bg-secondary/70 transition-all cursor-pointer group text-left"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="text-xs font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                          {item.query}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span className="px-1.5 py-0.5 rounded bg-card border border-border uppercase font-mono text-[9px]">
                          {item.agent || 'general'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> {formatTimestamp(item.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* History Footer */}
              <div className="p-3 border-t border-border bg-secondary/20 flex justify-between items-center text-[11px] text-muted-foreground">
                <span>Click query to reload input</span>
                <button 
                  onClick={fetchChatHistory}
                  className="text-primary hover:underline font-semibold"
                >
                  Refresh
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Document Original Viewer Modal */}
      <AnimatePresence>
        {previewDoc && (
          <DocumentPreviewModal 
            docIdentifier={previewDoc} 
            onClose={() => setPreviewDoc(null)} 
          />
        )}
      </AnimatePresence>

    </div>
  );
}
