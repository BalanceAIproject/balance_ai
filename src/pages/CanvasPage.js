import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css'; // Base styles are needed

import Sidebar from '../components/Sidebar';
import PlanningNode from '../components/nodes/PlanningNode';
import WebsiteNode from '../components/nodes/WebsiteNode';
import AdvertisingNode from '../components/nodes/AdvertisingNode';
// Import other node types as needed

// Corrected Import: Import both canvasService and CanvasState
import { canvasService, CanvasState } from '../services/canvasService';
import { blockService } from '../services/blockService';
import { useAppContext } from '../context/AppContext';

import './CanvasPage.css';
import '../components/Sidebar.css';
import '../components/nodes/NodeStyles.css';

// Map node type strings to their corresponding React components.
const nodeTypes = {
  PLANNING_VIDEO: PlanningNode,
  WEBSITE_SETUP: WebsiteNode,
  ADVERTISING: AdvertisingNode,
  // Add other custom node types here (e.g., 'JOURNAL': JournalNode)
};

// --- Canvas Component (Renders the React Flow instance) ---
const CanvasComponent = ({ canvasId }) => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition } = useReactFlow();
  const [canvasTitle, setCanvasTitle] = useState('Loading Canvas...');

  // Load initial canvas data and blocks
  useEffect(() => {
    if (!canvasId) {
        console.warn("CanvasComponent loaded without canvasId");
        setCanvasTitle('No Canvas Selected');
        setNodes([]);
        setEdges([]);
        return;
    };

    console.log(`Loading data for canvas: ${canvasId}`);
    const canvas = canvasService.getCanvas(canvasId);

    if (canvas) {
      setCanvasTitle(canvas.title || 'Untitled Canvas');
      const initialBlocks = blockService.getBlocks(canvasId);
      const initialNodes = initialBlocks.map(block => ({
        id: block.id,
        type: block.type, // This MUST match a key in nodeTypes
        position: block.position || { x: Math.random() * 400, y: Math.random() * 400 },
        data: {
          label: `${block.type} Block`,
          content: block.content,
        },
      }));
      setNodes(initialNodes);
      // TODO: Load edges if stored per canvas
      // setEdges(canvas.edges || []);
      console.log(`Loaded ${initialNodes.length} nodes for canvas ${canvasId}`);
    } else {
      console.error(`Canvas with ID ${canvasId} not found.`);
      setCanvasTitle('Canvas Not Found');
      setNodes([]);
      setEdges([]);
    }
  }, [canvasId, setNodes, setEdges]);

  // Handles new connections
  const onConnect = useCallback(
    (params) => {
        console.log('Edge created:', params);
        setEdges((eds) => addEdge(params, eds));
        // TODO: Persist edge
    },
    [setEdges]
  );

  // Handles dragging over the canvas
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handles dropping an element from the sidebar
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type || !nodeTypes[type]) {
        console.warn('Dropped element type is invalid or not registered:', type);
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newBlockData = { type, content: `New ${type}`, position };
      const createdBlock = blockService.createBlock(canvasId, newBlockData);

      if (createdBlock) {
        const newNode = {
          id: createdBlock.id,
          type,
          position,
          data: { label: `${type} Block`, content: createdBlock.content },
        };
        setNodes((nds) => nds.concat(newNode));
        console.log('Added node to React Flow:', newNode);
      } else {
        console.error('Failed to create block in service for canvas:', canvasId);
      }
    },
    [screenToFlowPosition, canvasId, setNodes]
  );

  // Handles node changes, including persisting position after drag
  const handleNodesChange = useCallback((changes) => {
    onNodesChange(changes);
    changes.forEach(change => {
      if (change.type === 'position' && !change.dragging && change.position) {
        setNodes((currentNodes) => {
            const node = currentNodes.find(n => n.id === change.id);
             if (node) {
                 console.log(`Persisting position for block ${change.id}:`, change.position);
                 blockService.updateBlockPosition(change.id, change.position);
             }
             return currentNodes;
        });
      }
    });
  }, [onNodesChange, blockService, setNodes]);


  return (
    <div className="reactflow-wrapper" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        fitView
        className="imagination-canvas-flow"
      >
        <Controls />
        <Background variant="dots" gap={16} size={1} />
        {/* <MiniMap /> */}
      </ReactFlow>
      <div className="prompt-input-bar">
          <input type="text" placeholder={`Chat about "${canvasTitle}"...`} />
          <button aria-label="Send message">↑</button>
      </div>
    </div>
  );
};

// --- Main Page Component (Container) ---
const CanvasPage = () => {
  const { canvasId: paramId } = useParams();
  const navigate = useNavigate();
  const { state } = useAppContext();
  const [currentCanvasId, setCurrentCanvasId] = useState(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!state.isLoading && !state.user) {
      console.log("User not logged in, redirecting to login.");
      navigate('/login');
    }
  }, [state.user, state.isLoading, navigate]);

  // Determine which canvas ID to load
  useEffect(() => {
    if (paramId) {
        console.log(`Using canvasId from URL param: ${paramId}`);
        setCurrentCanvasId(paramId);
    } else if (state.user) {
        console.log("No canvasId in URL, determining default canvas...");
        const canvases = canvasService.getAllCanvases();
        // Use the correctly imported CanvasState here
        const activeOrMostRecentCanvas = canvases
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .find(c => c.state === CanvasState.ACTIVE) || canvases[0]; // <-- Use CanvasState.ACTIVE

        if (activeOrMostRecentCanvas) {
            console.log(`Defaulting to canvas: ${activeOrMostRecentCanvas.id}`);
            setCurrentCanvasId(activeOrMostRecentCanvas.id);
            // navigate(`/canvas/${activeOrMostRecentCanvas.id}`, { replace: true });
        } else {
            console.log("No existing canvases found, creating a default one.");
            const newCanvas = canvasService.createCanvas("My First Canvas");
            if (newCanvas) {
                console.log(`Created default canvas: ${newCanvas.id}`);
                setCurrentCanvasId(newCanvas.id);
                // navigate(`/canvas/${newCanvas.id}`, { replace: true });
            } else {
                console.error("Failed to create initial default canvas.");
            }
        }
    }
  }, [paramId, state.user, navigate]);


  if (state.isLoading || !state.user || !currentCanvasId) {
    return <div className="loading-placeholder">Loading Canvas...</div>;
  }

  return (
    <div className="canvas-page-container">
      <ReactFlowProvider>
        <Sidebar />
        <main className="canvas-main-area">
           <div className="canvas-top-bar">
                <button className="top-bar-btn share-btn">Share</button>
                <div className="user-icon-placeholder">
                    {state.user.username ? state.user.username.charAt(0).toUpperCase() : '?'}
                </div>
           </div>
           <CanvasComponent canvasId={currentCanvasId} />
        </main>
      </ReactFlowProvider>
    </div>
  );
};

export default CanvasPage;