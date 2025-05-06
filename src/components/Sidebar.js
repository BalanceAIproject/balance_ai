import React from 'react';
import './Sidebar.css';

// Define block types available in the sidebar.
// Keys should match the keys in nodeTypes in CanvasPage.js to ensure
// React Flow knows which component to render for the dropped node.
const availableBlocks = [
    { type: 'PLANNING_VIDEO', label: 'Planning Video' },
    { type: 'WEBSITE_SETUP', label: 'Website Set Up Block' },
    { type: 'ADVERTISING', label: 'Advertising Block' },
    // { type: 'JOURNAL', label: 'Journal' },
    // { type: 'TODO', label: 'To-Do List' },
];

const Sidebar = () => {
  // Handles the start of a drag operation for a block type.
  const onDragStart = (event, nodeType) => {
    // Store the node type in the drag event's dataTransfer object.
    // 'application/reactflow' is the recommended key for React Flow.
    event.dataTransfer.setData('application/reactflow', nodeType);
    // Set the allowed drag effect (e.g., 'move', 'copy').
    event.dataTransfer.effectAllowed = 'move';
    console.log(`Dragging started for type: ${nodeType}`);
  };

  return (
    <aside className="imagination-sidebar">
      {/* Top Icons Area */}
      <div className="sidebar-top-icons">
        <button className="sidebar-icon-btn share-icon" title="Share (Placeholder)">
            {/* SVG Icon for Share */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
            </svg>
        </button>
        <button className="sidebar-icon-btn add-icon" title="Add (Placeholder)">
             {/* SVG Icon for Add */}
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
        </button>
      </div>

      <h3 className="sidebar-section-title">Blocks</h3>

      {/* Map over available block types to create draggable elements */}
      {availableBlocks.map((block) => (
        <div
          key={block.type}
          className="dnd-node-item"
          onDragStart={(event) => onDragStart(event, block.type)}
          draggable // Make the element draggable
        >
          {block.label}
        </div>
      ))}

       {/* Placeholder for "Unseen Blocks" section */}
       <div className="dnd-node-item unseen-blocks-placeholder">
            4 Unseen Blocks
       </div>
    </aside>
  );
};

export default Sidebar;