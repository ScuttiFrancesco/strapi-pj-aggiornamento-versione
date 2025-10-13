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

// Funzione helper ricorsiva con maxDepth
async function findDescendants(parentId: number, maxDepth: number = Infinity, currentDepth: number = 1): Promise<Pagina[]> {
  if (currentDepth > maxDepth) {
    return [];
  }
  // Trova i figli diretti solo se pubblicati
  const children: Pagina[] = await strapi.db.query('api::pagina.pagina').findMany({
    where: { 
      pagina: { id: parentId },
      publishedAt: { $notNull: true } // Solo contenuti pubblicati
    },
  });

  // Per ogni figlio, trova ricorsivamente i suoi discendenti
  for (const child of children) {
    child.children = await findDescendants(child.id, maxDepth, currentDepth + 1);
  }

  return children;
}

function reduceToSlugAndChildren(node: Pagina | Pagina[] | null): any {
  if (!node) return null;
  if (Array.isArray(node)) {
    return node.map(reduceToSlugAndChildren);
  }
  // Mantieni solo slug e ricorsione sui children
  return {
    slug: node.slug,
    tipoLayout: node.tipoLayout,
    titolo: node.titolo,
    id: node.id,
    documentId: node.documentId,
    children: node.children ? reduceToSlugAndChildren(node.children) : [],
  };
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
    
    try {
      // 1. Trova l'ID della pagina genitore a partire dal suo slug
      const parentPage = await strapi.db.query('api::pagina.pagina').findOne({
        where: { 
          slug,
          publishedAt: { $notNull: true } // Solo genitori pubblicati
        },
        select: ['id'], // Ci serve solo l'ID
      });

      if (!parentPage) {
        return ctx.notFound('Pagina genitore non trovata.');
      }

      console.log(`🔍 [getChildren] Looking for children of parent ID: ${parentPage.id} (slug: ${slug})`);

      // 2. Trova tutte le pagine che hanno questo ID come genitore e sono pubblicate
      const children = await strapi.db.query('api::pagina.pagina').findMany({
        where: { 
          pagina: { id: parentPage.id },
          publishedAt: { $notNull: true } // Solo figli pubblicati
        },
        orderBy: { titolo: 'asc' }, // Ordina per titolo
      });

      console.log(`✅ [getChildren] Found ${children.length} children for parent ${parentPage.id}`);

      const sanitizedChildren = await this.sanitizeOutput(children, ctx);
      return this.transformResponse(sanitizedChildren);
    } catch (error) {
      console.error('❌ [getChildren] Error:', error);
      return ctx.internalServerError('Errore nel caricamento dei figli.');
    }
  },

   /**
   * Recupera il sotto-albero completo di una pagina dato il suo slug.
   * @param {Context} ctx - Il contesto della richiesta Koa.
   */

  async getSubtree(ctx: Context) {
    const { slug } = ctx.params as { slug: string };
    // Leggi maxDeep dalla query string, default Infinity
    const maxDeep = ctx.query.maxDeep ? parseInt(ctx.query.maxDeep as string, 10) : Infinity;

    // 1. Trova il nodo radice del nostro sotto-albero
    const rootNode: Pagina | null = await strapi.db.query('api::pagina.pagina').findOne({
      where: { slug },
    });

    if (!rootNode) {
      return ctx.notFound('Pagina non trovata.');
    }

    // 2. Avvia la ricerca ricorsiva dei discendenti con maxDeep
    rootNode.children = await findDescendants(rootNode.id, maxDeep);

    const reducedTree = reduceToSlugAndChildren(rootNode);

    // 3. Sanitize e restituisci l'albero completo
    const sanitizedTree = await this.sanitizeOutput(reducedTree, ctx);
    return this.transformResponse(sanitizedTree);
  },

   async create(ctx: Context) {
    const { data } = ctx.request.body ?? {};
    if (!data) return ctx.badRequest("Missing 'data' in request body");

    // If `publishedAt` key is present, honor it. Otherwise force draft by setting null.
    const payload = Object.prototype.hasOwnProperty.call(data, 'publishedAt') ? data : { ...data, publishedAt: null };

    // Use entityService to create the entry (keeps Strapi lifecycle & policies behavior).
    const created = await strapi.entityService.create('api::pagina.pagina', { data: payload });

    const sanitized = await this.sanitizeOutput(created, ctx);
    return this.transformResponse(sanitized);
  },
  
}));