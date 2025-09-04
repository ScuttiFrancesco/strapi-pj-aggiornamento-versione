// Funzione per generare configurazione automatica
const generatePreviewConfig = () => {
  const fs = require('fs');
  const path = require('path');
  
  // Collection da ESCLUDERE dal preview (se non vuoi che abbiano il bottone)
  const excludeContentTypes = [
    'users',
    'uploads', 
    // Aggiungi qui collection che non vuoi nel preview
  ];
  
  // Percorso dove Strapi salva i content types
  const contentTypesPath = path.join(__dirname, '../src/api');
  
  let contentTypes = [];
  
  try {
    // Se la cartella esiste, leggi tutte le sottocartelle
    if (fs.existsSync(contentTypesPath)) {
      const folders = fs.readdirSync(contentTypesPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
        .filter(name => !excludeContentTypes.includes(name)); // Filtra le esclusioni
      
      contentTypes = folders;
      console.log('🔍 Content Types trovati automaticamente:', contentTypes);
      console.log('🚫 Content Types esclusi:', excludeContentTypes);
    } else {
      console.warn('⚠️ Cartella content types non trovata, uso lista manuale');
      // Fallback alla lista manuale
      contentTypes = [
        'comunicati-stampa',
        'news',
        'articoli',
        'pagine',
      ];
    }
  } catch (error) {
    console.warn('⚠️ Errore nella lettura automatica, uso lista manuale:', error.message);
    // Fallback alla lista manuale
    contentTypes = [
      'comunicati-stampa',
      'news', 
      'articoli',
      'pagine',
    ];
  }
  
  // Genera la configurazione per tutte le collection trovate
  return contentTypes.map(type => ({
    uid: `api::${type}.${type}`,
    draft: {
      url: 'http://localhost:4293/preview',
      query: {
        type: type,
        slug: '{slug}'
      },
    },
  }));
};

export default ({ env }) => ({
  upload: {
    config: {
      provider: 'local', // <-- DEVI specificare il provider
      providerOptions: {
        sizeLimit: 100 * 1024 * 1024, // 100MB
      },
    },
  },
  'preview-button': {
    enabled: true,
    config: {
      // Per ogni Content Type che vuoi abilitare, aggiungi una voce
      contentTypes: generatePreviewConfig(),
    },
  },

   'tagsinput': {
    enabled: true,
  },
  'tree-view': {
    enabled: true,
    resolve: './src/plugins/tree-view',
  },
  
  
});