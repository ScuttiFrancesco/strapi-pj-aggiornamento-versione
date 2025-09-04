import { factories } from '@strapi/strapi';
import { Context } from 'koa';

// Questo è il modo moderno e corretto per estendere un controller "core" di Strapi
export default ({ strapi }) => ({
  
  /**
   * Sovrascriviamo l'azione 'upload' per aggiungere il nostro controllo sui duplicati.
   */
  async upload(ctx: Context) {
    // Estraiamo i file dalla richiesta in modo sicuro
    const { request: { files: { files = [] } = {} } } = ctx as any;

    // Se non ci sono file, restituiamo un errore
    if (!files || (Array.isArray(files) && files.length === 0)) {
        return ctx.badRequest('Nessun file fornito per l\'upload.');
    }
    
    // Garantiamo di lavorare sempre con un array di file
    const filesToUpload = Array.isArray(files) ? files : [files];

    // --- Inizio della nostra logica personalizzata ---
    for (const file of filesToUpload) {
      // Usiamo l'hash generato da Strapi per trovare file con lo stesso contenuto
      const existingFile = await strapi.db.query('plugin::upload.file').findOne({
        where: { hash: file.hash },
      });

      // Se troviamo un duplicato, interrompiamo il processo e restituiamo un errore 409 Conflict
      if (existingFile) {
        return ctx.conflict(`Un file con lo stesso contenuto ('${file.name}') esiste già.`);
      }
    }
    // --- Fine della nostra logica personalizzata ---

    // Se il ciclo finisce, significa che non ci sono duplicati.
    // Chiamiamo il controller di upload originale per fare il suo lavoro standard.
    const originalController = strapi.plugin('upload').controller('content-api');
    const response = await originalController.upload(ctx);
    
    // Restituiamo la risposta standard di successo
    return response;
  },
});