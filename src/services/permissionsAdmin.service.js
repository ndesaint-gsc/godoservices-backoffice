// Administración del registry de permisos (editor /permisos). Delega en el edge-console-sdk (plano sesión).
import sdk from '@/services/console';

// GET …/web-and-console-integrations/auth/permissions -> { roles, tabs, actions, fields, permissions }
const getAll = (app) => sdk.admin.getPermissions();

// PUT …/web-and-console-integrations/auth/permissions?role=  body: { tabs, actions, fields }
const save = (app, role, perms) => sdk.admin.savePermissions(role, perms);

// Roles con metadata: [{ name, prefixedName, description }]. `name` = rolename pelado; `prefixedName`
// = grupo en Evolok ({consoleId}-{ROL}). El backend pone/quita el prefijo.
const listRoles = () => sdk.admin.roles.list();

// Alta / edición de descripción / baja. La descripción es obligatoria (se valida en el front y en
// backend). El backend aplica el prefijo Evolok y gata las mutaciones por el meta-privilegio
// permisos.edit.
const createRole = (name, description) => sdk.admin.roles.create(name, description);
const updateRole = (name, description) => sdk.admin.roles.update(name, description);
const deleteRole = (name) => sdk.admin.roles.remove(name);

// Catálogo (universo de claves de la consola): { roles, tabs, actions, fields }. Es lo que define qué
// tabs/acciones/datos aparecen en la vista de permisos. Se guarda junto al mapa de roles/privilegios.
const getCatalog = () => sdk.admin.catalog.get();
const setCatalog = (catalog) => sdk.admin.catalog.set(catalog); // { tabs, actions, fields }

const permissionsAdminService = {
  getAll,
  save,
  listRoles,
  createRole,
  updateRole,
  deleteRole,
  getCatalog,
  setCatalog,
};
export default permissionsAdminService;
