import { useSelector } from 'react-redux';

// appId de esta consola en el registry de permisos del backend (GET /perfil/console/auth/me?app=).
// Otro backoffice SaaS usaría su propio APP_ID contra el mismo endpoint/motor.
export const APP_ID = 'lv-console';

export const selectPermissions = (state) => state.auth.permissions;
export const selectRole = (state) => state.auth.role;

// Tab visible. Mientras los permisos no han cargado (null) → optimista (visible) para no
// parpadear el nav; una vez cargados, solo visible si la clave es exactamente 'visible'
// (app/rol desconocido devuelve permisos vacíos → todo oculto).
export const useTabVisible = (tabKey) => {
  const permissions = useSelector(selectPermissions);
  if (!tabKey) return true;
  if (!permissions) return true;
  return permissions.tabs?.[tabKey] === 'visible';
};

// Acción permitida: default-deny. Solo true si explícitamente 'allowed' (también denegado
// mientras los permisos cargan, para no permitir acciones antes de conocerlos).
export const useActionAllowed = (actionKey) => {
  const permissions = useSelector(selectPermissions);
  if (!actionKey) return true;
  return !!permissions && permissions.actions?.[actionKey] === 'allowed';
};

// Modo de un dato (fase 2): 'editable' | 'viewable' | 'hidden'. Por ahora `fields` viene vacío,
// así que el default es 'editable' (no altera los formularios existentes).
export const useFieldMode = (fieldKey) => {
  const permissions = useSelector(selectPermissions);
  return permissions?.fields?.[fieldKey] || 'editable';
};
