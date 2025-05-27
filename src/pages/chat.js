import './chat.css';
import React, { useState, useEffect } from 'react';
import { blockService } from '../services/blockService';
import { useParams, useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';


function Chat() {
  const [input, setInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [pastMessages, setPastMessages] = useState([]);
  const { canvasId } = useParams();
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
          canvasId: canvasId,
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
    setInput('');
    setPastMessages([]);

    fetch(`http://localhost:3001/chat/${canvasId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPastMessages(data);
        } else {
          setPastMessages([]);
        }
      })
      .catch(err => {
        console.error('Failed to load chat', err);
        setPastMessages([]);
      });
  }, [canvasId]);

  return (
    <div className="chatbackdrop">
      <TopBar />
      <div className="chatbar">
        <button className="share" onClick={() => navigate(`/chat/${Date.now()}`)}>+ New Chat</button>
        {chatHistory.map((chat, i) => (
          <div key={i} className="summary" onClick={() => navigate(`/chat/${chat.canvasId}`)}>
            {chat.firstPrompt ? chat.firstPrompt.split(" ").slice(0, 5).join(" ") + "..." : "Untitled Chat"}
          </div>
        ))}
      </div>

      <div className="chat-main">
        <div className="chat-content">
          {pastMessages
            .filter(entry => entry.userPrompt && entry.agentReply)
            .map((entry, i) => (
              <div key={i} className="chat-turn">
                <div><strong>You:</strong> {entry.userPrompt}</div>
                <div><strong>Agent:</strong> {entry.agentReply}</div>

                {(entry.suggestedBlocks || []).map((block, index) => {
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
