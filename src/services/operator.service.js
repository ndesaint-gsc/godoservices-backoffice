import { http } from '@/services/http';
import { apiUrl } from '@/services/endpoints';

const toQueryString = (params) => '?' + new URLSearchParams(params).toString();

// GET /perfil/console/auth/me?app=<appId>[&role=<override>]
//   -> { operator:{id,email,name}, role, permissions:{ tabs:{}, actions:{}, fields:{} } }
// `app` = backoffice id (lv-console). `roleOverride` solo en DEV para previsualizar permisos por rol;
// en prod el rol lo resuelve el backend desde la sesión Evolok.
const getMe = (app, roleOverride) => {
  const params = { app };
  if (roleOverride) params.role = roleOverride;
  return http.get(apiUrl('/perfil/console/auth/me' + toQueryString(params)));
};

const operatorService = { getMe };
export default operatorService;
