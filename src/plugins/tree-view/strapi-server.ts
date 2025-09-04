// Strapi v5 local plugin server entrypoint for tree-view
import type { Core } from '@strapi/strapi';

// Helper to safely load routes array (admin).
const loadAdminRoutes = () => {
  try {
    const adminRoutes = require('./server/routes');
    if (Array.isArray(adminRoutes)) return adminRoutes;
    if (Array.isArray(adminRoutes.routes)) return adminRoutes.routes; // legacy shape
    return [];
  } catch (e) {
    return [];
  }
};

export default ({ strapi }: { strapi: Core.Strapi }) => {
  return {
    register() {
      strapi.log.info('[tree-view] register()');
    },
    bootstrap() {
      strapi.log.info('[tree-view] bootstrap()');
    },
    destroy() {
      strapi.log.info('[tree-view] destroy()');
    },
    controllers: require('./server/controllers'),
    services: require('./server/services'),
    routes: {
      admin: loadAdminRoutes(),
    },
    contentTypes: {},
    policies: {},
    middlewares: {},
  };
};
