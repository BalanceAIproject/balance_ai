import React from 'react';
import { Handle, Position } from '@xyflow/react';
import './NodeStyles.css';

const DefaultNode = ({ data }) => {
  return (
    <div className="default-node" style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px', background: '#f9f9f9' }}>
      <Handle type="target" position={Position.Top} id="target" />
      <div>
        <strong>{data.label || 'Block'}</strong>
      </div>
      {data.content && <p style={{ margin: '5px 0 0', fontSize: '0.9em' }}>{data.content}</p>}
      <Handle type="source" position={Position.Bottom} id="source" />
    </div>
  );
};

export default DefaultNode;
