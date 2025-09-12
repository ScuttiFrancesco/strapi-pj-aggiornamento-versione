import React, { useEffect, useState } from 'react';

interface ParentInfo {
  parentId: string;
  parentDocumentId: string;
  parentLabel: string;
  parentSlug: string;
}

export const ParentHelperSimple: React.FC = () => {
  const [parentInfo, setParentInfo] = useState<ParentInfo | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'manual' | 'error'>('loading');
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    console.log('🚀 ParentHelperSimple MONTATO');
  }, []);

  useEffect(() => {
    const handleParentSelection = async () => {
      console.log('🔍 Controllo sessionStorage...');
      
      const parentInfoString = sessionStorage.getItem('parentInfo');
      
      if (!parentInfoString) {
        console.log('📭 Nessuna parentInfo');
        setIsVisible(false);
        return;
      }

      try {
        const info = JSON.parse(parentInfoString);
        console.log('📥 ParentInfo ricevuto:', info);
        
        setParentInfo(info);
        sessionStorage.removeItem('parentInfo');

        await new Promise(resolve => setTimeout(resolve, 500));

        console.log('🚀 Setup intercettore salvataggio...');
        const success = await setupSaveHandler(info);
        
        setStatus(success ? 'success' : 'manual');
        
        if (success) {
          console.log('✅ Handler configurato!');
          setTimeout(() => setIsVisible(false), 10000);
        }
        
      } catch (error) {
        console.error('❌ ERRORE:', error);
        setStatus('error');
        setTimeout(() => setIsVisible(false), 5000);
      }
    };

    handleParentSelection();
  }, []);

  const setupSaveHandler = async (info: ParentInfo): Promise<boolean> => {
    try {
      console.log('🎯 SETUP HANDLER per:', info.parentLabel);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Trova i pulsanti di salvataggio
      const allButtons = document.querySelectorAll('button');
      let saveButtons: Element[] = [];
      
      allButtons.forEach(button => {
        const text = button.textContent?.toLowerCase() || '';
        
        if (text.includes('save') || text.includes('publish') || text.includes('salva')) {
          saveButtons.push(button);
          console.log(`🎯 Pulsante trovato: "${button.textContent}"`);
        }
      });
      
      if (saveButtons.length === 0) {
        console.log('❌ Nessun pulsante trovato');
        return false;
      }

      // Aggiungi listener
      saveButtons.forEach((button, index) => {
        console.log(`🎯 Aggiungendo handler al pulsante ${index + 1}`);
        
        button.addEventListener('click', async (event) => {
          console.log('💾 CLICK SALVATAGGIO INTERCETTATO!');
          
          // Aspetta che il salvataggio sia completato
          setTimeout(async () => {
            console.log('⏰ Inizio aggiornamento relazione post-salvataggio...');
            await updateRelationAfterSave(info);
          }, 4000); // 4 secondi per essere sicuri
          
        }, { capture: true, once: false });
      });

      console.log('✅ Handler configurati');
      return true;

    } catch (error) {
      console.error('❌ ERRORE setup:', error);
      return false;
    }
  };

  const updateRelationAfterSave = async (info: ParentInfo): Promise<void> => {
    try {
      console.log('🔧 AGGIORNAMENTO RELAZIONE POST-SALVATAGGIO');
      console.log('🔗 Parent da collegare:', info.parentLabel);
      console.log('🆔 Parent ID:', info.parentId);
      console.log('📄 Parent DocumentId:', info.parentDocumentId);
      
      // Ottieni l'URL corrente per estrarre l'ID del documento salvato
      const currentUrl = window.location.href;
      console.log('🌐 URL corrente:', currentUrl);
      
      // Cerca pattern per estrarre l'ID del documento
      let newDocumentId: string | null = null;
      
      // Pattern 1: /content-manager/collection-types/api::pagina.pagina/create
      if (currentUrl.includes('/create')) {
        console.log('📝 Modalità CREATE - cerco documento salvato...');
        
        // In modalità create, aspettiamo un redirect o cerchiamo l'ID dalla risposta
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Ricontrolla l'URL dopo il redirect
        const updatedUrl = window.location.href;
        console.log('🔄 URL dopo redirect:', updatedUrl);
        
        const idMatch = updatedUrl.match(/\/([a-zA-Z0-9-_]+)(?:\?|$)/);
        if (idMatch && !idMatch[1].includes('create')) {
          newDocumentId = idMatch[1];
          console.log('✅ ID estratto da URL post-redirect:', newDocumentId);
        }
      } else {
        // Pattern 2: URL di edit esistente
        const idMatch = currentUrl.match(/\/([a-zA-Z0-9-_]+)(?:\?|$)/);
        if (idMatch) {
          newDocumentId = idMatch[1];
          console.log('✅ ID estratto da URL edit:', newDocumentId);
        }
      }
      
      if (!newDocumentId) {
        console.log('❌ Non riesco a determinare l\'ID del documento');
        console.log('🔍 Provo a cercare nell\'HTML...');
        
        // Fallback: cerca nell'HTML
        const urlElements = document.querySelectorAll('[href*="pagina"], [data-document-id], [id*="document"]');
        for (let i = 0; i < urlElements.length; i++) {
          const element = urlElements[i];
          const href = element.getAttribute('href') || '';
          const dataId = element.getAttribute('data-document-id') || '';
          
          if (href && href.includes('pagina/')) {
            const match = href.match(/pagina\/([a-zA-Z0-9-_]+)/);
            if (match) {
              newDocumentId = match[1];
              console.log('✅ ID trovato nell\'HTML:', newDocumentId);
              break;
            }
          }
          
          if (dataId) {
            newDocumentId = dataId;
            console.log('✅ ID trovato in data-document-id:', newDocumentId);
            break;
          }
        }
      }
      
      if (!newDocumentId) {
        console.log('❌ IMPOSSIBILE determinare l\'ID del documento');
        return;
      }
      
      console.log('🎯 Aggiornamento relazione per documento:', newDocumentId);
      
      // Costruisci l'URL dell'API - PROVA DIVERSI FORMATI
      const apiUrls = [
        `/api/paginas/${newDocumentId}`,
        `/api/pagina/${newDocumentId}`,
        `/content-manager/collection-types/api::pagina.pagina/${newDocumentId}`,
        `/api/content-manager/collection-types/api::pagina.pagina/${newDocumentId}`
      ];
      
      console.log('🌐 URLs da provare:', apiUrls);
      
      // Prova diversi formati di payload
      const payloads = [
        // Formato 1: Standard Strapi v5
        {
          data: {
            pagina: {
              connect: [{
                id: info.parentId,
                documentId: info.parentDocumentId
              }]
            }
          }
        },
        // Formato 2: ID diretto
        {
          data: {
            pagina: info.parentDocumentId
          }
        },
        // Formato 3: Array di IDs
        {
          data: {
            pagina: [info.parentDocumentId]
          }
        },
        // Formato 4: Solo connect
        {
          pagina: {
            connect: [{
              id: info.parentId,
              documentId: info.parentDocumentId
            }]
          }
        }
      ];
      
      console.log('📦 Payloads da provare:', payloads);
      
      // Ottieni il token di autorizzazione
      const authToken = getAuthToken();
      console.log('🔑 Token auth:', authToken ? 'presente' : 'non trovato');
      
      // Prova ogni combinazione URL + Payload
      let success = false;
      
      for (let i = 0; i < apiUrls.length && !success; i++) {
        for (let j = 0; j < payloads.length && !success; j++) {
          const apiUrl = apiUrls[i];
          const payload = payloads[j];
          
          console.log(`🚀 Tentativo ${i + 1}.${j + 1}: ${apiUrl}`);
          console.log('📦 Con payload:', JSON.stringify(payload, null, 2));
          
          try {
            const response = await fetch(apiUrl, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
              },
              body: JSON.stringify(payload)
            });
            
            console.log(`📨 Risposta ${i + 1}.${j + 1}:`, response.status, response.statusText);
            
            if (response.ok) {
              console.log('✅ SUCCESSO! Relazione salvata con questo formato:');
              console.log('🌐 URL:', apiUrl);
              console.log('📦 Payload:', JSON.stringify(payload, null, 2));
              
              const responseData = await response.json();
              console.log('📄 Dati risposta:', responseData);
              
              showSuccessMessage(info.parentLabel);
              success = true;
              
              // Ricarica la pagina per vedere la relazione
              setTimeout(() => {
                console.log('🔄 Ricarico la pagina per mostrare la relazione...');
                window.location.reload();
              }, 2000);
              
            } else {
              const errorText = await response.text();
              console.log(`❌ Errore ${i + 1}.${j + 1}:`, errorText);
            }
            
          } catch (error) {
            console.error(`❌ Errore richiesta ${i + 1}.${j + 1}:`, error);
          }
          
          // Aspetta un po' tra i tentativi
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      if (!success) {
        console.log('❌ TUTTI I TENTATIVI FALLITI');
        showErrorMessage('Impossibile salvare la relazione con tutti i formati testati');
      }
      
    } catch (error) {
      console.error('❌ ERRORE CRITICO nell\'aggiornamento:', error);
      showErrorMessage('Errore critico nell\'aggiornamento');
    }
  };

  const getAuthToken = (): string | null => {
    // Prova diversi metodi per ottenere il token
    try {
      // Metodo 1: da strapi globale
      const strapiAuth = (window as any).strapi?.auth?.getToken?.();
      if (strapiAuth) return strapiAuth;
      
      // Metodo 2: da localStorage
      const localToken = localStorage.getItem('jwtToken') || localStorage.getItem('strapi-jwt-token');
      if (localToken) return localToken;
      
      // Metodo 3: da sessionStorage
      const sessionToken = sessionStorage.getItem('jwtToken') || sessionStorage.getItem('strapi-jwt-token');
      if (sessionToken) return sessionToken;
      
      // Metodo 4: dai cookies
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name.includes('jwt') || name.includes('token')) {
          return value;
        }
      }
      
      return null;
    } catch (e) {
      console.log('⚠️ Errore nel recupero token:', e);
      return null;
    }
  };

  const showSuccessMessage = (parentLabel: string): void => {
    const message = document.createElement('div');
    message.style.cssText = `
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
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    message.textContent = `✅ Relazione parent "${parentLabel}" salvata!`;
    document.body.appendChild(message);
    
    setTimeout(() => message.remove(), 5000);
  };

  const showErrorMessage = (text: string): void => {
    const message = document.createElement('div');
    message.style.cssText = `
      position: fixed;
      top: 70px;
      right: 10px;
      background: #f44336;
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      z-index: 10000;
      font-family: system-ui;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    message.textContent = `❌ ${text}`;
    document.body.appendChild(message);
    
    setTimeout(() => message.remove(), 7000);
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
          ⚙️ Configurando handler...
          {parentInfo && <div style={{fontSize: '12px', marginTop: '4px', opacity: 0.9}}>
            Parent: {parentInfo.parentLabel}
          </div>}
        </div>
      )}
      {status === 'success' && (
        <div>
          ✅ Handler configurato!
          <div style={{fontSize: '12px', marginTop: '4px', opacity: 0.9}}>
            Dopo il salvataggio, relazione con "{parentInfo?.parentLabel}" verrà forzata via PUT
          </div>
        </div>
      )}
      {status === 'manual' && (
        <div>
          ⚠️ Handler non configurato
          <div style={{fontSize: '12px', marginTop: '4px', opacity: 0.9}}>
            Controlla la console
          </div>
        </div>
      )}
      {status === 'error' && (
        <div>❌ Errore nella configurazione</div>
      )}
    </div>
  );
};
