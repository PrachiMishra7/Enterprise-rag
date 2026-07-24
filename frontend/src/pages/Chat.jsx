import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/api';
import { Send, User, Bot, AlertTriangle, FileText, Cpu, ChevronDown, Users, Scale, Landmark, Monitor, Sparkles, Check, Zap, Server, X, ThumbsUp, ThumbsDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AGENTS = [
  { 
    id: 'auto', name: 'Auto-Detect Router', desc: 'Dynamically routes query to the best expert', 
    icon: Sparkles, color: 'text-blue-400', bg: 'bg-blue-500/10',
    provider: 'Enterprise Edge', model: 'Ensemble Routing', latency: '~1.2s', tag: 'Recommended'
  },
  { 
    id: 'hr', name: 'HR Expert', desc: 'Trained on company policies, benefits, and culture', 
    icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/10',
    provider: 'Azure OpenAI', model: 'GPT-4o', latency: '~800ms', tag: 'High Quality'
  },
  { 
    id: 'legal', name: 'Legal Counsel', desc: 'Specialized in contracts, compliance, and NDAs', 
    icon: Scale, color: 'text-purple-400', bg: 'bg-purple-500/10',
    provider: 'AWS Bedrock', model: 'Claude 3.5 Sonnet', latency: '~900ms', tag: 'High Accuracy'
  },
  { 
    id: 'finance', name: 'Finance Analyst', desc: 'Access to payroll, expenses, and budgets', 
    icon: Landmark, color: 'text-amber-400', bg: 'bg-amber-500/10',
    provider: 'Groq', model: 'Llama 3.1 70B', latency: '~300ms', tag: 'Ultra Fast'
  },
  { 
    id: 'it', name: 'IT Support', desc: 'Hardware troubleshooting and tech policies', 
    icon: Monitor, color: 'text-orange-400', bg: 'bg-orange-500/10',
    provider: 'Groq', model: 'Llama 3.1 8B', latency: '~200ms', tag: 'Fast'
  },
];

export default function Chat({ queryInput, setQueryInput }) {
  const { user, token } = useAuth();
  const [targetAgent, setTargetAgent] = useState('auto');
  const [messages, setMessages] = useState([{
    role: 'ai',
    content: `Hello ${user?.name}! 👋 I'm your Enterprise AI Assistant. I can help you find information from company documents. What would you like to know?`,
    agent: 'general',
    confidence: 0.9,
    hallucination: false,
    citations: []
  }]);
  const [typing, setTyping] = useState(false);
  const [isAgentDropdownOpen, setIsAgentDropdownOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typing]);

  const sendQuery = async () => {
    const query = queryInput.trim();
    if (!query || typing) return;

    const newMessages = [...messages, { role: 'user', content: query }];
    setMessages(newMessages);
    setQueryInput('');
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
    } catch (e) {
      setMessages([...newMessages, {
        role: 'ai',
        content: `⚠️ Unable to reach the backend (${e.message}).`,
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

  return (
    <div className="flex flex-col h-full bg-transparent mx-auto w-full max-w-4xl border-x border-white/[0.05] shadow-2xl relative z-10">
      <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-8 scroll-smooth relative z-10">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-4 max-w-full animate-in slide-in-from-bottom-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border shadow-lg ${
              m.role === 'user' ? 'bg-primary text-slate-900 dark:text-white border-primary shadow-primary/20' : 'glass-panel text-foreground border-slate-200 dark:border-white/10'
            }`}>
              {m.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>
            
            <div className={`flex flex-col max-w-[85%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'user' 
                  ? 'bg-gradient-to-r from-primary to-purple-600 text-slate-900 dark:text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] px-4 py-3 rounded-2xl rounded-tr-sm border border-slate-200 dark:border-white/10' 
                  : 'text-foreground pt-1.5'
              }`}>
                {m.content}
              </div>

              {m.role === 'ai' && m.agent && m.agent !== 'general' && (
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  <div className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-secondary text-muted-foreground border border-border tracking-wider">
                    {m.agent} Agent
                  </div>
                  {m.confidence !== undefined && (
                    <div className="flex items-center gap-2 bg-background px-2 py-1 rounded border border-border">
                      <span className="text-[10px] text-muted-foreground font-semibold">CONFIDENCE</span>
                      <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${m.confidence >= 0.7 ? 'bg-green-500' : m.confidence >= 0.45 ? 'bg-amber-500' : 'bg-red-500'}`} 
                          style={{ width: `${Math.round(m.confidence * 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] text-foreground font-bold">{Math.round(m.confidence * 100)}%</span>
                    </div>
                  )}
                </div>
              )}

              {m.hallucination && (
                <div className="flex items-center gap-2 text-xs font-medium text-amber-700 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-md px-3 py-2 mt-3 w-fit">
                  <AlertTriangle className="w-4 h-4" />
                  Potential hallucination detected. Verify claims against sources.
                </div>
              )}

              {m.citations && m.citations.length > 0 && (
                <div className="mt-4 w-full">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <FileText className="w-3 h-3" /> Sources
                  </div>
                  <div className="grid gap-2">
                    {m.citations.slice(0, 3).map((c, idx) => (
                      <div key={idx} className="text-xs text-muted-foreground p-3 bg-background rounded-md border border-border border-l-2 border-l-primary hover:bg-secondary/50 transition-colors cursor-default">
                        <div className="font-semibold text-primary mb-1 line-clamp-1">{c.source}</div>
                        <div className="line-clamp-2 leading-relaxed opacity-90">
                          "{c.text}"
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {m.role === 'ai' && m.query_id && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-white/10 w-full">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase mr-2">Was this helpful?</span>
                  <button 
                    onClick={() => handleFeedback(m.query_id, 1, i)}
                    className={`p-1.5 rounded-lg transition-colors ${m.feedback === 1 ? 'bg-emerald-500/20 text-emerald-500' : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-emerald-500'}`}
                    disabled={m.feedback !== undefined}
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleFeedback(m.query_id, -1, i)}
                    className={`p-1.5 rounded-lg transition-colors ${m.feedback === -1 ? 'bg-rose-500/20 text-rose-500' : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-rose-500'}`}
                    disabled={m.feedback !== undefined}
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {typing && (
          <div className="flex gap-4 animate-in slide-in-from-bottom-2">
            <div className="w-9 h-9 rounded-md flex items-center justify-center shrink-0 border bg-secondary text-foreground border-border">
              <Bot className="w-5 h-5" />
            </div>
            <div className="flex items-center pt-2">
              <div className="flex gap-1.5 px-2">
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      <div className="p-6 border-t border-white/[0.05] glass-panel rounded-t-3xl mx-4 mb-4 mt-auto shrink-0 relative z-50">
        <div className="flex flex-wrap gap-2 mb-4">
          {['What is the remote work policy?', 'Summarize the NDA', 'How to claim expenses?'].map(q => (
            <button 
              key={q} 
              className="px-4 py-2 glass-panel glass-panel-hover rounded-full text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-white transition-all shadow-lg"
              onClick={() => { setQueryInput(q); }}
            >
              {q}
            </button>
          ))}
        </div>
        
        <div className="relative mb-3 flex items-center z-50">
          <button 
            className="flex items-center justify-between w-[320px] px-4 py-3 glass-panel glass-panel-hover rounded-xl text-left transition-all group"
            onClick={() => setIsAgentDropdownOpen(!isAgentDropdownOpen)}
            disabled={typing}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border border-slate-200 dark:border-white/10 shadow-inner ${AGENTS.find(a => a.id === targetAgent)?.bg || 'bg-black/5 dark:bg-white/10'} ${AGENTS.find(a => a.id === targetAgent)?.color || 'text-slate-900 dark:text-white'}`}>
                {(() => { const Icon = AGENTS.find(a => a.id === targetAgent)?.icon || Sparkles; return <Icon className="w-5 h-5" /> })()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">{AGENTS.find(a => a.id === targetAgent)?.name || 'Auto-Detect Router'}</span>
                  <span className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-[9px] font-bold text-slate-800 dark:text-slate-500 dark:text-slate-300">{AGENTS.find(a => a.id === targetAgent)?.provider || 'Enterprise Edge'}</span>
                </div>
                <div className="text-[10px] text-slate-800 dark:text-slate-500 dark:text-slate-400 font-semibold mt-0.5">{AGENTS.find(a => a.id === targetAgent)?.desc || 'Dynamically routes query to the best expert'}</div>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 text-slate-700 dark:text-slate-400 transition-transform duration-300 ${isAgentDropdownOpen ? 'rotate-180 text-slate-900 dark:text-white' : 'group-hover:text-slate-900 dark:group-hover:text-slate-900 dark:text-white'}`} />
          </button>

          <AnimatePresence>
            {isAgentDropdownOpen && (
              <>
                {/* Backdrop overlay for focus */}
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                  onClick={() => setIsAgentDropdownOpen(false)}
                />
                
                <motion.div 
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="absolute bottom-full mb-4 left-0 w-[480px] bg-white dark:bg-[#0f1525] border border-slate-200 dark:border-white/10 rounded-2xl p-2 z-50 shadow-[0_20px_60px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex flex-col gap-1 overflow-hidden"
                >
                  <div className="px-4 py-3 mb-1 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <div className="text-[10px] font-black text-slate-800 dark:text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Server className="w-3.5 h-3.5" /> Execution Environment
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-[10px] font-bold text-slate-600 dark:text-slate-500 uppercase">Provider / Latency</div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setIsAgentDropdownOpen(false); }}
                        className="p-1 rounded-md text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                        title="Close"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto no-scrollbar pr-1 pb-1">
                    {AGENTS.map(agent => (
                      <div
                        key={agent.id}
                        className={`flex items-start gap-4 w-full p-3.5 rounded-xl text-left transition-all cursor-pointer relative overflow-hidden group ${targetAgent === agent.id ? 'bg-primary/5 dark:bg-primary/10 border border-primary/20 shadow-sm' : 'hover:bg-slate-50 dark:hover:bg-slate-100 dark:bg-white/5 border border-transparent'}`}
                        onClick={() => { setTargetAgent(agent.id); setIsAgentDropdownOpen(false); }}
                      >
                        {targetAgent === agent.id && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-xl shadow-[0_0_10px_rgba(139,92,246,0.3)] dark:shadow-[0_0_10px_rgba(139,92,246,0.8)]"></div>
                        )}
                        <div className={`w-10 h-10 rounded-lg flex shrink-0 items-center justify-center border border-slate-200 dark:border-white/10 ${agent.bg} ${agent.color}`}>
                          <agent.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-slate-900 dark:text-white">{agent.name}</span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest ${targetAgent === agent.id ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-foreground' : 'bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-500 dark:text-slate-300'}`}>
                                {agent.tag}
                              </span>
                            </div>
                            {targetAgent === agent.id && <Check className="w-4 h-4 text-primary shrink-0" />}
                          </div>
                          
                          <div className="text-xs text-slate-800 dark:text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-3 truncate">{agent.desc}</div>
                          
                          <div className="flex items-center justify-between gap-3 text-[10px] font-bold text-slate-800 dark:text-slate-500 uppercase tracking-widest bg-slate-50 dark:bg-black/20 p-2 rounded-lg border border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-1.5 truncate">
                              <Cpu className="w-3.5 h-3.5 text-slate-700 dark:text-slate-400 shrink-0" /> 
                              <span className="truncate">{agent.provider} ({agent.model})</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Zap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" /> {agent.latency}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <div className="flex gap-3 items-end relative">
          <textarea 
            className="flex-1 min-h-[56px] max-h-32 p-4 pr-14 glass-panel bg-white/50 dark:bg-black/20 text-slate-900 dark:text-white placeholder:text-slate-700 dark:text-slate-400 dark:placeholder:text-slate-800 dark:text-slate-500 rounded-2xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow shadow-xl" 
            placeholder="Ask a question about enterprise documents..." 
            value={queryInput}
            onChange={e => setQueryInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows="1"
          />
          <button 
            className="absolute right-3 bottom-3 w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-slate-900 dark:text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)]" 
            onClick={sendQuery} 
            disabled={!queryInput.trim() || typing}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
