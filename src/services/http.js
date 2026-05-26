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
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  const headers = await buildHeaders();
  const res = await fetch(url + qs, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) {
    // Soft logout via auth service. Throw so callers can react.
    await authService.logout();
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText}${text ? ': ' + text : ''}`);
  }
  if (res.status === 204) return null;
  return res.json();
};

export const http = {
  get: (url, opts) => request('GET', url, opts),
  post: (url, body) => request('POST', url, { body }),
  put: (url, body) => request('PUT', url, { body }),
  patch: (url, body) => request('PATCH', url, { body }),
  del: (url) => request('DELETE', url),
};

export default http;
