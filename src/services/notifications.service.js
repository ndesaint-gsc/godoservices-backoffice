import { http } from '@/services/http';
import { apiUrl } from '@/services/endpoints';

// Opt-ins (and any evUser attribute) are saved through the same update endpoint:
// PUT /perfil/console/user/{guid}  body: { attributes: [{name, value}] }
const updateAttributes = (guid, attributes) =>
  http.put(apiUrl('/perfil/console/user/' + guid), { attributes });

const notificationsService = { updateAttributes };

export default notificationsService;
