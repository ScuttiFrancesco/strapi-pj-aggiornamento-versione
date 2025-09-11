import React from 'react';
import pluginId from './pluginId';
import { getTranslation } from './utils/getTrad';
import PluginIcon from './pluginIcon';
import ParentHelper from './components/ParentHelper';

const plugin = {
  register(app: any) {
    // Debug log to verify admin register executes
    // (Visible in browser console after admin build)
    // eslint-disable-next-line no-console
    console.log('%c[tree-view] admin register()', 'color:#6c5ce7');
    app.addMenuLink({
      to: `/plugins/${pluginId}`,
      icon: PluginIcon,
      intlLabel: {
        id: getTranslation('plugin.name'),
        defaultMessage: 'Tree View',
      },
      Component: async () => (await import('./pages/App')).default,
      permissions: [],
    });
  },
  bootstrap(app: any) {
    // eslint-disable-next-line no-console
    console.log('%c[tree-view] admin bootstrap()', 'color:#6c5ce7');
    
    // Aggiungi il ParentHelper globalmente
    const renderParentHelper = () => {
      // Crea un contenitore per il ParentHelper se non esiste
      let helperContainer = document.getElementById('tree-view-parent-helper');
      if (!helperContainer) {
        helperContainer = document.createElement('div');
        helperContainer.id = 'tree-view-parent-helper';
        document.body.appendChild(helperContainer);
      }
      
      // Render del componente
      import('react-dom').then(({ render }) => {
        render(React.createElement(ParentHelper), helperContainer);
      });
    };
    
    // Render immediato e ogni volta che cambia la route
    renderParentHelper();
    
    // Ascolta i cambi di route per re-renderizzare il helper
    if (typeof window !== 'undefined') {
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;
      
      history.pushState = function(...args) {
        originalPushState.apply(history, args);
        setTimeout(renderParentHelper, 100);
      };
      
      history.replaceState = function(...args) {
        originalReplaceState.apply(history, args);
        setTimeout(renderParentHelper, 100);
      };
      
      window.addEventListener('popstate', () => {
        setTimeout(renderParentHelper, 100);
      });
    }
  },
  async registerTrads(app: any) {
    const importedTrads = await Promise.all(
      ['en', 'it'].map(async (locale) => {
        const trads = await import(`./translations/${locale}.json`);
        return { data: trads.default, locale };
      })
    );
    return Promise.resolve(importedTrads);
  },
};

export default plugin;
