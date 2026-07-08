// Singletons de los SDK de consola para esta app.
// - `sdk` (edge-console-sdk, CONSUMIDOR): auth + carga del mapa de privilegios + verify. Es lo que se
//   entregaría a un tercero.
// - `adminSdk` (edge-console-administrator, ADMINISTRACIÓN): admin de roles/privilegios/catálogo +
//   admin de consolas. Solo lo usa godoservices como consola MENTOR.
//
// - AUTH del operador: DIRECTA contra Evolok (POST /ic/api/session + GET /userProfile + GET /userProfile/{guid}/role),
//   implementada en edge-console-sdk/auth.service.js y expuesta aquí como `consoleAuthService`. En dev
//   el proxy Vite reenvía `/ic/*` a ev.lavanguardia.biz para esquivar CORS.
// - CONSUMO (mapa de privilegios): backend …/client/** (apikey inyectada por el proxy).
// - ADMIN: backend …/admin/** (apikey) y …/consoles/** (sesión Evolok).
import { createConsole } from '@/edge-console-sdk';
import { createConsoleAdmin } from '@/edge-console-administrator';
import { APP_ID } from '@/common/permissions/permissions';

// Puente 401 → logout: el SDK (y http.js) no conocen redux, así que la app registra aquí el handler
// (App.jsx → dispatch(logout()), que limpia redux + la sesión del SDK). Un 401 = sesión Evolok
// inválida/caducada → logout completo. (La denegación por permiso de página NO pasa por aquí: va a
// home desde AuthenticatedRoute.)
let onUnauthorizedHandler = () => {};
export const setOnUnauthorized = (handler) => {
  onUnauthorizedHandler = typeof handler === 'function' ? handler : () => {};
};
// Dispara el handler de 401. Lo usan el cliente del SDK y http.js (operaciones) → mismo logout.
export const notifyUnauthorized = () => onUnauthorizedHandler();

// Base de Evolok: vacío en local → el proxy Vite reenvía `/ic/*` a ev.lavanguardia.{biz|com}.
const EVOLOK_BASE = import.meta.env.VITE_EVOLOK_BASE || '';

const sdk = createConsole({
  consoleId: APP_ID,
  evolok: { baseUrl: EVOLOK_BASE, realm: 'default_realm' },
  onUnauthorized: notifyUnauthorized,
});

// authService real (login/logout/getAuthToken/setSession) contra Evolok.
export const consoleAuthService = sdk.authService;

// Administración (mentor): sin getEvolokSession (no autentica al operador; usa sesión/apikey del proxy).
export const adminSdk = createConsoleAdmin({
  consoleId: APP_ID,
  onUnauthorized: notifyUnauthorized,
});

export default sdk;
