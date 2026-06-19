import { http } from '@/services/http';
import { apiUrl } from '@/services/endpoints';

const toQueryString = (params) => '?' + new URLSearchParams(params).toString();

// PUT /perfil/user/evbk/update?guid=<guid>
// Body is { attributes: [{name, value}] } (matches the legacy manager payload).
const updateUser = (guid, attributes) =>
  http.put(apiUrl('/perfil/user/evbk/update' + toQueryString({ guid })), { attributes });

// Credential actions. reset/verify/delete take the full evUser object as body.
const resetPassword = (evUser) =>
  http.post(apiUrl('/perfil/user/evbk/resetPassword'), evUser);

const sendVerification = (evUser) =>
  http.post(apiUrl('/perfil/user/evbk/sendVerificationPassword'), evUser);

const deleteUser = (evUser) =>
  http.post(apiUrl('/perfil/user/evbk/deleteUser'), evUser);

const invalidateCache = (guid) =>
  http.post(apiUrl('/perfil/user/evbk/invalidate-cache' + toQueryString({ guid })));

const unblockUser = (guid) =>
  http.post(apiUrl('/perfil/user/evbk/unblock-user' + toQueryString({ guid })));

const datosService = {
  updateUser,
  resetPassword,
  sendVerification,
  deleteUser,
  invalidateCache,
  unblockUser,
};

export default datosService;
