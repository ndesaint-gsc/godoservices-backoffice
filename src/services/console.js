// Singleton del edge-console-sdk para esta app.
// - AUTH del operador: DIRECTA contra Evolok. En prod hay que cablear el IC web (evl-accounts.js /
//   window.evl) para leer el operador de backoffice + sus grupos Evolok. Mientras no esté cableado,
//   se usa un mock DEV que respeta el override de rol del switcher.
//   TODO(evolok-ic): sustituir devEvolokSession por la lectura real del IC web.
// - ADMIN / mapa de privilegios: backend …/admin/** (apikey inyectada por el proxy).
import { createConsole } from '@/edge-console-sdk';
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

const sdk = createConsole({
  consoleId: APP_ID,
  getEvolokSession: devEvolokSession,
  onUnauthorized: () => {
    authService.logout();
  },
});

export default sdk;
