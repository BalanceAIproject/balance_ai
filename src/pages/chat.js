import './chat.css';
import React, { useState, useEffect } from 'react';
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
  const { canvasId } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [pastMessages, setPastMessages] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [showPastChats, setShowPastChats] = useState(false);
  const [showPlusPopup, setShowPlusPopup] = useState(false);
  const [showShareLinkPopup, setShowShareLinkPopup] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const shareLink = `https://balanceai.com/share/${canvasId || 'canvas123'}`;

  useEffect(() => {
    fetch('http://localhost:3001/chat-history')
      .then(res => res.json())
      .then(setChatHistory)
      .catch(err => console.error('Failed to fetch chat history', err));
  }, []);

  useEffect(() => {
    if (!canvasId) return;
    fetch(`http://localhost:3001/chat/${canvasId}`)
      .then(res => res.json())
      .then(data => setPastMessages(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error('Failed to load chat', err);
        setPastMessages([]);
      });
  }, [canvasId]);

  const sendPrompt = async () => {
    if (!input.trim()) return;

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
      const newEntry = {
        userPrompt: input,
        agentReply: data.agentReply || 'No reply from agent',
        suggestedBlocks: data.suggestedBlocks || []
      };

      const updated = [...pastMessages, newEntry];
      setPastMessages(updated);

      const hist = await fetch('http://localhost:3001/chat-history').then(r => r.json());
      setChatHistory(hist);
    } catch (err) {
      console.error('Error contacting backend:', err);
    }

    setInput('');
  };

  const handleNavigation = (section) => {
    switch (section) {
      case 'chat': {
        setShowPastChats(false);
        const latestChat = [...chatHistory].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
        if (latestChat?.canvasId) navigate(`/chat/${latestChat.canvasId}`);
        else navigate(`/chat/${Date.now()}`);
        break;
      }
      case 'new-chat': {
        const newId = Date.now().toString();
        navigate(`/chat/${newId}`);
        setPastMessages([]);
        setInput('');
        setShowPastChats(false);
        break;
      }
      case 'past-chats':
        setShowPastChats(prev => !prev);
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
            <button className="nav-item" onClick={() => handleNavigation('chat')}><MessageCircle/><span className="label">Chat</span></button>
            <button className="nav-item" onClick={() => handleNavigation('new-chat')}><Plus/><span className="label">New Chat</span></button>
            <button className="nav-item" onClick={() => handleNavigation('past-chats')}><Clock/><span className="label">Past Chats</span></button>
            <button className="nav-item logout" onClick={() => setShowLogoutModal(true)}><LogOut/><span className="label">Logout</span></button>
          </div>
        </div>

        <div className="expand-btn-container">
          <button className={`expand-btn ${isExpanded ? 'expanded' : 'collapsed'}`} onClick={() => setIsExpanded(!isExpanded)}>
            <svg width="40" height="40" viewBox="0 0 24 24">
              <path d={isExpanded ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} stroke="black" strokeWidth="2" fill="none" />
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
                    <hr className="divider-line" /><span className="day-label">{dateLabel}</span><hr className="divider-line" />
                  </div>
                  {chats.map((chat, i) => (
                    <div key={i} className="chat-bubble-wrapper" onClick={() => {
                      setShowPastChats(false);
                      navigate(`/chat/${chat.canvasId}`);
                    }}>
                      <div className="chat-timestamp">{chat.time}</div>
                      <div className="chat-bubble">{chat.summary || chat.firstPrompt || 'No prompt'}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="chat-content">
              {pastMessages.map((entry, i) => (
                <div key={i} className="chat-turn">
                  <div><strong>You:</strong> {entry.userPrompt}</div>
                  <div><strong>Agent:</strong> {entry.agentReply}</div>
                  {(entry.suggestedBlocks || []).map((block, j) => {
                    switch (block.type) {
                      case 'CHECKLIST':
                        return (
                          <div key={j} className="block checklist">
                            <h3>{block.title}</h3>
                            <ul>{block.items.map((item, k) => <li key={k}>{item}</li>)}</ul>
                          </div>
                        );
                      case 'RESOURCE_CARD':
                        return (
                          <div key={j} className="block resource">
                            <h3>{block.title}</h3>
                            {block.items.map((item, k) => (
                              <div key={k}>
                                <strong>{item.name}</strong>: {item.purpose}<br />
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
              ))}
            </div>
          )}

          {!showPastChats && (
            <div className="chatinput">
              <div className="wrap">
                <button className="plus-button" onClick={() => setShowPlusPopup(!showPlusPopup)}>
                  <Plus />
                </button>
                <input type="text" placeholder="Enter an idea" value={input} onChange={e => setInput(e.target.value)} />
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
