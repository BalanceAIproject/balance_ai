import './chat.css';
import React, { useState } from 'react';
import { blockService } from '../services/blockService';
import { useParams } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { Lock, Upload, Plus, ArrowUpCircle, Send } from 'lucide-react';

function Chat() {
  const [input, setInput] = useState('');
  const [agentReply, setAgentReply] = useState('');
  const [blocks, setBlocks] = useState([]);
  const { canvasId } = useParams();
  const [showSharePopup, setShowSharePopup] = useState(false);

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

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log('Selected file:', file.name);
    }
  };

  const shareLink = `https://balanceai.com/share/…`;
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    alert('Link copied to clipboard!');
  };

  return (
      <>
        {/* Add TopBar component at the top of the page */}
        <TopBar />

        <div className="chatbackdrop">
          <div className="chatbar">
            <div className="chatbar-buttons">
              <button className="icon-button share-button" onClick={() => setShowSharePopup(true)}>
                <Lock size={55}/>
                <span>Share</span>
              </button>
              <button className="icon-button round"><Plus size={55}/></button>
              <div></div>
              {/* Empty slot to complete the 2x2 grid */}
            </div>
            <div className="defaultPrompt">
              <button className="help">Need Help Starting Your Ideas?</button>
              <div className="prompt">
                <button>Education</button>
                <button>Business</button>
                <button>Personal</button>
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
              <div className="wrap" style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
                {/* Input Field */}
                <input
                    type="text"
                    placeholder="Type your message here..."
                    className="input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />

                {/* Send Button */}
                <button
                    className="icon-button round send-btn"
                    onClick={sendPrompt}
                    disabled={!input.trim()}
                >
                  <Send size={60}/>
                </button>

                {/* Upload Button (on the right) */}
                <button
                    className="icon-button round send-btn"
                    onClick={() => document.getElementById('file-upload').click()}
                >
                  <ArrowUpCircle size={60}/>
                </button>

                <input
                    type="file"
                    id="file-upload"
                    style={{display: 'none'}}
                    onChange={(e) => handleFileUpload(e)}
                />
              </div>
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