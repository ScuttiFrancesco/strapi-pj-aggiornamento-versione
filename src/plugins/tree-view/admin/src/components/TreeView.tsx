import React from 'react';
import { TreeNode, TreeNodeData } from './TreeNode';

export const TreeView: React.FC<{ data: TreeNodeData[] }> = ({ data }) => {
  return (
    <div style={{ 
      fontFamily: 'Arial, sans-serif', 
      fontSize: '16px',
      lineHeight: '1.8',
      padding: '20px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      border: '1px solid #e9ecef',
      color: '#333'
    }}>
      {data.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          color: '#6c757d', 
          fontSize: '18px',
          padding: '40px 20px',
          fontStyle: 'italic'
        }}>
          Nessun elemento trovato o nessuna struttura gerarchica disponibile.
        </div>
      ) : (
        data.map((n) => (
          <TreeNode key={n.id} node={n} level={0} />
        ))
      )}
    </div>
  );
};

export default TreeView;
