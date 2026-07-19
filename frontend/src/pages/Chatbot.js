import React, { useState, useRef, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { 
  Send, Bot, User, Sparkles, MessageCircle, Plus, Trash2, 
  Edit2, MoreVertical, Search, Menu, X, Check 
} from 'lucide-react';

const Chatbot = () => {
  const { token, user } = useContext(AuthContext);
  
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am your FinPilot AI assistant. How can I help you today? You can ask me about investments, saving tips, or insurance coverage, or click one of the quick queries below!',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
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
    const activeChatId = localStorage.getItem('finpilot_active_chat_id');
    
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
  }, [messages, loading]);

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
        localStorage.setItem('finpilot_active_chat_id', chatId);
      }
    } catch (err) {
      console.error('Failed to load chat:', err);
      // Clean up invalid ID
      localStorage.removeItem('finpilot_active_chat_id');
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
        content: 'Hello! I am your FinPilot AI assistant. How can I help you today? You can ask me about investments, saving tips, or insurance coverage, or click one of the quick queries below!',
        timestamp: new Date()
      }
    ]);
    localStorage.removeItem('finpilot_active_chat_id');
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Handle message sending (optimistic updates + dynamic routes)
  const handleSendMessage = async (textToSend) => {
    if (!textToSend.trim() || loading) return;

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
          setMessages(prev => [...prev, aiMsg]);
          
          // Re-fetch or update the current conversation title/preview in the sidebar
          setConversations(prev => {
            const index = prev.findIndex(c => c.id === currentChatId);
            if (index !== -1) {
              const updated = [...prev];
              updated[index] = {
                ...updated[index],
                lastMessagePreview: aiMsg.content,
                updatedAt: new Date().toISOString()
              };
              return updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            }
            return prev;
          });
          // Call history refresh just in case auto-title changed it
          fetchConversations(1, false, searchQuery);
        }
      } else {
        // Create new chat
        const res = await axios.post('/api/chat', { message: textToSend });
        if (res.data?.status === 'success') {
          const { conversation, userMessage, aiMessage } = res.data;
          
          setCurrentChatId(conversation.id);
          localStorage.setItem('finpilot_active_chat_id', conversation.id);
          
          if (userMessage && aiMessage) {
            setMessages([userMessage, aiMessage]);
          }

          // Insert into sidebar
          setConversations(prev => [
            {
              id: conversation.id,
              title: conversation.title,
              createdAt: conversation.createdAt,
              updatedAt: conversation.updatedAt,
              lastMessagePreview: aiMessage ? aiMessage.content : '',
              lastMessageTime: aiMessage ? aiMessage.timestamp : conversation.updatedAt
            },
            ...prev
          ]);
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
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendMessage(inputText);
  };

  // Rename a conversation
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

  // Delete a conversation
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

  // Clear all chats
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

  // Helper to categorize dates
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

  // Parse text block for simple markdown rendering (bolding and code blocks)
  const renderMessageContent = (content) => {
    if (!content) return null;

    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const match = part.match(/```(\w*)\n([\s\S]*?)```/);
        const language = match ? match[1] : '';
        const code = match ? match[2] : part.slice(3, -3);

        return (
          <div key={index} style={styles.codeBlockContainer}>
            {language && <div style={styles.codeBlockHeader}>{language}</div>}
            <pre style={styles.codeBlockPre}>
              <code style={styles.codeBlockCode}>{code.trim()}</code>
            </pre>
          </div>
        );
      }

      const inlineParts = part.split(/(`[^`]+`)/g);
      const inlineRendered = inlineParts.map((subPart, subIndex) => {
        if (subPart.startsWith('`') && subPart.endsWith('`')) {
          return (
            <code key={subIndex} style={styles.inlineCode}>
              {subPart.slice(1, -1)}
            </code>
          );
        }

        const boldParts = subPart.split(/(\*\*[^*]+\*\*)/g);
        return boldParts.map((boldPart, boldIndex) => {
          if (boldPart.startsWith('**') && boldPart.endsWith('**')) {
            return <strong key={boldIndex}>{boldPart.slice(2, -2)}</strong>;
          }
          return boldPart;
        });
      });

      return <span key={index} style={{ whiteSpace: 'pre-wrap' }}>{inlineRendered}</span>;
    });
  };

  // Quick prompt buttons
  const quickReplies = [
    'Can I invest?',
    'Should I save more?',
    'What insurance should I buy?'
  ];

  const groupedChats = groupConversations(conversations);
  const showSidebar = !isMobile || sidebarOpen;

  return (
    <div className="main-content" style={styles.mainContent}>
      {/* Mobile Sidebar overlay backdrop */}
      {isMobile && sidebarOpen && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(3, 7, 18, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 99,
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div style={styles.chatContainer}>
        {/* Sidebar Component */}
        {showSidebar && (
          <div style={isMobile ? styles.sidebarMobile : styles.sidebarDesktop}>
            <div style={styles.sidebarHeader}>
              <h3 style={styles.sidebarTitle}>Chats History</h3>
              {isMobile && (
                <button 
                  onClick={() => setSidebarOpen(false)} 
                  style={{ background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              )}
            </div>

            <button onClick={startNewChat} className="new-chat-btn">
              <Plus size={18} />
              New Chat
            </button>

            <div style={styles.searchContainer}>
              <Search size={16} style={styles.searchIcon} />
              <input 
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={styles.clearSearchBtn}>
                  <X size={14} />
                </button>
              )}
            </div>

            <div style={styles.historyList}>
              {conversationsLoading ? (
                // Loading skeletons
                Array(4).fill(0).map((_, i) => (
                  <div key={i} style={styles.skeletonItem}>
                    <div style={styles.skeletonCircle} />
                    <div style={{ flex: 1 }}>
                      <div style={styles.skeletonLine(75)} />
                      <div style={styles.skeletonLine(45)} />
                    </div>
                  </div>
                ))
              ) : conversations.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748b', fontSize: '13px', padding: '20px 0' }}>
                  No conversations found.
                </div>
              ) : (
                <>
                  {/* Today Group */}
                  {groupedChats.today.length > 0 && (
                    <div style={styles.historyGroup}>
                      <div style={styles.groupHeader}>Today</div>
                      {groupedChats.today.map(conv => renderSidebarItem(conv))}
                    </div>
                  )}

                  {/* Yesterday Group */}
                  {groupedChats.yesterday.length > 0 && (
                    <div style={styles.historyGroup}>
                      <div style={styles.groupHeader}>Yesterday</div>
                      {groupedChats.yesterday.map(conv => renderSidebarItem(conv))}
                    </div>
                  )}

                  {/* Previous 7 Days Group */}
                  {groupedChats.previous7Days.length > 0 && (
                    <div style={styles.historyGroup}>
                      <div style={styles.groupHeader}>Previous 7 Days</div>
                      {groupedChats.previous7Days.map(conv => renderSidebarItem(conv))}
                    </div>
                  )}

                  {/* Older Group */}
                  {groupedChats.older.length > 0 && (
                    <div style={styles.historyGroup}>
                      <div style={styles.groupHeader}>Older Chats</div>
                      {groupedChats.older.map(conv => renderSidebarItem(conv))}
                    </div>
                  )}
                </>
              )}
            </div>

            {conversations.length > 0 && (
              <button onClick={handleClearAll} className="clear-history-btn">
                <Trash2 size={15} />
                Clear All Conversations
              </button>
            )}
          </div>
        )}

        {/* Chat Area Component */}
        <div style={styles.chatArea}>
          <div className="glass-card" style={styles.chatCard}>
            {/* Chat Header */}
            <div style={styles.chatHeader}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {isMobile && (
                  <button onClick={() => setSidebarOpen(true)} style={styles.hamburgerBtn}>
                    <Menu size={20} />
                  </button>
                )}
                <div style={styles.botIconBadge}>
                  <Bot size={20} style={{ color: '#6366f1' }} />
                </div>
                <div style={{ marginLeft: '12px' }}>
                  <h3 style={styles.chatTitle}>
                    {currentChatId 
                      ? (conversations.find(c => c.id === currentChatId)?.title || 'FinPilot Advisor') 
                      : 'New Consultation'}
                  </h3>
                  <span style={styles.chatStatus}>Gemini Model Active</span>
                </div>
              </div>
            </div>

            {/* Message Area */}
            <div style={styles.messageBox}>
              {historyLoading ? (
                // Loader when fetching conversation details
                Array(3).fill(0).map((_, i) => (
                  <div key={i} style={{ ...styles.messageRow, alignSelf: i % 2 === 0 ? 'flex-start' : 'flex-end', width: '60%' }}>
                    <div style={styles.avatar(i % 2 === 0 ? 'assistant' : 'user')}>
                      {i % 2 === 0 ? <Bot size={14} style={{ color: '#ffffff' }} /> : <User size={14} style={{ color: '#ffffff' }} />}
                    </div>
                    <div style={{ ...styles.messageBubble(i % 2 === 0), width: '100%' }}>
                      <div style={styles.skeletonLine(90)} />
                      <div style={styles.skeletonLine(65)} />
                    </div>
                  </div>
                ))
              ) : messages.length <= 1 && !currentChatId ? (
                // Welcome / Empty state
                <div style={styles.emptyStateContainer}>
                  <MessageCircle size={48} style={{ color: '#6366f1', opacity: 0.5, marginBottom: '16px' }} />
                  <h3 style={{ fontSize: '18px', color: '#ffffff', marginBottom: '8px', fontFamily: 'Outfit, sans-serif' }}>Finance AI Assistant</h3>
                  <p style={{ fontSize: '14px', color: '#94a3b8', textAlign: 'center', maxWidth: '380px' }}>
                    Ask FinPilot about portfolio analysis, tax optimizations, investment options, or insurance planning.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isAi = msg.role === 'assistant' || msg.sender === 'ai';
                  return (
                    <div
                      key={msg.id}
                      style={{
                        ...styles.messageRow,
                        alignSelf: isAi ? 'flex-start' : 'flex-end',
                      }}
                    >
                      {isAi && (
                        <div style={styles.avatar('assistant')}>
                          <Bot size={14} style={{ color: '#ffffff' }} />
                        </div>
                      )}
                      <div style={styles.messageBubble(isAi)}>
                        <p style={styles.messageText}>{renderMessageContent(msg.content || msg.message)}</p>
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
                })
              )}

              {loading && (
                <div style={{ ...styles.messageRow, alignSelf: 'flex-start' }}>
                  <div style={styles.avatar('assistant')}>
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
            {messages.length <= 1 && (
              <div style={styles.quickRepliesContainer}>
                {quickReplies.map((reply) => (
                  <button
                    key={reply}
                    style={styles.quickReplyBtn}
                    onClick={() => handleSendMessage(reply)}
                    disabled={loading}
                  >
                    <Sparkles size={12} style={{ color: '#a855f7' }} />
                    {reply}
                  </button>
                ))}
              </div>
            )}

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
              <button type="submit" className="btn btn-primary" style={styles.sendBtn} disabled={loading || !inputText.trim()}>
                <Send size={18} />
              </button>
            </form>
          </div>
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
        className={`sidebar-item ${isActive ? 'active' : ''}`}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, overflow: 'hidden' }}>
          <MessageCircle size={16} style={{ color: isActive ? '#6366f1' : '#64748b', flexShrink: 0 }} />
          
          <div style={styles.itemInfo}>
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
                style={styles.renameInput}
              />
            ) : (
              <>
                <span style={styles.itemTitle}>{conv.title}</span>
                <span style={styles.previewText}>{conv.lastMessagePreview || 'No messages'}</span>
              </>
            )}
          </div>
        </div>

        {!isRenaming && (
          <div style={{ position: 'relative' }}>
            <button 
              onClick={(e) => toggleMenu(conv.id, e)} 
              className="context-menu-btn"
            >
              <MoreVertical size={14} />
            </button>

            {isMenuOpen && (
              <div ref={dropdownRef} className="dropdown-menu">
                <button 
                  onClick={(e) => startRename(conv.id, conv.title, e)} 
                  className="dropdown-item"
                >
                  <Edit2 size={13} />
                  Rename
                </button>
                <button 
                  onClick={(e) => handleDelete(conv.id, e)} 
                  className="dropdown-item danger"
                >
                  <Trash2 size={13} />
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

const styles = {
  mainContent: {
    height: 'calc(100vh - 64px)',
    marginTop: '64px',
    display: 'flex',
    padding: '24px',
    gap: '24px',
    maxWidth: '100%',
    width: '100%',
    overflow: 'hidden',
    boxSizing: 'border-box',
    position: 'relative'
  },
  chatContainer: {
    display: 'flex',
    flex: 1,
    gap: '24px',
    overflow: 'hidden',
    height: '100%',
    width: '100%'
  },
  sidebarDesktop: {
    width: '280px',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: '20px',
    background: 'rgba(17, 24, 39, 0.7)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    flexShrink: 0
  },
  sidebarMobile: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '280px',
    zIndex: 100,
    background: '#0d111d',
    boxShadow: '4px 0 25px rgba(0,0,0,0.5)',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
    height: '100%'
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px'
  },
  sidebarTitle: {
    fontSize: '18px',
    color: '#ffffff',
    fontWeight: 600,
    fontFamily: 'Outfit, sans-serif'
  },
  searchContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '16px',
    width: '100%'
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    color: '#64748b',
    pointerEvents: 'none'
  },
  searchInput: {
    width: '100%',
    padding: '8px 36px 8px 36px',
    background: 'rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  clearSearchBtn: {
    position: 'absolute',
    right: '12px',
    background: 'transparent',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    padding: 0
  },
  historyList: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    paddingRight: '4px',
    marginBottom: '16px'
  },
  historyGroup: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '8px'
  },
  groupHeader: {
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: '#64748b',
    letterSpacing: '0.05em',
    marginBottom: '8px',
    paddingLeft: '4px'
  },
  chatArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden'
  },
  chatCard: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: 0,
    overflow: 'hidden',
    height: '100%',
    borderRadius: '16px',
    background: 'rgba(17, 24, 39, 0.7)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.08)'
  },
  chatHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    background: 'rgba(255, 255, 255, 0.01)',
    flexShrink: 0
  },
  botIconBadge: {
    background: 'rgba(99, 102, 241, 0.1)',
    borderRadius: '10px',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  chatTitle: {
    fontSize: '16px',
    color: '#ffffff',
    fontFamily: 'Outfit, sans-serif',
    fontWeight: 600,
    maxWidth: '300px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
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
    gap: '20px',
    background: 'rgba(0, 0, 0, 0.15)'
  },
  messageRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    maxWidth: '85%',
    marginBottom: '8px'
  },
  avatar: (role) => ({
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: role === 'assistant' ? 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' : 'rgba(255, 255, 255, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: '4px'
  }),
  messageBubble: (isAi) => ({
    background: isAi ? 'rgba(255, 255, 255, 0.03)' : 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    border: isAi ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
    padding: '14px 18px',
    borderRadius: isAi ? '16px 16px 16px 0' : '16px 16px 0 16px',
    color: '#ffffff',
    boxShadow: isAi ? 'none' : '0 4px 15px rgba(99, 102, 241, 0.25)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  }),
  messageText: {
    fontSize: '14.5px',
    lineHeight: '1.6',
  },
  messageTime: {
    fontSize: '10px',
    color: 'rgba(255, 255, 255, 0.4)',
    display: 'block',
    textAlign: 'right',
  },
  typingBubble: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    padding: '12px 16px',
    borderRadius: '12px 12px 12px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    height: '40px',
    alignSelf: 'flex-start',
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
  },
  codeBlockContainer: {
    borderRadius: '8px',
    overflow: 'hidden',
    margin: '8px 0',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    background: '#090d16',
  },
  codeBlockHeader: {
    background: 'rgba(255, 255, 255, 0.03)',
    padding: '6px 12px',
    fontSize: '11px',
    color: '#94a3b8',
    textTransform: 'uppercase',
    fontFamily: 'Outfit, sans-serif',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  },
  codeBlockPre: {
    margin: 0,
    padding: '12px',
    overflowX: 'auto',
  },
  codeBlockCode: {
    fontFamily: 'Consolas, Monaco, "Andale Mono", monospace',
    fontSize: '13px',
    color: '#f8fafc',
  },
  inlineCode: {
    background: 'rgba(255, 255, 255, 0.1)',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '13px',
    fontFamily: 'Consolas, Monaco, monospace',
    color: '#a855f7',
  },
  skeletonItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.01)',
    marginBottom: '8px'
  },
  skeletonCircle: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.05)',
    animation: 'pulse 1.5s infinite ease-in-out'
  },
  skeletonLine: (width) => ({
    height: '10px',
    width: `${width}%`,
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '4px',
    margin: '6px 0',
    animation: 'pulse 1.5s infinite ease-in-out'
  }),
  emptyStateContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    padding: '40px',
    color: '#cbd5e1'
  },
  renameInput: {
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid #6366f1',
    borderRadius: '4px',
    color: '#ffffff',
    padding: '4px 8px',
    fontSize: '13px',
    width: '90%',
    outline: 'none'
  },
  previewText: {
    fontSize: '12px',
    color: '#64748b',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginTop: '2px',
    maxWidth: '180px'
  },
  itemInfo: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'hidden',
    paddingRight: '8px'
  },
  itemTitle: {
    fontSize: '13.5px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  hamburgerBtn: {
    background: 'transparent',
    border: 'none',
    color: '#ffffff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px',
    borderRadius: '8px',
    marginRight: '12px',
  }
};

const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes bounce {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1.0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }
  
  .sidebar-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-bottom: 4px;
    border: 1px solid transparent;
    color: #cbd5e1;
    position: relative;
  }
  .sidebar-item:hover {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.06);
    color: #ffffff;
  }
  .sidebar-item.active {
    background: rgba(99, 102, 241, 0.12);
    border-color: rgba(99, 102, 241, 0.25);
    color: #ffffff;
    font-weight: 500;
  }
  .context-menu-btn {
    opacity: 0;
    transition: opacity 0.2s ease;
    background: transparent;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
  }
  .sidebar-item:hover .context-menu-btn {
    opacity: 1;
  }
  .context-menu-btn:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.1);
  }
  .dropdown-menu {
    position: absolute;
    right: 0px;
    top: 24px;
    background: #0f172a;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    z-index: 200;
    display: flex;
    flex-direction: column;
    padding: 4px;
    min-width: 120px;
  }
  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    font-size: 13px;
    color: #cbd5e1;
    border: none;
    background: transparent;
    text-align: left;
    cursor: pointer;
    border-radius: 4px;
    width: 100%;
    transition: background 0.2s;
  }
  .dropdown-item:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #ffffff;
  }
  .dropdown-item.danger:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #f87171;
  }
  .clear-history-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    background: transparent;
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #fca5a5;
    padding: 10px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    margin-top: auto;
    transition: all 0.2s;
  }
  .clear-history-btn:hover {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.5);
  }
  .new-chat-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    background: var(--grad-primary);
    color: white;
    padding: 12px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 16px;
    box-shadow: var(--shadow-glow-primary);
    transition: all 0.2s;
  }
  .new-chat-btn:hover {
    filter: brightness(1.1);
    box-shadow: 0 0 25px rgba(99, 102, 241, 0.4);
  }
`;
document.head.appendChild(styleSheet);

export default Chatbot;
