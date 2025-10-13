// path: src/api/pagina/routes/0-custom-pagina.ts

export default {
  routes: [
    {
      method: 'GET',
      path: '/pagina/:slug/tree', 
      handler: 'pagina.getTree', 
      //config: {auth: false },
    },
    {
      method: 'GET',
      path: '/pagina/:slug/children', 
      handler: 'pagina.getChildren',
    //config: { auth: false },
    },

     {
      method: 'GET',
      path: '/pagina/subtree/:slug', 
      handler: 'pagina.getSubtree',
      //config: { auth: false }, 
    },
  ],
};
