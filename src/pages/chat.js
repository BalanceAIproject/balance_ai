import './chat.css';
import React, { useState } from 'react';
import { blockService } from '../services/blockService';
import { useParams } from 'react-router-dom';

function Chat() {
  const [input, setInput] = useState('');
  const [agentReply, setAgentReply] = useState('');
  const [blocks, setBlocks] = useState([]);
  const { canvasId } = useParams();

  const sendPrompt = async () => {
    if (!input.trim()) return;
    let currentAgentReply = 'Agent failed to respond.'; // Variable to store reply/error

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
      currentAgentReply = data.agentReply || 'No reply from agent'; // Assign actual reply
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
      // currentAgentReply will hold the default "Agent failed to respond."
      setAgentReply(currentAgentReply);
    }

    // Store the full chat interaction in localStorage
    try {
      const chatEntry = { userInput: input, agentReply: currentAgentReply }; // Use the local variable
      const existingHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
      const updatedHistory = [...existingHistory, chatEntry];
      localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
    } catch (e) {
      console.error('Failed to save chat history to localStorage:', e);
    }

    setInput('');
  };

  return (
    <div className="chatbackdrop">
      <div className="chatbar">
        <div className="external">
          <button className="share">Share</button>
        </div>
        <div className="defaultPrompt">
          <button className="help">Need help starting your ideas?</button>
          <div className="prompt">
            <button>Education</button>
            <button>Business</button>
            <button>Family</button>
            <button>Content</button>
          </div>
        </div>
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

        <div className="chatinput">
          <div className="wrap">
            <input
              type="text"
              placeholder="Type your message here..."
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
