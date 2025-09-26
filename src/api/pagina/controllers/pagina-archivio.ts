import type { Core } from '@strapi/strapi';

export type GiornoNode = { giorno: number; count: number };
export type MeseNode = { mese: number; count: number; giorni: GiornoNode[] };
export type AnnoNode = { anno: number; count: number; mesi: MeseNode[] };
export type ArchivioResponse = { data: AnnoNode[] };

type PaginaDoc = {
  documentId: string | number;
  publishedAt: string; // ISO date
};

function normalizeDate(iso: string) {
  const d = new Date(iso);
  return { y: d.getFullYear(), m: d.getMonth() + 1, g: d.getDate() };
}

const controller: Core.Controller = {
  async index(ctx) {
    strapi.log?.info?.('[pagina-archivio] index handler invoked');
    const { from, to } = (ctx.query ?? {}) as { from?: string; to?: string };

    // Costruisci filtri v5 per il campo "publishedAt"
    const filters: any = {};
    if (from || to) {
      filters.publishedAt = {};
      if (from) filters.publishedAt.$gte = from;
      if (to) filters.publishedAt.$lte = to;
    }

    // Prendi solo campi minimi
    // Prima prova con il query builder DB (più affidabile senza dipendere da requestContext)
    let docs: PaginaDoc[] = [];
    try {
      docs = (await strapi.db.query('api::pagina.pagina').findMany({
        where: filters,
        orderBy: { publishedAt: 'desc' },
        limit: -1,
        select: ['publishedAt'],
      })) as any as PaginaDoc[];
      strapi.log?.info?.(`[pagina-archivio] DB query returned ${docs.length} documents`);
    } catch (err) {
      strapi.log?.error?.('[pagina-archivio] DB query failed, falling back to documents API', err);

      // Fallback: tenta l'API documents (manteniamo la logica precedente se il DB query fallisce)
      const prevReqCtx = (strapi.requestContext && (strapi.requestContext as any).get) ? (strapi.requestContext as any).get() : undefined;
      let injectedCtx = false;
      try {
        if (!prevReqCtx || !prevReqCtx.state || !prevReqCtx.state.auth) {
          try {
            (strapi.requestContext as any)?.set?.({ state: { auth: { credentials: null, strategy: { name: null } } } });
            injectedCtx = true;
          } catch (e) {
            strapi.log?.error?.('[pagina-archivio] Impossibile impostare requestContext minimale', e);
          }
        }

        docs = (await strapi
          .documents('api::pagina.pagina')
          .findMany({
            filters,
            sort: ['publishedAt:desc'],
            limit: -1,
          })) as PaginaDoc[];
        strapi.log?.info?.(`[pagina-archivio] Documents API returned ${docs.length} documents`);
      } finally {
        if (injectedCtx) {
          try {
            if (prevReqCtx) {
              (strapi.requestContext as any)?.set?.(prevReqCtx);
            } else {
              (strapi.requestContext as any)?.set?.({});
            }
          } catch (e) {
            strapi.log?.error?.('[pagina-archivio] Errore ripristino requestContext', e);
          }
        }
      }
    }

    // Aggregazione: year -> month -> day -> count
    const byYear = new Map<number, Map<number, Map<number, number>>>();

    for (const d of docs) {
      if (!d?.publishedAt) continue;
      const { y, m, g } = normalizeDate(d.publishedAt);
      if (!byYear.has(y)) byYear.set(y, new Map());
      const ym = byYear.get(y)!;
      if (!ym.has(m)) ym.set(m, new Map());
      const md = ym.get(m)!;
      md.set(g, (md.get(g) || 0) + 1);
    }

    // Proiezione ordinata in array
    const anni: AnnoNode[] = Array.from(byYear.keys())
      .sort((a, b) => b - a)
      .map((y) => {
        const mesiMap = byYear.get(y)!;
        const mesiKeys = Array.from(mesiMap.keys()).sort((a, b) => a - b);

        const mesi: MeseNode[] = mesiKeys.map((m) => {
          const giorniMap = mesiMap.get(m)!;
          const giorniKeys = Array.from(giorniMap.keys()).sort((a, b) => a - b);
          const giorni: GiornoNode[] = giorniKeys.map((g) => ({
            giorno: g,
            count: giorniMap.get(g)!,
          }));
          const count = giorni.reduce((s, n) => s + n.count, 0);
          return { mese: m, count, giorni };
        });

        const count = mesi.reduce((s, n) => s + n.count, 0);
        return { anno: y, count, mesi };
      });

    // Cache consigliata
    ctx.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=604800');

    const payload: ArchivioResponse = { data: anni };
    ctx.body = payload;
  },
};

export default controller;
