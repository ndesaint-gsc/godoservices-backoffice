// Permisos de la consola. Los hooks de verificación viven ahora en el console-sdk (independiente de
// redux); aquí se reexportan para no cambiar los ~10 consumidores. El snapshot de permisos lo alimenta
// <ConsoleProvider> en App.jsx desde redux.
export { useTabVisible, useActionAllowed, useFieldMode } from '@/console-sdk/react';

// appId de esta consola (la MENTOR): producto GGOBO (grupogodo business object, id `welcome`) +
// appconsole `console` → consoleId `welcome-console`. Es el `?app=` contra el backend y el prefijo de
// grupo Evolok (`welcome-console-{ROL}`). Otro backoffice usaría su propio APP_ID contra el mismo motor.
export const APP_ID = 'welcome-console';

// Selectores redux (usados por el bridge que alimenta el ConsoleProvider).
export const selectPermissions = (state) => state.auth.permissions;
export const selectRole = (state) => state.auth.role;
