import React, { useEffect, useState } from 'react';

interface ParentInfo {
  parentId: string;
  parentDocumentId: string;
  parentLabel: string;
  parentSlug: string;
}

// Variabile globale per memorizzare la parentInfo per l'intercettore
let globalParentInfo: ParentInfo | null = null;

export const ParentHelperIntercept: React.FC = () => {
  const [parentInfo, setParentInfo] = useState<ParentInfo | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'manual' | 'error'>('loading');
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    console.log('🚀 ParentHelperIntercept MONTATO');
  }, []);

  useEffect(() => {
    const handleParentSelection = async () => {
      console.log('🔍 ParentHelper avviato, controllo sessionStorage...');
      
      const parentInfoString = sessionStorage.getItem('parentInfo');
      
      if (!parentInfoString) {
        console.log('📭 Nessuna parentInfo in sessionStorage');
        setIsVisible(false);
        return;
      }

      try {
        const info = JSON.parse(parentInfoString);
        console.log('📥 ParentHelper ricevuto:', info);
        
        setParentInfo(info);
        globalParentInfo = info;
        
        sessionStorage.removeItem('parentInfo');

        await new Promise(resolve => setTimeout(resolve, 500));

        console.log('🚀 Configurando intercettore salvataggio...');
        const success = await setupSaveInterceptor(info);
        
        setStatus(success ? 'success' : 'manual');
        
        if (success) {
          console.log('✅ Intercettore configurato!');
          setTimeout(() => setIsVisible(false), 8000);
        }
        
      } catch (error) {
        console.error('❌ ERRORE nel parsing delle informazioni parent:', error);
        setStatus('error');
        setTimeout(() => setIsVisible(false), 5000);
      }
    };

    handleParentSelection();
  }, []);

  const setupSaveInterceptor = async (info: ParentInfo): Promise<boolean> => {
    try {
      console.log('🎯 SETUP INTERCETTORE SALVATAGGIO per:', info.parentLabel);
      
      // Imposta l'intercettore fetch globale
      interceptFetchRequests(info);
      
      // Aspetta che la pagina sia caricata
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Trova i pulsanti di salvataggio
      const allButtons = document.querySelectorAll('button');
      let realSaveButtons: Element[] = [];
      
      allButtons.forEach(button => {
        const text = button.textContent?.toLowerCase() || '';
        const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
        
        if (text.includes('save') || text.includes('publish') || text.includes('salva') || 
            ariaLabel.includes('save') || ariaLabel.includes('publish')) {
          realSaveButtons.push(button);
          console.log(`🎯 Pulsante salvataggio trovato: "${button.textContent}"`);
        }
      });
      
      if (realSaveButtons.length === 0) {
        console.log('❌ Nessun pulsante di salvataggio trovato');
        return false;
      }

      // Aggiungi listener a tutti i pulsanti potenziali
      realSaveButtons.forEach((button, index) => {
        console.log(`🎯 Aggiungendo interceptor al pulsante ${index + 1}`);
        
        button.addEventListener('click', async (event) => {
          console.log('💾 INTERCETTATO CLICK SALVATAGGIO!');
          console.log('🔗 Relazione parent sarà forzata:', info.parentLabel);
          
          // Aspetta che il salvataggio sia completato e poi forza la relazione
          setTimeout(async () => {
            console.log('⏰ Tentativo di forzatura post-salvataggio...');
            await forceRelationAfterSave(info);
          }, 3000); // Aspetta 3 secondi dopo il salvataggio
        }, { capture: true });
      });

      console.log('✅ Intercettori aggiunti con successo');
      return true;

    } catch (error) {
      console.error('❌ ERRORE nel setup intercettore:', error);
      return false;
    }
  };

  // Nuova funzione per forzare la relazione DOPO il salvataggio
  const forceRelationAfterSave = async (info: ParentInfo): Promise<void> => {
    try {
      console.log('🔧 Tentativo di forzatura relazione post-salvataggio...');
      
      // Ottieni l'URL corrente per capire quale documento è stato salvato
      const currentUrl = window.location.href;
      console.log('🌐 URL corrente:', currentUrl);
      
      // Estrai l'ID del documento dall'URL se possibile
      const documentIdMatch = currentUrl.match(/\/([a-zA-Z0-9-_]+)$/);
      if (!documentIdMatch) {
        console.log('❌ Non riesco a determinare l\'ID del documento dall\'URL');
        return;
      }
      
      const newDocumentId = documentIdMatch[1];
      console.log('🆔 ID del documento salvato:', newDocumentId);
      
      // Costruisci l'URL dell'API per aggiornare la relazione
      const apiUrl = `/api/paginas/${newDocumentId}`;
      console.log('🎯 URL API per aggiornamento:', apiUrl);
      
      // Prepara i dati di aggiornamento
      const updateData = {
        data: {
          pagina: {
            connect: [{
              id: info.parentId,
              documentId: info.parentDocumentId
            }]
          }
        }
      };
      
      console.log('📦 Dati di aggiornamento:', updateData);
      
      // Effettua la richiesta di aggiornamento
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(window as any).strapi?.auth?.getToken() || ''}`
        },
        body: JSON.stringify(updateData)
      });
      
      if (response.ok) {
        console.log('✅ Relazione parent forzata con successo via API post-salvataggio!');
        
        // Mostra un messaggio di successo
        const successMessage = document.createElement('div');
        successMessage.style.cssText = `
          position: fixed;
          top: 70px;
          right: 10px;
          background: #4CAF50;
          color: white;
          padding: 12px 16px;
          border-radius: 6px;
          z-index: 10000;
          font-family: system-ui;
          font-size: 14px;
        `;
        successMessage.textContent = `✅ Relazione parent "${info.parentLabel}" salvata correttamente!`;
        document.body.appendChild(successMessage);
        
        setTimeout(() => {
          successMessage.remove();
        }, 5000);
        
      } else {
        console.log('❌ Errore nell\'aggiornamento via API:', response.status, response.statusText);
        const errorText = await response.text();
        console.log('📄 Dettagli errore:', errorText);
      }
      
    } catch (error) {
      console.error('❌ ERRORE nella forzatura post-salvataggio:', error);
    }
  };

  const interceptFetchRequests = (info: ParentInfo): void => {
    console.log('🌐 Configurando intercettore richieste fetch AGGRESSIVO...');
    
    if ((window as any).__strapiParentInterceptorSet) {
      console.log('⚠️ Intercettore già impostato, riconfigurazione...');
      // Reset per riconfigurare
      (window as any).__strapiParentInterceptorSet = false;
    }
    
    const originalFetch = window.fetch;
    
    window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const url = typeof input === 'string' ? input : input.toString();
      
      // LOG TUTTE LE RICHIESTE per debug
      console.log('🌐 FETCH REQUEST:', {
        url: url,
        method: init?.method || 'GET',
        hasBody: !!init?.body
      });
      
      // Controlla se è una richiesta di salvataggio - pattern più ampi
      const isSaveRequest = (
        url.includes('/api/') && 
        (init?.method === 'POST' || init?.method === 'PUT') &&
        (url.includes('pagina') || url.includes('content-manager') || url.includes('collection-types'))
      );
      
      if (isSaveRequest) {
        console.log('💾 RICHIESTA DI SALVATAGGIO INTERCETTATA!');
        console.log('🔗 URL completo:', url);
        console.log('🔗 Method:', init?.method);
        console.log('🔗 Forzando relazione parent:', info.parentLabel);
        
        try {
          let bodyData: any = {};
          
          if (init?.body) {
            if (typeof init.body === 'string') {
              try {
                bodyData = JSON.parse(init.body);
              } catch (e) {
                console.log('⚠️ Body non è JSON valido:', init.body);
                bodyData = { data: {} };
              }
            } else {
              console.log('⚠️ Body non è stringa:', typeof init.body);
              bodyData = { data: {} };
            }
          } else {
            bodyData = { data: {} };
          }
          
          console.log('📦 Body originale DETTAGLIATO:', JSON.stringify(bodyData, null, 2));
          
          // Forza la relazione parent nel payload - MULTIPLI FORMATI
          if (!bodyData.data) bodyData.data = {};
          
          // Formato 1: Standard Strapi v5
          bodyData.data.pagina = {
            connect: [{
              id: info.parentId,
              documentId: info.parentDocumentId
            }]
          };
          
          // Formato 2: ID diretto (fallback)
          bodyData.data.paginaId = info.parentId;
          bodyData.data.pagina_id = info.parentId;
          
          // Formato 3: DocumentId diretto (Strapi v5)
          bodyData.data.paginaDocumentId = info.parentDocumentId;
          
          console.log('📦 Body MODIFICATO DETTAGLIATO:', JSON.stringify(bodyData, null, 2));
          
          // Aggiorna il body della richiesta
          const modifiedInit = {
            ...init,
            body: JSON.stringify(bodyData),
            headers: {
              ...init?.headers,
              'Content-Type': 'application/json'
            }
          };
          
          console.log('🚀 Inviando richiesta FORZATA con relazione...');
          const response = await originalFetch.call(this, input, modifiedInit);
          console.log('📨 Risposta ricevuta:', response.status, response.statusText);
          
          return response;
          
        } catch (error) {
          console.error('❌ ERRORE CRITICO nella modifica del payload:', error);
          console.log('⚠️ Procedo con richiesta originale');
        }
      }
      
      // Per tutte le altre richieste, usa il fetch originale
      return originalFetch.call(this, input, init);
    };
    
    // Intercetta anche XMLHttpRequest per sicurezza
    const originalXHR = window.XMLHttpRequest.prototype.open;
    window.XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...args: any[]) {
      console.log('🌐 XHR REQUEST:', method, url);
      return originalXHR.apply(this, [method, url, ...args]);
    };
    
    (window as any).__strapiParentInterceptorSet = true;
    console.log('✅ Intercettore fetch AGGRESSIVO configurato');
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
      padding: '12px 16px',
      borderRadius: '6px',
      zIndex: 9999,
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      fontSize: '14px',
      maxWidth: '320px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {status === 'loading' && (
        <div>
          ⚙️ Configurando intercettore...
          {parentInfo && <div style={{fontSize: '12px', marginTop: '4px', opacity: 0.9}}>
            Parent: {parentInfo.parentLabel}
          </div>}
        </div>
      )}
      {status === 'success' && (
        <div>
          ✅ Intercettore configurato!
          <div style={{fontSize: '12px', marginTop: '4px', opacity: 0.9}}>
            Al salvataggio verrà forzata la relazione con: {parentInfo?.parentLabel}
          </div>
        </div>
      )}
      {status === 'manual' && (
        <div>
          ⚠️ Intercettore non configurato
          <div style={{fontSize: '12px', marginTop: '4px', opacity: 0.9}}>
            Controlla la console per dettagli
          </div>
        </div>
      )}
      {status === 'error' && (
        <div>❌ Errore nella configurazione</div>
      )}
    </div>
  );
};
