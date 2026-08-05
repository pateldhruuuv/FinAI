import React, { useState, useRef, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const Chatbot = () => {
  const { token, user, t } = useContext(AuthContext);
  
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am your Finmate AI assistant. How can I help you today? You can ask me about investments, saving tips, or insurance coverage, or click one of the quick queries below!',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Streaming states
  const [streamingId, setStreamingId] = useState(null);
  const [streamingText, setStreamingText] = useState('');
  
  // Feedback states
  const [feedback, setFeedback] = useState({}); // { [msgId]: 'up' | 'down' }
  
  // Responsive sidebar states
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  
  // Inline rename states
  const [renamingId, setRenamingId] = useState(null);
  const [renameTitle, setRenameTitle] = useState('');
  
  // Three-dots dropdown menu state
  const [activeMenuId, setActiveMenuId] = useState(null);
  
  const messagesEndRef = useRef(null);
  const dropdownRef = useRef(null);

  // Responsive layout tracking
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch initial conversations list & restore selected chat
  useEffect(() => {
    const activeChatId = localStorage.getItem('finmate_active_chat_id');
    
    const loadInitialData = async () => {
      setConversationsLoading(true);
      try {
        await fetchConversations(1, false, searchQuery);
        if (activeChatId) {
          await loadChat(activeChatId);
        } else {
          startNewChat();
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      } finally {
        setConversationsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Handle click outside three-dots dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search logic
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchConversations(1, false, searchQuery);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, streamingText]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch conversations list from server
  const fetchConversations = async (pageToLoad = 1, append = false, search = '') => {
    try {
      const res = await axios.get('/api/chat/history', {
        params: { page: pageToLoad, limit: 40, search }
      });
      if (res.data?.status === 'success') {
        setConversations(prev => append ? [...prev, ...res.data.data] : res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch chat history:', err);
    }
  };

  // Load specific chat messages
  const loadChat = async (chatId) => {
    if (!chatId) return;
    setHistoryLoading(true);
    try {
      const res = await axios.get(`/api/chat/${chatId}`);
      if (res.data?.status === 'success') {
        setMessages(res.data.messages);
        setCurrentChatId(chatId);
        localStorage.setItem('finmate_active_chat_id', chatId);
      }
    } catch (err) {
      console.error('Failed to load chat:', err);
      localStorage.removeItem('finmate_active_chat_id');
      startNewChat();
    } finally {
      setHistoryLoading(false);
      if (isMobile) {
        setSidebarOpen(false);
      }
    }
  };

  // Initialize brand new chat context
  const startNewChat = () => {
    setCurrentChatId(null);
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Hello! I am your Finmate AI assistant. How can I help you today? You can ask me about investments, saving tips, or insurance coverage, or click one of the quick queries below!',
        timestamp: new Date()
      }
    ]);
    localStorage.removeItem('finmate_active_chat_id');
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Word-by-word text streaming simulation
  const simulateStreaming = (aiMsg) => {
    setLoading(false);
    setStreamingId(aiMsg.id);
    setStreamingText('');
    
    // Add empty message to message stack
    const tempMsg = { ...aiMsg, content: '' };
    setMessages(prev => [...prev, tempMsg]);
    
    const fullText = aiMsg.content || '';
    const words = fullText.split(' ');
    let currentWordIndex = 0;
    let currentText = '';
    
    const interval = setInterval(() => {
      if (currentWordIndex < words.length) {
        currentText += (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex];
        setStreamingText(currentText);
        setMessages(prev => prev.map(m => m.id === aiMsg.id ? { ...m, content: currentText } : m));
        currentWordIndex++;
      } else {
        clearInterval(interval);
        setStreamingId(null);
        setStreamingText('');
        // Enforce exact match at end
        setMessages(prev => prev.map(m => m.id === aiMsg.id ? aiMsg : m));
      }
    }, 30);
  };

  // Handle message sending
  const handleSendMessage = async (textToSend) => {
    if (!textToSend.trim() || loading || streamingId) return;

    const tempUserMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, tempUserMsg]);
    setInputText('');
    setLoading(true);

    try {
      if (currentChatId) {
        // Send to existing chat
        const res = await axios.post(`/api/chat/${currentChatId}/message`, { message: textToSend });
        if (res.data?.status === 'success') {
          const aiMsg = res.data.reply;
          simulateStreaming(aiMsg);
          fetchConversations(1, false, searchQuery);
        }
      } else {
        // Create new chat
        const res = await axios.post('/api/chat', { message: textToSend });
        if (res.data?.status === 'success') {
          const { conversation, userMessage, aiMessage } = res.data;
          
          setCurrentChatId(conversation.id);
          localStorage.setItem('finmate_active_chat_id', conversation.id);
          
          if (userMessage && aiMessage) {
            setMessages([userMessage]);
            simulateStreaming(aiMessage);
          }
          fetchConversations(1, false, searchQuery);
        }
      }
    } catch (err) {
      console.error(err);
      const errorMsg = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I am having trouble connecting to the financial core right now. Make sure the backend has a valid Gemini API key configured.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendMessage(inputText);
  };

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!');
  };

  const handleFeedback = (msgId, type) => {
    setFeedback(prev => ({ ...prev, [msgId]: type }));
    showToast(type === 'up' ? 'Feedback saved: Helpful' : 'Feedback saved: Not Helpful');
  };

  const handleRegenerate = () => {
    const userMsgs = messages.filter(m => m.role === 'user');
    if (userMsgs.length > 0) {
      const lastUserMsg = userMsgs[userMsgs.length - 1];
      handleSendMessage(lastUserMsg.content);
    }
  };

  const showToast = (msg) => {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2.5 bg-surface-container border border-outline-variant/65 text-on-surface rounded-full text-xs font-semibold shadow-xl transition-all duration-300 z-[9999] opacity-0 translate-y-2';
    toast.innerText = msg;
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      toast.classList.remove('opacity-0', 'translate-y-2');
    }, 10);
    
    // Animate out
    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  };

  const handleRename = async (chatId, newTitle) => {
    if (!newTitle.trim()) {
      setRenamingId(null);
      return;
    }
    try {
      const res = await axios.put(`/api/chat/${chatId}`, { title: newTitle });
      if (res.data?.status === 'success') {
        setConversations(prev => prev.map(c => c.id === chatId ? { ...c, title: newTitle } : c));
      }
    } catch (err) {
      console.error('Failed to rename chat:', err);
    } finally {
      setRenamingId(null);
    }
  };

  const startRename = (chatId, currentTitle, e) => {
    e.stopPropagation();
    setRenamingId(chatId);
    setRenameTitle(currentTitle);
    setActiveMenuId(null);
  };

  const handleDelete = async (chatId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this conversation?')) {
      setActiveMenuId(null);
      return;
    }
    try {
      const res = await axios.delete(`/api/chat/${chatId}`);
      if (res.data?.status === 'success') {
        setConversations(prev => prev.filter(c => c.id !== chatId));
        if (currentChatId === chatId) {
          startNewChat();
        }
      }
    } catch (err) {
      console.error('Failed to delete chat:', err);
    } finally {
      setActiveMenuId(null);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to delete ALL conversations? This cannot be undone.')) return;
    try {
      const res = await axios.delete('/api/chat/history');
      if (res.data?.status === 'success') {
        setConversations([]);
        startNewChat();
      }
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  const toggleMenu = (chatId, e) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === chatId ? null : chatId);
  };

  const groupConversations = (list) => {
    const groups = {
      today: [],
      yesterday: [],
      previous7Days: [],
      older: []
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    list.forEach(conv => {
      const convDate = new Date(conv.updatedAt || conv.createdAt);
      const itemDate = new Date(convDate.getFullYear(), convDate.getMonth(), convDate.getDate());

      if (itemDate.getTime() === today.getTime()) {
        groups.today.push(conv);
      } else if (itemDate.getTime() === yesterday.getTime()) {
        groups.yesterday.push(conv);
      } else if (itemDate.getTime() >= sevenDaysAgo.getTime()) {
        groups.previous7Days.push(conv);
      } else {
        groups.older.push(conv);
      }
    });

    return groups;
  };

  const renderMessageContent = (content) => {
    if (!content) return null;

    // Split by block code fences first
    const codeBlocks = content.split(/(```[\s\S]*?```)/g);

    return codeBlocks.map((block, blockIndex) => {
      if (block.startsWith('```') && block.endsWith('```')) {
        const match = block.match(/```(\w*)\n([\s\S]*?)```/);
        const language = match ? match[1] : '';
        const code = match ? match[2] : block.slice(3, -3);

        return (
          <div key={blockIndex} className="my-4 rounded-xl overflow-hidden border border-outline-variant/40 bg-surface-container font-sans text-xs">
            {language && <div className="bg-surface-container-high px-4 py-2 text-on-surface-variant font-bold border-b border-outline-variant/30 uppercase">{language}</div>}
            <pre className="p-4 overflow-x-auto text-[11px] leading-relaxed text-on-surface">
              <code>{code.trim()}</code>
            </pre>
          </div>
        );
      }

      // Parse lines for markdown elements: headers, bullet points, table rows
      const lines = block.split('\n');
      let tableRows = [];
      let inTable = false;

      const renderedLines = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // 1. Markdown Tables
        if (line.startsWith('|')) {
          inTable = true;
          const cells = line.split('|').map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
          if (cells.some(c => c.includes('---'))) {
            continue;
          }
          tableRows.push(cells);
          
          const nextLine = lines[i+1]?.trim() || '';
          if (!nextLine.startsWith('|')) {
            inTable = false;
            const rows = [...tableRows];
            tableRows = [];
            renderedLines.push(
              <div key={`table-${i}`} className="my-4 overflow-x-auto rounded-xl border border-outline-variant/40">
                <table className="w-full text-left border-collapse text-xs font-sans">
                  <thead>
                    <tr className="bg-surface-container-high border-b border-outline-variant/40">
                      {rows[0].map((cell, idx) => (
                        <th key={idx} className="py-2.5 px-4 font-bold text-on-surface-variant">{cell}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(1).map((row, rowIdx) => (
                      <tr key={rowIdx} className="border-b border-outline-variant/20 hover:bg-surface-container/30">
                        {row.map((cell, cellIdx) => (
                          <td key={cellIdx} className="py-2.5 px-4 text-on-surface">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
          continue;
        }

        // 2. Markdown Headers
        if (line.startsWith('# ')) {
          renderedLines.push(
            <h1 key={i} className="text-base font-bold text-primary font-serif mt-4 mb-2 border-b border-outline-variant/20 pb-1">
              {parseInlineMarkdown(line.slice(2))}
            </h1>
          );
          continue;
        }
        if (line.startsWith('## ')) {
          renderedLines.push(
            <h2 key={i} className="text-sm font-bold text-on-surface font-serif mt-3 mb-1.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs text-primary">arrow_right</span>
              {parseInlineMarkdown(line.slice(3))}
            </h2>
          );
          continue;
        }

        // 3. Bullet Lists
        if (line.startsWith('- ') || line.startsWith('* ')) {
          renderedLines.push(
            <li key={i} className="ml-4 list-disc text-xs text-on-surface-variant font-serif leading-relaxed my-1">
              {parseInlineMarkdown(line.slice(2))}
            </li>
          );
          continue;
        }

        // 4. Standard Paragraph
        if (line !== '') {
          renderedLines.push(
            <p key={i} className="my-2 text-xs font-serif leading-relaxed text-on-surface">
              {parseInlineMarkdown(line)}
            </p>
          );
        }
      }

      return <div key={blockIndex}>{renderedLines}</div>;
    });
  };

  const parseInlineMarkdown = (text) => {
    const inlineParts = text.split(/(`[^`]+`)/g);
    return inlineParts.map((subPart, subIndex) => {
      if (subPart.startsWith('`') && subPart.endsWith('`')) {
        return (
          <code key={subIndex} className="px-1.5 py-0.5 rounded bg-surface-container border border-outline-variant/40 text-[10px] text-primary font-sans">
            {subPart.slice(1, -1)}
          </code>
        );
      }

      const boldParts = subPart.split(/(\*\*[^*]+\*\*)/g);
      return boldParts.map((boldPart, boldIndex) => {
        if (boldPart.startsWith('**') && boldPart.endsWith('**')) {
          return <strong key={boldIndex} className="font-bold text-on-surface">{boldPart.slice(2, -2)}</strong>;
        }
        return boldPart;
      });
    });
  };

  const quickReplies = [
    'Can I invest?',
    'Should I save more?',
    'What insurance should I buy?'
  ];

  const groupedChats = groupConversations(conversations);
  const showSidebar = !isMobile || sidebarOpen;

  // Compute active follow-up suggestions from the last message metadata
  const lastMessage = messages[messages.length - 1];
  const lastMessageIsAi = lastMessage && (lastMessage.role === 'assistant' || lastMessage.sender === 'ai');
  const activeSuggestions = lastMessageIsAi && lastMessage.metadata?.suggestions 
    ? lastMessage.metadata.suggestions 
    : (messages.length <= 1 ? quickReplies : []);

  return (
    <div className="md:pl-20 mt-16 px-4 md:px-6 py-4 bg-background text-on-background flex gap-6 overflow-hidden relative font-sans h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] min-h-0">
      
      {/* Mobile Sidebar backdrop */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-45"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Component */}
      {showSidebar && (
        <div className={`flex flex-col glass-card rounded-2xl p-4 flex-shrink-0 z-50 transition-all duration-300 min-w-0 min-h-0 ${
          isMobile 
            ? 'fixed left-0 top-0 bottom-0 w-72 shadow-2xl h-full rounded-none border-y-0 border-l-0' 
            : 'w-72 h-full'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface font-serif">Chats History</h3>
            {isMobile && (
              <button 
                onClick={() => setSidebarOpen(false)} 
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-container-high text-on-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            )}
          </div>

          <button 
            onClick={startNewChat} 
            className="w-full py-3 mb-4 rounded-full bg-primary-container hover:bg-primary text-on-primary-container font-semibold transition-all flex items-center justify-center gap-2 text-sm cursor-pointer shadow-sm shadow-primary-container/10"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            New Consultation
          </button>

          {/* Search */}
          <div className="relative flex items-center mb-4">
            <span className="material-symbols-outlined text-on-surface-variant/40 absolute left-3 text-lg">search</span>
            <input 
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container/60 border border-outline-variant rounded-xl pl-10 pr-8 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary-container transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 text-on-surface-variant/60 hover:text-on-surface">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>

          {/* Conversations list */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {conversationsLoading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="flex gap-3 items-center p-2 animate-pulse">
                  <div className="w-8 h-8 rounded-lg bg-surface-container-highest" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-surface-container-highest rounded w-3/4" />
                    <div className="h-2.5 bg-surface-container-highest rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : conversations.length === 0 ? (
              <div className="text-center text-xs text-on-surface-variant/50 font-serif py-12">
                No past consultations found.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Today */}
                {groupedChats.today.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant/40 mb-2 pl-2 font-sans">Today</div>
                    <div className="space-y-1">{groupedChats.today.map(conv => renderSidebarItem(conv))}</div>
                  </div>
                )}

                {/* Yesterday */}
                {groupedChats.yesterday.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant/40 mb-2 pl-2 font-sans">Yesterday</div>
                    <div className="space-y-1">{groupedChats.yesterday.map(conv => renderSidebarItem(conv))}</div>
                  </div>
                )}

                {/* Previous 7 Days */}
                {groupedChats.previous7Days.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant/40 mb-2 pl-2 font-sans">Previous 7 Days</div>
                    <div className="space-y-1">{groupedChats.previous7Days.map(conv => renderSidebarItem(conv))}</div>
                  </div>
                )}

                {/* Older */}
                {groupedChats.older.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant/40 mb-2 pl-2 font-sans">Older</div>
                    <div className="space-y-1">{groupedChats.older.map(conv => renderSidebarItem(conv))}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {conversations.length > 0 && (
            <button 
              onClick={handleClearAll} 
              className="w-full py-2.5 mt-2 border border-outline-variant/60 hover:bg-error-container/10 hover:text-error text-on-surface-variant rounded-xl flex items-center justify-center gap-2 text-xs transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
              Clear All Chats
            </button>
          )}
        </div>
      )}

      {/* Chat Area Component */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-h-0">
        <div className="flex-1 flex flex-col glass-card border border-outline-variant rounded-2xl overflow-hidden h-full min-h-0">
          
          {/* Chat Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface/30">
            <div className="flex items-center gap-3">
              {isMobile && (
                <button 
                  onClick={() => setSidebarOpen(true)} 
                  className="w-10 h-10 rounded-xl hover:bg-surface-container-high text-on-surface flex items-center justify-center cursor-pointer"
                >
                  <span className="material-symbols-outlined">menu</span>
                </button>
              )}
              <div className="bg-primary-container/10 border border-primary-container/20 rounded-xl p-2.5 text-primary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">psychology</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface font-serif max-w-[240px] md:max-w-[400px] truncate leading-tight flex items-center gap-2">
                  {currentChatId 
                    ? (conversations.find(c => c.id === currentChatId)?.title || 'Finmate Advisor') 
                    : 'New Consultation'}
                  {user?.isPremium && (
                    <span className="text-[9px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/35 font-bold uppercase tracking-wider font-sans">
                      Premium
                    </span>
                  )}
                </h3>
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Gemini LLM Engine Online
                </span>
              </div>
            </div>
          </div>

          {/* Message Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-surface-container-lowest/10 flex flex-col min-h-0">
            {historyLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className={`flex gap-3 max-w-[80%] ${i % 2 === 0 ? 'self-start' : 'self-end flex-row-reverse'} animate-pulse`}>
                  <div className="w-8 h-8 rounded-full bg-surface-container" />
                  <div className="space-y-2 bg-surface-container/60 border border-outline-variant/40 p-4 rounded-2xl w-[260px]">
                    <div className="h-3 bg-surface-container-highest rounded w-3/4" />
                    <div className="h-2.5 bg-surface-container-highest rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : messages.length <= 1 && !currentChatId ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 self-center">
                <div className="w-16 h-16 rounded-2xl bg-primary-container/10 border border-primary-container/20 flex items-center justify-center text-primary-container mb-4">
                  <span className="material-symbols-outlined text-3xl font-bold">forum</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface font-serif mb-2">Finance AI Assistant</h3>
                <p className="text-sm text-on-surface-variant max-w-[360px] leading-relaxed font-serif">
                  Ask me questions regarding asset valuations, mutual funds, insurance caps, or budget forecasts, or click a helper prompt below.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isAi = msg.role === 'assistant' || msg.sender === 'ai';
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 max-w-[85%] ${isAi ? 'self-start' : 'self-end flex-row-reverse animate-fade-in'}`}
                  >
                    {isAi ? (
                      <div className="w-8 h-8 rounded-full bg-primary-container/10 border border-primary-container/20 flex items-center justify-center text-primary-container flex-shrink-0 mt-1">
                        <span className="material-symbols-outlined text-base">psychology</span>
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-surface-container border border-outline-variant/60 flex items-center justify-center text-on-surface-variant flex-shrink-0 mt-1">
                        <span className="material-symbols-outlined text-base">person</span>
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-1.5 max-w-full">
                      <div className={`p-4 rounded-2xl flex flex-col gap-2 relative ${
                        isAi 
                          ? 'bg-surface-container/60 border border-outline-variant/50 rounded-tl-none text-on-surface' 
                          : 'bg-primary text-on-primary rounded-tr-none shadow-md shadow-primary/10'
                      }`}>
                        <div className="text-sm leading-relaxed font-serif font-medium break-words">
                          {renderMessageContent(msg.content || msg.message)}
                        </div>
                        <span className={`text-[9px] text-right font-sans block mt-1 ${isAi ? 'text-on-surface-variant/60' : 'text-on-primary/60'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Toolbars for assistant messages */}
                      {isAi && msg.id !== 'welcome' && (
                        <div className="flex items-center gap-2 mt-0.5 pl-1 text-on-surface-variant/40">
                          <button 
                            onClick={() => handleCopyText(msg.content)} 
                            className="hover:text-primary transition-colors flex items-center p-1 rounded hover:bg-surface-container-high"
                            title="Copy Response"
                          >
                            <span className="material-symbols-outlined text-xs">content_copy</span>
                          </button>
                          <button 
                            onClick={() => handleFeedback(msg.id, 'up')} 
                            className={`transition-colors flex items-center p-1 rounded hover:bg-surface-container-high ${feedback[msg.id] === 'up' ? 'text-emerald-400' : 'hover:text-emerald-400'}`}
                            title="Helpful"
                          >
                            <span className="material-symbols-outlined text-xs">thumb_up</span>
                          </button>
                          <button 
                            onClick={() => handleFeedback(msg.id, 'down')} 
                            className={`transition-colors flex items-center p-1 rounded hover:bg-surface-container-high ${feedback[msg.id] === 'down' ? 'text-rose-400' : 'hover:text-rose-400'}`}
                            title="Not Helpful"
                          >
                            <span className="material-symbols-outlined text-xs">thumb_down</span>
                          </button>
                          {!loading && !streamingId && (
                            <button 
                              onClick={handleRegenerate} 
                              className="hover:text-primary transition-colors flex items-center p-1 rounded hover:bg-surface-container-high"
                              title="Regenerate"
                            >
                              <span className="material-symbols-outlined text-xs">refresh</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {loading && (
              <div className="flex gap-3 max-w-[80%] self-start animate-pulse">
                <div className="w-8 h-8 rounded-full bg-primary-container/10 border border-primary-container/20 flex items-center justify-center text-primary-container flex-shrink-0 mt-1">
                  <span className="material-symbols-outlined text-base">psychology</span>
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

          {/* Dynamic Follow-up Suggestions / Quick Replies */}
          {activeSuggestions.length > 0 && (
            <div className="flex gap-2 p-4 border-t border-outline-variant/40 flex-wrap flex-shrink-0 bg-surface/20">
              {activeSuggestions.map((reply) => (
                <button
                  key={reply}
                  onClick={() => handleSendMessage(reply)}
                  disabled={loading || !!streamingId}
                  className="px-4 py-2 border border-outline-variant rounded-full text-xs font-semibold text-on-surface-variant hover:border-primary hover:text-on-surface transition-all flex items-center gap-1.5 bg-surface-container/40 cursor-pointer disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-[10px] text-primary">auto_awesome</span>
                  {reply}
                </button>
              ))}
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex p-4 border-t border-outline-variant bg-surface/40 gap-3 items-center flex-shrink-0">
            <input
              type="text"
              placeholder="Ask a financial question..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={loading || !!streamingId}
              className="flex-1 bg-surface-container/60 border border-outline-variant rounded-full px-5 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all"
            />
            <button 
              type="submit" 
              disabled={loading || !!streamingId || !inputText.trim()}
              className="p-3 rounded-full bg-primary-container text-on-primary-container hover:bg-primary shadow-sm hover:scale-105 active:scale-95 disabled:opacity-40 disabled:scale-100 disabled:pointer-events-none transition-all flex items-center justify-center cursor-pointer"
            >
              <span className="material-symbols-outlined font-bold text-lg">send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  // Render sidebar list item
  function renderSidebarItem(conv) {
    const isActive = currentChatId === conv.id;
    const isRenaming = renamingId === conv.id;
    const isMenuOpen = activeMenuId === conv.id;

    return (
      <div 
        key={conv.id} 
        onClick={() => !isRenaming && loadChat(conv.id)}
        className={`flex items-center justify-between p-2.5 rounded-xl transition-all select-none cursor-pointer group ${
          isActive 
            ? 'bg-surface-container-high border border-outline-variant/60 text-on-surface' 
            : 'text-on-surface-variant/80 hover:bg-surface-container/40 hover:text-on-surface'
        }`}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <span className={`material-symbols-outlined text-lg ${isActive ? 'text-primary' : 'text-on-surface-variant/60'}`}>
            chat_bubble
          </span>
          
          <div className="flex-1 min-w-0 flex flex-col text-left">
            {isRenaming ? (
              <input 
                value={renameTitle}
                onChange={(e) => setRenameTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename(conv.id, renameTitle);
                  if (e.key === 'Escape') setRenamingId(null);
                }}
                onBlur={() => handleRename(conv.id, renameTitle)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
                className="w-full bg-surface border border-outline-variant rounded-md px-2 py-1 text-xs text-on-surface focus:outline-none focus:border-primary-container"
              />
            ) : (
              <>
                <span className="text-xs font-bold font-serif truncate text-on-surface leading-normal">{conv.title}</span>
                <span className="text-[10px] text-on-surface-variant/60 truncate leading-normal mt-0.5">{conv.lastMessagePreview || 'No messages'}</span>
              </>
            )}
          </div>
        </div>

        {!isRenaming && (
          <div className="relative flex-shrink-0">
            <button 
              onClick={(e) => toggleMenu(conv.id, e)} 
              className="p-1 rounded hover:bg-surface-container-highest text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-sm font-bold">more_vert</span>
            </button>

            {isMenuOpen && (
              <div 
                ref={dropdownRef} 
                className="absolute right-0 mt-1 w-28 bg-surface-container border border-outline-variant rounded-xl shadow-xl z-50 p-1 flex flex-col font-sans"
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  onClick={(e) => startRename(conv.id, conv.title, e)} 
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs text-on-surface hover:bg-surface-container-high transition-colors w-full cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                  Rename
                </button>
                <button 
                  onClick={(e) => handleDelete(conv.id, e)} 
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs text-error hover:bg-error-container/10 transition-colors w-full cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
};

export default Chatbot;
