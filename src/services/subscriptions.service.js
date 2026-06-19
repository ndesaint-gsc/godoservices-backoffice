import { http } from '@/services/http';
import { apiUrl } from '@/services/endpoints';

const toQueryString = (params) => '?' + new URLSearchParams(params).toString();

// POST /perfil/user/evbk/revokeRole?role=<role>  body: evUser
const revokeRole = (role, evUser) =>
  http.post(apiUrl('/perfil/user/evbk/revokeRole' + toQueryString({ role })), evUser);

// POST /perfil/user/evbk/createRole?role=<role>&date=<ISO end date>  body: evUser
const createRole = (role, date, evUser) =>
  http.post(apiUrl('/perfil/user/evbk/createRole' + toQueryString({ role, date })), evUser);

const subscriptionsService = { revokeRole, createRole };

export default subscriptionsService;
