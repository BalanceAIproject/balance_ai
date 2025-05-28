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
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [showPlusPopup, setShowPlusPopup] = useState(false);
  const [showShareLinkPopup, setShowShareLinkPopup] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const navigate = useNavigate();
  const [showPastChats, setShowPastChats] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

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
                <img src="/images/profile-pic.jpg" className="profile-image" alt="User" />
              </div>
            </div>
            {isExpanded && (
                <div className="profile-info">
                  <div className="profile-name">User Name</div>
                  <div className="profile-email">username@gmail.com</div>
                </div>
            )}
            <div className="nav-menu">
              <button className="nav-item" onClick={() => handleNavigation('chat')}><MessageCircle /><span className="label">Chat</span></button>
              <button className="nav-item" onClick={() => handleNavigation('new-chat')}><Plus /><span className="label">New Chat</span></button>
              <button className="nav-item" onClick={() => handleNavigation('past-chats')}><Clock /><span className="label">Past Chats</span></button>
              <button className="nav-item logout" onClick={() => { localStorage.clear(); navigate('/login'); }}><LogOut /><span className="label">Logout</span></button>
            </div>
          </div>

          <div className="chat-main">
            {showPastChats ? (
                <div className="past-chats-list-container">
                  <h2 className="past-chats-title">Past Chats</h2>
                  {groupChatsByDate(chatHistory).map(([dateLabel, chats]) => (
                      <div key={dateLabel} className="chat-day-section">
                        <div className="chat-day-divider">
                          <hr className="divider-line" />
                          <span className="day-label">{dateLabel}</span>
                          <hr className="divider-line" />
                        </div>
                        {chats.map((chat, i) => (
                            <div key={i} className="chat-bubble-wrapper" onClick={() => { setShowPastChats(false); navigate(`/chat/${chat.canvasId}`); }}>
                              <div className="chat-timestamp">{chat.time}</div>
                              <div className="chat-bubble">{chat.firstPrompt || 'No prompt'}<span className="edit-icon">✎</span></div>
                            </div>
                        ))}
                      </div>
                  ))}
                </div>
            ) : (
                <div className="chat-content">
                  {agentReply && (<div className="agent-reply"><strong>Agent:</strong> {agentReply}</div>)}
                  {blocks.map((block, index) => {
                    switch (block.type) {
                      case 'CHECKLIST': return <div key={index} className="block checklist"><h3>{block.title}</h3><ul>{block.items.map((item, i) => <li key={i}>{item}</li>)}</ul></div>;
                      case 'RESOURCE_CARD': return <div key={index} className="block resource"><h3>{block.title}</h3>{block.items.map((item, i) => (<div key={i}><strong>{item.name}</strong>: {item.purpose}<br /><em>Recommended: {item.recommended}</em></div>))}</div>;
                      default: return null;
                    }
                  })}
                </div>
            )}

            {!showPastChats && (
                <div className="chatinput">
                  <div className="wrap">
                    <input type="text" placeholder="Enter an idea" className="input" value={input} onChange={(e) => setInput(e.target.value)} />
                    <button className="send-button" onClick={sendPrompt} disabled={!input.trim()}><Send /></button>
                  </div>
                </div>
            )}
          </div>
        </div>
      </>
  );
}

export default Chat;