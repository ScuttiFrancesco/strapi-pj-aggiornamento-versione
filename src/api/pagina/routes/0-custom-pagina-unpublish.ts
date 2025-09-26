export default {
  routes: [
    {
      method: 'POST', // puoi usare PATCH se preferisci
      path: '/pagina/:documentId/unpublish',
      handler: 'pagina-unpublish.unpublish',
      config: { policies: [], middlewares: [] }
    },
  ],
};
