// edge-console-sdk — interfaz pública del CONSUMIDOR (lo que se entrega a un tercero).
//
// Módulo independiente (sin redux/MUI). Consume nuestro sistema de auth/roles/privilegios; NO administra
// nada (la administración de consolas/roles/permisos es el paquete @/edge-console-administrator).
//   - AUTH del operador + sus ROLES → DIRECTO contra Evolok (la app pasa `getEvolokSession`, que reusa
//     el IC web). El SDK quita el prefijo {consoleId}- → roles pelados.
//   - PRIVILEGIOS: el backend sirve el mapa por rol(es) en el plano CLIENT (…/client/**, apikey del
//     producto inyectada por el proxy).
//   - Verificación en pantalla: funciones puras (verify) sobre el snapshot de permisos.
//
// Uso:
//   const sdk = createConsole({ consoleId: 'welcome-console', getEvolokSession });
//   const { operator, roles } = await sdk.auth.getOperator();
//   const permissions = await sdk.privileges.resolve(roles);
//   sdk.verify.actionAllowed(permissions, 'datos.delete');

import { createConsoleClient, ConsoleError } from './client';
import { createAuthApi } from './auth';
import { createAuthService } from './auth.service';
import { createPrivilegesApi } from './privileges';
import * as verify from './verify';
import * as keys from './keys';

export function createConsole(config = {}) {
  const client = createConsoleClient(config);
  const authService = config.evolok
    ? createAuthService({ ...config.evolok, onUnauthorized: config.onUnauthorized })
    : null;
  // Explicit config override (tests/dev) wins; otherwise the real authService's getEvolokSession.
  const getEvolokSession =
    config.getEvolokSession || (authService ? authService.getEvolokSession : undefined);
  return {
    client,
    consoleId: config.consoleId,
    authService,
    auth: createAuthApi({ ...config, getEvolokSession }),
    privileges: createPrivilegesApi(client),
    verify,
    keys,
  };
}

export { createConsoleClient, ConsoleError, verify, keys };
export { BASE, CLIENT } from './paths'; // BASE lo reusa el paquete edge-console-administrator
export * from './keys';
