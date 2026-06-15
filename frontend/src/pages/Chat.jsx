import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/api';
import { Send, User, Bot, AlertTriangle, FileText } from 'lucide-react';

export default function Chat({ queryInput, setQueryInput }) {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState([{
    role: 'ai',
    content: `Hello ${user?.name}! 👋 I'm your Enterprise AI Assistant. I can help you find information from company documents. What would you like to know?`,
    agent: 'general',
    confidence: 0.9,
    hallucination: false,
    citations: []
  }]);
  const [typing, setTyping] = useState(false);
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
      const data = await apiCall('POST', '/query', { query }, false, token);
      setMessages([...newMessages, {
        role: 'ai',
        content: data.answer,
        agent: data.agent,
        confidence: data.confidence_score,
        hallucination: data.hallucination_detected,
        citations: data.citations || []
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

  return (
    <div className="flex flex-col h-full bg-card mx-auto w-full max-w-4xl border-x border-border shadow-sm">
      <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-8 scroll-smooth">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-4 max-w-full animate-in slide-in-from-bottom-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 border ${
              m.role === 'user' ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-foreground border-border'
            }`}>
              {m.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>
            
            <div className={`flex flex-col max-w-[85%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'user' 
                  ? 'bg-secondary text-foreground px-4 py-3 rounded-lg border border-border' 
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

      <div className="p-6 border-t border-border bg-card">
        <div className="flex flex-wrap gap-2 mb-4">
          {['What is the remote work policy?', 'Summarize the NDA', 'How to claim expenses?'].map(q => (
            <button 
              key={q} 
              className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 border border-border rounded-full text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => { setQueryInput(q); }}
            >
              {q}
            </button>
          ))}
        </div>
        <div className="flex gap-3 items-end relative">
          <textarea 
            className="flex-1 min-h-[52px] max-h-32 p-3.5 pr-12 bg-background border border-border rounded-lg text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow shadow-sm" 
            placeholder="Ask a question about enterprise documents..." 
            value={queryInput}
            onChange={e => setQueryInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows="1"
          />
          <button 
            className="absolute right-3 bottom-2 w-9 h-9 bg-primary hover:bg-primary/90 text-primary-foreground border-none rounded-md flex items-center justify-center cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm" 
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
