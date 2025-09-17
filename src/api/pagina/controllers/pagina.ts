// path: src/api/pagina/controllers/pagina.ts
import { factories } from '@strapi/strapi';
import { Context } from 'koa';

interface Pagina {
  id: number;
  slug: string;
  titolo: string;
  children?: Pagina[]; // Aggiungiamo un array per i figli
  [key: string]: any;
}

// Funzione helper ricorsiva
async function findDescendants(parentId: number): Promise<Pagina[]> {
  // Trova i figli diretti solo se pubblicati
  const children: Pagina[] = await strapi.db.query('api::pagina.pagina').findMany({
    where: { 
      pagina: { id: parentId },
      publishedAt: { $notNull: true } // Solo contenuti pubblicati
    },
  });

  // Per ogni figlio, trova ricorsivamente i suoi discendenti
  for (const child of children) {
    child.children = await findDescendants(child.id);
  }

  return children;
}

export default factories.createCoreController('api::pagina.pagina', ({ strapi }) => ({
  
  /**
   * Recupera l'albero genealogico di una pagina dato il suo slug.
   * @param {Context} ctx - Il contesto della richiesta Koa.
   */
  async getTree(ctx: Context) {
    const { slug } = ctx.params as { slug: string };
    const tree: Pagina[] = [];
    
    // Trova il nodo di partenza usando lo slug
    let currentNode: Pagina | null = await strapi.db.query('api::pagina.pagina').findOne({
      where: { slug },
      populate: { pagina: true }, // Popoliamo il primo genitore
    });

    if (!currentNode) {
      return ctx.notFound('Pagina non trovata con lo slug fornito.');
    }

    // Cicla a ritroso per trovare tutti gli antenati
    while (currentNode) {
      // Estraiamo il genitore per il prossimo ciclo e teniamo il resto dei dati
      const { pagina: parent, ...attributes } = currentNode;
      
      // Aggiungiamo il nodo corrente all'inizio dell'array (per l'ordine corretto)
      tree.unshift(attributes);

      // Passiamo al genitore successivo
      if (parent) {
        // Se il genitore è già popolato ma i suoi dati sono parziali, potremmo doverlo ricaricare.
        // In questo caso, il populate semplice è sufficiente.
        currentNode = await strapi.db.query('api::pagina.pagina').findOne({
            where: { id: parent.id },
            populate: { pagina: true },
        });
      } else {
        currentNode = null; // Fine della catena, usciamo dal ciclo
      }
    }

    // Sanitize and transform the response
    const sanitizedTree = await this.sanitizeOutput(tree, ctx);
    return this.transformResponse(sanitizedTree);
  },

   async getChildren(ctx: Context) {
    const { slug } = ctx.params as { slug: string };
    
    // 1. Trova l'ID della pagina genitore a partire dal suo slug
    const parentPage = await strapi.db.query('api::pagina.pagina').findOne({
      where: { slug },
      select: ['id'], // Ci serve solo l'ID
    });

    if (!parentPage) {
      return ctx.notFound('Pagina genitore non trovata.');
    }

    // 2. Trova tutte le pagine che hanno questo ID come genitore
    const children = await strapi.entityService.findMany('api::pagina.pagina', {
      filters: { pagina: { id: parentPage.id } },
      // Popola eventuali relazioni dei figli che ti servono
      // populate: { ... } 
    });

    const sanitizedChildren = await this.sanitizeOutput(children, ctx);
    return this.transformResponse(sanitizedChildren);
  },

   /**
   * Recupera il sotto-albero completo di una pagina dato il suo slug.
   * @param {Context} ctx - Il contesto della richiesta Koa.
   */
  async getSubtree(ctx: Context) {
    const { slug } = ctx.params as { slug: string };
    
    // 1. Trova il nodo radice del nostro sotto-albero
    const rootNode: Pagina | null = await strapi.db.query('api::pagina.pagina').findOne({
      where: { slug },
    });

    if (!rootNode) {
      return ctx.notFound('Pagina non trovata.');
    }

    // 2. Avvia la ricerca ricorsiva dei discendenti
    rootNode.children = await findDescendants(rootNode.id);

    // 3. Sanitize e restituisci l'albero completo
    const sanitizedTree = await this.sanitizeOutput(rootNode, ctx);
    return this.transformResponse(sanitizedTree);
  },
  
}));