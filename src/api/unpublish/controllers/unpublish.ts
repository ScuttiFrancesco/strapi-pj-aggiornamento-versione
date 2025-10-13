import { factories } from '@strapi/strapi';

export default factories.createCoreController('plugin::users-permissions.user', ({ strapi }) => ({
  async unpublish(ctx) {
    try {
      const { contentType, id } = ctx.params;

      if (!contentType || !id) {
        return ctx.badRequest('Content type e ID sono obbligatori');
      }

      // Costruisce l'UID del content type (es: api::classificazione.classificazione)
      const uid = `api::${contentType}.${contentType}`;

      // Verifica che il content type esista
      const model = strapi.contentType(uid as any);
      if (!model) {
        return ctx.badRequest(`Content type "${contentType}" non trovato`);
      }

      // Verifica che il content type supporti draft/publish
      if (!model.options?.draftAndPublish) {
        return ctx.badRequest(`Il content type "${contentType}" non supporta draft/publish`);
      }

      // Verifica che l'entità esista
      const entity = await strapi.documents(uid as any).findOne({
        documentId: id,
      });

      if (!entity) {
        return ctx.notFound('Contenuto non trovato');
      }

      // Effettua l'unpublish
      const unpublishedEntity = await (strapi.documents(uid as any) as any).unpublish({
        documentId: id,
      });

      return ctx.send({
        data: unpublishedEntity,
        meta: {
          contentType: contentType,
          documentId: id,
        },
        message: 'Contenuto rimosso dalla pubblicazione con successo'
      });

    } catch (error: any) {
      strapi.log.error('Errore durante unpublish:', error);
      return ctx.internalServerError(`Errore durante la rimozione dalla pubblicazione: ${error.message}`);
    }
  }
}));
