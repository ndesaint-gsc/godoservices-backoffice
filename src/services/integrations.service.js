// Admin de CONSOLAS de la plataforma (consola mentor) + config técnica del god. Delega en el
// console-sdk (plano sesión: enforcement por privilegio, sin apikey). Ver console-sdk/consoles.js.
import sdk from '@/services/console';

// [{ consoleId, product, appconsole, godEmail, godRole, godGroup, hasApiKey, apiKeyMasked }]
const listConsoles = () => sdk.consoles.list();

// Alta: { product, console, godEmail }. Devuelve { consoleId, godGroup, apiKey (en claro, una vez) }.
// La apikey solo se expone aquí una vez; en la lista va enmascarada.
const createConsole = (product, console, godEmail) =>
  sdk.consoles.create(product, console, godEmail);

// Edición (god): { product, console, godEmail, apiKey }. apiKey vacío = conservar la actual.
const updateConsole = (consoleId, changes) => sdk.consoles.update(consoleId, changes);

const removeConsole = (consoleId) => sdk.consoles.remove(consoleId);

// Config técnica de la propia consola (god): { consoleId, product, appconsole, rolePrefix, godGroup,
// godEmail, apiKey } — apikey EN CLARO, para configurar el proxy del producto.
const myConfig = () => sdk.consoles.mine();

const integrationsService = { listConsoles, createConsole, updateConsole, removeConsole, myConfig };
export default integrationsService;
