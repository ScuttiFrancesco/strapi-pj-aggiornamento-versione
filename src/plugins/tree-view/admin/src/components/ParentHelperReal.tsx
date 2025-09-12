import React, { useEffect, useState } from 'react';

interface ParentInfo {
  parentId: string;
  parentDocumentId: string;
  parentLabel: string;
  parentSlug: string;
}

// Variabile globale per memorizzare la parentInfo per l'intercettore
let globalParentInfo: ParentInfo | null = null;

export const ParentHelperReal: React.FC = () => {
  const [parentInfo, setParentInfo] = useState<ParentInfo | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'manual' | 'error'>('loading');
  const [isVisible, setIsVisible] = useState(true);

  // DEBUG: Log quando il component si monta
  useEffect(() => {
    console.log('🚀 ParentHelperReal MONTATO');
  }, []);

  useEffect(() => {
    const handleParentSelection = async () => {
      console.log('🔍 ParentHelper avviato, controllo sessionStorage...');
      
      // Controlla entrambe le chiavi possibili
      let parentInfoString = sessionStorage.getItem('parentInfo') || sessionStorage.getItem('strapi_tree_parent_info');
      
      if (!parentInfoString) {
        console.log('📭 Nessuna parentInfo in sessionStorage');
        setIsVisible(false);
        return;
      }

      try {
        const info = JSON.parse(parentInfoString);
        console.log('📥 ParentHelper ricevuto:', info);
        
        setParentInfo(info);
        globalParentInfo = info; // Salva globalmente per l'intercettore
        
        // Rimuovi da entrambe le chiavi
        sessionStorage.removeItem('parentInfo');
        sessionStorage.removeItem('strapi_tree_parent_info');

        // Attesa più breve per test
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log('🚀 Configurando intercettore salvataggio...');
        const success = await setupSaveInterceptor(info);
        
        console.log('📊 Risultato setup:', success ? 'SUCCESS' : 'FAILED');
        setStatus(success ? 'success' : 'manual');
        
        if (success) {
          console.log('✅ Intercettore configurato!');
          setTimeout(() => setIsVisible(false), 8000);
        } else {
          console.log('❌ Setup intercettore fallito');
        }
        
      } catch (error) {
        console.error('❌ ERRORE nel parsing delle informazioni parent:', error);
        setStatus('error');
        setTimeout(() => setIsVisible(false), 5000);
      }
    };

    handleParentSelection();
  }, []);

  // Funzione per impostare l'intercettore del salvataggio
  const setupSaveInterceptor = async (info: ParentInfo): Promise<boolean> => {
    try {
      console.log('🎯 SETUP INTERCETTORE SALVATAGGIO per:', info.parentLabel);
      
      // Imposta l'intercettore fetch globale
      interceptFetchRequests(info);
      
      // Aspetta che la pagina sia caricata
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Trova i pulsanti di salvataggio
      const saveButtons = document.querySelectorAll('button[type="submit"], button:contains("Save"), button:contains("Publish"), [data-testid*="submit"]');
      console.log(`🔍 Trovati ${saveButtons.length} pulsanti di salvataggio potenziali`);
      
      // Trova più specificamente i pulsanti
      const allButtons = document.querySelectorAll('button');
      let realSaveButtons: Element[] = [];
      
      allButtons.forEach(button => {
        const text = button.textContent?.toLowerCase() || '';
        const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
        
        if (text.includes('save') || text.includes('publish') || text.includes('salva') || 
            ariaLabel.includes('save') || ariaLabel.includes('publish')) {
          realSaveButtons.push(button);
          console.log(`🎯 Pulsante salvaggio trovato: "${button.textContent}" (aria-label: "${button.getAttribute('aria-label')}")`);
        }
      });
      
      if (realSaveButtons.length === 0) {
        console.log('❌ Nessun pulsante di salvataggio trovato');
        return false;
      }

      // Aggiungi listener a tutti i pulsanti potenziali
      let interceptorAdded = false;
      
      realSaveButtons.forEach((button, index) => {
        console.log(`🎯 Aggiungendo interceptor al pulsante ${index + 1}: "${button.textContent}"`);
        
        button.addEventListener('click', async (event) => {
          console.log('💾 INTERCETTATO CLICK SALVATAGGIO!');
          console.log('🔗 Forzando relazione parent:', info.parentLabel);
          
          // Non prevenire il comportamento default, lascia che il salvataggio proceda
          // L'intercettore fetch si occuperà di modificare il payload
        }, { capture: true });
        
        interceptorAdded = true;
      });

      console.log('✅ Intercettori aggiunti con successo');
      return true;

    } catch (error) {
      console.error('❌ ERRORE nel setup intercettore:', error);
      return false;
    }
  };

  // Funzione per intercettare le richieste fetch e modificare il payload
  const interceptFetchRequests = (info: ParentInfo): void => {
    console.log('🌐 Configurando intercettore richieste fetch...');
    
    // Controlla se l'intercettore è già stato impostato
    if ((window as any).__strapiParentInterceptorSet) {
      console.log('⚠️ Intercettore già impostato, skip');
      return;
    }
    
    // Salva il fetch originale
    const originalFetch = window.fetch;
    
    // Sostituisci fetch con la nostra versione che modifica il payload
    window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const url = typeof input === 'string' ? input : input.toString();
      
      // Controlla se è una richiesta di salvataggio per le pagine
      if (url.includes('/api/') && url.includes('pagina') && init?.method === 'POST') {
        console.log('💾 RICHIESTA DI SALVATAGGIO PAGINA INTERCETTATA!');
        console.log('🔗 Forzando relazione parent nel payload:', info.parentLabel);
        
        try {
          let bodyData: any = {};
          
          // Parse del body esistente
          if (init.body) {
            if (typeof init.body === 'string') {
              bodyData = JSON.parse(init.body);
            }
          }
          
          console.log('📦 Body originale:', bodyData);
          
          // Forza la relazione parent nel payload
          if (!bodyData.data) bodyData.data = {};
          
          // Imposta la relazione parent
          bodyData.data.pagina = {
            connect: [{
              id: info.parentId,
              documentId: info.parentDocumentId
            }]
          };
          
          console.log('📦 Body modificato con relazione:', bodyData);
          
          // Aggiorna il body della richiesta
          const modifiedInit = {
            ...init,
            body: JSON.stringify(bodyData)
          };
          
          console.log('🚀 Inviando richiesta con relazione forzata...');
          return originalFetch.call(this, input, modifiedInit);
          
        } catch (error) {
          console.error('❌ ERRORE nella modifica del payload:', error);
          console.log('⚠️ Procedo con richiesta originale');
        }
      }
      
      // Per tutte le altre richieste, usa il fetch originale
      return originalFetch.call(this, input, init);
    };
    
    // Marca che l'intercettore è stato impostato
    (window as any).__strapiParentInterceptorSet = true;
    console.log('✅ Intercettore fetch configurato');
  };

  // Funzione per fare una VERA SELEZIONE nel dropdown
  const setRelationWithRealData = async (info: ParentInfo): Promise<boolean> => {
    try {
      console.log('🎯 SELEZIONE REALE DROPDOWN per:', info.parentLabel);
      
      // Aspetta che la pagina sia completamente caricata
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 1. Trova il campo relazione
      const relationField = document.querySelector('input[name="pagina"][role="combobox"]') as HTMLInputElement;
      if (!relationField) {
        console.log('❌ Campo relazione non trovato');
        return false;
      }

      console.log('✅ Campo relazione trovato');

      // 2. FOCUS sul campo per attivarlo
      console.log('📍 Focus sul campo relazione');
      relationField.focus();
      await new Promise(resolve => setTimeout(resolve, 300));

      // 3. CANCELLA eventuali valori e prepara per ricerca
      console.log('✏️ Cancello e preparo per ricerca');
      relationField.value = '';
      relationField.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 200));

      // Dichiara options qui per evitare errori di scope
      let options: NodeListOf<Element>;

      // 4. RICERCA PRECISA: Se abbiamo documentId, usalo per ricerca specifica
      if (info.parentDocumentId && info.parentDocumentId !== info.parentId) {
        console.log('📋 Ricerca precisa con documentId:', info.parentDocumentId);
        
        relationField.value = info.parentDocumentId;
        relationField.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Controlla se questo ha trovato risultati
        let preciseOptions = document.querySelectorAll('[role="option"]');
        if (preciseOptions.length > 0) {
          console.log(`✅ Ricerca precisa ha trovato ${preciseOptions.length} opzioni`);
          options = preciseOptions;
        } else {
          // Fallback alla ricerca per nome
          console.log('⚠️ Ricerca per documentId non ha dato risultati, provo con nome');
          relationField.value = '';
          relationField.dispatchEvent(new Event('input', { bubbles: true }));
          await new Promise(resolve => setTimeout(resolve, 200));
          
          relationField.value = info.parentLabel;
          relationField.dispatchEvent(new Event('input', { bubbles: true }));
          await new Promise(resolve => setTimeout(resolve, 800));
          
          options = document.querySelectorAll('[role="option"]');
        }
      } else {
        // Ricerca normale per nome
        console.log('📝 Ricerca per nome:', info.parentLabel);
        relationField.value = info.parentLabel;
        relationField.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(resolve => setTimeout(resolve, 800));
        options = document.querySelectorAll('[role="option"]');
      }

      console.log(`📋 Trovate ${options.length} opzioni dopo ricerca`);
      
      // Se non ci sono opzioni, prova diversi metodi per aprire il dropdown
      if (options.length === 0) {
        console.log('🖱️ Provo a cliccare per aprire dropdown');
        
        // Metodo 1: Click sul campo
        relationField.click();
        await new Promise(resolve => setTimeout(resolve, 400));
        
        options = document.querySelectorAll('[role="option"]');
        console.log(`📋 Dopo click campo: ${options.length} opzioni`);
        
        // Metodo 2: Click su freccia dropdown se esiste
        if (options.length === 0) {
          const dropdownButton = relationField.parentElement?.querySelector('button, [role="button"], .dropdown-toggle');
          if (dropdownButton) {
            console.log('🔽 Trovato pulsante dropdown, cliccando...');
            (dropdownButton as HTMLElement).click();
            await new Promise(resolve => setTimeout(resolve, 400));
            
            options = document.querySelectorAll('[role="option"]');
            console.log(`📋 Dopo click pulsante: ${options.length} opzioni`);
          }
        }
        
        // Metodo 3: Eventi keyboard per aprire dropdown
        if (options.length === 0) {
          console.log('⌨️ Provo con eventi keyboard');
          relationField.dispatchEvent(new KeyboardEvent('keydown', { 
            key: 'ArrowDown', 
            code: 'ArrowDown', 
            bubbles: true 
          }));
          await new Promise(resolve => setTimeout(resolve, 400));
          
          options = document.querySelectorAll('[role="option"]');
          console.log(`📋 Dopo ArrowDown: ${options.length} opzioni`);
        }
      }

      if (options.length === 0) {
        console.log('❌ Impossibile aprire dropdown - nessuna opzione trovata');
        return false;
      }

      // 5. TROVA l'opzione che corrisponde al nostro parent usando documentId
      let targetOption: Element | null = null;
      
      console.log('🔍 Cerco opzione con documentId:', info.parentDocumentId || info.parentId);
      console.log('🔍 Nome da cercare:', info.parentLabel);
      
      for (let i = 0; i < options.length; i++) {
        const option = options[i];
        const optionText = option.textContent?.trim();
        
        // Cerca per documentId negli attributi data
        const optionDocumentId = option.getAttribute('data-document-id') || 
                                option.getAttribute('data-id') ||
                                option.getAttribute('data-value');
        
        console.log(`  ${i + 1}. "${optionText}" (documentId: ${optionDocumentId})`);
        
        // Confronta prima per documentId se disponibile
        if (optionDocumentId && (optionDocumentId === info.parentDocumentId || optionDocumentId === info.parentId)) {
          targetOption = option;
          console.log(`✅ OPZIONE TROVATA per documentId alla posizione ${i + 1}: "${optionText}"`);
          break;
        }
        
        // Fallback: confronta per nome se il documentId non matcha
        if (optionText?.toLowerCase() === info.parentLabel.toLowerCase()) {
          targetOption = option;
          console.log(`✅ OPZIONE TROVATA per nome alla posizione ${i + 1}: "${optionText}"`);
          // Non fare break qui, continua a cercare per documentId
        }
      }

      if (!targetOption) {
        console.log('❌ Opzione target non trovata');
        console.log('🔍 Debug - informazioni ricerca:');
        console.log('  - documentId cercato:', info.parentDocumentId || info.parentId);
        console.log('  - nome cercato:', info.parentLabel);
        console.log('📝 Opzioni disponibili:');
        Array.from(options).forEach((opt, i) => {
          const optText = opt.textContent?.trim();
          const optId = opt.getAttribute('data-document-id') || opt.getAttribute('data-id') || opt.getAttribute('data-value');
          console.log(`  ${i + 1}. "${optText}" (id: ${optId})`);
          
          // Log tutti gli attributi dell'opzione per debug
          const attrs = Array.from(opt.attributes).map(attr => `${attr.name}="${attr.value}"`).join(', ');
          console.log(`    Attributi: ${attrs}`);
        });
        return false;
      }

      // 6. CLICCA l'opzione per selezionarla VERAMENTE
      console.log('�️ CLICCANDO OPZIONE PER SELEZIONE REALE...');
      
      // Sequenza completa di eventi mouse per simulare click umano
      const targetElement = targetOption as HTMLElement;
      
      // Mouse enter per hover
      targetElement.dispatchEvent(new MouseEvent('mouseenter', { 
        bubbles: true, 
        cancelable: true 
      }));
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Mouse down
      targetElement.dispatchEvent(new MouseEvent('mousedown', { 
        bubbles: true, 
        cancelable: true,
        button: 0
      }));
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Mouse up
      targetElement.dispatchEvent(new MouseEvent('mouseup', { 
        bubbles: true, 
        cancelable: true,
        button: 0
      }));
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Click finale
      targetElement.click();
      console.log('✅ Sequenza click completata');
      
      // 7. VERIFICA che la selezione sia avvenuta
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Cerca elementi che indicano selezione avvenuta
      const selectionIndicators = [
        'button[aria-label*="Remove"]',
        '[data-strapi-field="pagina"] .tag',
        '[data-strapi-field="pagina"] .chip',
        '[data-strapi-field="pagina"] .selection',
        '.selected-item',
        '.relation-item'
      ];
      
      let hasRealSelection = false;
      let selectionElement = null;
      
      for (const selector of selectionIndicators) {
        selectionElement = document.querySelector(selector);
        if (selectionElement) {
          hasRealSelection = true;
          console.log(`✅ Trovato indicatore selezione: ${selector}`);
          console.log('� Contenuto elemento:', selectionElement.textContent?.trim());
          break;
        }
      }
      
      // Controlla anche se il valore del campo è cambiato
      const finalFieldValue = relationField.value;
      console.log('🔍 Stato finale campo:', finalFieldValue);
      
      if (hasRealSelection) {
        console.log('🎉 SELEZIONE REALE CONFERMATA! Relazione creata correttamente');
        return true;
      } else if (finalFieldValue && finalFieldValue !== 'Add or create a relation' && finalFieldValue.includes(info.parentLabel)) {
        console.log('✅ Valore nel campo sembra corretto, anche se non vedo indicatori visivi');
        return true;
      } else {
        console.log('❌ Selezione non confermata - nessun indicatore trovato');
        console.log('🔍 Debug - stato DOM dopo selezione:');
        console.log('  - Valore campo:', finalFieldValue);
        console.log('  - Campo stesso:', relationField.outerHTML.substring(0, 200));
        return false;
      }

    } catch (error) {
      console.error('❌ ERRORE nella selezione dropdown:', error);
      return false;
    }
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      backgroundColor: status === 'success' ? '#4CAF50' : 
                     status === 'error' ? '#f44336' : 
                     status === 'manual' ? '#ff9800' : '#2196F3',
      color: 'white',
      padding: '10px 15px',
      borderRadius: '5px',
      zIndex: 9999,
      boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
      fontSize: '14px',
      maxWidth: '300px'
    }}>
      {status === 'loading' && (
        <div>
          🔄 Creazione relazione parent...
          {parentInfo && <div>Parent: {parentInfo.parentLabel}</div>}
        </div>
      )}
      {status === 'success' && (
        <div>
          ✅ Relazione creata automaticamente!
          <div>Parent: {parentInfo?.parentLabel}</div>
        </div>
      )}
      {status === 'manual' && (
        <div>
          ⚠️ Relazione non creata automaticamente
          <div>Seleziona: {parentInfo?.parentLabel}</div>
        </div>
      )}
      {status === 'error' && (
        <div>❌ Errore nella creazione relazione</div>
      )}
    </div>
  );
};
