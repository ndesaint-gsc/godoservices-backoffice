import { http } from '@/services/http';
import { apiUrl } from '@/services/endpoints';

// Acciones sobre suscripciones de tienda (Apple / Google / Terceros). Base
// /perfil/console/user. Replica los endpoints del BO antiguo:
//   ConsoleUserController.appleSubsActions / googleSubsActions (cuerpo Jaxson,
//   leído por clave) y los de asignación/desasignación de guid.
//
// El backend lee `action` y `email` por nombre y deja pasar `guid`,
// `subscriptionId` y (en Google/terceros) `type` dentro del Jaxson hasta la
// cola de delivery. Claves camelCase exactas, igual que backofficeUserManager.js.
// Como en el legacy, `email` solo se incluye cuando hay valor (reasignar titular).
const BASE = '/perfil/console/user';

const toQueryString = (params) => '?' + new URLSearchParams(params).toString();

// POST /perfil/console/user/appleSubsActions
//   action ∈ { unassign, force, reassign }; email solo en reassign.
//   body { action, guid, subscriptionId, [email] }
const appleAction = ({ action, email, subscriptionId, guid }) => {
  const body = { action, guid, subscriptionId };
  if (email) body.email = email;
  return http.post(apiUrl(BASE + '/appleSubsActions'), body);
};

// POST /perfil/console/user/googleSubsActions  (terceros: Apple "A" / Google "G")
//   action ∈ { unassign, force, reassign }; email solo en reassign.
//   body { action, guid, subscriptionId, [type], [email] }
const googleAction = ({ action, email, subscriptionId, guid, type }) => {
  const body = { action, guid, subscriptionId };
  if (type) body.type = type;
  if (email) body.email = email;
  return http.post(apiUrl(BASE + '/googleSubsActions'), body);
};

// PUT /perfil/console/user/{guid}/guid?tr=<tr> — asigna el titular (S2S).
const assignGuid = (guid, tr) =>
  http.put(apiUrl(BASE + '/' + guid + '/guid' + toQueryString({ tr })));

// DELETE /perfil/console/user/{guid}/guid — desasigna el titular (S2S).
const unassignGuid = (guid) => http.del(apiUrl(BASE + '/' + guid + '/guid'));

const subscriptionActionsService = {
  appleAction,
  googleAction,
  assignGuid,
  unassignGuid,
};

export default subscriptionActionsService;
