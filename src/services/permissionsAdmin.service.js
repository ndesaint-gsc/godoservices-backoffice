// Administración del registry de permisos (editor /permisos). Delega en el console-sdk (plano sesión).
import sdk from '@/services/console';

// GET /perfil/console/auth/permissions -> { roles, tabs, actions, fields, permissions }
const getAll = (app) => sdk.admin.getPermissions();

// PUT /perfil/console/auth/permissions?role=  body: { tabs, actions, fields }
const save = (app, role, perms) => sdk.admin.savePermissions(role, perms);

const permissionsAdminService = { getAll, save };
export default permissionsAdminService;
