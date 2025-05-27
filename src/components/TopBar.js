import React from 'react';
import { useNavigate } from 'react-router-dom';
import './TopBar.css';

export default function TopBar() {
    const navigate = useNavigate();

    return (
        <div className="top-bar-global">
            <div className="top-bar-left">
                <h1 className="top-bar-title">Balnce.ai</h1>
            </div>
            <div className="top-bar-right">
                {/* <button className="top-bar-btn" onClick={() => navigate('/canvas')}>Canvas</button> */}
                <button className="top-bar-btn" onClick={() => navigate('/chat')}>Chat</button>
                <button className="top-bar-btn" onClick={() => navigate('/userprofile')}>Profile</button>
            </div>
        </div>
    );
}