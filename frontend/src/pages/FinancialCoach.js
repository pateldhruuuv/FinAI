import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
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
    <div className="md:pl-20 mt-16 px-6 md:px-8 pt-10 md:pt-14 pb-6 md:pb-8 min-h-screen bg-background text-on-background font-sans max-w-[1000px] mx-auto animate-fade-in flex flex-col">

      {/* Header */}
      <header className="mb-6 border-b border-outline-variant pb-6 shrink-0">
        <Link to="/premium-dashboard" className="inline-flex items-center gap-2 text-xs text-on-surface-variant hover:text-on-surface font-semibold mb-4 transition-colors">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Hub
        </Link>
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-3xl text-primary-container font-bold">forum</span>
          <h1 className="font-display-hero text-3xl font-bold tracking-tight text-on-surface">AI Financial Coach</h1>
        </div>
        <p className="text-sm text-on-surface-variant mt-1 m-2">Ask contextual planning questions to get real-time, profile-aware recommendations.</p>
      </header>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col glass-card border border-outline-variant rounded-2xl overflow-hidden min-h-[500px] h-[60vh]">

        {/* Messages Feed */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6 scrollbar-none flex flex-col">
          {messages.map((m, idx) => {
            const isCoach = m.sender === 'coach';
            return (
              <div
                key={idx}
                className={`flex gap-3 max-w-[85%] ${isCoach ? 'self-start' : 'self-end flex-row-reverse animate-fade-in'}`}
              >
                {isCoach ? (
                  <div className="w-8 h-8 rounded-full bg-primary-container/10 border border-primary-container/20 flex items-center justify-center text-primary-container flex-shrink-0 mt-1">
                    <span className="material-symbols-outlined text-base">forum</span>
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-surface-container border border-outline-variant/60 flex items-center justify-center text-on-surface-variant flex-shrink-0 mt-1">
                    <span className="material-symbols-outlined text-base">person</span>
                  </div>
                )}

                <div className={`p-4 rounded-2xl flex flex-col gap-1.5 relative ${isCoach
                    ? 'bg-surface-container/60 border border-outline-variant/50 rounded-tl-none text-on-surface'
                    : 'bg-primary text-on-primary rounded-tr-none shadow-md shadow-primary/10'
                  }`}>
                  <p className="text-sm leading-relaxed font-serif whitespace-pre-line">{m.text}</p>
                  <span className={`text-[9px] text-right font-sans block mt-1 ${isCoach ? 'text-on-surface-variant/60' : 'text-on-primary/60'}`}>
                    {m.time}
                  </span>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 max-w-[80%] self-start animate-pulse">
              <div className="w-8 h-8 rounded-full bg-primary-container/10 border border-primary-container/20 flex items-center justify-center text-primary-container flex-shrink-0 mt-1">
                <span className="material-symbols-outlined text-base">forum</span>
              </div>
              <div className="bg-surface-container/60 border border-outline-variant/50 p-4 rounded-2xl rounded-tl-none flex items-center gap-1.5 h-10 self-start">
                <span className="w-1.5 h-1.5 bg-on-surface-variant/60 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                <span className="w-1.5 h-1.5 bg-on-surface-variant/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-1.5 h-1.5 bg-on-surface-variant/60 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick suggestions chips */}
        <div className="p-4 border-t border-outline-variant/40 shrink-0 bg-surface/20">
          <div className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant/40 mb-2 font-sans">Ask the Coach</div>
          <div className="flex gap-2 flex-wrap">
            {suggestionChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip)}
                disabled={loading}
                className="px-3.5 py-1.5 border border-outline-variant rounded-full text-[11px] font-semibold text-on-surface-variant hover:border-primary hover:text-on-surface transition-all bg-surface-container/40 cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Input field */}
        <div className="flex p-4 border-t border-outline-variant bg-surface/40 gap-3 items-center shrink-0">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about your debt, savings, or investments..."
            disabled={loading}
            className="flex-1 bg-surface-container/60 border border-outline-variant rounded-full px-5 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="px-6 py-2.5 rounded-full bg-primary-container text-on-primary-container hover:bg-primary font-bold text-xs shadow-sm hover:scale-105 active:scale-95 disabled:opacity-40 disabled:scale-100 disabled:pointer-events-none transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm font-bold">send</span> Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinancialCoach;
