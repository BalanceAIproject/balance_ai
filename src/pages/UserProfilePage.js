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
    const [canvases, setCanvases] = useState([
        {
            id: 1,
            title: 'Small Business',
            description: 'Manage tasks and finances for your business.',
            blocks: ['Journal Block', 'Budget Block', 'To-Do List', 'Idea Mapper'],
            updated: '1 Min Ago',
            status: 'Active',
            videoTitles: []
        },
        {
            id: 2,
            title: 'Short Stories',
            description: 'Track your characters, timelines, and story drafts.',
            blocks: ['Journal Block', 'Characters Block', 'Timeline Block', 'To-Do List'],
            updated: '5 Hrs Ago',
            status: 'Active',
            videoTitles: []
        },
        {
            id: 3,
            title: 'Crochet',
            description: 'Organize your crochet projects and tools.',
            blocks: ['Beginners Block', 'Tools Block', 'Ideas Block'],
            updated: '2 Days Ago',
            status: 'Inactive',
            videoTitles: ['Easy Patterns']
        },
        {
            id: 4,
            title: 'Cooking',
            description: 'Plan and collect your favorite recipes.',
            blocks: ['Beginners Safety', 'Cooking Tools'],
            updated: '1 Week Ago',
            status: 'Active',
            videoTitles: ['Beginners Recipe', 'Recipe with no Peanuts']
        }
    ]);

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
            if (aPinned !== bPinned) return (bPinned ? 1 : 0) - (aPinned ? 1 : 0);

            return sortOrder === 'newest' ? b.id - a.id : a.id - b.id;
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