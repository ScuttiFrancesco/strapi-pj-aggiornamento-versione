// src/api/pagina/content-types/pagina/lifecycles.js

module.exports = {
  async beforeUpdate(event) {
    const { data, where } = event.params;

    // Check if this is a soft-delete operation
    // The soft-delete plugin might use different field names like _softDeletedAt, deleted, or isDeleted
    if (data && (data._softDeletedAt || data.deleted || typeof data.isDeleted !== 'undefined')) {
      console.log(`Soft-deleting page with id: ${where.id}. Unpublishing...`);
      data.publishedAt = null;
    }
  },
};