// Administración del registry de permisos (editor /permisos). Delega en el edge-console-sdk (plano sesión).
import { adminSdk } from '@/services/console';

// GET …/admin/permissions -> { roles, tabs, actions, fields, permissions }. La consola la resuelve el
// backend por la apikey del proxy, no por parámetro.
const getAll = () => adminSdk.admin.getPermissions();

// PUT …/admin/privileges/{role}  body: { tabs, actions, fields }
const save = (role, perms) => adminSdk.admin.savePermissions(role, perms);

// Roles con metadata: [{ name, prefixedName, description }]. `name` = rolename pelado; `prefixedName`
// = grupo en Evolok ({consoleId}-{ROL}). El backend pone/quita el prefijo.
const listRoles = () => adminSdk.admin.roles.list();

// Alta / edición de descripción / baja. La descripción es obligatoria (se valida en el front y en
// backend). El backend aplica el prefijo Evolok y gata las mutaciones por el meta-privilegio
// permisos.edit.
const createRole = (name, description) => adminSdk.admin.roles.create(name, description);
const updateRole = (name, description) => adminSdk.admin.roles.update(name, description);
const deleteRole = (name) => adminSdk.admin.roles.remove(name);

// Catálogo (universo de claves de la consola): { roles, tabs, actions, fields }. Es lo que define qué
// tabs/acciones/datos aparecen en la vista de permisos. Se guarda junto al mapa de roles/privilegios.
const getCatalog = () => adminSdk.admin.catalog.get();
const setCatalog = (catalog) => adminSdk.admin.catalog.set(catalog); // { tabs, actions, fields }

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
