import { http } from '@/services/http';
import { apiUrl } from '@/services/endpoints';

// Beneficiarios corporativos. Base /perfil/console/user.
// Verificado contra ConsoleUserController (web-lv) y backofficeUserApi.js (legacy).
const BASE = '/perfil/console/user';

const toQueryString = (params) => '?' + new URLSearchParams(params).toString();

// GET {guid}/beneficiaries?subscriptionId=  -> Beneficiary[]
// (controller.beneficiaries -> purchaseService.getBeneficaries(guid, subscriptionId))
const list = (guid, subscriptionId) =>
  http.get(apiUrl(BASE + '/' + guid + '/beneficiaries' + toQueryString({ subscriptionId })));

// POST {guid}/beneficiaries           body: Beneficiary  (addBeneficiary)
// POST {guid}/beneficiaries/accepted  body: Beneficiary  (addBeneficiaryAutoAccept)
// El backend, en /accepted, fuerza additionalData autoActivate + skipEmailInvitation.
// `beneficiary` debe traer al menos { subscriptionId, email }. Si beneficiaryAutoAccept
// es true se manda a /accepted (mismo criterio que el legacy backofficeUserApi.addBeneficiary).
const add = (guid, beneficiary) => {
  const autoAccept = beneficiary?.beneficiaryAutoAccept === true;
  const path = BASE + '/' + guid + '/beneficiaries' + (autoAccept ? '/accepted' : '');
  return http.post(apiUrl(path), beneficiary);
};

// DELETE {guid}/beneficiaries?subscriptionId=&key=  -> Beneficiary (deleteBeneficiary)
// `key` es el grantKey (UUID). Los beneficiarios PENDING traen key null -> no borrables.
const remove = (guid, subscriptionId, key) =>
  http.del(apiUrl(BASE + '/' + guid + '/beneficiaries' + toQueryString({ subscriptionId, key })));

// POST {guid}/beneficiaries/import  multipart (uploadWithEmail). Asíncrono: responde 200
// y el resultado del procesado se envía por email a `email`. Campos (@RequestParam del
// controller): subscriptionId, roleName, externalRef, email, forceAutoActivate (default false)
// y @RequestPart beneficiariesFile. Raw fetch porque el body es FormData (boundary multipart).
const importFile = async (
  guid,
  { subscriptionId, roleName, externalRef, email, forceAutoActivate, beneficiariesFile },
) => {
  const formData = new FormData();
  formData.append('subscriptionId', subscriptionId);
  formData.append('roleName', roleName);
  formData.append('externalRef', externalRef);
  formData.append('email', email);
  formData.append('forceAutoActivate', forceAutoActivate ? 'true' : 'false');
  formData.append('beneficiariesFile', beneficiariesFile);
  const response = await fetch(apiUrl(BASE + '/' + guid + '/beneficiaries/import'), {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`${response.status}${errorText ? ': ' + errorText : ''}`);
  }
  return response.text();
};

// POST {guid}/beneficiaries/export  multipart (downloadWithEmail). Asíncrono: responde 200
// y el fichero generado se envía por email a `email`. Campos (@RequestParam): subscriptionId, email.
// El legacy lo envía como FormData (downloadBeneficiaries), así que mantenemos multipart.
const exportFile = async (guid, { subscriptionId, email }) => {
  const formData = new FormData();
  formData.append('subscriptionId', subscriptionId);
  formData.append('email', email);
  const response = await fetch(apiUrl(BASE + '/' + guid + '/beneficiaries/export'), {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`${response.status}${errorText ? ': ' + errorText : ''}`);
  }
  return response.text();
};

// POST beneficiaries/invitations  body: GuidBeneficiary[]  (inviteBeneficiaries).
// Encola una tarea por owner y responde 202 (procesado real async). Cada item:
// { guid: <owner>, beneficiary: { subscriptionId, email, additionalData[...] } }.
const invite = (items) =>
  http.post(apiUrl(BASE + '/beneficiaries/invitations'), items);

const beneficiariesService = { list, add, remove, importFile, exportFile, invite };

export default beneficiariesService;
