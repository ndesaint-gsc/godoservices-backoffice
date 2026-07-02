// Permisos de la consola. Los hooks de verificación viven ahora en el console-sdk (independiente de
// redux); aquí se reexportan para no cambiar los ~10 consumidores. El snapshot de permisos lo alimenta
// <ConsoleProvider> en App.jsx desde redux.
export { useTabVisible, useActionAllowed, useFieldMode } from '@/console-sdk/react';

// appId de esta consola en el backend (GET /perfil/console/auth/me?app=). Otro backoffice usaría su
// propio APP_ID contra el mismo motor/endpoint.
export const APP_ID = 'lv-console';

// Selectores redux (usados por el bridge que alimenta el ConsoleProvider).
export const selectPermissions = (state) => state.auth.permissions;
export const selectRole = (state) => state.auth.role;
