import type { StrapiApp } from '@strapi/strapi/admin';

export default {
  config: {
    locales: [
      // 'ar',
      // 'fr',
      // 'cs',
      // 'de',
      // 'dk',
      // 'es',
      // 'he',
      // 'id',
       'it',
      // 'ja',
      // 'ko',
      // 'ms',
      // 'nl',
      // 'no',
      // 'pl',
      // 'pt-BR',
      // 'pt',
      // 'ru',
      // 'sk',
      // 'sv',
      // 'th',
      // 'tr',
      // 'uk',
      // 'vi',
      // 'zh-Hans',
      // 'zh',
    ],
    theme: {
      light: {
        // Questi sono i colori principali che vorrai cambiare
        colors: {
          primary100: '#f0f0ff', // Sfondo pulsanti hover leggeri
          primary200: '#d9d9ff', // Bordo pulsanti
          primary500: '#a3a3ff', // Colore link e focus
          primary600: '#6b6bff', // Colore principale dei pulsanti
          primary700: '#3434ff', // Colore principale hover/attivo

          // Puoi anche sovrascrivere altri colori
          // danger500: '#ff0000', // Colore per i pulsanti di cancellazione
          // success500: '#00ff00', // Colore per le azioni di successo
        },
      },
      dark: {
        // Puoi definire anche i colori per il tema scuro
        colors: {
          primary100: '#1d3c24ff',  // Sfondo scuro rossastro
          primary200: '#2a6d2cff',  // Bordo o sfondo leggermente più chiaro
          primary500: '#6cf565ff',  // Link e focus (un rosso vivo)
          primary600: '#3ee554ff',  // Colore principale dei pulsanti (un rosso acceso)
          primary700: '#30c546ff',
        },
      },
    },
    // Disabilita la visualizzazione dei tutorial video nella home page
    tutorials: false,
    // Disabilita le notifiche di nuove versioni di Strapi
    notifications: { releases: false },
  
  },
 bootstrap(app: StrapiApp) {
    console.log('🚀 Bootstrap personalizzato avviato');
    
    // Lista dei link che vogliamo nascondere
    const linksToHide = [
      'Deploy', // Link "Deploy" 
      'marketplace',  // Link "Marketplace"
    ];

    // Lista dei ruoli che NON devono vedere questi link
    const restrictedRoles = [
      'Editor',       // Gli editor non vedranno Deploy e Marketplace
      'Author',       // Gli autori non vedranno Deploy e Marketplace
      //'Super Admin', // Decommenta se vuoi nasconderli anche ai Super Admin
    ];

    // CONFIGURAZIONE: Recupero automatico del ruolo o fallback manuale
    let CURRENT_USER_ROLE = 'Super Admin'; // Fallback SICURO: assumiamo Super Admin se non troviamo nulla
    
    // TOKEN SPECIFICO (recuperato dal debug)
    const MANUAL_TOKEN = '2ca8ee8d1713c9efc2b0a37bac2773f82b48ad01f03931da5e4148c9b788efaf48ae0f6afb7b7d1cf4cf68ed2438b4e410cad860a0f175db6337e08e09f3c63af3500ca3df810f53d264248276f029f3126d2fb858c2bedc167e7aa7817ac085923bc1525d4e515b4a58112dc3e40aeb67c1c8d21370f9a914ee656500a24ee8';

    // Funzione asincrona per recuperare il ruolo dell'utente corrente
    const getUserRole = async () => {
      try {
        console.log('🔍 Tentativo di recupero automatico del ruolo...');
        
        // 1. DEBUG: Mostra tutto il localStorage/sessionStorage
        console.log('💾 Tutti i dati localStorage:');
        Object.keys(localStorage).forEach(key => {
          const value = localStorage.getItem(key);
          console.log(`  ${key}:`, value);
          // Cerca possibili token nelle stringhe
          if (value && typeof value === 'string' && value.length > 50 && 
              (value.includes('eyJ') || value.match(/[a-f0-9]{64,}/))) {
            console.log(`  🎯 POSSIBILE TOKEN in ${key}:`, value.substring(0, 30) + '...');
          }
        });
        
        console.log('💾 Tutti i dati sessionStorage:');
        Object.keys(sessionStorage).forEach(key => {
          const value = sessionStorage.getItem(key);
          console.log(`  ${key}:`, value);
          // Cerca possibili token nelle stringhe
          if (value && typeof value === 'string' && value.length > 50 && 
              (value.includes('eyJ') || value.match(/[a-f0-9]{64,}/))) {
            console.log(`  🎯 POSSIBILE TOKEN in ${key}:`, value.substring(0, 30) + '...');
          }
        });
        
        // 2. Cerca il token di autenticazione con più opzioni
        const possibleTokens = [
          MANUAL_TOKEN, // Token specifico trovato nel debug
          localStorage.getItem('jwtToken'),
          localStorage.getItem('strapi-jwt-token'),
          localStorage.getItem('authToken'),
          localStorage.getItem('token'),
          sessionStorage.getItem('jwtToken'),
          sessionStorage.getItem('strapi-jwt-token'),
          // Cerca in qualsiasi chiave che contenga 'token'
          ...Object.keys(localStorage).filter(k => k.toLowerCase().includes('token')).map(k => localStorage.getItem(k)),
        ].filter(Boolean);

        // 2.1 Cerca anche nei cookie con debug esteso
        console.log('🍪 Tutti i cookie:', document.cookie);
        
        const getCookie = (name: string) => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop()?.split(';').shift();
          return null;
        };

        // Cerca tutti i cookie che potrebbero contenere token
        const allCookies = document.cookie.split(';').reduce((acc: Record<string, string>, cookie) => {
          const [name, value] = cookie.trim().split('=');
          if (name && value) {
            acc[name] = value;
            // Cerca possibili token nei cookie
            if (value.length > 50 && (value.includes('eyJ') || value.match(/[a-f0-9]{64,}/))) {
              console.log(`  🎯 POSSIBILE TOKEN nel cookie ${name}:`, value.substring(0, 30) + '...');
            }
          }
          return acc;
        }, {});

        const cookieTokens = [
          getCookie('strapi-jwt'),
          getCookie('jwt'),
          getCookie('token'),
          getCookie('authToken'),
          getCookie('strapi-token'),
          // Aggiungi tutti i possibili token trovati nei cookie
          ...Object.values(allCookies).filter(value => 
            value.length > 50 && (value.includes('eyJ') || value.match(/[a-f0-9]{64,}/))
          )
        ].filter(Boolean);

        const allTokens = [...possibleTokens, ...cookieTokens];

        console.log('🔑 Token localStorage trovati:', possibleTokens.length - 1); // -1 per escludere MANUAL_TOKEN
        console.log('🍪 Token cookie trovati:', cookieTokens.length);
        console.log('🎯 Token manuale incluso:', MANUAL_TOKEN ? 'SÌ' : 'NO');
        console.log('🔑 Token totali:', allTokens.length);
        
        allTokens.forEach((token, i) => {
          if (i === 0 && token === MANUAL_TOKEN) {
            console.log(`  Token ${i} (MANUALE):`, token?.substring(0, 30) + '...');
          } else {
            console.log(`  Token ${i}:`, token?.substring(0, 20) + '...');
          }
        });

        if (allTokens.length > 0) {
          const token = allTokens[0];
          console.log('🌐 Chiamata API con token...');
          
          try {
            const response = await fetch('http://localhost:1337/admin/users/me', {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              credentials: 'include' // Include cookies
            });
            
            console.log('📡 Risposta API status:', response.status);
            
            if (response.ok) {
              const userData = await response.json();
              console.log('✅ Dati utente dall\'API completi:', JSON.stringify(userData, null, 2));
              
              // Estrai il ruolo dai dati con tutti i possibili percorsi
              const possibleRoles = [
                userData.data?.roles?.[0]?.name,
                userData.roles?.[0]?.name,
                userData.role?.name,
                userData.data?.role?.name,
                userData.user?.roles?.[0]?.name,
                userData.user?.role?.name,
                userData.data?.user?.roles?.[0]?.name,
                userData.data?.user?.role?.name,
              ].filter(Boolean);
              
              console.log('🎭 Possibili ruoli trovati:', possibleRoles);
              
              if (possibleRoles.length > 0) {
                const role = possibleRoles[0];
                console.log('✅ Ruolo recuperato automaticamente:', role);
                CURRENT_USER_ROLE = role;
                return role;
              }
            } else {
              const errorText = await response.text();
              console.log('❌ Errore API:', response.status, errorText);
            }
          } catch (apiError) {
            console.log('❌ Errore chiamata API:', apiError);
          }
        } else {
          console.log('⚠️ Nessun token trovato, provo chiamata senza Bearer token...');
          
          // Prova chiamata API senza token (forse usa cookie di sessione)
          try {
            const response = await fetch('http://localhost:1337/admin/users/me', {
              credentials: 'include', // Include cookies
              headers: {
                'Content-Type': 'application/json'
              }
            });
            
            console.log('📡 Risposta API senza token status:', response.status);
            
            if (response.ok) {
              const userData = await response.json();
              console.log('✅ Dati utente dall\'API (senza token):', JSON.stringify(userData, null, 2));
              
              // Estrai il ruolo dai dati
              const possibleRoles = [
                userData.data?.roles?.[0]?.name,
                userData.roles?.[0]?.name,
                userData.role?.name,
                userData.data?.role?.name,
                userData.user?.roles?.[0]?.name,
                userData.user?.role?.name,
                userData.data?.user?.roles?.[0]?.name,
                userData.data?.user?.role?.name,
              ].filter(Boolean);
              
              console.log('🎭 Possibili ruoli trovati (senza token):', possibleRoles);
              
              if (possibleRoles.length > 0) {
                const role = possibleRoles[0];
                console.log('✅ Ruolo recuperato automaticamente (senza token):', role);
                CURRENT_USER_ROLE = role;
                return role;
              }
            } else {
              const errorText = await response.text();
              console.log('❌ Errore API senza token:', response.status, errorText);
            }
          } catch (apiError) {
            console.log('❌ Errore chiamata API senza token:', apiError);
          }
        }

        // 3. Fallback: cerca direttamente dati utente nel localStorage
        console.log('🔍 Ricerca dati utente nel localStorage...');
        Object.keys(localStorage).forEach(key => {
          try {
            const value = localStorage.getItem(key);
            if (value && (value.includes('role') || value.includes('Role') || value.includes('user') || value.includes('admin'))) {
              try {
                const parsed = JSON.parse(value);
                console.log(`📦 Dati interessanti in ${key}:`, parsed);
                
                // Cerca ruoli in questo oggetto
                if (parsed.role || parsed.roles || parsed.user?.role || parsed.user?.roles) {
                  console.log('🎯 Possibile ruolo trovato in localStorage!');
                }
              } catch (e) {
                // Se non è JSON, cerca comunque nel testo
                if (value.includes('Super Admin') || value.includes('Editor') || value.includes('Author')) {
                  console.log(`📦 Possibile ruolo nel testo di ${key}:`, value);
                }
              }
            }
          } catch (e) {
            // Ignora errori
          }
        });

        console.log('⚠️ Uso fallback manuale:', CURRENT_USER_ROLE);
        return CURRENT_USER_ROLE;
      } catch (error) {
        console.warn('⚠️ Errore nel recupero ruolo:', error);
        return CURRENT_USER_ROLE;
      }
    };

    // Funzione per ottenere le informazioni dell'utente corrente usando l'hook di Strapi
    const getCurrentUser = () => {
      try {
        // Accesso diretto al contesto utente di Strapi
        const adminContext = (window as any).strapi?.admin;
        const userContext = adminContext?.user || adminContext?.currentUser;
        
        if (userContext) {
          console.log('👤 Utente dal contesto Strapi:', userContext);
          return userContext;
        }

        // Prova a ottenere dalle variabili globali
        const globalUser = (window as any).__STRAPI_ADMIN_USER__ || 
                          (window as any).strapiUser ||
                          (window as any).currentUser;
        
        if (globalUser) {
          console.log('� Utente dalle variabili globali:', globalUser);
          return globalUser;
        }

        // Prova a ottenere dal React DevTools (se disponibili)
        const reactFiber = document.querySelector('[data-reactroot]') as any;
        if (reactFiber && reactFiber._reactInternalFiber) {
          // Cerca nei componenti React per il contesto utente
          console.log('� Cercando utente nei componenti React...');
        }

        console.warn('⚠️ Utente non trovato in nessun contesto');
        return null;
      } catch (error) {
        console.warn('⚠️ Errore nel recupero utente dal contesto:', error);
        return null;
      }
    };

    // Metodo per nascondere i link dal menu
    const hideMenuLinks = async () => {
      console.log('🎭 Controllo ruolo per nascondere link...');
      
      // Prova a recuperare il ruolo automaticamente
      const userRole = await getUserRole();
      console.log('👤 Ruolo utente:', userRole);
      console.log('📋 Ruoli ristretti:', restrictedRoles);

      // Controlla se il ruolo corrente è in quelli ristretti
      if (!restrictedRoles.includes(userRole)) {
        console.log(`✅ Ruolo "${userRole}" ha accesso completo ai link`);
        return; // Non nascondere nulla
      }

      console.log(`🚫 Ruolo "${userRole}" è ristretto, nascondo i link:`, linksToHide);

      // Procedi a nascondere i link dopo un breve delay
      setTimeout(() => {
        linksToHide.forEach(linkId => {
          // Cerca il link nel menu laterale con selettori multipli
          const selectors = [
            `[href*="${linkId}"]`,
            `[href*="${linkId.toLowerCase()}"]`,
            `a[href$="/${linkId}"]`,
            `a[href$="/${linkId.toLowerCase()}"]`,
            `[data-testid*="${linkId}"]`,
            `[aria-label*="${linkId}"]`,
            `[title*="${linkId}"]`,
            `a:contains("${linkId}")`, // CSS :contains non funziona, ma proviamo
          ];

          let found = false;
          for (const selector of selectors) {
            try {
              const linkElement = document.querySelector(selector);
              if (linkElement) {
                // Nasconde l'intero elemento padre (di solito è un <li>)
                const menuItem = linkElement.closest('li') || 
                                linkElement.closest('a') || 
                                linkElement.closest('[role="menuitem"]') ||
                                linkElement.parentElement;
                if (menuItem) {
                  (menuItem as HTMLElement).style.display = 'none';
                  console.log(`✅ Nascosto link "${linkId}" con selettore: ${selector}`);
                  found = true;
                  break;
                }
              }
            } catch (e) {
              // Ignora errori di selettore non valido
            }
          }

          // Se non trovato, cerca nel testo dei link
          if (!found) {
            const allLinks = document.querySelectorAll('a, [role="menuitem"]');
            allLinks.forEach(link => {
              const text = (link as HTMLElement).textContent?.toLowerCase().trim();
              if (text && text.includes(linkId.toLowerCase())) {
                const menuItem = link.closest('li') || link.closest('a') || link.parentElement;
                if (menuItem) {
                  (menuItem as HTMLElement).style.display = 'none';
                  console.log(`✅ Nascosto link "${linkId}" tramite ricerca testo: "${text}"`);
                  found = true;
                }
              }
            });
          }

          if (!found) {
            console.log(`❌ Non trovato link: ${linkId}`);
          }
        });
      }, 1500); // Aumentiamo il timeout per dare più tempo al caricamento
    };

    // Aspetta che l'app di Strapi sia completamente caricata
    const initHideLinks = async () => {
      // Prova più volte con intervalli crescenti
      setTimeout(async () => await hideMenuLinks(), 1000);
      setTimeout(async () => await hideMenuLinks(), 2000);
      setTimeout(async () => await hideMenuLinks(), 3000);
    };

    // Esegui la funzione all'avvio
    initHideLinks();

    // Osserva i cambiamenti nel DOM per nascondere i link anche dopo navigazioni
    const observer = new MutationObserver(async () => {
      await hideMenuLinks();
    });

    // Inizia l'osservazione quando il body è disponibile
    setTimeout(() => {
      if (document.body) {
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
        console.log('👀 Observer per nascondere i link attivato');
      }
    }, 1000);

    // Aggiungi questa riga per debug
    console.log('🔍 DEBUG - Window objects:', {
      strapi: (window as any).strapi,
      strapiAdmin: (window as any).strapi?.admin,
      allWindowKeys: Object.keys(window).filter(k => k.toLowerCase().includes('strapi'))
    });
  },
};


