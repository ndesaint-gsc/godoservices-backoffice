import { http } from '@/services/http';
import { apiUrl } from '@/services/endpoints';

// Catálogo de roles asignables (temporales).
//
// No hay endpoint dedicado de "roles asignables". El backoffice antiguo (Groovy)
// lo obtenía de `config.getTableRoles().findAll { it.isRoleTemporal() }`. Aquí se
// replica leyendo el EvolokConfig:
//   GET /perfil/console/configuration?cache=true  ->  EvolokConfig
// El EvolokConfig serializa `tableRoles: RoleTable[]`, donde cada RoleTable lleva
// `evolokRole` (clave del rol) y `roleTemporal` (boolean). Se filtran los temporales
// y se mapean por su `evolokRole` (mismo criterio que RoleAssignmentsLayout.getRoles()
// / la combobox del Groovy). Se de-duplican manteniendo el orden de aparición.
const getRoleCatalog = async () => {
  const config = await http.get(apiUrl('/perfil/console/configuration?cache=true'));
  const tableRoles = Array.isArray(config?.tableRoles) ? config.tableRoles : [];
  const roles = tableRoles
    .filter((role) => role && role.roleTemporal && role.evolokRole)
    .map((role) => role.evolokRole);
  return [...new Set(roles)];
};

// Asignación masiva de roles (asíncrona; el resultado se envía por email).
//   POST /perfil/console/user/assignRoleMassive   (multipart/form-data)
// Campos: linkAssignRoleFile (CSV), email, startDate, endDate, roleSelected, contentOption.
// Se usa un fetch crudo porque el body es FormData (el navegador fija el boundary),
// igual que tools.service.uploadNifs.
const assignMassive = async (formData) => {
  const response = await fetch(apiUrl('/perfil/console/user/assignRoleMassive'), {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`${response.status}${errorText ? ': ' + errorText : ''}`);
  }
  return response.text();
};

const rolesService = { getRoleCatalog, assignMassive };

export default rolesService;
