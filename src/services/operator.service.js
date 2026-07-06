// Operador + permisos, vía edge-console-sdk.
// - getOperator: identidad + roles del operador desde Evolok (directo). roleOverride solo DEV.
// - resolvePermissions: mapa de privilegios fusionado para esos roles (backend …/admin/privileges/resolve).
import sdk from '@/services/console';

const getOperator = (roleOverride) => sdk.auth.getOperator(roleOverride);
const resolvePermissions = (roles) => sdk.privileges.resolve(roles);

const operatorService = { getOperator, resolvePermissions };
export default operatorService;
