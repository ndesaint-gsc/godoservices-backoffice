import authService from '@/services/auth.service';

const buildHeaders = async () => {
  const token = await authService.getAuthToken();
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { Authorization: token } : {}),
  };
};

const request = async (method, url, { body, params } = {}) => {
  const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
  const headers = await buildHeaders();
  const response = await fetch(url + queryString, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) {
    // Soft logout via auth service. Throw so callers can react.
    await authService.logout();
    throw new Error('Unauthorized');
  }
  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`${response.status} ${response.statusText}${errorText ? ': ' + errorText : ''}`);
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
