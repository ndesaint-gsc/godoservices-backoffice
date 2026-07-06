// edge-console-administrator — paquete de ADMINISTRACIÓN (parte de godoservices-backoffice como consola
// MENTOR; NO se entrega a terceros).
//
// Paquete SEPARADO que se apoya en el núcleo del edge-console-sdk (client/keys) y añade la administración
// de consolas:
//   - admin    → roles/privilegios/catálogo + membresías. Plano …/admin/** (apikey vía proxy).
//   - consoles → alta/baja/lista de consolas de la plataforma + config técnica del god (…/mine).
//                Plano …/consoles/** (enforcement por sesión Evolok, NO apikey).
//
// La auth del operador, la carga del mapa de privilegios (consumo) y la verificación en pantalla NO están
// aquí: eso es el edge-console-sdk (createConsole). godoservices importa ambos paquetes.
//
// Uso:
//   import { createConsole } from '@/edge-console-sdk';              // consumidor
//   import { createConsoleAdmin } from '@/edge-console-administrator'; // administración
//   const admin = createConsoleAdmin({ consoleId: 'welcome-console' });
//   await admin.admin.roles.create('editor', 'Editor de contenidos');
//   const consoles = await admin.consoles.list();

import { createConsoleClient, ConsoleError, keys } from '@/edge-console-sdk';
import { createAdminApi } from './admin';
import { createConsolesApi } from './consoles';

export function createConsoleAdmin(config = {}) {
  const client = createConsoleClient(config);
  return {
    client,
    consoleId: config.consoleId,
    // Admin de roles/privilegios/catálogo (apikey inyectada por el proxy).
    admin: createAdminApi(client),
    // Admin de consolas de la plataforma (integración) + config técnica del god (mine).
    consoles: createConsolesApi(client, config.consoleId),
    keys,
  };
}

export { ConsoleError, keys };
