import { http } from '@/services/http';
import { apiUrl } from '@/services/endpoints';

const toQueryString = (params) => '?' + new URLSearchParams(params).toString();

// Opt-ins (and any evUser attribute) are saved through the same update endpoint:
// PUT /perfil/user/evbk/update?guid=<guid>  body: { attributes: [{name, value}] }
const updateAttributes = (guid, attributes) =>
  http.put(apiUrl('/perfil/user/evbk/update' + toQueryString({ guid })), { attributes });

const notificationsService = { updateAttributes };

export default notificationsService;
