import './chat.css';
import React, { useState } from 'react';
import { blockService } from '../services/blockService';
import { useParams, useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { Lock, Upload, Plus, Send, MessageCircle, Clock, LogOut } from 'lucide-react';

function Chat() {
  const [input, setInput] = useState('');
  const [agentReply, setAgentReply] = useState('');
  const [blocks, setBlocks] = useState([]);
  const { canvasId } = useParams();
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [showPlusPopup, setShowPlusPopup] = useState(false);
  const [showShareLinkPopup, setShowShareLinkPopup] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const navigate = useNavigate();

  const sendPrompt = async () => {
    if (!input.trim()) return;
    let currentAgentReply = 'Agent failed to respond.';

    try {
      const response = await fetch('http://localhost:3001/agent-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: input,
          canvasId: canvasId || 'canvas123',
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
      const chatEntry = { userInput: input, agentReply: currentAgentReply };
      const existingHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
      const updatedHistory = [...existingHistory, chatEntry];
      localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
    } catch (e) {
      console.error('Failed to save chat history to localStorage:', e);
    }

    setInput('');
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) console.log('Selected file:', file.name);
  };

  const handleNavigation = (section) => {
    switch (section) {
      case 'chat':
        console.log('Current chat selected');
        break;
      case 'new-chat':
        setAgentReply('');
        setBlocks([]);
        setInput('');
        break;
      case 'past-chats':
        navigate('/chat-history');
        break;
      default:
        console.log(`Navigating to: ${section}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('chatHistory');
    localStorage.removeItem('userToken');
    navigate('/login');
  };

  const shareLink = `https://balanceai.com/share/…`;
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    alert('Link copied to clipboard!');
  };

  return (
      <>
        <TopBar />
        <div className="chatbackdrop">
          <div className={`chatbar ${isExpanded ? 'expanded' : 'collapsed'}`}>

            {/* Avatar and Expand */}
            <div className="profile-row">
              <div className="profile-avatar">
                <img src="/images/profile-pic.jpg" className="profile-image" alt="User"/>
              </div>
            </div>

            {/* Profile Info */}
            {isExpanded && (
                <div className="profile-info">
                  <div className="profile-name">User Name</div>
                  <div className="profile-email">username@gmail.com</div>
                </div>
            )}

            {/* Navigation Buttons */}
            <div className="nav-menu">
              <button className="nav-item" onClick={() => handleNavigation('chat')}>
                <MessageCircle size={24}/>
                <span className={`label ${isExpanded ? 'expanded' : 'collapsed'}`}>Chat</span>
              </button>
              <button className="nav-item" onClick={() => handleNavigation('new-chat')}>
                <Plus size={24}/>
                <span className={`label ${isExpanded ? 'expanded' : 'collapsed'}`}>New Chat</span>
              </button>
              <button className="nav-item" onClick={() => handleNavigation('past-chats')}>
                <Clock size={24}/>
                <span className={`label ${isExpanded ? 'expanded' : 'collapsed'}`}>Past Chats</span>
              </button>
              <button className="nav-item logout" onClick={handleLogout}>
                <LogOut size={24}/>
                <span className={`label ${isExpanded ? 'expanded' : 'collapsed'}`}>Logout</span>
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
                          <ul>{block.items.map((item, i) => <li key={i}>{item}</li>)}</ul>
                        </div>
                    );
                  case 'RESOURCE_CARD':
                    return (
                        <div key={index} className="block resource">
                          <h3>{block.title}</h3>
                          {block.items.map((item, i) => (
                              <div key={i}>
                                <strong>{item.name}</strong>: {item.purpose}<br/>
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

            <div className="chatinput">
              <div className="wrap">
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
                          <input type="file" id="file-upload" style={{display: 'none'}} onChange={handleFileUpload}/>
                        </div>
                        <div className="popup-option-strict" onClick={() => setShowShareLinkPopup(true)}>
                          <div className="icon-circle-strict"><Lock size={28}/></div>
                          <span className="option-label">Share</span>
                        </div>
                      </div>
                  )}
                </div>

                <input type="text" placeholder="Enter an idea" className="input" value={input}
                       onChange={(e) => setInput(e.target.value)}/>
                <button className="send-button" onClick={sendPrompt} disabled={!input.trim()}>
                  <Send/>
                </button>
              </div>

              {showShareLinkPopup && (
                  <div className="share-popup">
                    <div className="popup-content">
                      <button className="close-btn" onClick={() => setShowShareLinkPopup(false)}>×</button>
                      <h2>Share public link to canva</h2>
                      <div className="share-link-box">
                        <span className="share-link">{shareLink}</span>
                        <button className="copy-btn" onClick={copyToClipboard}>Copy Link</button>
                      </div>
                    </div>
                  </div>
              )}
            </div>
          </div>

          {showSharePopup && (
              <div className="share-popup">
                <div className="popup-content">
                  <button className="close-btn" onClick={() => setShowSharePopup(false)}>×</button>
                  <h2>Share public link to canva</h2>
                  <div className="share-link-box">
                    <span className="share-link">{shareLink}</span>
                    <button className="copy-btn" onClick={copyToClipboard}>Copy Link</button>
                  </div>
                </div>
              </div>
          )}
        </div>
      </>
  );
}

export default Chat;