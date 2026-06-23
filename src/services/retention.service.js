import { http } from '@/services/http';
import { apiUrl } from '@/services/endpoints';

const toQueryString = (params) => '?' + new URLSearchParams(params).toString();

// Configuración de retención (global, multi-tenant). Base /perfil/console.

// GET /perfil/console/configuration/retention?cache=false -> RetentionConfig
// Forma:
//   {
//     config: { LV: Config, MD: Config, R1: Config },  // Map<Tenants, Config>
//     environment: 'BIZ' | 'PRO',
//     timestamp: <Long>
//   }
// Config = {
//   articles: Article[],
//   features: Feature[],
//   offers:   { EVLCL: Offer[] },   // Map<String, Offer[]> agrupado por proveedor
//   sections: Section[],
//   video:    { url, tenant }
// }
const getConfig = (cache = false) =>
  http.get(apiUrl('/perfil/console/configuration/retention' + toQueryString({ cache })));

// POST /perfil/console/user/retention-video-update?urlVideo=<url>&tenant=<LV|MD|R1>
const updateVideo = (urlVideo, tenant) =>
  http.post(
    apiUrl('/perfil/console/user/retention-video-update' + toQueryString({ urlVideo, tenant })),
  );

// POST /perfil/console/user/upload-retention-image?tenant=<t>  multipart: { image }
// Formatos aceptados: jpg/gif/jpeg/png. Devuelve { url } (o { warning }/{ error }).
// Raw fetch porque el body es FormData (el navegador fija el boundary multipart),
// mismo mecanismo que tools.service.uploadNifs / landings.service.upload.
const uploadImage = async (imageFile, tenant) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  const response = await fetch(
    apiUrl('/perfil/console/user/upload-retention-image' + toQueryString({ tenant })),
    { method: 'POST', body: formData },
  );
  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`${response.status}${errorText ? ': ' + errorText : ''}`);
  }
  return response.json();
};

// POST /perfil/console/user/retention-update/{type}  body JSON
// type ∈ { OFFER, ARTICLE, FEATURE, SECTION }. Campos por tipo (+ index, tenant):
//   OFFER:   description, discount, url, imageUrl
//   ARTICLE: title, section, author, url, freemium, imageUrl
//   FEATURE: title, description, url, imageUrl
//   SECTION: title, description, url, imageUrl
// `index` es la posición del elemento dentro de su lista en la Config del tenant.
const updateContent = (type, body) =>
  http.post(apiUrl('/perfil/console/user/retention-update/' + type), body);

const retentionService = { getConfig, updateVideo, uploadImage, updateContent };

export default retentionService;
