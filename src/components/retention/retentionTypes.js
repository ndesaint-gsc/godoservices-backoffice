// Metadatos de los tipos de contenido de retención. Espejo de los campos del
// backend (ConsoleUserController.updateOfferContentRetention + RetentionConfig).
// `apiType` es el {type} del endpoint retention-update/{type}.
// `listKey` es la clave dentro de la Config del tenant (RetentionConfig.Config).
// `fields` define qué inputs se pintan y se envían en el body.

const TEXT = 'text';
const URL = 'url';
const BOOL = 'bool';

export const RETENTION_TYPES = {
  OFFER: {
    apiType: 'OFFER',
    listKey: 'offers',
    label: 'Ofertas',
    singular: 'Oferta',
    // offers es Map<String, Offer[]> agrupado por proveedor (clave EVLCL).
    grouped: true,
    groupKey: 'EVLCL',
    titleField: 'description',
    fields: [
      { name: 'description', label: 'Descripción', type: TEXT, required: true },
      { name: 'discount', label: 'Descuento', type: TEXT, required: true },
      { name: 'url', label: 'URL', type: URL, required: true },
      { name: 'imageUrl', label: 'Imagen (URL)', type: URL, image: true },
    ],
  },
  ARTICLE: {
    apiType: 'ARTICLE',
    listKey: 'articles',
    label: 'Artículos',
    singular: 'Artículo',
    titleField: 'title',
    fields: [
      { name: 'title', label: 'Título', type: TEXT, required: true },
      { name: 'section', label: 'Sección', type: TEXT, required: true },
      { name: 'author', label: 'Autor', type: TEXT, required: true },
      { name: 'url', label: 'URL', type: URL, required: true },
      { name: 'freemium', label: 'Freemium', type: BOOL },
      { name: 'imageUrl', label: 'Imagen (URL)', type: URL, image: true },
    ],
  },
  FEATURE: {
    apiType: 'FEATURE',
    listKey: 'features',
    label: 'Features',
    singular: 'Feature',
    titleField: 'title',
    fields: [
      { name: 'title', label: 'Título', type: TEXT, required: true },
      { name: 'description', label: 'Descripción', type: TEXT, required: true },
      { name: 'url', label: 'URL', type: URL, required: true },
      { name: 'imageUrl', label: 'Imagen (URL)', type: URL, image: true },
    ],
  },
  SECTION: {
    apiType: 'SECTION',
    listKey: 'sections',
    label: 'Secciones',
    singular: 'Sección',
    titleField: 'title',
    fields: [
      { name: 'title', label: 'Título', type: TEXT, required: true },
      { name: 'description', label: 'Descripción', type: TEXT, required: true },
      { name: 'url', label: 'URL', type: URL, required: true },
      { name: 'imageUrl', label: 'Imagen (URL)', type: URL, image: true },
    ],
  },
};

export const FIELD_KINDS = { TEXT, URL, BOOL };

// Extrae la lista de items de un tipo desde la Config del tenant.
// Para OFFER, la lista vive bajo config.offers[groupKey].
export const itemsForType = (tenantConfig, typeDef) => {
  if (!tenantConfig) return [];
  const container = tenantConfig[typeDef.listKey];
  if (typeDef.grouped) {
    return (container && container[typeDef.groupKey]) || [];
  }
  return Array.isArray(container) ? container : [];
};
