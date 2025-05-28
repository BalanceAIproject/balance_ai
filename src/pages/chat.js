import './chat.css';
import React, { useState, useEffect } from 'react';
import { blockService } from '../services/blockService';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import TopBar from '../components/TopBar';


function Chat() {
  const [input, setInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [pastMessages, setPastMessages] = useState([]);
  const { canvasId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const sendPrompt = async () => {
    if (!input.trim()) return;
    let currentAgentReply = 'Agent failed to respond.';

    try {
      const response = await fetch('http://localhost:3001/agent-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: input,
          canvasId: canvasId || "canvas1",
          blocks: []
        })
      });

      const data = await response.json();
      currentAgentReply = data.agentReply || 'No reply from agent';

      const updatedMessages = [
        ...pastMessages,
        {
          userPrompt: input,
          agentReply: currentAgentReply,
          suggestedBlocks: data.suggestedBlocks || []
        }
      ];
      setPastMessages(updatedMessages);

      await fetch('http://localhost:3001/chat-history')
        .then(res => res.json())
        .then(setChatHistory)
        .catch(err => console.error('Failed to refresh chat list', err));

    } catch (error) {
      console.error('Error contacting backend:', error);
    }

    setInput('');
  };

  useEffect(() => {
    fetch('http://localhost:3001/chat-history')
      .then(res => res.json())
      .then(setChatHistory)
      .catch(err => console.error('Failed to fetch chat history', err));
  }, []);

  useEffect(() => {
    if (!canvasId) return;
    setInput(''); // Clear input when canvasId changes
    
    // Check if initial data is passed via navigation state (for new combined chats)
    if (location.state?.canvasData?.initialEntry) {
      const initialEntry = location.state.canvasData.initialEntry;
      // Ensure suggestedBlocks is an array, even if null/undefined from state
      setPastMessages([{ 
        ...initialEntry, 
        suggestedBlocks: initialEntry.suggestedBlocks || [] 
      }]);
      // Clear the state to prevent re-loading from state on refresh/re-navigation
      navigate(location.pathname, { replace: true, state: {} }); 
    } else {
      // Otherwise, fetch chat history for existing chats
      setPastMessages([]); // Clear previous messages before fetching new ones
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
    <div className="chatbackdrop">
      <TopBar />
      <div className="chatbar">
        <button className="share" onClick={() => navigate(`/chat/${Date.now()}`)}>+ New Chat</button>
        {chatHistory.map((chat, i) => (
          <div key={i} className="summary" onClick={() => navigate(`/chat/${chat.canvasId || chat.id}`)}>
            {chat.title ? chat.title.split(" ").slice(0, 5).join(" ") + (chat.title.split(" ").length > 5 ? "..." : "") : "Untitled Chat"}
          </div>
        ))}
      </div>

      <div className="chat-main">
        <div className="chat-content">
          {pastMessages.map((entry, i) => (
              <div key={i} className="chat-turn">
                {entry.userPrompt && <div><strong>You:</strong> {entry.userPrompt}</div>}
                {entry.agentReply && <div><strong>Agent:</strong> {entry.agentReply}</div>}

                {(entry.suggestedBlocks || []).map((block, index) => {
                  // Ensure block and block.type are defined
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
                    case 'TEXT_INPUT':
                        return (
                            <div key={index} className="block text-input-block">
                                <h4>{block.title || 'Suggested Input'}</h4>
                                {block.content && <p><i>{block.content}</i></p>}
                            </div>
                        );
                    default:
                       console.warn("Unknown block type:", block.type, block);
                       return (
                        <div key={index} className="block unknown-block">
                            <p>Unsupported block type: {block.type}</p>
                        </div>
                       );
                  }
                })}
              </div>
            ))}
        </div>

        <div className="chatinput">
          <div className="wrap">
            <input
              type="text"
              placeholder="Enter an idea"
              className="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button className="send" onClick={sendPrompt}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;
