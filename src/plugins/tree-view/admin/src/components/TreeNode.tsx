import React, { useState, useEffect } from 'react';

// Fallback simple chevron icons (unicode) to avoid extra deps
const ChevronDown = () => <span style={{ display: 'inline-block', width: 20, fontSize: '16px' }}>▼</span>;
const ChevronRight = () => <span style={{ display: 'inline-block', width: 20, fontSize: '16px' }}>▶</span>;

export interface TreeNodeData {
  id: number | string;
  documentId?: string; // Aggiungi documentId per Strapi v5
  label: string;
  children?: TreeNodeData[];
  hasChildren?: boolean; // Flag per lazy loading
  raw?: any;
}

export interface TreeNodeProps {
  node: TreeNodeData;
  level?: number;
  contentType?: string;
  parentField?: string;
  onLoadChildren?: (nodeId: string | number, nodeData?: TreeNodeData) => Promise<TreeNodeData[]>;
}

const indent = (level: number, borderColor?: string) => ({ 
  paddingLeft: `${level * 40}px`,
  borderLeft: level > 0 ? `3px solid ${borderColor || '#dee2e6'}` : 'none',
  marginLeft: level > 0 ? `${level*20}px` : '0'
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
    // Livello 3 - Pronipoti (viola)
    { bg: '#f3e5f5', text: '#7b1fa2', border: '#9c27b0' },
    // Livello 4 - Teal/Acquamarina
    { bg: '#e0f2f1', text: '#00695c', border: '#009688' },
    // Livello 5 - Rosso/Rosa
    { bg: '#fce4ec', text: '#c2185b', border: '#e91e63' },
    // Livello 6 - Indigo/Blu scuro
    { bg: '#e8eaf6', text: '#303f9f', border: '#3f51b5' },
    // Livello 7+ - Marrone/Terra
    { bg: '#efebe9', text: '#5d4037', border: '#795548' },
  ];
  
  // Usa l'ultimo schema per livelli > 7
  const colorIndex = Math.min(level, colorSchemes.length - 1);
  const colors = colorSchemes[colorIndex];
  
  return {
    backgroundColor: colors.bg,
    color: hasChildren ? colors.text : `${colors.text}aa`, // Testo più chiaro se è foglia
    borderColor: colors.border
  };
};

export const TreeNode: React.FC<TreeNodeProps> = ({ node, level = 0, contentType, parentField, onLoadChildren }) => {
  const [open, setOpen] = useState(false);
  const [children, setChildren] = useState<TreeNodeData[]>(node.children || []);
  const [childrenLoaded, setChildrenLoaded] = useState(!!(node.children && node.children.length > 0));
  const [isLoading, setIsLoading] = useState(false);
  const [actuallyHasChildren, setActuallyHasChildren] = useState(node.hasChildren);
  const [hasNoPublishedChildren, setHasNoPublishedChildren] = useState(false);
  
  // Determina se il nodo ha children - usa actuallyHasChildren dopo il caricamento
  const hasChildren = (children && children.length > 0) || (actuallyHasChildren && !childrenLoaded);
  const levelColors = getLevelColors(level, hasChildren);
  
  // useEffect per caricare i children quando si apre il nodo
  useEffect(() => {
    if (open && !childrenLoaded && actuallyHasChildren && onLoadChildren) {
      setIsLoading(true);
      console.log(`🔄 Loading children for node ${node.id} (${node.label})`, {
        nodeData: node,
        documentId: node.documentId,
        rawData: node.raw
      });
      
      onLoadChildren(node.id, node)
        .then(childrenData => {
          setChildren(childrenData);
          setChildrenLoaded(true);
          
          // Aggiorna actuallyHasChildren basandosi sui risultati effettivi
          if (childrenData.length === 0) {
            setHasNoPublishedChildren(true);
            // Non chiudere automaticamente, lascia che l'utente veda il messaggio
          } else {
            setActuallyHasChildren(true);
            setHasNoPublishedChildren(false);
          }
          
          console.log(`✅ Loaded ${childrenData.length} children for node ${node.id}`, {
            children: childrenData,
            parentNode: node
          });
        })
        .catch(error => {
          console.error('❌ Error loading children:', error);
          setHasNoPublishedChildren(true);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [open, childrenLoaded, actuallyHasChildren, node.id, onLoadChildren]);
  
  // Click handler semplificato - solo toggling
  const handleToggle = () => {
    setOpen(!open);
  };
  
  // Funzione per navigare alla creazione di una nuova entry
  const handleAddChild = () => {
    if (!contentType) return;
    
    // Salva le informazioni del parent nel sessionStorage per essere usate dalla pagina di creazione
    const parentInfo = {
      parentId: node.raw?.documentId || node.documentId || node.id, // Usa documentId per Strapi v5
      parentDocumentId: node.raw?.documentId || node.documentId || node.id,
      parentLabel: node.label,
      parentSlug: node.label.toLowerCase().replace(/\s+/g, '-'),
      parentField: parentField || 'pagina', // Default per la collection pagina
      contentType: contentType,
      timestamp: Date.now()
    };
    
    console.log('💾 TreeNode salva parentInfo:', parentInfo);
    sessionStorage.setItem('parentInfo', JSON.stringify(parentInfo));
    
    // Naviga alla pagina di creazione nella stessa finestra
    const createUrl = `/admin/content-manager/collection-types/${contentType}/create`;
    window.location.href = createUrl;
  };
  
  return (
    <div style={{ marginBottom: '6px' }} >
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
            onClick={handleToggle}
            disabled={isLoading}
            style={{              
              background: 'none',
              border: 'none',
              cursor: isLoading ? 'wait' : 'pointer',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              borderRadius: '4px',
              opacity: isLoading ? 0.6 : 1
            }}
            aria-label={open ? 'Collapse' : 'Expand'}
          >
            {isLoading ? (
              <span style={{ 
                display: 'inline-block', 
                width: 16, 
                height: 16, 
                border: '2px solid #ccc',
                borderTop: '2px solid #666',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}>
                <style>
                  {`
                    @keyframes spin {
                      0% { transform: rotate(0deg); }
                      100% { transform: rotate(360deg); }
                    }
                  `}
                </style>
              </span>
            ) : open ? <ChevronDown /> : <ChevronRight />}
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
          {isLoading && !childrenLoaded && (
            <div style={{ 
              ...indent(level + 1, levelColors.borderColor),
              padding: '8px 12px',
              fontStyle: 'italic',
              color: '#666'
            }}>
              Caricamento children...
            </div>
          )}
          
          {childrenLoaded && hasNoPublishedChildren && (
            <div style={{ 
              ...indent(level + 1, levelColors.borderColor),
              padding: '8px 12px',
              fontStyle: 'italic',
              color: '#999',
              fontSize: '14px'
            }}>
              • Nessun figlio
            </div>
          )}
          
          {children.map((c) => (
            <TreeNode 
              key={c.id} 
              node={c} 
              level={level + 1} 
              contentType={contentType} 
              parentField={parentField}
              onLoadChildren={onLoadChildren}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TreeNode;
