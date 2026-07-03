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
import { createPrivilegesApi } from './privileges';
import * as verify from './verify';
import * as keys from './keys';

export function createConsole(config = {}) {
  const client = createConsoleClient(config);
  return {
    client,
    consoleId: config.consoleId,
    auth: createAuthApi(config),
    // Carga el mapa de privilegios (fusionado) para los roles dados. Los roles vienen de Evolok.
    privileges: createPrivilegesApi(client),
    verify, // funciones puras sobre un snapshot de permisos
    keys, // Role / Tab / Priv / hasPrivilege
  };
}

export { createConsoleClient, ConsoleError, verify, keys };
export { BASE, CLIENT } from './paths'; // BASE lo reusa el paquete edge-console-administrator
export * from './keys';
