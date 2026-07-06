// Singletons de los SDK de consola para esta app.
// - `sdk` (edge-console-sdk, CONSUMIDOR): auth + carga del mapa de privilegios + verify. Es lo que se
//   entregaría a un tercero.
// - `adminSdk` (edge-console-administrator, ADMINISTRACIÓN): admin de roles/privilegios/catálogo +
//   admin de consolas. Solo lo usa godoservices como consola MENTOR.
//
// - AUTH del operador: DIRECTA contra Evolok. En prod hay que cablear el IC web (evl-accounts.js /
//   window.evl) para leer el operador de backoffice + sus grupos Evolok. Mientras no esté cableado,
//   se usa un mock DEV que respeta el override de rol del switcher.
//   TODO(evolok-ic): sustituir devEvolokSession por la lectura real del IC web.
// - CONSUMO (mapa de privilegios): backend …/client/** (apikey inyectada por el proxy).
// - ADMIN: backend …/admin/** (apikey) y …/consoles/** (sesión Evolok).
import { createConsole } from '@/edge-console-sdk';
import { createConsoleAdmin } from '@/edge-console-administrator';
import { APP_ID } from '@/common/permissions/permissions';
import authService from '@/services/auth.service';

const devEvolokSession = async (roleOverride) => {
  const roles = Array.isArray(roleOverride) ? roleOverride : roleOverride ? [roleOverride] : ['ADMIN'];
  return {
    operator: { id: 'op-mock', email: 'operador@grupogodo.com', name: 'Operador (mock)' },
    // Grupos tal como los daría Evolok, con el prefijo {consoleId}- (el SDK lo quita → roles pelados).
    groups: roles.map((r) => `${APP_ID}-${String(r).toUpperCase()}`),
  };
};

const onUnauthorized = () => {
  authService.logout();
};

const sdk = createConsole({
  consoleId: APP_ID,
  getEvolokSession: devEvolokSession,
  onUnauthorized,
});

// Administración (mentor): sin getEvolokSession (no autentica al operador; usa sesión/apikey del proxy).
export const adminSdk = createConsoleAdmin({
  consoleId: APP_ID,
  onUnauthorized,
});

export default sdk;
