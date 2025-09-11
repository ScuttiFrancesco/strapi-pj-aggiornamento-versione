/**
 * Tree controller
 * Builds a hierarchical structure for a given self-referential content-type.
 * Query params:
 *  contentType (required) -> UID e.g. api::pagina.pagina
 *  parentField (optional, default: parent) -> relation field name referencing same CT
 *  labelField (optional, default: title|name|id) -> field used for display
 */

module.exports = {
  async find(ctx) {
    strapi.log.debug('[tree-view] controller tree.find called with query %o', ctx.query);
    const { contentType, parentField, labelField } = ctx.query;
    if (!contentType) {
      return ctx.badRequest('Missing contentType query parameter');
    }

    try {
      // Inline tree building logic to avoid service context issues
      const ctSchema = strapi.getModel(contentType);
      if (!ctSchema) {
        throw new Error(`Unknown content-type: ${contentType}`);
      }

      // Auto-detect parent field if not provided
      let actualParentField = parentField;
      if (!actualParentField) {
        // Find self-referential field
        for (const [fieldName, fieldConfig] of Object.entries(ctSchema.attributes)) {
          if (fieldConfig.type === 'relation' && 
              fieldConfig.target === contentType &&
              (fieldConfig.relation === 'oneToOne' || fieldConfig.relation === 'manyToOne')) {
            actualParentField = fieldName;
            break;
          }
        }
        // Common fallbacks
        if (!actualParentField) {
          const commonFields = ['parent', 'pagina', 'categoria', 'genitore'];
          for (const fieldName of commonFields) {
            if (ctSchema.attributes[fieldName] && ctSchema.attributes[fieldName].type === 'relation') {
              actualParentField = fieldName;
              break;
            }
          }
        }
      }

      if (!actualParentField) {
        throw new Error(`No self-referential field found in ${contentType}. Available fields: ${Object.keys(ctSchema.attributes).join(', ')}`);
      }

      // Auto-detect label field
      let labelKey = labelField;
      if (!labelKey || !ctSchema.attributes[labelKey]) {
        if (ctSchema.attributes.title) labelKey = 'title';
        else if (ctSchema.attributes.titolo) labelKey = 'titolo';
        else if (ctSchema.attributes.name) labelKey = 'name';
        else if (ctSchema.attributes.label) labelKey = 'label';
        else labelKey = 'id';
      }

      strapi.log.info(`[tree-view] Building tree for ${contentType}, parent field: ${actualParentField}, label field: ${labelKey}`);

      // Use strapi.db instead of entityService for manual routes
      const entries = await strapi.db.query(contentType).findMany({
        populate: [actualParentField],
        orderBy: { id: 'asc' },
        where: {
          publishedAt: { $notNull: true } // Solo contenuti pubblicati
        }
      });

      strapi.log.info(`[tree-view] Found ${entries.length} entries for ${contentType}`);

      // Normalize to tree structure
      const nodes = entries.map((e) => {
        const parentValue = e[actualParentField];
        let parentId = null;
        
        // Gestione migliore delle relazioni parent
        if (parentValue) {
          if (typeof parentValue === 'object') {
            // Se parentValue è un oggetto con dati completi
            parentId = parentValue.documentId || parentValue.id;
          } else {
            // Se parentValue è un ID diretto (numerico o stringa)
            parentId = parentValue;
          }
        }
        
        strapi.log.debug(`[tree-view] Node ${e.documentId || e.id} (${e[labelKey]}) has parent: ${parentId}`);
        
        return {
          id: e.documentId || e.id, // Usa documentId se disponibile, altrimenti id numerico
          numericId: e.id, // Mantieni l'id numerico per compatibilità
          documentId: e.documentId, // Aggiungi documentId esplicito
          label: e[labelKey] ?? `#${e.id}`,
          parent: parentId,
          children: [],
          raw: e,
        };
      });

      strapi.log.info(`[tree-view] Processed nodes:`, nodes.map(n => `${n.label} -> parent: ${n.parent}`));

      // Build tree
      const byId = new Map();
      const byNumericId = new Map();
      
      // Popola le mappe con entrambi gli ID per gestire relazioni miste
      nodes.forEach((n) => {
        byId.set(n.id, n);
        if (n.numericId) {
          byNumericId.set(n.numericId, n);
        }
        if (n.documentId) {
          byId.set(n.documentId, n);
        }
      });
      
      const roots = [];
      
      nodes.forEach((n) => {
        if (n.parent) {
          // Cerca il parent usando sia documentId che ID numerico
          let parentNode = byId.get(n.parent) || byNumericId.get(n.parent);
          
          if (parentNode) {
            parentNode.children.push(n);
            strapi.log.debug(`[tree-view] Added ${n.label} as child of ${parentNode.label}`);
          } else {
            // Se il parent non è trovato, aggiungi ai root ma logga il warning
            strapi.log.warn(`[tree-view] Parent ${n.parent} not found for node ${n.label}, adding to roots`);
            roots.push(n);
          }
        } else {
          roots.push(n);
        }
      });

      // Sort children recursively alphabetically by label
      const sortRec = (arr) => {
        arr.sort((a, b) => a.label.localeCompare(b.label));
        arr.forEach((c) => sortRec(c.children));
      };
      sortRec(roots);
      
      strapi.log.info(`[tree-view] Tree built successfully: ${roots.length} root nodes`);
      ctx.body = { data: roots };
    } catch (e) {
      strapi.log.error('[tree-view] Error building tree: %s', e.message);
      strapi.log.error('[tree-view] Error stack:', e.stack);
      ctx.throw(500, e.message);
    }
  },
};
