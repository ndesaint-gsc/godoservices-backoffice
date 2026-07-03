// console-sdk — interfaz pública única.
//
// Módulo independiente (sin redux/MUI). Modelo:
//   - AUTH del operador + sus ROLES → DIRECTO contra Evolok (la app pasa `getEvolokSession`, que reusa
//     el IC web). El SDK quita el prefijo {consoleId}- → roles pelados.
//   - PRIVILEGIOS: el backend sirve el mapa por rol(es) (privileges.resolve) y el admin de roles/
//     privilegios (…/admin/**, apikey inyectada por el proxy).
//   - Verificación en pantalla: funciones puras (verify) sobre el snapshot de permisos.
//
// Uso:
//   const sdk = createConsole({ consoleId: 'welcome-console', getEvolokSession });
//   const { operator, roles } = await sdk.auth.getOperator();
//   const permissions = await sdk.privileges.resolve(roles);
//   sdk.verify.actionAllowed(permissions, 'datos.delete');
//   // admin (editor de permisos / alta de roles):
//   await sdk.admin.roles.create('editor', 'Editor de contenidos');

import { createConsoleClient, ConsoleError } from './client';
import { createAuthApi } from './auth';
import { createAdminApi } from './admin';
import { createConsolesApi } from './consoles';
import { ADMIN } from './paths';
import * as verify from './verify';
import * as keys from './keys';

const EMPTY_PERMS = { tabs: {}, actions: {}, fields: {} };

export function createConsole(config = {}) {
  const client = createConsoleClient(config);
  return {
    client,
    consoleId: config.consoleId,
    auth: createAuthApi(config),
    admin: createAdminApi(client),
    // Admin de consolas de la plataforma (integración) + config técnica del god (mine).
    consoles: createConsolesApi(client, config.consoleId),
    // Carga el mapa de privilegios (fusionado) para los roles dados. Los roles vienen de Evolok.
    privileges: {
      resolve: (roles) =>
        client
          .get(ADMIN + '/privileges/resolve', { params: { roles: (roles || []).join(',') } })
          .then((r) => r?.permissions || EMPTY_PERMS),
    },
    verify, // funciones puras sobre un snapshot de permisos
    keys, // Role / Tab / Priv / hasPrivilege
  };
}

export { createConsoleClient, ConsoleError, verify, keys };
export * from './keys';
