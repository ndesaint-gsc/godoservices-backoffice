import { http } from '@/services/http';
import { apiUrl } from '@/services/endpoints';

const toQueryString = (params) => '?' + new URLSearchParams(params).toString();

// POST /perfil/console/user/revokeRole?role=<role>  body: evUser
const revokeRole = (role, evUser) =>
  http.post(apiUrl('/perfil/console/user/revokeRole' + toQueryString({ role })), evUser);

// POST /perfil/console/user/createRole?role=<role>&date=<ISO end date>  body: evUser
const createRole = (role, date, evUser) =>
  http.post(apiUrl('/perfil/console/user/createRole' + toQueryString({ role, date })), evUser);

// --- Lecturas (JSON) de las suscripciones del usuario cargado. Base /perfil/console/user. ---
// GET /perfil/console/user/{guid}/subscriptions -> suscripciones impresas (print)
const getPrint = (guid) => http.get(apiUrl('/perfil/console/user/' + guid + '/subscriptions'));

// GET /perfil/console/user/{guid}/subscriptions/digital -> EvolokSubscription[]
const getDigital = (guid) =>
  http.get(apiUrl('/perfil/console/user/' + guid + '/subscriptions/digital'));

// GET /perfil/console/user/{guid}/subscriptions/apple -> AppleSubscription[]
const getApple = (guid) =>
  http.get(apiUrl('/perfil/console/user/' + guid + '/subscriptions/apple'));

// GET /perfil/console/user/{guid}/subscriptions/third-parties -> ThirdPartiesSubscription[]
const getThirdParties = (guid) =>
  http.get(apiUrl('/perfil/console/user/' + guid + '/subscriptions/third-parties'));

// GET /perfil/console/user/{guid}/subscriptions/beneficiary -> BeneficiarySubscription[]
const getBeneficiary = (guid) =>
  http.get(apiUrl('/perfil/console/user/' + guid + '/subscriptions/beneficiary'));

const subscriptionsService = {
  revokeRole,
  createRole,
  getPrint,
  getDigital,
  getApple,
  getThirdParties,
  getBeneficiary,
};

export default subscriptionsService;
