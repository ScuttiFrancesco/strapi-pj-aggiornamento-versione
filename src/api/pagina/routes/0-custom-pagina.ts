// path: src/api/pagina/routes/0-custom-pagina.ts

export default {
  routes: [
    {
      method: 'GET',
      path: '/pagine/:slug/tree', 
      handler: 'pagina.getTree', 
      //config: {auth: false },
    },
    {
      method: 'GET',
      path: '/pagine/:slug/children', 
      handler: 'pagina.getChildren',
    //config: { auth: false },
    },

     {
      method: 'GET',
      path: '/pagine/:slug/subtree', 
      handler: 'pagina.getSubtree',
      //config: { auth: false }, 
    },
  ],
};
