import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Bot, User, Sparkles, MessageCircle } from 'lucide-react';

const Chatbot = () => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Hello! I am your FinPilot AI assistant. How can I help you today? You can ask me about investments, saving tips, or insurance coverage, or click one of the quick queries below!',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    if (!textToSend.trim()) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const res = await axios.post('/chat', { message: textToSend });
      if (res.data?.status === 'success') {
        const aiMsg = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: res.data.reply,
          timestamp: new Date()
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (err) {
      console.error(err);
      const errorMsg = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: 'Sorry, I am having trouble connecting to the financial core right now. Make sure the backend has a valid Gemini API key configured.',
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendMessage(inputText);
  };

  const quickReplies = [
    'Can I invest?',
    'Should I save more?',
    'What insurance should I buy?'
  ];

  return (
    <div className="main-content" style={styles.mainContent}>
      <div style={styles.header}>
        <h1 style={styles.title}>Finance AI Assistant</h1>
        <p style={styles.subtitle}>Ask questions about your assets, liability margins, and risk protection portfolios.</p>
      </div>

      <div className="glass-card" style={styles.chatCard}>
        {/* Chat Header */}
        <div style={styles.chatHeader}>
          <div style={styles.botIconBadge}>
            <Bot size={20} style={{ color: '#6366f1' }} />
          </div>
          <div>
            <h3 style={styles.chatTitle}>FinPilot Copilot</h3>
            <span style={styles.chatStatus}>Gemini Model Active</span>
          </div>
        </div>

        {/* Message History */}
        <div style={styles.messageBox}>
          {messages.map((msg) => {
            const isAi = msg.sender === 'ai';
            return (
              <div
                key={msg.id}
                style={{
                  ...styles.messageRow,
                  justifyContent: isAi ? 'flex-start' : 'flex-end'
                }}
              >
                {isAi && (
                  <div style={styles.avatar('ai')}>
                    <Bot size={14} style={{ color: '#ffffff' }} />
                  </div>
                )}
                <div style={styles.messageBubble(isAi)}>
                  <p style={styles.messageText}>{msg.text}</p>
                  <span style={styles.messageTime}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {!isAi && (
                  <div style={styles.avatar('user')}>
                    <User size={14} style={{ color: '#ffffff' }} />
                  </div>
                )}
              </div>
            );
          })}
          {loading && (
            <div style={{ ...styles.messageRow, justifyContent: 'flex-start' }}>
              <div style={styles.avatar('ai')}>
                <Bot size={14} style={{ color: '#ffffff' }} />
              </div>
              <div style={styles.typingBubble}>
                <span className="dot" style={styles.dot1}></span>
                <span className="dot" style={styles.dot2}></span>
                <span className="dot" style={styles.dot3}></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Replies */}
        <div style={styles.quickRepliesContainer}>
          {quickReplies.map((reply) => (
            <button
              key={reply}
              style={styles.quickReplyBtn}
              onClick={() => handleSendMessage(reply)}
              disabled={loading}
            >
              <Sparkles size={12} />
              {reply}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} style={styles.inputForm}>
          <input
            type="text"
            className="form-input"
            placeholder="Ask a financial question..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            style={styles.chatInput}
            disabled={loading}
          />
          <button type="submit" className="btn btn-primary" style={styles.sendBtn} disabled={loading}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  mainContent: {
    height: 'calc(100vh - 64px)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  header: {
    marginBottom: '20px',
    flexShrink: 0
  },
  title: {
    fontSize: '32px',
    color: '#ffffff',
    fontFamily: 'Outfit, sans-serif'
  },
  subtitle: {
    fontSize: '15px',
    color: '#94a3b8'
  },
  chatCard: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: 0,
    overflow: 'hidden',
    height: '100%',
    marginBottom: '20px'
  },
  chatHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    background: 'rgba(255, 255, 255, 0.01)',
    flexShrink: 0
  },
  botIconBadge: {
    background: 'rgba(99, 102, 241, 0.1)',
    borderRadius: '10px',
    padding: '8px'
  },
  chatTitle: {
    fontSize: '16px',
    color: '#ffffff',
    fontFamily: 'Outfit, sans-serif',
    fontWeight: 600
  },
  chatStatus: {
    fontSize: '11px',
    color: '#10b981',
    fontWeight: 500
  },
  messageBox: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    background: 'rgba(0, 0, 0, 0.15)'
  },
  messageRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
    maxWidth: '80%',
    alignSelf: 'flex-start'
  },
  avatar: (sender) => ({
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: sender === 'ai' ? 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' : 'rgba(255, 255, 255, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  }),
  messageBubble: (isAi) => ({
    background: isAi ? 'rgba(255, 255, 255, 0.03)' : 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    border: isAi ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
    padding: '12px 16px',
    borderRadius: isAi ? '12px 12px 12px 0' : '12px 12px 0 12px',
    color: '#ffffff',
    boxShadow: isAi ? 'none' : '0 4px 15px rgba(99, 102, 241, 0.25)'
  }),
  messageText: {
    fontSize: '14px',
    lineHeight: '1.5',
    whiteSpace: 'pre-line'
  },
  messageTime: {
    fontSize: '10px',
    color: 'rgba(255, 255, 255, 0.4)',
    display: 'block',
    textAlign: 'right',
    marginTop: '4px'
  },
  typingBubble: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    padding: '12px 16px',
    borderRadius: '12px 12px 12px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    height: '40px'
  },
  dot1: { width: '6px', height: '6px', background: '#94a3b8', borderRadius: '50%', display: 'inline-block', animation: 'bounce 1.4s infinite ease-in-out' },
  dot2: { width: '6px', height: '6px', background: '#94a3b8', borderRadius: '50%', display: 'inline-block', animation: 'bounce 1.4s infinite ease-in-out', animationDelay: '0.2s' },
  dot3: { width: '6px', height: '6px', background: '#94a3b8', borderRadius: '50%', display: 'inline-block', animation: 'bounce 1.4s infinite ease-in-out', animationDelay: '0.4s' },
  quickRepliesContainer: {
    display: 'flex',
    gap: '10px',
    padding: '12px 24px',
    background: 'rgba(255, 255, 255, 0.01)',
    borderTop: '1px solid rgba(255, 255, 255, 0.04)',
    flexWrap: 'wrap',
    flexShrink: 0
  },
  quickReplyBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '20px',
    color: '#cbd5e1',
    padding: '6px 16px',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'Outfit, sans-serif'
  },
  inputForm: {
    display: 'flex',
    padding: '16px 24px',
    gap: '12px',
    background: 'rgba(255, 255, 255, 0.02)',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    flexShrink: 0
  },
  chatInput: {
    flex: 1,
    background: 'rgba(0, 0, 0, 0.2)'
  },
  sendBtn: {
    padding: '12px',
    borderRadius: '8px',
    flexShrink: 0
  }
};

// Add standard inline CSS styling for dot animation in javascript
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes bounce {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1.0); }
  }
`;
document.head.appendChild(styleSheet);

export default Chatbot;
