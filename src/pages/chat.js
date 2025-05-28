import './chat.css';
import React, { useState, useEffect } from 'react';
import { blockService } from '../services/blockService';
import { useParams, useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { Lock, Upload, Plus, Send, MessageCircle, Clock, LogOut } from 'lucide-react';

function groupChatsByDate(chatHistory) {
  const grouped = {};
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  for (const chat of chatHistory) {
    const dt = new Date(chat.timestamp || Date.now());
    const dateStr = dt.toDateString();
    let label = '';

    if (dateStr === today.toDateString()) {
      label = 'Today';
    } else if (dateStr === yesterday.toDateString()) {
      label = 'Yesterday';
    } else {
      label = dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }

    const time = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase();
    if (!grouped[label]) grouped[label] = [];
    grouped[label].push({ ...chat, time });
  }

  return Object.entries(grouped);
}

function Chat() {
  const [input, setInput] = useState('');
  const [agentReply, setAgentReply] = useState('');
  const [blocks, setBlocks] = useState([]);
  const { canvasId } = useParams();
  const [showPlusPopup, setShowPlusPopup] = useState(false);
  const [showShareLinkPopup, setShowShareLinkPopup] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();
  const [showPastChats, setShowPastChats] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log('Selected file:', file.name);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    console.log("Logging out");
    navigate('/login');
  };

  const shareLink = `https://balanceai.com/share/${canvasId || 'canvas123'}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    alert('Link copied to clipboard!');
  };
  useEffect(() => {
    if (!canvasId) return;

    try {
      const history = JSON.parse(localStorage.getItem('chatHistory')) || [];
      const found = history.find(chat => chat.canvasId === canvasId);
      if (found) {
        setAgentReply(found.agentReply);
        setBlocks([]);
      } else {
        setAgentReply('');
        setBlocks([]);
      }
    } catch (e) {
      console.error('Error loading chat for canvasId:', e);
      setAgentReply('');
      setBlocks([]);
    }
  }, [canvasId]);

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('chatHistory')) || [];
    setChatHistory(history);
  }, [showPastChats]);

  const sendPrompt = async () => {
    if (!input.trim()) return;
    let currentAgentReply = 'Agent failed to respond.';

    try {
      const response = await fetch('http://localhost:3001/agent-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: input,
          canvasId,
          blocks: []
        })
      });

      const data = await response.json();
      currentAgentReply = data.agentReply || 'No reply from agent';
      setAgentReply(currentAgentReply);
      setBlocks(data.suggestedBlocks || []);

      if (data.suggestedBlocks?.length) {
        data.suggestedBlocks.forEach(block => {
          blockService.createBlock(canvasId, {
            type: block.type,
            content: JSON.stringify(block),
            position: { x: Math.random() * 600, y: Math.random() * 400 }
          });
        });
      }
    } catch (error) {
      console.error('Error contacting backend:', error);
      setAgentReply(currentAgentReply);
    }

    try {
      const chatEntry = {
        canvasId: canvasId || `canvas-${Date.now()}`,
        firstPrompt: input,
        agentReply: currentAgentReply,
        timestamp: new Date().toISOString(),
      };
      const existingHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
      const updatedHistory = [
        ...existingHistory.filter(c => c.canvasId !== chatEntry.canvasId),
        chatEntry
      ];
      localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
      setChatHistory(updatedHistory);
    } catch (e) {
      console.error('Failed to save chat history to localStorage:', e);
    }

    setInput('');
  };

  const handleNavigation = (section) => {
    const existingHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];

    switch (section) {
      case 'chat': {
        setShowPastChats(false);
        const latestChat = [...existingHistory].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
        if (latestChat?.canvasId) {
          navigate(`/chat/${latestChat.canvasId}`);
        } else {
          const newCanvasId = `canvas-${Date.now()}`;
          navigate(`/chat/${newCanvasId}`);
        }
        break;
      }
      case 'new-chat': {
        const newId = `canvas-${Date.now()}`;
        const newEntry = {
          canvasId: newId,
          firstPrompt: '',
          agentReply: '',
          timestamp: new Date().toISOString(),
        };
        const history = JSON.parse(localStorage.getItem('chatHistory')) || [];
        const updatedHistory = [...history, newEntry];
        localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
        setChatHistory(updatedHistory);
        setAgentReply('');
        setBlocks([]);
        setInput('');
        navigate(`/chat/${newId}`);
        setShowPastChats(false);
        break;
      }
      case 'past-chats':
        setShowPastChats(prev => !prev);
        break;
      default:
        break;
    }
  };

  return (
      <>
        <TopBar />
        <div className="chatbackdrop">
          <div className={`chatbar ${isExpanded ? 'expanded' : 'collapsed'}`}>
            <div className="profile-row">
              <div className="profile-avatar">
                <img src="/images/profile-pic.jpg" className="profile-image" alt="User"/>
              </div>
            </div>
            {isExpanded && (
                <div className="profile-info">
                  <div className="profile-name">User Name</div>
                  <div className="profile-email">username@gmail.com</div>
                </div>
            )}
            <div className="nav-menu">
              <button className="nav-item" onClick={() => handleNavigation('chat')}><MessageCircle/><span
                  className="label">Chat</span></button>
              <button className="nav-item" onClick={() => handleNavigation('new-chat')}><Plus/><span className="label">New Chat</span>
              </button>
              <button className="nav-item" onClick={() => handleNavigation('past-chats')}><Clock/><span
                  className="label">Past Chats</span></button>
              <button className="nav-item logout" onClick={() => setShowLogoutModal(true)}>
                <LogOut/><span className="label">Logout</span>
              </button>
            </div>
          </div>

          <div className={`expand-btn-container ${isExpanded ? 'expanded' : 'collapsed'}`}>
            <button
                className={`expand-btn ${isExpanded ? 'expanded' : 'collapsed'}`}
                onClick={() => setIsExpanded(!isExpanded)}
            >
              <svg width="40" height="40" viewBox="0 0 24 24">
                <path
                    d={isExpanded ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"}
                    stroke="black"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <div className="chat-main">
            {showPastChats ? (
                <div className="past-chats-list-container">
                  <h2 className="past-chats-title">Past Chats</h2>
                  {groupChatsByDate(chatHistory).map(([dateLabel, chats]) => (
                      <div key={dateLabel} className="chat-day-section">
                        <div className="chat-day-divider">
                          <hr className="divider-line"/>
                          <span className="day-label">{dateLabel}</span>
                          <hr className="divider-line"/>
                        </div>
                        {chats.map((chat, i) => (
                            <div
                                key={i}
                                className="chat-bubble-wrapper"
                                onClick={() => {
                                  setShowPastChats(false);
                                  navigate(`/chat/${chat.canvasId}`);
                                }}
                            >
                              <div className="chat-timestamp">{chat.time}</div>
                              <div className="chat-bubble">
                                {chat.firstPrompt || 'No prompt'}
                                <span className="edit-icon">✎</span>
                              </div>
                            </div>
                        ))}
                      </div>
                  ))}
                </div>
            ) : (
                <div className="chat-content">
                  {agentReply && (
                      <div className="agent-reply">
                        <strong>Agent:</strong> {agentReply}
                      </div>
                  )}
                  {blocks.map((block, index) => {
                    switch (block.type) {
                      case 'CHECKLIST':
                        return (
                            <div key={index} className="block checklist">
                              <h3>{block.title}</h3>
                              <ul>
                                {block.items.map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                              </ul>
                            </div>
                        );
                      case 'RESOURCE_CARD':
                        return (
                            <div key={index} className="block resource">
                              <h3>{block.title}</h3>
                              {block.items.map((item, i) => (
                                  <div key={i}>
                                    <strong>{item.name}</strong>: {item.purpose}
                                    <br/>
                                    <em>Recommended: {item.recommended}</em>
                                  </div>
                              ))}
                            </div>
                        );
                      default:
                        return null;
                    }
                  })}
                </div>
            )}

            {!showPastChats && (
                <div className="chatinput">
                  <div className="wrap">
                    {/* + Button with popup */}
                    <div className="plus-menu-container">
                      <button className="plus-button" onClick={() => setShowPlusPopup(!showPlusPopup)}>
                        <div className="plus-icon-wrapper-pill">
                          <Plus size={28} strokeWidth={3}/>
                        </div>
                      </button>
                      {showPlusPopup && (
                          <div className="plus-popup-strict">
                            <div className="popup-option-strict">
                              <div className="icon-circle-strict"><Upload size={28}/></div>
                              <label htmlFor="file-upload" className="option-label">Upload</label>
                              <input type="file" id="file-upload" style={{display: 'none'}}
                                     onChange={handleFileUpload}/>
                            </div>
                            <div className="popup-option-strict" onClick={() => setShowShareLinkPopup(true)}>
                              <div className="icon-circle-strict"><Lock size={28}/></div>
                              <span className="option-label">Share</span>
                            </div>
                          </div>
                      )}
                    </div>

                    {/* Input and Send */}
                    <input
                        type="text"
                        placeholder="Enter an idea"
                        className="input"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <button className="send-button" onClick={sendPrompt} disabled={!input.trim()}>
                      <Send/>
                    </button>
                  </div>
                </div>
            )}
          </div>
          {showShareLinkPopup && (
              <div className="share-popup">
                <div className="popup-content">
                  <button className="close-btn" onClick={() => setShowShareLinkPopup(false)}>×</button>
                  <h2>Share public link to canva</h2>
                  <div className="share-link-box">
                    <span className="share-link">{shareLink}</span>
                    <button
                        className="copy-btn"
                        onClick={copyToClipboard}
                        tabIndex={-1}
                    >
                      Copy Link
                    </button>
                  </div>
                </div>
              </div>
          )}
          {showLogoutModal && (
              <div className="logout-modal-overlay">
                <div className="logout-modal">
                  <p>Are you sure you want to log out?</p>
                  <div className="modal-buttons">
                    <button className="modal-yes" onClick={confirmLogout}>Log Out</button>
                    <button className="modal-no" onClick={() => setShowLogoutModal(false)}>Cancel</button>
                  </div>
                </div>
              </div>
          )}
        </div>
      </>
  );
}

export default Chat;