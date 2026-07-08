import { http } from '@/services/http';
import { apiUrl } from '@/services/endpoints';

const toQueryString = (params) => '?' + new URLSearchParams(params).toString();

// PUT /perfil/console/user/{guid}
// Body is { attributes: [{name, value}] } (matches the legacy manager payload).
const updateUser = (guid, attributes) =>
  http.put(apiUrl('/perfil/console/user/' + guid), { attributes });

// Credential actions. reset/verify take the full evUser object as body.
const resetPassword = (evUser) => http.post(apiUrl('/perfil/console/user/resetPassword'), evUser);

const sendVerification = (evUser) =>
  http.post(apiUrl('/perfil/console/user/sendVerificationPassword'), evUser);

// DELETE /perfil/console/user/{guid} — the server reloads the user from the guid.
const deleteUser = (evUser) => http.del(apiUrl('/perfil/console/user/' + evUser.guid));

const invalidateCache = (guid) =>
  http.post(apiUrl('/perfil/console/user/invalidate-cache' + toQueryString({ guid })));

const unblockUser = (guid) =>
  http.post(apiUrl('/perfil/console/user/unblock-user' + toQueryString({ guid })));

// NIF/NIE linking. Vincular: PUT with the nif as a query param.
// Desvincular: DELETE (the server clears the linked nif).
const linkNif = (guid, nif) =>
  http.put(apiUrl('/perfil/console/user/' + guid + '/nif' + toQueryString({ nif })));

const unlinkNif = (guid) => http.del(apiUrl('/perfil/console/user/' + guid + '/nif'));

const datosService = {
  updateUser,
  resetPassword,
  sendVerification,
  deleteUser,
  invalidateCache,
  unblockUser,
  linkNif,
  unlinkNif,
};

export default datosService;
