// src/api/pagina/controllers/pagina-unpublish.ts
import { factories } from '@strapi/strapi';

const UID = 'api::pagina.pagina';

export default factories.createCoreController(UID, ({ strapi }) => ({
  async unpublish(ctx) {
    const { documentId } = ctx.params as { documentId?: string };
    if (!documentId) return ctx.badRequest('Missing documentId');

    // Unica chiamata al Document Service: gestisce versioni/locale internamente
    const result = await strapi.documents(UID).unpublish({
      documentId,
      // opzionale: locale: '*' per tutte le localizzazioni
    });

    ctx.body = result; // { documentId, entries: number }
  },
}));
