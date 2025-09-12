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

  // Funzione per fuzzy matching
  const fuzzyMatch = (text: string, pattern: string): boolean => {
    if (pattern.length === 0) return true;
    if (text.length === 0) return false;
    
    let patternIndex = 0;
    for (let i = 0; i < text.length && patternIndex < pattern.length; i++) {
      if (text[i] === pattern[patternIndex]) {
        patternIndex++;
      }
    }
    return patternIndex === pattern.length;
  };

  // Funzione per inserire automaticamente il parent nel campo relazione
  const autoFillRelationField = async (info: ParentInfo) => {
    console.log('🚀 Auto-compilazione SEMPLIFICATA per:', info);
    console.log('📋 Parent documentId:', info.parentId);
    console.log('📋 Parent label:', info.parentLabel);
    setStatus('loading');
    
    // Aspetta che la pagina sia completamente caricata
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      // Strategia DIRETTA: Usa il documentId del parent dal TreeView
      const success = await setDirectRelation(info);
      setStatus(success ? 'success' : 'manual');
      
    } catch (error) {
      console.error('❌ Errore nell\'auto-compilazione:', error);
      setStatus('manual');
    }
  };

  // Funzione SEMPLIFICATA per impostare la relazione usando direttamente il documentId
  const setDirectRelation = async (info: ParentInfo): Promise<boolean> => {
    try {
      console.log('🎯 Impostazione diretta della relazione');
      console.log('📋 DocumentId parent:', info.parentId);
      console.log('📋 Label parent:', info.parentLabel);
      
      const relationField = document.querySelector('input[name="pagina"][role="combobox"]') as HTMLInputElement;
      
      if (!relationField) {
        console.log('❌ Campo relazione non trovato');
        return false;
      }
      
      // Step 1: Focus sul campo
      console.log('🔧 Step 1: Focus sul campo relazione');
      relationField.focus();
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Step 2: Clicca per aprire il dropdown
      console.log('🔧 Step 2: Apertura dropdown');
      relationField.click();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 3: Digita il nome del parent per filtrare
      console.log('🔧 Step 3: Digitazione per filtrare:', info.parentLabel);
      relationField.value = info.parentLabel;
      relationField.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Step 4: Cerca le opzioni nel dropdown
      console.log('🔧 Step 4: Ricerca opzioni nel dropdown');
      const dropdownOptions = Array.from(document.querySelectorAll('[role="option"]'));
      
      console.log(`📋 Trovate ${dropdownOptions.length} opzioni nel dropdown`);
      dropdownOptions.forEach((option, index) => {
        const text = option.textContent?.trim() || '';
        console.log(`   ${index}: "${text}"`);
      });
      
      // Step 5: Trova e clicca l'opzione che corrisponde al parent
      for (const option of dropdownOptions) {
        const text = option.textContent?.trim() || '';
        if (text && text.toLowerCase().includes(info.parentLabel.toLowerCase())) {
          console.log('✅ Opzione trovata e cliccata:', text);
          (option as HTMLElement).click();
          await new Promise(resolve => setTimeout(resolve, 300));
          return true;
        }
      }
      
      // Step 6: Se non trova opzioni, prova con Enter
      console.log('� Step 6: Fallback con Enter');
      relationField.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Verifica se il campo è stato compilato
      if (relationField.value && relationField.value.toLowerCase().includes(info.parentLabel.toLowerCase())) {
        console.log('✅ Campo compilato con successo via Enter');
        return true;
      }
      
      console.log('❌ Impossibile impostare la relazione automaticamente');
      return false;
      
    } catch (error) {
      console.error('❌ Errore in setDirectRelation:', error);
      return false;
    }
  };

  // Funzione per impostare la relazione completa
  const setCompleteRelation = async (allParentData: any[], info: ParentInfo) => {
    try {
      console.log('🔍 Cercando parent con slug/label:', info.parentLabel);
      console.log('🔍 Dati parent disponibili:', allParentData.length, 'elementi');
      
      // Verifica che i dati parent siano stati caricati
      if (!allParentData || allParentData.length === 0) {
        console.log('❌ Nessun dato parent disponibile');
        return false;
      }

      // Trova il parent corrispondente nello slug o nel titolo
      const parentSlug = info.parentLabel; // parentLabel dovrebbe contenere lo slug
      const parentItem = allParentData.find(item => 
        (item.slug && item.slug.toLowerCase() === parentSlug.toLowerCase()) ||
        (item.titolo && item.titolo.toLowerCase() === parentSlug.toLowerCase()) ||
        (item.title && item.title.toLowerCase() === parentSlug.toLowerCase())
      );

      console.log('🎯 Parent cercato:', parentSlug);
      console.log('🎯 Parent trovato:', parentItem);

      if (!parentItem) {
        console.log(`❌ Parent "${parentSlug}" non trovato nei dati:`, allParentData.map(p => ({ 
          id: p.id, 
          slug: p.slug, 
          titolo: p.titolo || p.title,
          publishedAt: p.publishedAt 
        })));
        // Messaggio utente semplificato 
        console.log(`⚠️ Parent "${parentSlug}" non trovato nel database. Potrebbe non essere pubblicato. Selezione manuale richiesta.`);
        return false;
      }

      const relationField = document.querySelector('input[name="pagina"][role="combobox"]') as HTMLInputElement;
      
      if (relationField) {
        console.log('🎯 Usando strategia super migliorata');
        
        const parentLabel = parentItem.titolo || parentItem.title || parentSlug;
        const parentId = parentItem.documentId || parentItem.id;
        console.log('📝 Parent label:', parentLabel, 'ID:', parentId);
        
        // Step 1: Focus e attivazione del campo
        console.log('🔧 Step 1: Attivazione campo relazione...');
        relationField.focus();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Step 2: Clicca direttamente sul campo per assicurarsi che il dropdown si apra
        console.log('🔧 Step 2: Click sul campo per aprire dropdown...');
        relationField.click();
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Step 3: Svuota il campo e digita per attivare il filtro
        console.log('🔧 Step 3: Digitazione per filtrare...');
        relationField.value = '';
        relationField.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Digita il nome del parent per filtrare
        relationField.value = parentLabel;
        relationField.dispatchEvent(new Event('input', { bubbles: true }));
        relationField.dispatchEvent(new KeyboardEvent('keyup', { key: parentLabel.charAt(parentLabel.length - 1), bubbles: true }));
        
        console.log('⏳ Aspettando che il dropdown si carichi...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Step 4: Cerca opzioni più specificamente nel dropdown del campo relazione
        console.log('🔧 Step 4: Ricerca opzioni nel dropdown specifico...');
        
        // Selettori più specifici per Strapi relation dropdown
        const dropdownSelectors = [
          `input[name="pagina"] + div [role="option"]`,
          `input[name="pagina"] ~ div [role="option"]`,
          `.react-select__menu [role="option"]`,
          `[data-testid*="combobox"] [role="option"]`,
          `div[class*="menu"] [role="option"]`,
          `div[class*="dropdown"] [role="option"]`
        ];
        
        let dropdownOptions: Element[] = [];
        let usedSelector = '';
        
        for (const selector of dropdownSelectors) {
          dropdownOptions = Array.from(document.querySelectorAll(selector));
          if (dropdownOptions.length > 0) {
            usedSelector = selector;
            console.log(`📋 Trovate ${dropdownOptions.length} opzioni con selettore: ${selector}`);
            break;
          }
        }
        
        if (dropdownOptions.length === 0) {
          console.log('⚠️ Nessuna opzione trovata con selettori specifici, provo selettore generico...');
          
          // Fallback: cerca tutte le opzioni e filtra per vicinanza al campo
          const allOptions = Array.from(document.querySelectorAll('[role="option"]'));
          const fieldRect = relationField.getBoundingClientRect();
          
          // Filtra opzioni che sono vicine al campo (entro 200px)
          dropdownOptions = allOptions.filter(option => {
            const optionRect = option.getBoundingClientRect();
            const distance = Math.abs(optionRect.top - fieldRect.bottom);
            return distance < 200;
          });
          
          console.log(`📋 Filtrate ${dropdownOptions.length} opzioni vicine al campo`);
        }
        
        console.log('🔍 Opzioni nel dropdown specifico:');
        dropdownOptions.forEach((option, index) => {
          const text = option.textContent?.trim() || '';
          console.log(`   ${index}: "${text}"`);
        });
        
        // Step 5: Cerca e clicca l'opzione corretta
        let optionFound = false;
        
        console.log('🔍 Analizzando opzioni per trovare match...');
        console.log('🎯 Cerco parent:', parentLabel);
        console.log('📋 Opzioni disponibili:', dropdownOptions.map(opt => opt.textContent?.trim()).filter(text => text));
        
        if (dropdownOptions.length === 0) {
          console.log('⚠️ Nessuna opzione nel dropdown - parent potrebbe non esistere');
          // Prova con Enter per confermare il testo digitato
          console.log('🔧 Provo con Enter per confermare...');
          relationField.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
          relationField.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Verifica se Enter ha funzionato
          if (relationField.value && relationField.value.toLowerCase().includes(parentLabel.toLowerCase())) {
            console.log('✅ Enter ha funzionato - parent confermato!');
            optionFound = true;
          } else {
            console.log('❌ Parent non trovato nel database. Potrebbe non essere pubblicato o non esistere.');
          }
        } else if (dropdownOptions.length === 1) {
          // Se c'è solo un'opzione, selezionala automaticamente
          const singleOption = dropdownOptions[0];
          const singleText = singleOption.textContent?.trim() || '';
          console.log('✅ Una sola opzione disponibile, la seleziono:', singleText);
          (singleOption as HTMLElement).click();
          optionFound = true;
        } else if (dropdownOptions.length > 1) {
          // Se ci sono più opzioni, cerca quella giusta
          for (const option of dropdownOptions) {
            const text = option.textContent?.trim() || '';
            
            if (text && text.length > 0) {
              // Ricerca molto più flessibile
              const textLower = text.toLowerCase();
              const labelLower = parentLabel.toLowerCase();
              
              if (
                textLower === labelLower ||                           // Corrispondenza esatta
                textLower.includes(labelLower) ||                    // Il testo contiene il label
                labelLower.includes(textLower) ||                    // Il label contiene il testo
                textLower.replace(/\s+/g, '') === labelLower.replace(/\s+/g, '') || // Senza spazi
                fuzzyMatch(textLower, labelLower)                    // Match fuzzy
              ) {
                console.log('✅ Opzione trovata con match flessibile:', text);
                (option as HTMLElement).click();
                optionFound = true;
                break;
              }
            }
          }
          
          // Se non trova match specifico, prova a selezionare la prima opzione non vuota
          if (!optionFound) {
            const firstNonEmptyOption = dropdownOptions.find(opt => 
              opt.textContent?.trim() && opt.textContent.trim().length > 0
            );
            
            if (firstNonEmptyOption) {
              const firstText = firstNonEmptyOption.textContent?.trim() || '';
              console.log('🎯 Nessun match specifico, seleziono la prima opzione valida:', firstText);
              (firstNonEmptyOption as HTMLElement).click();
              optionFound = true;
            }
          }
        }
        
        if (!optionFound) {
          console.log('❌ Opzione non trovata, provo strategia fallback...');
          
          // Fallback: Usa strategia di selezione con eventi React
          console.log('🔧 Fallback: Strategia eventi React diretti...');
          
          // Trova il contenitore del campo
          const fieldContainer = relationField.closest('[data-testid], .field, .form-group, .react-select') || relationField.parentElement;
          
          // Imposta valori diretti
          relationField.value = parentLabel;
          
          // Crea un evento di selezione simulato
          const syntheticEvent = {
            target: { name: 'pagina', value: { documentId: parentId, id: parentId } },
            persist: () => {},
          };
          
          // Triggera eventi nell'ordine corretto
          relationField.dispatchEvent(new Event('focus', { bubbles: true }));
          relationField.dispatchEvent(new Event('input', { bubbles: true }));
          relationField.dispatchEvent(new Event('change', { bubbles: true }));
          
          // Simula evento di selezione React
          const selectEvent = new CustomEvent('select', { 
            detail: { 
              value: { documentId: parentId, id: parentId },
              label: parentLabel 
            },
            bubbles: true 
          });
          relationField.dispatchEvent(selectEvent);
          
          // Finalizza con blur
          await new Promise(resolve => setTimeout(resolve, 300));
          relationField.blur();
        }
        
        // Step 6: Verifica finale
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const finalValue = relationField.value;
        const fieldContainer = relationField.closest('[data-testid], .field, .form-group, .react-select');
        const hiddenInputs = fieldContainer?.querySelectorAll('input[type="hidden"]') || [];
        const hasValidValue = hiddenInputs.length > 0 && Array.from(hiddenInputs).some(input => 
          (input as HTMLInputElement).value && (input as HTMLInputElement).value !== ''
        );
        
        console.log('🔍 Verifica finale dettagliata:', {
          finalValue,
          hiddenInputsCount: hiddenInputs.length,
          hasValidValue,
          expectedLabel: parentLabel,
          usedSelector
        });
        
        if ((finalValue && finalValue.includes(parentLabel)) || hasValidValue) {
          console.log('✅ Strategia super migliorata riuscita!');
          setTimeout(() => handleDismiss(), 2000);
          return true;
        }
        
        console.log('❌ Strategia super migliorata fallita, campo pronto per uso manuale');
        setStatus('manual');
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
            🔧 Parent "{parentInfo.parentLabel}" non trovato automaticamente.<br/>
            Verifica che esista e sia pubblicato, oppure seleziona manualmente dal campo "pagina" qui sopra.
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
