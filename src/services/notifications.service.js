import { http } from '@/services/http';
import { apiUrl } from '@/services/endpoints';

// Opt-ins (and any evUser attribute) are saved through the same update endpoint:
// PUT /perfil/console/user/{guid}  body: { attributes: [{name, value}] }
const updateAttributes = (guid, attributes) =>
  http.put(apiUrl('/perfil/console/user/' + guid), { attributes });

// Catálogos disponibles (EvolokConfig), por tenant: { LV: Catalog[], MD: [...], R1: [...] }.
// Catalog = { id, name, image, category, isUrlExternal }.
const getNewslettersCatalog = () => http.get(apiUrl('/perfil/console/user/newsletters'));

const getInterestsCatalog = () => http.get(apiUrl('/perfil/console/user/interests'));

const notificationsService = { updateAttributes, getNewslettersCatalog, getInterestsCatalog };

export default notificationsService;
