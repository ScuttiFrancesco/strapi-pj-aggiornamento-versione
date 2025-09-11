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
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'manual'>('loading');

  // Funzione per inserire automaticamente il parent nel campo relazione
  const autoFillRelationField = async (info: ParentInfo) => {
    console.log('🚀 Iniziando auto-compilazione per:', info);
    setStatus('loading');
    
    // Aspetta che la pagina sia completamente caricata
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      // Strategia principale: Usa l'API di Strapi per ottenere i dati della relazione
      const parentData = await fetchParentData(info.parentId, info.contentType);
      
      if (parentData) {
        console.log('📦 Dati parent ottenuti:', parentData);
        const success = await setCompleteRelation(parentData, info);
        if (success) {
          setStatus('success');
          return;
        }
      }
      
      console.log('❌ Dati parent non trovati, fallback al metodo click');
      const success = await fallbackClickMethod(info);
      if (!success) {
        setStatus('manual'); // Nuovo stato per indicare selezione manuale
      } else {
        setStatus('success');
      }
      
    } catch (error) {
      console.error('❌ Errore nell\'auto-compilazione:', error);
      const success = await fallbackClickMethod(info);
      setStatus(success ? 'success' : 'manual');
    }
  };

  // Funzione per ottenere i dati del parent tramite API
  const fetchParentData = async (parentId: string | number, contentType: string) => {
    try {
      // Per Strapi v5, usa documentId direttamente nell'URL se è una stringa
      // altrimenti usa filtri per ID numerico
      // Trasforma api::pagina.pagina in paginas
      const endpointBase = contentType.replace('api::', '').split('.')[0] + 's';
      
      let response;
      if (typeof parentId === 'string' && parentId.length > 10) {
        // Se parentId è una stringa lunga, probabilmente è un documentId
        response = await fetch(`/api/${endpointBase}/${parentId}?populate=*`);
      } else {
        // Se è numerico, usa i filtri
        response = await fetch(`/api/${endpointBase}?filters[id][$eq]=${parentId}&populate=*`);
      }
      
      if (response.ok) {
        const data = await response.json();
        // Se è una chiamata diretta con documentId, restituisce data.data
        // Se è una chiamata con filtri, restituisce data.data[0]
        return data.data?.length !== undefined ? data.data[0] : data.data;
      }
    } catch (error) {
      console.error('Errore nel fetch dei dati parent:', error);
    }
    return null;
  };

  // Funzione per impostare la relazione completa
  const setCompleteRelation = async (parentData: any, info: ParentInfo) => {
    try {
      const relationField = document.querySelector('input[name="pagina"][role="combobox"]') as HTMLInputElement;
      
      if (relationField) {
        console.log('🎯 Usando strategia diretta senza dropdown');
        
        const parentLabel = parentData.attributes?.titolo || parentData.attributes?.title || info.parentLabel;
        const parentId = parentData.documentId || parentData.id;
        console.log('📝 Parent label:', parentLabel, 'ID:', parentId);
        
        // Strategia diretta: Imposta il valore senza mai attivare il dropdown
        console.log('🔧 Impostazione diretta del valore...');
        
        // Imposta il valore direttamente
        relationField.value = parentLabel;
        
        // Cerca campi correlati
        const hiddenField = relationField.parentElement?.querySelector('input[type="hidden"]') as HTMLInputElement;
        const displayField = relationField.closest('div')?.querySelector('input[readonly]') as HTMLInputElement;
        
        if (hiddenField) {
          hiddenField.value = parentId.toString();
          console.log('✅ Campo hidden impostato');
        }
        
        if (displayField) {
          displayField.value = parentLabel;
          console.log('✅ Campo display impostato');
        }
        
        // Trigger solo evento di input minimale
        relationField.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Attendi stabilizzazione
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verifica se funziona
        if (relationField.value === parentLabel || displayField?.value === parentLabel) {
          console.log('✅ Strategia diretta riuscita!');
          setTimeout(() => handleDismiss(), 2000);
          return true;
        }
        
        console.log('❌ Strategia diretta fallita, resetto campo');
        await resetRelationField(relationField);
        return false;
      }
      
      return false;
    } catch (error) {
      console.error('Errore in setCompleteRelation:', error);
      return false;
    }
  };

  // Funzione per resettare il campo relation e renderlo utilizzabile manualmente
  const resetRelationField = async (relationField: HTMLInputElement) => {
    try {
      console.log('🔄 Resetting campo relation per uso manuale...');
      
      // Svuota il campo
      relationField.value = '';
      
      // Rimuovi focus
      relationField.blur();
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Trigger di eventi per "resettare" lo stato interno
      relationField.dispatchEvent(new Event('input', { bubbles: true }));
      relationField.dispatchEvent(new Event('change', { bubbles: true }));
      relationField.dispatchEvent(new Event('blur', { bubbles: true }));
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Re-enable il campo se era disabilitato
      relationField.removeAttribute('disabled');
      relationField.removeAttribute('readonly');
      
      console.log('✅ Campo relation resettato e pronto per uso manuale');
      
      // Aggiungi un messaggio per l'utente
      const parentInfo = JSON.parse(sessionStorage.getItem('strapi_tree_parent_info') || '{}');
      if (parentInfo.parentLabel) {
        console.log(`💡 Suggerimento: Cerca manualmente "${parentInfo.parentLabel}" nel campo relation`);
      }
      
    } catch (error) {
      console.error('Errore durante reset campo relation:', error);
    }
  };

  // Metodo di fallback con click
  const fallbackClickMethod = async (info: ParentInfo): Promise<boolean> => {
    const relationField = document.querySelector('input[name="pagina"][role="combobox"]') as HTMLInputElement;
    
    if (relationField) {
      console.log('🔄 Usando metodo click fallback');
      
      // Clicca sul campo per aprire il dropdown
      relationField.click();
      relationField.focus();
      
      // Aspetta che il dropdown si apra
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Cerca l'elemento parent nel dropdown
      const dropdownOptions = document.querySelectorAll('[role="option"], li, [data-value], [role="menuitem"]');
      let parentFound = false;
      
      console.log('🔍 Cercando nel dropdown:', info.parentLabel);
      console.log('🔍 Opzioni trovate nel dropdown:');
      
      dropdownOptions.forEach((option, index) => {
        const text = option.textContent?.trim() || '';
        console.log(`   ${index}: "${text}"`);
        
        // Cerca con diverse strategie:
        // 1. Esatta corrispondenza
        if (text === info.parentLabel) {
          console.log('✅ Parent trovato (corrispondenza esatta):', text);
          (option as HTMLElement).click();
          parentFound = true;
          return;
        }
        
        // 2. Contiene il testo
        if (text.includes(info.parentLabel)) {
          console.log('✅ Parent trovato (contiene):', text);
          (option as HTMLElement).click();
          parentFound = true;
          return;
        }
        
        // 3. Ricerca case-insensitive
        if (text.toLowerCase().includes(info.parentLabel.toLowerCase())) {
          console.log('✅ Parent trovato (case-insensitive):', text);
          (option as HTMLElement).click();
          parentFound = true;
          return;
        }
        
        // 4. Ricerca fuzzy - rimuove spazi extra e confronta
        const normalizedText = text.replace(/\s+/g, ' ').trim();
        const normalizedLabel = info.parentLabel.replace(/\s+/g, ' ').trim();
        if (normalizedText.toLowerCase().includes(normalizedLabel.toLowerCase())) {
          console.log('✅ Parent trovato (fuzzy):', text, '→', normalizedText);
          (option as HTMLElement).click();
          parentFound = true;
          return;
        }
      });
      
      if (parentFound) {
        console.log('✅ Parent selezionato con successo tramite click!');
        setTimeout(() => {
          handleDismiss();
        }, 2000);
        return true;
      } else {
        console.log('❌ Parent non trovato nel dropdown');
        
        // Reset del campo per uso manuale
        await resetRelationField(relationField);
        
        // Mostra messaggio informativo invece di alert invasivo
        console.log(`💡 Suggerimento: Seleziona manualmente "${info.parentLabel}" nel campo relation`);
        return false;
      }
    }
    return false;
  };

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
          
          // Prova a compilare automaticamente il campo dopo un breve delay
          setTimeout(() => {
            autoFillRelationField(info);
          }, 1000); // Ridotto a 1 secondo
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
        🌳 Auto-compilazione da TreeView
        {status === 'loading' && ' ⏳'}
        {status === 'success' && ' ✅'}
        {status === 'error' && ' ❌'}
        {status === 'manual' && ' 🔧'}
      </div>
      <div style={{ marginBottom: '12px' }}>
        Impostando come parent:<br />
        <strong>"{parentInfo.parentLabel}"</strong>
        {status === 'loading' && (
          <div style={{ marginTop: '8px', color: '#ffc107', fontSize: '12px' }}>
            Compilazione automatica in corso...
          </div>
        )}
        {status === 'success' && (
          <div style={{ marginTop: '8px', color: '#90EE90', fontSize: '12px' }}>
            ✅ Relazione impostata automaticamente!
          </div>
        )}
        {status === 'manual' && (
          <div style={{ marginTop: '8px', color: '#87CEEB', fontSize: '12px' }}>
            🔧 Campo pronto per selezione manuale. Clicca sul campo "pagina" qui sopra per selezionare.
          </div>
        )}
        {status === 'error' && (
          <div style={{ marginTop: '8px', color: '#ffcccb', fontSize: '12px' }}>
            Auto-compilazione fallita. Usa i pulsanti qui sotto.
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {status !== 'loading' && (
          <>
            <button
              onClick={() => {
                if (parentInfo) {
                  autoFillRelationField(parentInfo);
                }
              }}
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
          onClick={() => {
            // Strategia migliorata per trovare il campo di relazione
            let found = false;
            
            // 1. Cerca bottoni con testo "Add or create a relation"
            const allButtons = document.querySelectorAll('button, div[role="button"], span[role="button"]');
            allButtons.forEach(btn => {
              const text = btn.textContent?.toLowerCase() || '';
              if (text.includes('add') && (text.includes('relation') || text.includes('create'))) {
                (btn as HTMLElement).click();
                found = true;
                console.log('Clicked relation button:', btn);
              }
            });
            
            // 2. Cerca dropdown/combobox del campo pagina
            if (!found) {
              const dropdowns = document.querySelectorAll('div[role="combobox"], select');
              dropdowns.forEach(dropdown => {
                const parent = dropdown.closest('div');
                if (parent) {
                  const label = parent.querySelector('label');
                  if (label && label.textContent?.toLowerCase().includes('pagina')) {
                    (dropdown as HTMLElement).click();
                    found = true;
                    console.log('Clicked pagina dropdown:', dropdown);
                  }
                }
              });
            }
            
            // 3. Cerca elementi che contengono il placeholder text
            if (!found) {
              const placeholderElements = document.querySelectorAll('*');
              placeholderElements.forEach(el => {
                const text = el.textContent?.toLowerCase() || '';
                if (text.includes('add or create a relation')) {
                  (el as HTMLElement).click();
                  found = true;
                  console.log('Clicked placeholder element:', el);
                }
              });
            }
            
            if (!found) {
              alert('Campo di relazione non trovato. Prova a cliccare manualmente sul campo "pagina".');
            }
          }}
          style={{
            background: 'rgba(255,255,255,0.9)',
            color: '#007bff',
            border: '1px solid rgba(255,255,255,0.5)',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Apri relazione
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
        </>
        )}
      </div>
    </div>
  );
};

export default ParentHelper;
