import pluginId from './pluginId';
import { getTranslation } from './utils/getTrad';
import PluginIcon from './pluginIcon';

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
  bootstrap() {
    // eslint-disable-next-line no-console
    console.log('%c[tree-view] admin bootstrap()', 'color:#6c5ce7');
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
