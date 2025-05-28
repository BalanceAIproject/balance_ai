import './chat.css';
import React, { useState, useEffect } from 'react';
import { blockService } from '../services/blockService';
import { useParams, useNavigate, useLocation as useReactRouterLocation } from 'react-router-dom'; // Renamed to avoid conflict if any
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
  const [chatHistory, setChatHistory] = useState([]); // Sidebar list of past chats
  const [pastMessages, setPastMessages] = useState([]); // Active chat's messages & blocks
  const { canvasId } = useParams();
  const [showPlusPopup, setShowPlusPopup] = useState(false);
  const [showShareLinkPopup, setShowShareLinkPopup] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const navigate = useNavigate();
  const location = useReactRouterLocation(); 
  const [showPastChats, setShowPastChats] = useState(false);

  const handleNavigation = (path) => {
    if (path === 'new-chat') {
      navigate(`/chat/${Date.now()}`); 
    } else if (path === 'past-chats') {
      setShowPastChats(prev => !prev); 
    } else if (path === 'chat') {
      if(canvasId) navigate(`/chat/${canvasId}`);
      else navigate(`/chat/${Date.now()}`);
    } else {
      navigate(`/${path}`);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log('Selected file:', file.name);
    }
  };

  const shareLink = `https://balanceai.com/share/${canvasId || 'canvas123'}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    alert('Link copied to clipboard!');
  };

  const sendPrompt = async () => {
    if (!input.trim()) return;
    const currentInput = input; 
    setInput(''); 

    try {
      const response = await fetch('http://localhost:3001/agent-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: currentInput, 
          canvasId: canvasId || Date.now().toString(), // Ensure new chats get a numeric ID
          blocks: [] 
        })
      });

      const data = await response.json();
      const agentReply = data.agentReply || 'No reply from agent';
      const suggestedBlocks = data.suggestedBlocks || [];

      setPastMessages(prevMessages => [
        ...prevMessages,
        {
          userPrompt: currentInput,
          agentReply: agentReply,
          suggestedBlocks: suggestedBlocks
        }
      ]);

      // Refresh sidebar chat list
      fetch('http://localhost:3001/chat-history')
        .then(res => res.json())
        .then(data => setChatHistory(data))
        .catch(err => console.error('Failed to refresh chat history for sidebar', err));

    } catch (error) {
      console.error('Error contacting backend:', error);
      setPastMessages(prevMessages => [
        ...prevMessages,
        {
          userPrompt: currentInput,
          agentReply: "Error: Agent failed to respond. Please try again.",
          suggestedBlocks: []
        }
      ]);
    }
  };

  useEffect(() => {
    // Fetch initial sidebar chat list on mount
    fetch('http://localhost:3001/chat-history')
      .then(res => res.json())
      .then(data => setChatHistory(data))
      .catch(err => console.error('Failed to fetch chat history for sidebar', err));
  }, []);

  useEffect(() => {
    if (!canvasId) return;
    setInput(''); 
    
    // Load active chat: use navigation state for new chats, else fetch.
    if (location.state?.canvasData?.initialEntry) {
      const initialEntry = location.state.canvasData.initialEntry;
      setPastMessages([{ 
        ...initialEntry, 
        suggestedBlocks: initialEntry.suggestedBlocks || [] 
      }]);
      navigate(location.pathname, { replace: true, state: {} }); // Clear nav state
    } else {
      setPastMessages([]); 
      fetch(`http://localhost:3001/chat/${canvasId}`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data)) {
            setPastMessages(data);
          } else {
            console.warn("Fetched chat data is not an array:", data);
            setPastMessages([]);
          }
        })
        .catch(err => {
          console.error('Failed to load chat for canvasId:', canvasId, err);
          setPastMessages([]);
        });
    }
  }, [canvasId, location, navigate]);

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
              <button className="nav-item logout" onClick={() => {
                localStorage.clear();
                navigate('/login');
              }}><LogOut/><span className="label">Logout</span></button>
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
                                  // Ensure chat.canvasId or chat.id is used as available from backend data
                                  navigate(`/chat/${chat.canvasId || chat.id}`); 
                                }}
                            >
                              <div className="chat-timestamp">{chat.time}</div>
                              <div className="chat-bubble">
                                {/* Display chat.title instead of chat.firstPrompt */}
                                {chat.title || 'Untitled Chat'} 
                                <span className="edit-icon">✎</span>
                              </div>
                            </div>
                        ))}
                      </div>
                  ))}
                </div>
            ) : (
                <div className="chat-content">
                  {pastMessages.map((entry, i) => (
                    <div key={i} className="chat-turn">
                      {entry.userPrompt && <div><strong>You:</strong> {entry.userPrompt}</div>}
                      {entry.agentReply && <div><strong>Agent:</strong> {entry.agentReply}</div>}

                      {(entry.suggestedBlocks || []).map((block, index) => {
                        if (!block || !block.type) {
                          console.warn("Skipping rendering of undefined block:", block);
                          return null;
                        }
                        switch (block.type) {
                          case 'CHECKLIST':
                            return (
                              <div key={index} className="block checklist">
                                <h3>{block.title || 'Checklist'}</h3>
                                <ul>{(block.items || []).map((item, itemIdx) => <li key={itemIdx}>{item}</li>)}</ul>
                              </div>
                            );
                          case 'RESOURCE_CARD':
                            return (
                              <div key={index} className="block resource">
                                <h3>{block.title || 'Resources'}</h3>
                                {(block.items || []).map((item, itemIdx) => (
                                  <div key={itemIdx}>
                                    <strong>{item.name}</strong>: {item.purpose}<br />
                                    {item.recommended && <em>Recommended: {item.recommended}</em>}
                                  </div>
                                ))}
                              </div>
                            );
                          case 'TEXT_INPUT': // Example rendering for TEXT_INPUT
                            return (
                                <div key={index} className="block text-input-block">
                                    <h4>{block.title || 'Suggested Input Area'}</h4>
                                    {/* TEXT_INPUT blocks usually don't have 'content' to display here initially */}
                                </div>
                            );
                          default:
                             console.warn("Unknown block type:", block.type, block);
                             return (
                              <div key={index} className="block unknown-block">
                                  <p>Unsupported block type: {block.type}.</p>
                              </div>
                             );
                        }
                      })}
                    </div>
                  ))}
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
        </div>
      </>
  );
}

export default Chat;
