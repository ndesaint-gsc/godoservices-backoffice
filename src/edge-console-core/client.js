// edge-console-sdk/client.js
// Cliente HTTP self-contained del edge-console-sdk (sin redux/MUI). Habla SOLO con el backend del framework
// (admin de roles/privilegios + carga del mapa por rol) bajo /perfil/welcome/web-and-console-integrations/admin.
//
// Auth del plano admin = apikey (X-Console-ApiKey). En la consola en navegador NO se pone la key: la
// inyecta el proxy/BFF server-side (como el sessionId hoy). Consumidores S2S (Node/script) pueden pasar
// `apiKey` y el cliente la envía en la cabecera.
//
// La AUTENTICACIÓN del operador y sus ROLES NO pasan por aquí: van directas contra Evolok (ver auth.js).

export class ConsoleError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ConsoleError';
    this.status = status;
  }
}

const buildQuery = (params) => {
  const entries = Object.entries(params || {}).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (!entries.length) return '';
  return '?' + new URLSearchParams(entries).toString();
};

/**
 * @param {object} config
 * @param {string} [config.baseUrl='']       Prefijo de URLs (vacío = relativo, resuelto por el proxy).
 * @param {string} [config.apiKey]           Cabecera X-Console-ApiKey (solo S2S; en navegador la pone el proxy).
 * @param {() => void} [config.onUnauthorized] Callback en 401.
 */
export function createConsoleClient(config = {}) {
  const { baseUrl = '', apiKey, onUnauthorized } = config;

  const request = async (method, path, { body, params } = {}) => {
    const query = buildQuery(params);
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
      throw new ConsoleError(
        `${res.status} ${res.statusText}${text ? ': ' + text : ''}`,
        res.status,
      );
    }
    if (res.status === 204) return null;

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
    get: (path, opts) => request('GET', path, opts),
    post: (path, body, opts) => request('POST', path, { ...opts, body }),
    put: (path, body, opts) => request('PUT', path, { ...opts, body }),
    del: (path, opts) => request('DELETE', path, opts),
  };
}
