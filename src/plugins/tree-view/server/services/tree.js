const pickLabelField = (attributes, explicit) => {
  if (explicit && attributes[explicit]) return explicit;
  if (attributes.title) return 'title';
  if (attributes.titolo) return 'titolo'; // Italian
  if (attributes.name) return 'name';
  if (attributes.label) return 'label';
  return 'id';
};

const findSelfReferentialField = (attributes, contentType) => {
  // Find a field that relates to the same content type
  for (const [fieldName, fieldConfig] of Object.entries(attributes)) {
    if (fieldConfig.type === 'relation' && 
        fieldConfig.target === contentType &&
        (fieldConfig.relation === 'oneToOne' || fieldConfig.relation === 'manyToOne')) {
      return fieldName;
    }
  }
  
  // Common field names for hierarchical structures
  const commonParentFields = ['parent', 'pagina', 'categoria', 'genitore'];
  for (const fieldName of commonParentFields) {
    if (attributes[fieldName] && attributes[fieldName].type === 'relation') {
      return fieldName;
    }
  }
  
  return null;
};

module.exports = {
  /**
   * Build a tree from flat entries of a self-referential content-type
   * @param {object} opts
   * @param {string} opts.contentType - UID e.g. api::pagina.pagina
   * @param {string} [opts.parentField] - relation field (manyToOne / oneToOne) referencing same CT. Auto-detected if not provided.
   * @param {string} [opts.labelField] - field for display
   */
  async buildTree({ contentType, parentField, labelField }) {
    const ctSchema = strapi.getModel(contentType);
    if (!ctSchema) throw new Error(`Unknown content-type: ${contentType}`);

    // Auto-detect parent field if not provided
    const actualParentField = parentField || findSelfReferentialField(ctSchema.attributes, contentType);
    if (!actualParentField) {
      throw new Error(`No self-referential field found in ${contentType}. Available fields: ${Object.keys(ctSchema.attributes).join(', ')}`);
    }

    const labelKey = pickLabelField(ctSchema.attributes, labelField);

    strapi.log.info(`[tree-view] Building tree for ${contentType}, parent field: ${actualParentField}, label field: ${labelKey}`);

    // Fetch all entries
    const entries = await strapi.entityService.findMany(contentType, {
      populate: [actualParentField],
      fields: ['id', labelKey, actualParentField],
      filters: {},
      sort: { id: 'asc' },
      limit: -1,
    });

    strapi.log.info(`[tree-view] Found ${entries.length} entries for ${contentType}`);
    strapi.log.debug(`[tree-view] Entries sample:`, entries.slice(0, 3));

    // Normalize
    const nodes = entries.map((e) => {
      const parentValue = e[actualParentField];
      const parentId = parentValue?.id || parentValue || null;
      
      const node = {
        id: e.id,
        label: e[labelKey] ?? `#${e.id}`,
        parent: parentId,
        children: [],
        raw: e,
      };
      
      strapi.log.debug(`[tree-view] Node ${e.id}: label="${node.label}", parent=${parentId}, raw parent:`, parentValue);
      return node;
    });

    const byId = new Map();
    nodes.forEach((n) => byId.set(n.id, n));
    const roots = [];
    nodes.forEach((n) => {
      if (n.parent && byId.has(n.parent)) {
        byId.get(n.parent).children.push(n);
      } else {
        roots.push(n);
      }
    });

    // sort children recursively alphabetically by label
    const sortRec = (arr) => {
      arr.sort((a, b) => a.label.localeCompare(b.label));
      arr.forEach((c) => sortRec(c.children));
    };
    sortRec(roots);
    
    strapi.log.info(`[tree-view] Built tree with ${roots.length} root nodes`);
    return roots;
  },
};
