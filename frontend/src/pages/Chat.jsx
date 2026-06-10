import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/api';

export default function Chat({ queryInput, setQueryInput }) {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState([{
    role: 'ai',
    content: `Hello \${user?.name}! 👋 I'm your Enterprise AI Assistant. I can help you find information from company documents. What would you like to know?`,
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
        content: `⚠️ Unable to reach the backend (\${e.message}).`,
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
    <div className="chat-container">
      <div className="messages-area">
        {messages.map((m, i) => (
          <div key={i} className={`message \${m.role}`}>
            <div className={`avatar avatar-\${m.role}`}>
              {m.role === 'user' ? '👤' : '🤖'}
            </div>
            <div className={`bubble bubble-\${m.role}`}>
              {m.content}
              {m.role === 'ai' && m.agent && m.agent !== 'general' && (
                <div className="meta-row">
                  <div className={`agent-tag agent-\${m.agent}`}>{m.agent} Agent</div>
                  {m.confidence !== undefined && (
                    <div className="confidence-bar">
                      <div className="conf-label">Confidence</div>
                      <div className="conf-track">
                        <div 
                          className={`conf-fill \${m.confidence >= 0.7 ? 'conf-high' : m.confidence >= 0.45 ? 'conf-mid' : 'conf-low'}`} 
                          style={{ width: `\${Math.round(m.confidence * 100)}%` }}
                        ></div>
                      </div>
                      <div className="conf-pct">{Math.round(m.confidence * 100)}%</div>
                    </div>
                  )}
                </div>
              )}
              {m.hallucination && (
                <div className="hallucination-warning">
                  ⚠️ Potential hallucination detected. Verify claims against sources.
                </div>
              )}
              {m.citations && m.citations.length > 0 && (
                <div className="citations">
                  <div className="citations-header">📎 Sources</div>
                  {m.citations.slice(0, 3).map((c, idx) => (
                    <div key={idx} className="citation-item">
                      <div className="citation-source">📄 {c.source}</div>
                      <div className="citation-text">
                        {c.text?.substring(0, 180)}{c.text?.length > 180 ? '…' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {typing && (
          <div className="message ai">
            <div className="avatar avatar-ai">🤖</div>
            <div className="bubble bubble-ai">
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <div className="suggestion-chips">
          {['What is the remote work policy?', 'Summarize the NDA', 'How to claim expenses?'].map(q => (
            <div key={q} className="chip" onClick={() => { setQueryInput(q); }}>{q}</div>
          ))}
        </div>
        <div className="input-row">
          <textarea 
            className="query-input" 
            placeholder="Ask a question about enterprise documents..." 
            value={queryInput}
            onChange={e => setQueryInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows="1"
          />
          <button className="send-btn" onClick={sendQuery} disabled={!queryInput.trim() || typing}>
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
