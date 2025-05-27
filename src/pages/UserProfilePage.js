import React, { useState, useEffect } from 'react';
import './UserProfilePage.css';
import {
    Search,
    Filter,
    Upload,
    Lock,
    Plus,
    Settings,
    ChevronLeft,
    ChevronRight,
    Home,
    ChevronDown,
    Trash2,
    Pin
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';

const UserProfilePage = () => {
    const navigate = useNavigate();
    const [draggedCanvasId, setDraggedCanvasId] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterOpen, setFilterOpen] = useState(false);
    const [pinnedCanvases, setPinnedCanvases] = useState([]);
    const [deleteConfirmation, setDeleteConfirmation] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(3);
    const [openStatusDropdown, setOpenStatusDropdown] = useState(null);
    const [chatHistory, setChatHistory] = useState([]);
    const [sortOrder, setSortOrder] = useState('newest');
    const statusOptions = ['Active', 'Ambient', 'Checkpointed', 'Dormant'];
    const [editingCanvasId, setEditingCanvasId] = useState(null);
    const [editingTitle, setEditingTitle] = useState('');
    const [canvases, setCanvases] = useState([]); // Initialize with empty array

    // Helper function to format timestamp to relative time
    const formatTimeAgo = (timestamp) => {
        const now = new Date();
        const secondsPast = (now.getTime() - new Date(timestamp).getTime()) / 1000;

        if (secondsPast < 60) {
            return `${Math.round(secondsPast)} Sec Ago`;
        }
        if (secondsPast < 3600) {
            return `${Math.round(secondsPast / 60)} Min Ago`;
        }
        if (secondsPast <= 86400) {
            return `${Math.round(secondsPast / 3600)} Hrs Ago`;
        }
        if (secondsPast > 86400) {
            const days = Math.round(secondsPast / 86400);
            if (days === 1) {
                return `${days} Day Ago`;
            }
            return `${days} Days Ago`;
        }
    };


    useEffect(() => {
        const fetchCanvases = async () => {
            try {
                const response = await fetch('http://localhost:3001/chat-history');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                // Transform data to match the structure expected by the component
                const formattedCanvases = data.map(canvas => ({
                    ...canvas, // id, title, description, blocks, status, videoTitles are from backend
                    updated: formatTimeAgo(canvas.timestamp) // Format timestamp
                }));
                setCanvases(formattedCanvases);
            } catch (error) {
                console.error("Failed to fetch canvases:", error);
                setCanvases([]); // Set to empty array on error
            }
        };

        fetchCanvases();
    }, []);


    const handleDragStart = (e, canvasId) => {
        setDraggedCanvasId(canvasId);
        e.dataTransfer.setData('text/plain', canvasId);
        e.effectAllowed = "move";
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e, targetCanvasId) => {
        e.preventDefault();
        if (draggedCanvasId && draggedCanvasId !== targetCanvasId) {
            const draggedCanvas = canvases.find(c => c.id === draggedCanvasId);
            const targetCanvas = canvases.find(c => c.id === targetCanvasId);

            if (draggedCanvas && targetCanvas) {
                const combinedContext = {
                    title: `Combined: ${draggedCanvas.title} & ${targetCanvas.title}`,
                    canvases: [draggedCanvas, targetCanvas],
                    blocks: [...new Set([...draggedCanvas.blocks, ...targetCanvas.blocks])]
                };
                console.log("Combining canvases:", draggedCanvas.title, "and", targetCanvas.title);
                // Navigate to chat page with combined context
                navigate('/chat', { state: { combinedContext } });
            }
        }
        setDraggedCanvasId(null);
    };

    const handleStatusChange = (canvasId, newStatus) => {
        setCanvases(prev =>
            prev.map(canvas =>
                canvas.id === canvasId ? { ...canvas, status: newStatus } : canvas
            )
        );
        setOpenStatusDropdown(null);
    };

    const toggleStatusDropdown = (canvasId, e) => {
        e.stopPropagation();
        setOpenStatusDropdown(openStatusDropdown === canvasId ? null : canvasId);
    };

    useEffect(() => {
        const handleClickOutside = () => {
            setOpenStatusDropdown(null);
            setFilterOpen(false);
        };
        document.addEventListener('click', handleClickOutside);

        try {
            const storedHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
            setChatHistory(storedHistory);
        } catch (e) {
            console.error('Failed to load chat history from localStorage:', e);
            setChatHistory([]);
        }

        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const togglePinCanvas = (canvasId, e) => {
        e.stopPropagation();
        setPinnedCanvases(prev =>
            prev.includes(canvasId)
                ? prev.filter(id => id !== canvasId)
                : [...prev, canvasId]
        );
    };

    const handleDeleteClick = (canvasId, e) => {
        e.stopPropagation();
        setDeleteConfirmation(canvasId);
    };

    const confirmDelete = (canvasId) => {
        setCanvases(prev => prev.filter(canvas => canvas.id !== canvasId));
        setDeleteConfirmation(null);
        setPinnedCanvases(prev => prev.filter(id => id !== canvasId));
    };

    const cancelDelete = () => {
        setDeleteConfirmation(null);
    };

    const handleFilterClick = (e) => {
        e.stopPropagation();
        setFilterOpen(prev => !prev);
    };

    const handleSortOrderChange = (newOrder) => {
        setSortOrder(newOrder);
        setFilterOpen(false);
    };

    const filteredData = [...canvases]
        .filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            const aPinned = pinnedCanvases.includes(a.id);
            const bPinned = pinnedCanvases.includes(b.id);
            if (aPinned !== bPinned) return (bPinned ? 1 : 0) - (aPinned ? 1 : 0); // Pinned items first

            // Sort by timestamp for 'newest' or 'oldest'
            // The backend already sends `timestamp` as a number.
            // The backend also sorts by newest first initially.
            // This client-side sort respects the user's choice.
            if (sortOrder === 'newest') {
                return b.timestamp - a.timestamp; // Newest (larger timestamp) first
            } else {
                return a.timestamp - b.timestamp; // Oldest (smaller timestamp) first
            }
        });

    return (
        <>
            <TopBar />
            <div className="user-profile-container">
                <div className="home-icon" onClick={() => navigate("../chat/")}>
                    <Home size={24} />
                </div>

                <aside className="sidebar">
                    <img src="/images/profile-pic.jpg" alt="User Name" className="profile-pic" />
                    <h2 className="username">User Name</h2>
                    <div className="profile-actions">
                        <button title="Add" onClick={() => navigate("../chat")}>
                            <Plus size={40}/>
                        </button>
                        <button title="Settings" onClick={() => navigate("/settings")}>
                            <Settings size={30}/>
                        </button>
                    </div>
                </aside>

                <main className="main-canvas-area">

                    <div className="top-controls">
                        <div className="top-controls-inner">
                            <div className="left-controls">
                                <button className="pill-btn">My Canvases</button>
                                <div className={`filter-dropdown-full ${filterOpen ? 'open' : ''}`}
                                     onClick={handleFilterClick}>
                                    <div className="filter-header">
                                        <Filter/>
                                        Filter
                                        <ChevronDown className={`filter-chevron ${filterOpen ? 'rotated' : ''}`}/>
                                    </div>
                                    {filterOpen && (
                                        <div className="filter-options">
                                            <div
                                                className={`sort-option ${sortOrder === 'newest' ? 'selected' : ''}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSortOrderChange('newest');
                                                }}
                                            >
                                                Oldest to Newest
                                            </div>
                                            <div
                                                className={`sort-option ${sortOrder === 'oldest' ? 'selected' : ''}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSortOrderChange('oldest');
                                                }}
                                            >
                                                Newest to Oldest
                                            </div>
                                        </div>
                                    )}
                                </div>
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
                    </div>

                    {deleteConfirmation && (
                        <div className="delete-modal" onClick={cancelDelete}>
                            <div className="delete-modal-content" onClick={e => e.stopPropagation()}>
                                <div className="delete-modal-title">
                                    Are you sure you want to delete this canvas?
                                </div>
                                <div className="delete-modal-buttons">
                                    <button className="delete-confirm-btn"
                                            onClick={() => confirmDelete(deleteConfirmation)}>
                                        Yes
                                    </button>
                                    <button className="delete-cancel-btn" onClick={cancelDelete}>
                                        No
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="canvas-grid">
                        {filteredData.map(canvas => (
                            <div
                                className={`canvas-card ${draggedCanvasId === canvas.id ? 'dragging' : ''}`}
                                key={canvas.id}
                                draggable="true"
                                onDragStart={(e) => handleDragStart(e, canvas.id)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, canvas.id)}
                                style={{position: 'relative'}}
                            >
                                <div
                                    className={`pin-icon ${pinnedCanvases.includes(canvas.id) ? 'pinned' : ''}`}
                                    onClick={(e) => togglePinCanvas(canvas.id, e)}
                                    title={pinnedCanvases.includes(canvas.id) ? 'Unpin' : 'Pin'}
                                >
                                    <Pin size={16}/>
                                </div>

                                <div
                                    className="delete-icon"
                                    onClick={(e) => handleDeleteClick(canvas.id, e)}
                                    title="Delete"
                                >
                                    <Trash2 size={16}/>
                                </div>

                                {canvas.status === 'Active' && <div className="active-bar"/>}

                                <div className="canvas-preview-grid">
                                    {(() => {
                                        const displayItems = [];
                                        const MAX_PREVIEW_ITEMS = 4;

                                        (canvas.blocks || []).forEach(blockTitle => {
                                            if (displayItems.length < MAX_PREVIEW_ITEMS) {
                                                displayItems.push({ type: 'text', title: blockTitle });
                                            }
                                        });

                                        (canvas.videoTitles || []).forEach(videoTitle => {
                                            if (displayItems.length < MAX_PREVIEW_ITEMS) {
                                                displayItems.push({ type: 'video', title: videoTitle });
                                            }
                                        });
                                        
                                        while (displayItems.length < MAX_PREVIEW_ITEMS) {
                                            displayItems.push({ type: 'empty' });
                                        }

                                        return displayItems.map((item, i) => {
                                            if (item.type === 'text') {
                                                return (
                                                    <div className="canvas-block" key={`text-${canvas.id}-${i}`}>
                                                        <div className="block-title">{item.title}</div>
                                                        <div className="block-text">Insert text here...</div>
                                                    </div>
                                                );
                                            } else if (item.type === 'video') {
                                                return (
                                                    <div className="canvas-block video-block" key={`video-${canvas.id}-${i}`}>
                                                        <div className="block-title">{item.title}</div>
                                                        <div className="video-container">
                                                            <div className="video-overlay-text">Video Preview</div>
                                                            <div className="play-button"/>
                                                        </div>
                                                        <div className="video-footer-space"></div>
                                                    </div>
                                                );
                                            } else { // 'empty'
                                                return (
                                                    <div className="canvas-block empty-canvas-block" key={`empty-${canvas.id}-${i}`}>
                                                        <div className="block-title"></div>
                                                        <div className="block-text"></div>
                                                    </div>
                                                );
                                            }
                                        });
                                    })()}
                                </div>

                                <div className="canvas-title" onDoubleClick={() => {
                                    setEditingCanvasId(canvas.id);
                                    setEditingTitle(canvas.title);
                                }}>
                                    {editingCanvasId === canvas.id ? (
                                        <input
                                            type="text"
                                            value={editingTitle}
                                            autoFocus
                                            onChange={(e) => setEditingTitle(e.target.value)}
                                            onBlur={() => {
                                                setCanvases(prev =>
                                                    prev.map(c => c.id === canvas.id ? {...c, title: editingTitle} : c)
                                                );
                                                setEditingCanvasId(null);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    setCanvases(prev =>
                                                        prev.map(c => c.id === canvas.id ? {
                                                            ...c,
                                                            title: editingTitle
                                                        } : c)
                                                    );
                                                    setEditingCanvasId(null);
                                                }
                                            }}
                                            className="canvas-title-input"
                                        />
                                    ) : (
                                        canvas.title
                                    )}
                                </div>
                                {canvas.description && (
                                    <div className="canvas-description">{canvas.description}</div>
                                )}
                                <div className="meta-info">{canvas.updated}</div>

                                <div className="status-dropdown-container">
                                    <button
                                        className="status-button"
                                        onClick={(e) => toggleStatusDropdown(canvas.id, e)}
                                    >
                                        {canvas.status}
                                        <ChevronDown size={16}/>
                                    </button>
                                    {openStatusDropdown === canvas.id && (
                                        <div className="status-options">
                                            {statusOptions.map(option => (
                                                <div
                                                    key={option}
                                                    className="status-option"
                                                    onClick={() => handleStatusChange(canvas.id, option)}
                                                >
                                                    {option}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
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
        </>
    );
};

export default UserProfilePage;
