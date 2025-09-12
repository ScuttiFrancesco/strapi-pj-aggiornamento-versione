import React, { useEffect, useState } from 'react';

interface ParentInfo {
  parentId: string;
  parentDocumentId: string;
  parentLabel: string;
  parentSlug: string;
}

export const ParentHelperSlug: React.FC = () => {
  const [parentInfo, setParentInfo] = useState<ParentInfo | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'manual' | 'error'>('loading');
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    console.log('🚀 ParentHelperSlug MONTATO');
  }, []);

  useEffect(() => {
    const handleParentSelection = async () => {
      console.log('🔍 Controllo parentInfo in sessionStorage...');
      
      const parentInfoString = sessionStorage.getItem('parentInfo');
      if (!parentInfoString) {
        console.log('📭 Nessuna parentInfo trovata');
        setIsVisible(false);
        return;
      }

      try {
        const info = JSON.parse(parentInfoString);
        console.log('📥 ParentInfo ricevuto:', info);
        
        setParentInfo(info);
        sessionStorage.removeItem('parentInfo');

        await new Promise(resolve => setTimeout(resolve, 800));

        console.log('🚀 Avvio impostazione campo parent slug...');
        const success = await setParentSlugField(info);
        
        console.log('📊 Risultato:', success ? 'SUCCESS' : 'FAILED');
        setStatus(success ? 'success' : 'manual');
        
        if (success) {
          console.log('✅ Campo parent slug impostato!');
          setTimeout(() => setIsVisible(false), 4000);
        } else {
          console.log('❌ Impostazione fallita');
          setTimeout(() => setIsVisible(false), 6000);
        }
        
      } catch (error) {
        console.error('❌ ERRORE:', error);
        setStatus('error');
        setTimeout(() => setIsVisible(false), 5000);
      }
    };

    handleParentSelection();
  }, []);

  // Funzione per impostare il campo parent come testo semplice
  const setParentSlugField = async (info: ParentInfo): Promise<boolean> => {
    try {
      console.log('🎯 IMPOSTAZIONE CAMPO PARENT SLUG');
      console.log('📋 Parent:', info.parentLabel);
      
      // Aspetta caricamento completo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 1. Cerca il campo parent/pagina
      let parentField = document.querySelector('input[name="pagina"]') as HTMLInputElement;
      
      // Cerca anche varianti del nome
      if (!parentField) {
        const possibleNames = ['parent', 'genitore', 'parent_slug', 'pagina_parent'];
        for (const name of possibleNames) {
          parentField = document.querySelector(`input[name="${name}"]`) as HTMLInputElement;
          if (parentField) {
            console.log(`✅ Trovato campo con nome: ${name}`);
            break;
          }
        }
      }
      
      if (!parentField) {
        console.log('❌ Campo parent non trovato');
        console.log('🔍 Campi disponibili:');
        const allInputs = document.querySelectorAll('input, textarea');
        allInputs.forEach((input, i) => {
          const el = input as HTMLInputElement;
          console.log(`  ${i + 1}. name="${el.name}" type="${el.type}" placeholder="${el.placeholder}"`);
        });
        return false;
      }

      console.log('✅ Campo parent trovato:', parentField.name, parentField.type);

      // 2. Genera lo slug del parent
      const parentSlug = info.parentSlug || 
                        info.parentLabel.toLowerCase()
                          .replace(/\s+/g, '-')
                          .replace(/[^a-z0-9-]/g, '')
                          .replace(/-+/g, '-')
                          .replace(/^-|-$/g, '');
      
      console.log('📝 Slug generato:', parentSlug);
      
      // 3. Imposta il valore nel campo
      parentField.value = parentSlug;
      
      // 4. Stile per indicare che è auto-compilato
      parentField.style.backgroundColor = '#e8f5e8';
      parentField.style.border = '2px solid #4CAF50';
      parentField.style.color = '#2e7d32';
      parentField.readOnly = true;
      parentField.title = `Parent auto-compilato dal TreeView: ${info.parentLabel}`;
      
      // 5. Aggiungi indicatore visivo
      const existingIndicator = document.querySelector('.parent-auto-indicator');
      if (existingIndicator) {
        existingIndicator.remove();
      }
      
      const indicator = document.createElement('div');
      indicator.className = 'parent-auto-indicator';
      indicator.style.cssText = `
        background: #4CAF50;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        margin-top: 4px;
        display: inline-block;
      `;
      indicator.textContent = `🔗 Parent: ${info.parentLabel}`;
      
      if (parentField.parentElement) {
        parentField.parentElement.appendChild(indicator);
      }
      
      // 6. Eventi per il form
      parentField.dispatchEvent(new Event('input', { bubbles: true }));
      parentField.dispatchEvent(new Event('change', { bubbles: true }));
      
      // 7. Protezione del valore
      const protectValue = (e: Event) => {
        if (parentField.value !== parentSlug) {
          console.log('🛡️ Ripristino slug parent');
          parentField.value = parentSlug;
          e.preventDefault();
        }
      };
      
      parentField.addEventListener('input', protectValue);
      parentField.addEventListener('keydown', (e) => {
        // Blocca modifiche manuali
        if (!['Tab', 'Escape'].includes(e.key) && !e.ctrlKey) {
          e.preventDefault();
        }
      });
      
      console.log('✅ Campo parent slug impostato e protetto!');
      console.log('📊 Dettagli:');
      console.log('  - Campo:', parentField.name);
      console.log('  - Valore:', parentField.value);
      console.log('  - Parent originale:', info.parentLabel);
      console.log('  - DocumentId:', info.parentDocumentId || info.parentId);

      return true;

    } catch (error) {
      console.error('❌ ERRORE nell\'impostazione campo:', error);
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
          ⚙️ Impostazione parent slug...
          {parentInfo && <div style={{fontSize: '12px', marginTop: '4px', opacity: 0.9}}>
            Parent: {parentInfo.parentLabel}
          </div>}
        </div>
      )}
      {status === 'success' && (
        <div>
          ✅ Parent slug impostato!
          <div style={{fontSize: '12px', marginTop: '4px', opacity: 0.9}}>
            {parentInfo?.parentLabel} → {parentInfo?.parentSlug || parentInfo?.parentLabel.toLowerCase().replace(/\s+/g, '-')}
          </div>
        </div>
      )}
      {status === 'manual' && (
        <div>
          ⚠️ Campo parent non trovato
          <div style={{fontSize: '12px', marginTop: '4px', opacity: 0.9}}>
            Controlla la console per dettagli
          </div>
        </div>
      )}
      {status === 'error' && (
        <div>❌ Errore nell'impostazione</div>
      )}
    </div>
  );
};
