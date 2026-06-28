import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { MessageSquare, ArrowLeft, Send, Sparkles, User, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const FinancialCoach = () => {
  const [messages, setMessages] = useState([
    {
      sender: 'coach',
      text: "Hello! I am your AI Financial Coach. I have loaded your digital twin profile, transaction logs, active goal budgets, and outstanding liabilities.\n\nAsk me anything about your money, or select one of the core advisory questions below to analyze your options!",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestionChips = [
    "Can I afford Goa trip?",
    "How can I save more?",
    "Should I invest now?",
    "Should I buy insurance?",
    "Should I close my loan?",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (messageText) => {
    const textToSend = messageText || input;
    if (!textToSend.trim()) return;

    // Add user message
    const userMsg = {
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post('/financial-coach', { question: textToSend });
      const coachMsg = {
        sender: 'coach',
        text: res.data.reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, coachMsg]);
      setLoading(false);
    } catch (err) {
      console.error(err);
      const errMsg = {
        sender: 'coach',
        text: "I'm sorry, I encountered an error communicating with the financial twin models. Please try again.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        error: true,
      };
      setMessages((prev) => [...prev, errMsg]);
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <Link to="/premium-dashboard" style={styles.backLink}>
          <ArrowLeft size={16} />
          Back to Hub
        </Link>
        <div style={styles.titleRow}>
          <MessageSquare size={28} color="#a855f7" />
          <h1 style={styles.title}>AI Financial Coach</h1>
        </div>
        <p style={styles.subtitle}>Ask contextual planning questions to get real-time, profile-aware recommendations.</p>
      </header>

      <div style={styles.chatWrapper}>
        <div style={styles.chatBox}>
          {/* Messages Feed */}
          <div style={styles.messagesFeed}>
            {messages.map((m, idx) => (
              <div 
                key={idx} 
                style={{
                  ...styles.messageRow,
                  justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                {m.sender === 'coach' && (
                  <div style={styles.coachAvatar}>
                    <Sparkles size={16} color="#ffffff" />
                  </div>
                )}
                
                <div style={{
                  ...styles.bubble,
                  backgroundColor: m.sender === 'user' ? '#a855f7' : 'rgba(255, 255, 255, 0.03)',
                  border: m.sender === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
                  color: m.sender === 'user' ? '#ffffff' : '#cbd5e1',
                  borderRadius: m.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px'
                }}>
                  <div style={styles.bubbleText}>{m.text}</div>
                  <div style={{
                    ...styles.bubbleTime,
                    color: m.sender === 'user' ? 'rgba(255, 255, 255, 0.7)' : '#64748b'
                  }}>{m.time}</div>
                </div>

                {m.sender === 'user' && (
                  <div style={styles.userAvatar}>
                    <User size={16} color="#ffffff" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={styles.messageRow}>
                <div style={styles.coachAvatar}>
                  <Sparkles size={16} color="#ffffff" />
                </div>
                <div style={styles.typingIndicator}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={scrollToBottom} />
          </div>

          {/* Quick suggestions chips */}
          <div style={styles.suggestionsWrapper}>
            <div style={styles.suggestionsLabel}>ASK THE COACH:</div>
            <div style={styles.chipsContainer}>
              {suggestionChips.map((chip, idx) => (
                <button 
                  key={idx} 
                  onClick={() => handleSend(chip)} 
                  disabled={loading}
                  style={styles.chipBtn}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Input field */}
          <div style={styles.inputArea}>
            <input 
              type="text" 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about your debt, savings, or investments..." 
              disabled={loading}
              style={styles.chatInput}
            />
            <button 
              onClick={() => handleSend()} 
              disabled={loading || !input.trim()}
              style={styles.sendBtn}
            >
              <Send size={16} />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    marginTop: '64px',
    backgroundColor: '#030712',
    color: '#f8fafc',
    fontFamily: 'Outfit, sans-serif',
    padding: '40px 24px',
  },
  header: {
    maxWidth: '900px',
    margin: '0 auto 24px auto',
  },
  backLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#94a3b8',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: 500,
    marginBottom: '16px',
    width: 'fit-content',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 800,
    color: '#ffffff',
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: '14px',
  },
  chatWrapper: {
    maxWidth: '900px',
    margin: '0 auto',
    height: '600px',
  },
  chatBox: {
    height: '100%',
    background: 'rgba(17, 24, 39, 0.45)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '24px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.25)',
    overflow: 'hidden',
  },
  messagesFeed: {
    flexGrow: 1,
    overflowY: 'auto',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  messageRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-end',
    maxWidth: '80%',
  },
  coachAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  userAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.1)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  bubble: {
    padding: '12px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  },
  bubbleText: {
    fontSize: '14px',
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
  },
  bubbleTime: {
    fontSize: '10px',
    alignSelf: 'flex-end',
  },
  typingIndicator: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    padding: '14px 20px',
    borderRadius: '18px 18px 18px 4px',
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
  },
  suggestionsWrapper: {
    padding: '16px 24px',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    background: 'rgba(0, 0, 0, 0.1)',
  },
  suggestionsLabel: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#94a3b8',
    letterSpacing: '0.05em',
    marginBottom: '10px',
  },
  chipsContainer: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  chipBtn: {
    background: 'rgba(168, 85, 247, 0.08)',
    border: '1px solid rgba(168, 85, 247, 0.25)',
    color: '#d8b4fe',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  inputArea: {
    padding: '16px 24px',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    background: 'rgba(15, 23, 42, 0.4)',
    display: 'flex',
    gap: '12px',
  },
  chatInput: {
    flexGrow: 1,
    padding: '12px 18px',
    borderRadius: '12px',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    fontSize: '14px',
    fontFamily: 'Outfit, sans-serif',
    outline: 'none',
  },
  sendBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    padding: '0 20px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
};

export default FinancialCoach;
