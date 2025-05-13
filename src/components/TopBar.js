import React from 'react';
import { useNavigate } from 'react-router-dom';
import './TopBar.css';

export default function TopBar() {
    const navigate = useNavigate();

    return (
        <div className="top-bar-global">
            <button className="top-bar-btn" onClick={() => navigate('/canvas')}>Canvas</button>
            <button className="top-bar-btn" onClick={() => navigate('/userprofile')}>Profile</button>
        </div>
    );
}
