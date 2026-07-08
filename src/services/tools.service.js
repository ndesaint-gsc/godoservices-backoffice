import { http } from '@/services/http';
import { apiUrl } from '@/services/endpoints';

const toQueryString = (params) => '?' + new URLSearchParams(params).toString();

// GET /perfil/console/user/purchase?externalId=<id>
//   200 -> { purchaseId, accountId }   404 -> not found   409 -> multiple matches
// Returns a structured result so the view can show the right message per status.
const findPurchaseByExternalId = async (externalId) => {
  const response = await fetch(
    apiUrl('/perfil/console/user/purchase' + toQueryString({ externalId })),
  );
  if (response.status === 404) return { status: 'notFound' };
  if (response.status === 409) return { status: 'multiple' };
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return { status: 'found', purchase: await response.json() };
};

// POST /perfil/console/user/createUser  body: { email, brand }
const createUser = ({ email, brand }) =>
  http.post(apiUrl('/perfil/console/user/createUser'), { email, brand });

// POST /perfil/console/user/uploadNifs  multipart: { email, nifsFile }
// Processed asynchronously; the result is emailed to `email`. Uses a raw fetch
// because the body is FormData (the browser must set the multipart boundary).
const uploadNifs = async (csvFile, email) => {
  const formData = new FormData();
  formData.append('email', email);
  formData.append('nifsFile', csvFile);
  const response = await fetch(apiUrl('/perfil/console/user/uploadNifs'), {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`${response.status}${errorText ? ': ' + errorText : ''}`);
  }
  return response.text();
};

const toolsService = { findPurchaseByExternalId, createUser, uploadNifs };

export default toolsService;
