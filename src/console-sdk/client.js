// console-sdk/client.js
// Cliente HTTP self-contained del console-sdk. NO depende de la app (ni redux, ni MUI, ni de
// services/http.js). Dos modos de auth:
//   - 'session' (por defecto): la sesión de operador viaja por la cookie `ev_gg_bo`; si se pasa
//     `getSessionId`, además se añade `?sessionId=<valor>` (útil con el proxy Vite en DEV).
//   - 'apikey': provisioning S2S; añade la cabecera `X-Console-ApiKey`.
// Ver CONTRACT.md para los paths y payloads.

export class ConsoleError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ConsoleError';
    this.status = status;
  }
}

const buildQuery = (params) => {
  const entries = Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (!entries.length) return '';
  return '?' + new URLSearchParams(entries).toString();
};

/**
 * @param {object} config
 * @param {string} [config.baseUrl='']   Prefijo de las URLs (vacío = relativo, resuelto por el proxy).
 * @param {string} [config.appId]        appId del backoffice (p.ej. 'lv-console') para el plano sesión.
 * @param {string} [config.apiKey]       Si se pasa → modo provisioning (cabecera X-Console-ApiKey).
 * @param {() => (string|undefined)} [config.getSessionId] Devuelve el sessionId a inyectar como query.
 * @param {() => void} [config.onUnauthorized] Callback en respuesta 401.
 */
export function createConsoleClient(config = {}) {
  const { baseUrl = '', appId, apiKey, getSessionId, onUnauthorized } = config;

  const request = async (method, path, { body, params } = {}) => {
    const sessionId = typeof getSessionId === 'function' ? getSessionId() : undefined;
    const query = buildQuery({ ...(params || {}), ...(sessionId ? { sessionId } : {}) });

    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (apiKey) headers['X-Console-ApiKey'] = apiKey;

    const res = await fetch(baseUrl + path + query, {
      method,
      headers,
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401) {
      if (typeof onUnauthorized === 'function') onUnauthorized();
      throw new ConsoleError('Unauthorized', 401);
    }
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new ConsoleError(`${res.status} ${res.statusText}${text ? ': ' + text : ''}`, res.status);
    }
    if (res.status === 204) return null;

    // Los endpoints de mutación suelen devolver 200 con body vacío: no llamar json() a ciegas.
    const text = await res.text();
    if (!text) return null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    }
    return text;
  };

  return {
    appId,
    mode: apiKey ? 'apikey' : 'session',
    get: (path, opts) => request('GET', path, opts),
    post: (path, body, opts) => request('POST', path, { ...opts, body }),
    put: (path, body, opts) => request('PUT', path, { ...opts, body }),
    del: (path, opts) => request('DELETE', path, opts),
  };
}
