// Flat array of admin routes consumed directly by Strapi's registerPluginRoutes
module.exports = [
  {
    method: 'GET',
    path: '/ping',
    handler: 'test.ping',
    config: { 
      policies: [],
      auth: false,
    },
  },
  {
    method: 'GET',
    path: '/tree',
    handler: 'tree.find',
    config: { 
      policies: [],
      auth: false, // Allow admin access without specific auth
    },
  },
  {
    method: 'GET',
    path: '/tree/children/:parentId',
    handler: 'tree.findChildren',
    config: { 
      policies: [],
      auth: false,
    },
  },
];
