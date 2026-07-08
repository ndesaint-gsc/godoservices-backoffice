import authService from '@/services/auth.service';
import { notifyUnauthorized } from '@/services/console';

// Fallback when the backend returns no readable errorMessage (e.g. a 500 HTML page).
export const GENERIC_ERROR_MESSAGE =
  'Ha ocurrido un error. Vuelve a intentarlo más tarde y, en caso de persistir, contacta el departamento técnico.';

// Presentable message from an error body: backend validationErrors/errorMessage if JSON, else generic.
// Never returns the raw HTML.
const errorMessageFromBody = (bodyText) => {
  if (bodyText) {
    try {
      const parsed = JSON.parse(bodyText);
      if (parsed?.validationErrors?.length) {
        return parsed.validationErrors
          .map((validationError) => `${validationError.field}: ${validationError.message}`)
          .join('; ');
      }
      if (parsed?.errorMessage) return parsed.errorMessage;
    } catch {
      // non-JSON body (HTML error page, …) → generic
    }
  }
  return GENERIC_ERROR_MESSAGE;
};

const request = async (method, url, { body, params } = {}) => {
  // Console ops (/perfil/*) authenticate via the Evolok sessionId as a query param (backend reads
  // ?sessionId= or the ev_gg_bo cookie). Don't override one already present (params or Vite proxy).
  const sessionId = authService.getAuthToken();
  const search = new URLSearchParams(params || {});
  if (sessionId && !search.has('sessionId') && !url.includes('sessionId=')) {
    search.set('sessionId', sessionId);
  }
  const extraQuery = search.toString();
  // Service URL may already carry a query (e.g. `/nif?nif=X`): join with `&`, not a second `?`.
  const separator = url.includes('?') ? '&' : '?';
  const fullUrl = extraQuery ? url + separator + extraQuery : url;
  const headers = { Accept: 'application/json', 'Content-Type': 'application/json' };
  const response = await fetch(fullUrl, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) {
    // Invalid/expired Evolok session → full logout via the same bridge as the SDK (clears redux + SDK,
    // back to /login). Throw so the caller aborts its flow.
    notifyUnauthorized();
    throw new Error('Unauthorized');
  }
  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    const error = new Error(errorMessageFromBody(errorText));
    error.status = response.status;
    throw error;
  }
  if (response.status === 204) return null;

  // Mutation endpoints often return an empty 200 body — don't blindly call
  // response.json() (that throws "Unexpected end of JSON input"). Parse only
  // when the response actually carries JSON.
  const responseText = await response.text();
  if (!responseText) return null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(responseText);
    } catch {
      return null;
    }
  }
  return responseText;
};

export const http = {
  get: (url, options) => request('GET', url, options),
  post: (url, body) => request('POST', url, { body }),
  put: (url, body) => request('PUT', url, { body }),
  patch: (url, body) => request('PATCH', url, { body }),
  del: (url) => request('DELETE', url),
};

export default http;
