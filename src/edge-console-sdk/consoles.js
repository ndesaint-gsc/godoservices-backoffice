// edge-console-sdk/consoles.js
// Admin de CONSOLAS de la plataforma (consola mentor godoservices-backoffice) + config técnica del god.
// Autorización = enforcement por privilegio: el backend resuelve los roles del operador contra Evolok
// (parámetro `app` = consoleId desde el que opera) y exige la tab de integración / config. NO usa apikey.
//   - list/create/remove → admin de integración (rol con `integraciones.*`).
//   - mine               → config técnica de la PROPIA consola (identificadores + apikey en claro), god.
import { CONSOLES } from './paths';

export function createConsolesApi(client, consoleId) {
  const enc = encodeURIComponent;
  // `app` identifica ante el enforcement la consola desde la que opera el operador (su sesión Evolok).
  const app = { app: consoleId };
  return {
    // Lista de consolas (apikey enmascarada).
    list: () => client.get(CONSOLES, { params: app }).then((r) => r?.consoles || []),
    // Alta: { product, console, godEmail }. Devuelve { consoleId, godGroup, apiKey (en claro, una vez) }.
    create: (product, console, godEmail) =>
      client.post(CONSOLES, { product, console, godEmail }, { params: app }),
    // Edición (god): todos los campos. apiKey vacío = conservar la actual. Si cambia product/console,
    // el consoleId cambia (rename). Devuelve la vista con apikey enmascarada.
    update: (consoleId, { product, console, godEmail, apiKey }) =>
      client.put(CONSOLES + `/${enc(consoleId)}`, { product, console, godEmail, apiKey }, { params: app }),
    // Baja por consoleId.
    remove: (consoleIdToRemove) =>
      client.del(CONSOLES + `/${enc(consoleIdToRemove)}`, { params: app }),
    // Config técnica de la propia consola (god): identificadores + apikey en claro.
    mine: () => client.get(CONSOLES + '/mine', { params: app }),
  };
}
