import React, { useState, useEffect } from 'react';
import './UserProfilePage.css';
import SettingsPage from './SettingsPage';
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
    const [showSettingsPopup, setShowSettingsPopup] = useState(false);
    const [editingCanvasId, setEditingCanvasId] = useState(null);
    const [editingTitle, setEditingTitle] = useState('');
    const [canvases, setCanvases] = useState([]); // Initialize with empty array
    const [showSettings, setShowSettings] = useState(false);
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

    const handleDrop = async (e, targetCanvasId) => {
        e.preventDefault();
        if (draggedCanvasId && draggedCanvasId !== targetCanvasId) {
            try {
                const response = await fetch('http://localhost:3001/combine-chats', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        sourceChatId1: draggedCanvasId,
                        sourceChatId2: targetCanvasId,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.text();
                    throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
                }

                const newCombinedCanvas = await response.json();

                setCanvases(prevCanvases => {
                    // Add the new combined canvas, formatting its timestamp and ensuring all fields are present
                    const formattedNewCanvas = {
                        ...newCombinedCanvas,
                        blocks: newCombinedCanvas.blocks || [],
                        videoTitles: newCombinedCanvas.videoTitles || [],
                        description: newCombinedCanvas.description || '',
                        status: newCombinedCanvas.status || 'Active',
                        updated: formatTimeAgo(newCombinedCanvas.timestamp)
                    };
                    // Add the new canvas to the list, keeping the old ones
                    const updatedCanvases = [formattedNewCanvas, ...prevCanvases];

                    return updatedCanvases.sort((a, b) => {
                        // Re-apply sort after adding new canvas, respecting pinned and current sortOrder
                        const aPinned = pinnedCanvases.includes(a.id);
                        const bPinned = pinnedCanvases.includes(b.id);
                        if (aPinned !== bPinned) return (bPinned ? 1 : 0) - (aPinned ? 1 : 0);
                        if (sortOrder === 'newest') {
                            return b.timestamp - a.timestamp;
                        } else {
                            return a.timestamp - b.timestamp;
                        }
                    });
                });

                console.log("Successfully created new canvas from combination. New canvas ID:", newCombinedCanvas.id);
                // Navigate to the new chat page using path parameter
                navigate(`/chat/${newCombinedCanvas.id}`, { state: { canvasData: newCombinedCanvas } });

            } catch (error) {
                console.error("Failed to combine canvases:", error);
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

            if (sortOrder === 'newest') {
                return b.timestamp - a.timestamp;
            } else {
                return a.timestamp - b.timestamp;
            }
        });

    useEffect(() => {
        setTotalPages(Math.ceil(filteredData.length / 4) || 1);
        setCurrentPage(prev => Math.min(prev, Math.ceil(filteredData.length / 4) || 1));
    }, [filteredData]);

    return (
        <>
            <TopBar />
            <div className="user-profile-container">
                <div className="home-icon" onClick={() => navigate("../chat/")}>
                    <Home size={24} />
                </div>

                <aside className="sidebar">
                    <img src="/images/green.png" alt="User Name" className="profile-pic" />
                    <h2 className="username">User Name</h2>
                    <p className="user-email">Username@gmail.com</p>
                    <div className="profile-actions">
                        <button title="Add" onClick={() => navigate("../chat")}>
                            <Plus size={40}/>
                        </button>
                        <button title="Settings" onClick={() => setShowSettings(true)}>
                            <Settings size={30}/>
                        </button>
                    </div>
                </aside>

                <main className="main-canvas-area">

                    <div className="top-controls">
                        <div className="top-controls-inner">
                            <div className="left-controls">
                                <button className="pill-btn my-library-btn">My Library</button>

                                <div className="filter-button-container">
                                    <button
                                        className={`pill-btn filter-btn ${filterOpen ? 'open' : ''}`}
                                        onClick={handleFilterClick}
                                    >
                                        <Filter size={18}/>
                                        <span>Filter</span>
                                        <ChevronDown size={16}
                                                     className={`filter-chevron ${filterOpen ? 'rotated' : ''}`}/>
                                    </button>

                                    {filterOpen && (
                                        <div className="filter-dropdown-full open">
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
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="search-container">
                                <Search className="search-icon" size={20}/>
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
                        {filteredData.slice((currentPage - 1) * 4, currentPage * 4).map(canvas => (
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
                                        const MAX_PREVIEW_ITEMS = 2;

                                        // Assuming canvas.blocks is an array of full block objects
                                        (canvas.blocks || []).forEach(block => { // block is an object
                                            if (displayItems.length < MAX_PREVIEW_ITEMS) {
                                                displayItems.push({
                                                    type: 'block', // A generic type for blocks from canvas.blocks
                                                    blockData: block // Store the whole block object
                                                });
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
                                            if (item.type === 'block') {
                                                const block = item.blockData;
                                                let contentPreview = null;

                                                if (block && block.type === 'CHECKLIST') {
                                                    const checklistItemsToShow = 3; // Show more checklist items
                                                    contentPreview = (block.items || []).slice(0, checklistItemsToShow).map((checklistItem, index) => (
                                                        <p key={`${canvas.id}-cl-${i}-${index}`} className="block-content-item">{checklistItem}</p>
                                                    ));
                                                    if ((block.items || []).length > checklistItemsToShow) {
                                                        contentPreview.push(<p key={`${canvas.id}-cl-${i}-more`} className="block-content-more">...</p>);
                                                    }
                                                } else if (block && block.type === 'RESOURCE_CARD') {
                                                    const resourceItemsToShow = 1; // Keep showing 1 resource item, but more of its purpose
                                                    const purposeCharLimit = 100; // Increased character limit for purpose
                                                    contentPreview = (block.items || []).slice(0, resourceItemsToShow).map((resourceItem, index) => (
                                                        <div key={`${canvas.id}-rc-${i}-${index}`}>
                                                            <p className="block-content-item resource-name">{resourceItem.name}</p>
                                                            <p className="block-content-item resource-purpose">
                                                                {resourceItem.purpose ? resourceItem.purpose.substring(0, purposeCharLimit) + (resourceItem.purpose.length > purposeCharLimit ? '...' : '') : ''}
                                                            </p>
                                                        </div>
                                                    ));
                                                     if ((block.items || []).length > resourceItemsToShow) {
                                                        contentPreview.push(<p key={`${canvas.id}-rc-${i}-more`} className="block-content-more">...</p>);
                                                    }
                                                } else if (block && typeof block.items === 'string') {
                                                    const stringCharLimit = 120; // Increased character limit for generic string items
                                                    contentPreview = <p className="block-content-item">{block.items.substring(0, stringCharLimit)}{block.items.length > stringCharLimit ? '...' : ''}</p>;
                                                } else if (block && block.title && (!block.items || (Array.isArray(block.items) && block.items.length === 0))) {
                                                    // If block has a title but no items or empty items array
                                                    contentPreview = <p className="block-content-item"><i>No content items in this block.</i></p>;
                                                }
                                                else {
                                                    // Fallback for other block types or if block structure is not as expected
                                                    contentPreview = <p className="block-content-item">Content preview not available.</p>;
                                                    // If block itself is a string (legacy or unexpected format)
                                                    if(typeof block === 'string') {
                                                        contentPreview = <p className="block-content-item">{block.substring(0,70)}{block.length > 70 ? '...' : ''}</p>;
                                                    }
                                                }

                                                return (
                                                    <div className="canvas-block" key={`block-${canvas.id}-${i}`}>
                                                        <div className="block-title">{block ? block.title : 'Untitled Block'}</div>
                                                        <div className="block-text">{contentPreview}</div>
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
                            <ChevronLeft size={50} strokeWidth={5}/>
                        </button>
                        <button
                            className="arrow-btn"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight size={50} strokeWidth={5}/>
                        </button>
                    </div>
                </main>
                {showSettings && (
                    <div className="settings-popup-overlay" onClick={() => setShowSettings(false)}>
                        <div className="settings-popup" onClick={e => e.stopPropagation()}>
                            <button className="close-button" onClick={() => setShowSettings(false)}>✕</button>
                            <SettingsPage onClose={() => setShowSettings(false)} />
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default UserProfilePage;
