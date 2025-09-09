import type { Schema, Struct } from '@strapi/strapi';

export interface ConfigColumn extends Struct.ComponentSchema {
  collectionName: 'components_config_columns';
  info: {
    displayName: 'column';
  };
  attributes: {
    composizioneColonnaMulti: Schema.Attribute.JSON &
      Schema.Attribute.CustomField<
        'plugin::multi-select.multi-select',
        ['data', 'titolo', 'comune', 'fonte', 'descrizione']
      > &
      Schema.Attribute.DefaultTo<'[]'>;
    etichetta: Schema.Attribute.String & Schema.Attribute.Required;
    isCliccabile: Schema.Attribute.Boolean;
    nomeColonna: Schema.Attribute.String;
    tipo: Schema.Attribute.Enumeration<['text', 'data', 'data-ora', 'file']>;
  };
}

export interface ConfigDataConfig extends Struct.ComponentSchema {
  collectionName: 'components_config_data_configs';
  info: {
    displayName: 'data-config';
  };
  attributes: {
    columns: Schema.Attribute.Component<'config.column', true>;
    tipoLayout: Schema.Attribute.Enumeration<['tabella', 'pagina']>;
  };
}

export interface ConfigTabella extends Struct.ComponentSchema {
  collectionName: 'components_config_tabellas';
  info: {
    displayName: 'tabella';
  };
  attributes: {
    columns: Schema.Attribute.Component<'config.column', true> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<
        [
          {
            composizioneColonnaMulti: '["data"]';
            etichetta: 'data';
            isCliccabile: false;
            nomeColonna: 'Data';
            tipo: 'data';
          },
          {
            composizioneColonnaMulti: '["titolo","data"]';
            etichetta: 'titolo';
            isCliccabile: false;
            nomeColonna: 'Titolo';
            tipo: 'text';
          },
        ]
      >;
  };
}

export interface LayoutArticolo extends Struct.ComponentSchema {
  collectionName: 'components_layout_articolos';
  info: {
    displayName: 'articolo';
    icon: 'file';
  };
  attributes: {
    contenuto: Schema.Attribute.RichText &
      Schema.Attribute.CustomField<
        'plugin::ckeditor5.CKEditor',
        {
          preset: 'defaultHtml';
        }
      >;
  };
}

export interface LayoutSoloTesto extends Struct.ComponentSchema {
  collectionName: 'components_layout_solo_testos';
  info: {
    displayName: 'solo testo';
  };
  attributes: {
    contenuto: Schema.Attribute.Blocks;
    titolo: Schema.Attribute.String;
  };
}

export interface LayoutTitolo extends Struct.ComponentSchema {
  collectionName: 'components_layout_titolos';
  info: {
    displayName: 'titolo';
  };
  attributes: {
    titolo: Schema.Attribute.String;
  };
}

export interface PostazioniPostazione1 extends Struct.ComponentSchema {
  collectionName: 'components_postazioni_postazione1s';
  info: {
    displayName: 'postazione1';
  };
  attributes: {
    data: Schema.Attribute.Date;
    dddd: Schema.Attribute.Component<'postazioni.postazione2', true>;
    name: Schema.Attribute.String;
  };
}

export interface PostazioniPostazione2 extends Struct.ComponentSchema {
  collectionName: 'components_postazioni_postazione2s';
  info: {
    displayName: 'postazione2';
  };
  attributes: {
    img: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    name: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'config.column': ConfigColumn;
      'config.data-config': ConfigDataConfig;
      'config.tabella': ConfigTabella;
      'layout.articolo': LayoutArticolo;
      'layout.solo-testo': LayoutSoloTesto;
      'layout.titolo': LayoutTitolo;
      'postazioni.postazione1': PostazioniPostazione1;
      'postazioni.postazione2': PostazioniPostazione2;
    }
  }
}
