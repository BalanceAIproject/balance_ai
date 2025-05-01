import './chat.css';
import React from 'react';

function Chat() {
    return (
        <div className='chatbackdrop'>

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

        </div>
    );
};


export default Chat;