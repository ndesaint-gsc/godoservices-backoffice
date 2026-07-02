// console-sdk — interfaz pública única.
//
// Módulo independiente dedicado SOLO a: auth de operador, admin de roles/privilegios y verificación
// de permisos, con los clientes de endpoint incluidos. Sin dependencias de redux ni MUI. El
// adaptador React (provider + hooks) vive en './react' y es opcional.
//
// Uso típico (plano sesión, dentro de la consola):
//   import { createConsole } from '@/console-sdk';
//   const sdk = createConsole({ appId: 'lv-console' });
//   const me = await sdk.auth.getMe();           // { operator, role, roles, permissions }
//   const map = await sdk.admin.getPermissions(); // editor de permisos
//   sdk.verify.actionAllowed(me.permissions, 'datos.delete');
//
// Uso provisioning (S2S, backend de producto o script de alta):
//   const sdk = createConsole({ apiKey: '<key>' });
//   await sdk.admin.roles.create('editor', 'Editor de contenidos');
//   await sdk.admin.privileges.set('editor', { tabs:{…}, actions:{…}, fields:{…} });

import { createConsoleClient, ConsoleError } from './client';
import { createAuthApi } from './auth';
import { createAdminApi } from './admin';
import * as verify from './verify';
import * as keys from './keys';

export function createConsole(config = {}) {
  const client = createConsoleClient(config);
  return {
    client,
    mode: client.mode,
    appId: client.appId,
    auth: createAuthApi(client),
    admin: createAdminApi(client),
    verify, // funciones puras sobre un snapshot de permisos
    keys, // Role / Tab / Priv / hasPrivilege
  };
}

export { createConsoleClient, ConsoleError, verify, keys };
export * from './keys';
