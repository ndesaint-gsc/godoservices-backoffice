// edge-console-sdk/verify.js
// Verificación de permisos — funciones PURAS sobre un snapshot de permisos (sin React, sin redux).
// El snapshot tiene la forma { tabs:{key:'visible'|'hidden'}, actions:{key:'allowed'|'denied'},
// fields:{key:'editable'|'viewable'|'hidden'} } tal como lo devuelve el endpoint …/auth/me.

// Tab visible. Mientras los permisos no han cargado (null) → optimista (visible) para no parpadear el
// nav; una vez cargados, solo visible si la clave es exactamente 'visible' (app/rol desconocido
// devuelve permisos vacíos → todo oculto).
export const tabVisible = (permissions, tabKey) => {
  if (!tabKey) return true;
  if (!permissions) return true;
  return permissions.tabs?.[tabKey] === 'visible';
};

// Acción permitida: default-deny. Solo true si explícitamente 'allowed' (también denegado mientras
// los permisos cargan, para no permitir acciones antes de conocerlos).
export const actionAllowed = (permissions, actionKey) => {
  if (!actionKey) return true;
  return !!permissions && permissions.actions?.[actionKey] === 'allowed';
};

// Modo de un dato: 'editable' | 'viewable' | 'hidden'. Default 'editable' cuando no está declarado.
export const fieldMode = (permissions, fieldKey) => permissions?.fields?.[fieldKey] || 'editable';
