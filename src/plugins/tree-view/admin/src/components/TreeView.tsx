import React from 'react';
import { TreeNode, TreeNodeData } from './TreeNode';

export interface TreeViewProps {
  data: TreeNodeData[];
  contentType?: string;
  parentField?: string;
  onLoadChildren?: (parentId: string | number, nodeData?: TreeNodeData) => Promise<TreeNodeData[]>;
}

export const TreeView: React.FC<TreeViewProps> = ({ data, contentType, parentField, onLoadChildren }) => {
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
        <>
          {contentType === 'api::pagina.pagina' && (
            <div style={{
              marginBottom: '16px',
              padding: '8px 12px',
              backgroundColor: '#e3f2fd',
              border: '1px solid #2196f3',
              borderRadius: '4px',
              fontSize: '14px',
              color: '#1565c0'
            }}>
              <strong>💡 Suggerimento:</strong> Clicca sul bottone "Aggiungi" accanto a qualsiasi nodo per creare un nuovo elemento figlio.
            </div>
          )}
          {data.map((n) => (
            <TreeNode 
              key={n.id} 
              node={n} 
              level={0} 
              contentType={contentType}
              parentField={parentField}
              onLoadChildren={onLoadChildren}
            />
          ))}
        </>
      )}
    </div>
  );
};

export default TreeView;
