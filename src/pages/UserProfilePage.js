import React, { useState, useEffect } from 'react';
import './UserProfilePage.css';
import {
    Smile,
    Search,
    Filter,
    Upload,
    Lock,
    Plus,
    Settings,
    ChevronLeft,
    ChevronRight,
    Home
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserProfilePage = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [filterOpen, setFilterOpen] = useState(false);
    const [showOnlyWithVideo, setShowOnlyWithVideo] = useState(false);
    const [smiledCanvases, setSmiledCanvases] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(3);

    const canvasData = [
        {
            id: 1,
            title: 'Small Business',
            blocks: ['Journal Block', 'Budget Block', 'To-Do List', 'Idea Mapper'],
            updated: '1 Min Ago',
            status: 'Active',
            videoTitles: [] // no videos
        },
        {
            id: 2,
            title: 'Short Stories',
            blocks: ['Journal Block', 'Characters Block', 'Timeline Block', 'To-Do List'],
            updated: '5 Hrs Ago',
            status: 'Active',
            videoTitles: [] // no videos
        },
        {
            id: 3,
            title: 'Crochet',
            blocks: ['Beginners Block', 'Tools Block', 'Ideas Block'],
            updated: '2 Days Ago',
            status: 'Inactive',
            videoTitles: ['Easy Patterns']
        },
        {
            id: 4,
            title: 'Cooking',
            blocks: ['Beginners Safety', 'Cooking Tools'],
            updated: '1 Week Ago',
            status: 'Active',
            videoTitles: ['Beginners Recipe', 'Recipe with no Peanuts']
        }
    ];

    const filteredData = canvasData
        .filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
        .filter(c => !showOnlyWithVideo || (c.videoTitles && c.videoTitles.length > 0))
        .sort((a, b) => {
            const aSmiled = smiledCanvases.includes(a.id);
            const bSmiled = smiledCanvases.includes(b.id);
            return (bSmiled ? 1 : 0) - (aSmiled ? 1 : 0); // smiled canvases first
        });

    return (
        <div className="user-profile-container">
            <div className="home-icon" onClick={() => navigate("../canvas/")}>
                <Home size={24} />
            </div>

            <aside className="sidebar">
                <img src="/images/profile-pic.jpg" alt="Amy Smith" className="profile-pic" />
                <h2 className="username">Amy Smith</h2>
                <div className="profile-actions">
                    <button title="Add" onClick={() => alert("Add new canvas!")}>
                        <Plus size={40} />
                    </button>
                    <button title="Settings" onClick={() => alert("Settings clicked!")}>
                        <Settings size={30} />
                    </button>
                </div>
            </aside>

            <main className="main-canvas-area">
                <header className="top-bar">
                    <button className="upload-btn" onClick={() => alert("Upload clicked!")}>
                        <Upload size={20} strokeWidth={2.5} />
                    </button>
                    <button className="share-btn" onClick={() => alert("Share clicked!")}>
                        <Lock size={16} />
                        <span>Share</span>
                    </button>
                    <img src="/images/profile-pic.jpg" className="profile-icon" alt="User" />
                </header>

                <div className="top-controls">
                    <div className="left-controls">
                        <h2 className="section-title">My Canvases</h2>
                        <button className="filter-btn" onClick={() => setFilterOpen(prev => !prev)}>
                            <div className="filter-icon-wrapper">
                                <Filter size={20} />
                            </div>
                            <span className="filter-text">Filter</span>
                        </button>
                    </div>

                    <div className="search-container">
                        <Search className="search-icon" size={18}/>
                        <input
                            className="search-box"
                            type="text"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {filterOpen && (
                    <div className="filter-dropdown">
                        <label>
                            <input
                                type="checkbox"
                                checked={showOnlyWithVideo}
                                onChange={() => setShowOnlyWithVideo(prev => !prev)}
                            />
                            Only show canvases with videos
                        </label>
                    </div>
                )}

                <div className="canvas-grid">
                    {filteredData.map(canvas => (
                        <div className="canvas-card" key={canvas.id}>
                            {canvas.status === 'Active' && <div className="active-bar"/>}
                            <div
                                className={`canvas-emoji ${smiledCanvases.includes(canvas.id) ? 'smiled' : ''}`}
                                onClick={() => {
                                    setSmiledCanvases(prev =>
                                        prev.includes(canvas.id)
                                            ? prev.filter(id => id !== canvas.id)
                                            : [...prev, canvas.id]
                                    );
                                }}
                                title={smiledCanvases.includes(canvas.id) ? 'Unfavorite' : 'Favorite'}
                            >
                                <Smile size={20}/>
                            </div>

                            <div className="canvas-preview-grid">
                                {canvas.blocks.map((block, i) => (
                                    <div className="canvas-block" key={`text-${i}`}>
                                        <div className="block-title">{block}</div>
                                        <div className="block-text">Insert text here...</div>
                                    </div>
                                ))}

                                {canvas.videoTitles?.map((title, i) => (
                                    <div className="canvas-block video-block" key={`video-${i}`}>
                                        <div className="block-title">{title}</div>
                                        <div className="video-container">
                                            <div className="video-overlay-text">Video Preview</div>
                                            <div className="play-button"/>
                                        </div>
                                        <div className="video-footer-space"></div>
                                    </div>
                                ))}
                            </div>

                            <div className="canvas-title">{canvas.title}</div>
                            <div className="meta-info">{canvas.updated}</div>
                            <div className="meta-info">{canvas.status}</div>
                        </div>
                    ))}
                </div>

                <div className="pagination-arrows">
                    <button
                        className="arrow-btn"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft/>
                    </button>
                    <button
                        className="arrow-btn"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                    >
                        <ChevronRight/>
                    </button>
                </div>
            </main>
        </div>
    );
};

export default UserProfilePage;