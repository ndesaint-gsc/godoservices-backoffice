import { http } from '@/services/http';
import { apiUrl } from '@/services/endpoints';

const toQueryString = (params) => '?' + new URLSearchParams(params).toString();

// POST /perfil/console/user/revokeRole?role=<role>  body: evUser
const revokeRole = (role, evUser) =>
  http.post(apiUrl('/perfil/console/user/revokeRole' + toQueryString({ role })), evUser);

// POST /perfil/console/user/createRole?role=<role>&date=<ISO end date>  body: evUser
const createRole = (role, date, evUser) =>
  http.post(apiUrl('/perfil/console/user/createRole' + toQueryString({ role, date })), evUser);

const subscriptionsService = { revokeRole, createRole };

export default subscriptionsService;
