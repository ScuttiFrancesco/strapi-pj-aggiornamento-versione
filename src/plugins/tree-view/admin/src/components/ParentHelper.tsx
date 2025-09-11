import React, { useEffect, useState } from 'react';

export interface ParentInfo {
  parentId: string | number;
  parentLabel: string;
  parentField: string;
  contentType: string;
  timestamp: number;
}

export const ParentHelper: React.FC = () => {
  const [parentInfo, setParentInfo] = useState<ParentInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Controlla se ci sono informazioni del parent nel sessionStorage
    const storedInfo = sessionStorage.getItem('strapi_tree_parent_info');
    if (storedInfo) {
      try {
        const info: ParentInfo = JSON.parse(storedInfo);
        // Verifica che le informazioni non siano troppo vecchie (max 5 minuti)
        const maxAge = 5 * 60 * 1000; // 5 minuti in ms
        if (Date.now() - info.timestamp < maxAge) {
          setParentInfo(info);
          setIsVisible(true);
        } else {
          // Rimuovi informazioni scadute
          sessionStorage.removeItem('strapi_tree_parent_info');
        }
      } catch (e) {
        console.error('Errore nel parsing delle informazioni parent:', e);
        sessionStorage.removeItem('strapi_tree_parent_info');
      }
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.removeItem('strapi_tree_parent_info');
  };

  const handleAutoFill = () => {
    if (!parentInfo) return;

    // Cerca il campo parent nella pagina
    const parentFieldElement = document.querySelector(`input[name="${parentInfo.parentField}"]`) as HTMLInputElement;
    const parentSelectElement = document.querySelector(`select[name="${parentInfo.parentField}"]`) as HTMLSelectElement;
    
    // Cerca anche i componenti di relazione di Strapi (potrebbero avere strutture diverse)
    const relationElements = document.querySelectorAll(`[data-testid*="${parentInfo.parentField}"], [aria-label*="${parentInfo.parentField}"]`);

    if (parentFieldElement) {
      parentFieldElement.value = parentInfo.parentId.toString();
      parentFieldElement.dispatchEvent(new Event('input', { bubbles: true }));
      parentFieldElement.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (parentSelectElement) {
      parentSelectElement.value = parentInfo.parentId.toString();
      parentSelectElement.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (relationElements.length > 0) {
      // Per i campi di relazione di Strapi, potremmo dover fare qualcosa di più complesso
      console.log('Trovati elementi di relazione:', relationElements);
      alert(`Campo "${parentInfo.parentField}" trovato ma è un campo di relazione complesso. Seleziona manualmente "${parentInfo.parentLabel}" (ID: ${parentInfo.parentId}).`);
    } else {
      alert(`Campo "${parentInfo.parentField}" non trovato nella pagina. Assicurati che esista e seleziona manualmente "${parentInfo.parentLabel}" (ID: ${parentInfo.parentId}).`);
    }

    handleDismiss();
  };

  if (!isVisible || !parentInfo) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: '#28a745',
      color: 'white',
      padding: '16px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 10000,
      maxWidth: '350px',
      fontSize: '14px'
    }}>
      <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
        🌳 Creazione da TreeView
      </div>
      <div style={{ marginBottom: '12px' }}>
        Stai creando un figlio di:<br />
        <strong>"{parentInfo.parentLabel}"</strong>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleAutoFill}
          style={{
            background: 'white',
            color: '#28a745',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          Auto-compila
        </button>
        <button
          onClick={handleDismiss}
          style={{
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.5)',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Chiudi
        </button>
      </div>
    </div>
  );
};

export default ParentHelper;
