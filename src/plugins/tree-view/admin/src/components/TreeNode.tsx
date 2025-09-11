import React, { useState } from 'react';

// Fallback simple chevron icons (unicode) to avoid extra deps
const ChevronDown = () => <span style={{ display: 'inline-block', width: 20, fontSize: '16px' }}>▼</span>;
const ChevronRight = () => <span style={{ display: 'inline-block', width: 20, fontSize: '16px' }}>▶</span>;

export interface TreeNodeData {
  id: number | string;
  documentId?: string; // Aggiungi documentId per Strapi v5
  label: string;
  children?: TreeNodeData[];
  raw?: any;
}

export interface TreeNodeProps {
  node: TreeNodeData;
  level?: number;
  contentType?: string;
  parentField?: string;
}

const indent = (level: number, borderColor?: string) => ({ 
  paddingLeft: `${level * 40}px`,
  borderLeft: level > 0 ? `3px solid ${borderColor || '#dee2e6'}` : 'none',
  marginLeft: level > 0 ? '10px' : '0'
});

// Funzione per generare colori progressivi basati sul livello
const getLevelColors = (level: number, hasChildren: boolean) => {
  const colorSchemes = [
    // Livello 0 - Root (blu scuro)
    { bg: '#e3f2fd', text: '#1565c0', border: '#2196f3' },
    // Livello 1 - Figli (verde)
    { bg: '#e8f5e8', text: '#2e7d32', border: '#4caf50' },
    // Livello 2 - Nipoti (arancione)
    { bg: '#fff3e0', text: '#ef6c00', border: '#ff9800' },
    // Livello 3+ - Pronipoti (viola)
    { bg: '#f3e5f5', text: '#7b1fa2', border: '#9c27b0' },
  ];
  
  // Usa l'ultimo schema per livelli > 3
  const colorIndex = Math.min(level, colorSchemes.length - 1);
  const colors = colorSchemes[colorIndex];
  
  return {
    backgroundColor: colors.bg,
    color: hasChildren ? colors.text : `${colors.text}aa`, // Testo più chiaro se è foglia
    borderColor: colors.border
  };
};

export const TreeNode: React.FC<TreeNodeProps> = ({ node, level = 0, contentType, parentField }) => {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const levelColors = getLevelColors(level, hasChildren);
  
  // Funzione per navigare alla creazione di una nuova entry
  const handleAddChild = () => {
    if (!contentType) return;
    
    // Salva le informazioni del parent nel sessionStorage per essere usate dalla pagina di creazione
    const parentInfo = {
      parentId: node.raw?.documentId || node.documentId || node.id, // Usa documentId per Strapi v5
      parentLabel: node.label,
      parentField: parentField || 'pagina', // Default per la collection pagina
      contentType: contentType,
      timestamp: Date.now()
    };
    
    sessionStorage.setItem('strapi_tree_parent_info', JSON.stringify(parentInfo));
    
    // Naviga alla pagina di creazione nella stessa finestra
    const createUrl = `/admin/content-manager/collection-types/${contentType}/create`;
    window.location.href = createUrl;
  };
  
  return (
    <div style={{ marginBottom: '6px' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        ...indent(level, levelColors.borderColor),
        padding: '8px 12px',
        borderRadius: '6px',
        backgroundColor: levelColors.backgroundColor,
        border: `1px solid ${levelColors.borderColor}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        transition: 'all 0.2s ease'
      }}>
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              borderRadius: '4px'
            }}
            aria-label={open ? 'Collapse' : 'Expand'}
          >
            {open ? <ChevronDown /> : <ChevronRight />}
          </button>
        ) : (
          <span style={{ width: 32 }} />
        )}
        <span style={{ 
          fontFamily: 'Arial, sans-serif', 
          fontSize: '16px',
          fontWeight: '600', // Sempre grassetto per tutti
          color: levelColors.color,
          flex: 1
        }}>
          {node.label}
        </span>
        
        {/* Bottone per aggiungere un figlio - solo per la collection pagina */}
        {contentType === 'api::pagina.pagina' && (
          <button
            type="button"
            onClick={handleAddChild}
            style={{
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '12px',
              cursor: 'pointer',
              marginLeft: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              opacity: 0.8,
              transition: 'opacity 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
            title={`Aggiungi figlio a "${node.label}"`}
          >
            <span style={{ fontSize: '14px' }}>+</span>
            <span>Aggiungi</span>
          </button>
        )}
      </div>
      {open && hasChildren && (
        <div>
          {node.children!.map((c) => (
            <TreeNode key={c.id} node={c} level={level + 1} contentType={contentType} parentField={parentField} />
          ))}
        </div>
      )}
    </div>
  );
};

export default TreeNode;
