import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import './NodeStyles.css';

// Custom Node for 'WEBSITE_SETUP' type
const WebsiteNode = ({ data, isConnectable }) => {
  return (
    <div className="imagination-node website-node">
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="imagination-handle"
      />
       <div className="node-header">
        <span>Website Set Up Block</span>
        <button className="expand-button" aria-label="Expand node">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
            </svg>
        </button>
      </div>
      <div className="node-content">
        {/* Display text content from the node's data, or a default message */}
        <p>{data?.content || 'Default text for website setup block. Describe the steps or details here.'}</p>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="imagination-handle"
      />
    </div>
  );
};

export default memo(WebsiteNode);