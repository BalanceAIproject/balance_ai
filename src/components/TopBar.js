import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './TopBar.css';

export default function TopBar() {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <div className="top-bar-global">
            <div className="top-bar-left">
                <h1 className="top-bar-title">Balnce.ai</h1>
            </div>
            <div className="top-bar-right">
                <button className={`top-bar-btn ${isActive('/chat') ? 'active' : ''}`} onClick={() => navigate('/chat')} > Chat </button>
                <button className={`top-bar-btn ${isActive('/userprofile') ? 'active' : ''}`} onClick={() => navigate('/userprofile')} > Profile </button>
            </div>
        </div>
    );
}