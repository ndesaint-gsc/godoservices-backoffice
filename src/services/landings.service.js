import { http } from '@/services/http';
import { apiUrl } from '@/services/endpoints';

const toQueryString = (params) => '?' + new URLSearchParams(params).toString();

// Landings are global (not tied to the loaded customer).

// GET /perfil/console/user/landings -> string[] (nombres de fichero .html)
const list = () => http.get(apiUrl('/perfil/console/user/landings'));

// POST /perfil/console/user/landings/upload  multipart: { landing: <fichero .html> }
// Uses a raw fetch because the body is FormData (the browser must set the
// multipart boundary). Same mechanism as tools.service.uploadNifs.
const upload = async (htmlFile) => {
  const formData = new FormData();
  formData.append('landing', htmlFile);
  const response = await fetch(apiUrl('/perfil/console/user/landings/upload'), {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`${response.status}${errorText ? ': ' + errorText : ''}`);
  }
  return response.text();
};

// POST /perfil/console/user/landings/delete?ruta=<nombre>
const remove = (ruta) =>
  http.post(apiUrl('/perfil/console/user/landings/delete' + toQueryString({ ruta })));

const landingsService = { list, upload, remove };

export default landingsService;
