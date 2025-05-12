import React from 'react';
import { useNavigate } from 'react-router-dom';
import './TopBar.css';

export default function TopBar() {
    const navigate = useNavigate();

    return (
        <div className="top-bar">
            <button onClick={() => navigate("/canvas")} className="top-bar-btn">Canvas</button>
            <button onClick={() => navigate("/chat")} className="top-bar-btn">Chat</button>
            <button onClick={() => navigate("/profile")} className="top-bar-btn">Profile</button>
        </div>
    );
}