import { http } from '@/services/http';
import { apiUrl } from '@/services/endpoints';

// Curated, secret-free subset of the remote Evolok config. The backend (web-core
// BackofficeController) is the security boundary: GET returns only whitelisted
// dot-path keys, POST applies only whitelisted keys onto the full config. We
// always send the full curated map back (not just changed fields).
const CONFIG_PATH = '/perfil/user/ev/backoffice/config-curated';

const getConfig = () => http.get(apiUrl(CONFIG_PATH));

const saveConfig = (values) => http.post(apiUrl(CONFIG_PATH), values);

const configService = {
  getConfig,
  saveConfig,
};

export default configService;
