import './chat.css';
import React, { useState, useEffect } from 'react';
import { blockService } from '../services/blockService';
import { useParams, useLocation } from 'react-router-dom';

function Chat() {
    const [input, setInput] = useState('');
    const [agentReply, setAgentReply] = useState('');
    const { canvasId } = useParams();
    const location = useLocation();
    const [currentCombinedContext, setCurrentCombinedContext] = useState(null);

    useEffect(() => {
        if (location.state?.combinedContext) {
            setCurrentCombinedContext(location.state.combinedContext);
        }
    }, [location.state]);

    const sendPrompt = async () => {
        if (!input.trim()) return;

        let promptToSend = input;
        let blocksForPrompt = [];
        let contextIdentifier = canvasId || 'canvas123';

        if (currentCombinedContext) {
            promptToSend = `Context: ${currentCombinedContext.title}. User question: ${input}`;
            blocksForPrompt = currentCombinedContext.blocks || [];
            contextIdentifier = currentCombinedContext.title;
            console.log("Sending prompt with combined context:", currentCombinedContext);
        }

        try {
            const response = await fetch('http://localhost:3000/agent-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: promptToSend,
                    canvasId: contextIdentifier,
                    blocks: blocksForPrompt 
                })
            });

            const data = await response.json();
            setAgentReply(data.agentReply || 'No reply from agent');

            if (data.suggestedBlocks?.length) {
                data.suggestedBlocks.forEach(block => {
                    blockService.createBlock(canvasId, {
                        type: block.type,
                        content: block.content,
                        position: { x: Math.random() * 600, y: Math.random() * 400 }
          });
        });

                window.location.reload();
      }

        } catch (error) {
        console.error('Error contacting backend:', error);
        setAgentReply('Agent failed to respond.');
    }

    setInput('');
  };

    return (
        <div className='chatbackdrop'>
            {currentCombinedContext && (
                <div className="combined-context-display">
                    <h3>Chatting about: {currentCombinedContext.title}</h3>
                    <p><strong>Combined Blocks:</strong></p>
                    <ul>
                        {currentCombinedContext.blocks.map((block, index) => (
                            <li key={index}>{block}</li>
                        ))}
                    </ul>
                    <hr />
                </div>
            )}

            <div className='chatbar'>

                <div className='external'>
                    <button className='share'>Share</button>
                </div>

                <div className='defaultPrompt'>
                    <button className='help'>Need help starting your ideas?</button>
                    <div className='prompt'>
                        <button>Education</button>
                        <button>Business</button>
                        <button>Family</button>
                        <button>Content</button>
                    </div>
                </div>
                
            </div>
            
            <div className='chatinput'>
        <div className='wrap'>
          <input
            type='text'
            placeholder='Type your message here...'
            className='input'
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className='send' onClick={sendPrompt}>Send</button>
        </div>
        {agentReply && (
          <div className='agent-reply'>
            <strong>Agent:</strong> {agentReply}
          </div>
        )}
      </div>
     </div>
        
    );
};


export default Chat;
