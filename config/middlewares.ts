export default [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      headers: '*',
      // Aggiungi qui tutte le URL che devono poter comunicare con la tua API
      origin: [
        'http://localhost:1337',   // L'admin di Strapi
        'http://localhost:4200',   // L'URL di default di 'ng serve' (aggiungila per sicurezza)
        'http://localhost:4293',  // L'URL della tua app Angular che stai usando ora
        // Potresti voler aggiungere anche le URL di produzione qui in futuro
      ],
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
