import { http } from '@/services/http';
import { apiUrl } from '@/services/endpoints';

// Administración del registry de permisos (editor). Backend: ConsoleAuthController.
// La persistencia del backend es SOLO en memoria por ahora (se pierde al reiniciar).

// GET /perfil/console/auth/permissions?app=<app>
//   -> { roles:[...], tabs:[...], actions:[...], fields:[...], permissions:{ role->{tabs,actions,fields} } }
const getAll = (app) =>
  http.get(apiUrl('/perfil/console/auth/permissions?app=' + encodeURIComponent(app)));

// PUT /perfil/console/auth/permissions?app=<app>&role=<role>  body: { tabs, actions, fields }
const save = (app, role, perms) =>
  http.put(
    apiUrl(
      '/perfil/console/auth/permissions?app=' +
        encodeURIComponent(app) +
        '&role=' +
        encodeURIComponent(role),
    ),
    perms,
  );

const permissionsAdminService = { getAll, save };

export default permissionsAdminService;
