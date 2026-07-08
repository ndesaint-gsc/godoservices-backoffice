// edge-console-sdk/auth.service.js
// AUTH del operador = DIRECTA contra Evolok (no pasa por nuestro backend), en 3 pasos:
//   1) POST /ic/api/session              (crea sesión con email+password) -> { mainSession.sessionId, guid }
//   2) GET  /ic/api/userProfile/{guid}   (identidad)                      -> operador (email, display_name, brand)
//   3) GET  /ic/api/userProfile/{guid}/role (roles)                       -> { roleAssignment: [{roleName,startDate,endDate}] }
// El header de Evolok es por SERVICIO (no api-key): `Evolok evolok.api.service=<svc> [evolok.api.sessionId=<sid>]`.
// Flujo validado en vivo contra ev.lavanguardia.biz. Ver CONTRACT.md.
//
// La sesión vive en memoria; la app persiste un snapshot (redux-persist) y la rehidrata con setSession()
// tras un reload. getEvolokSession() es lo que se inyecta en createAuthApi (que recorta el prefijo del
// console → roles pelados). Devolvemos los roleNames ACTIVOS en bruto; el filtrado por prefijo es de createAuthApi.

const DEFAULT_REALM = 'default_realm';
const DEFAULT_SCHEME = 'default';
// Servicio Evolok para crear sesión. Si 'login' fallara en algún entorno, el fallback es 'migrate_session'.
const DEFAULT_SESSION_SERVICE = 'login';
const DEFAULT_PROFILE_SERVICE = 'client_profile';

const attributeValue = (profile, name) =>
  profile?.attributes?.find((attribute) => attribute.name === name)?.value;

// roleAssignment[] -> nombres de rol activos AHORA (dentro de su ventana startDate/endDate; endDate null = sin fin).
const activeRoleNames = (roleAssignment) => {
  const now = Date.now();
  return (roleAssignment || [])
    .filter((assignment) => {
      const start = assignment.startDate ?? 0;
      const end = assignment.endDate ?? Number.MAX_SAFE_INTEGER;
      return now >= start && now < end;
    })
    .map((assignment) => assignment.roleName)
    .filter(Boolean);
};

export function createAuthService(config = {}) {
  const {
    baseUrl = '', // '' => mismo origen (proxy Vite /ic). S2S puede pasar el host completo.
    realm = DEFAULT_REALM,
    scheme = DEFAULT_SCHEME,
    sessionService = DEFAULT_SESSION_SERVICE,
    profileService = DEFAULT_PROFILE_SERVICE,
    onUnauthorized,
  } = config;

  const ic = `${baseUrl}/ic/api`;

  // { sessionId, guid, operator, groups } | null
  let session = null;

  const request = async (method, path, { body, sessionId } = {}) => {
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    headers.Authorization = sessionId
      ? `Evolok evolok.api.service=${profileService} evolok.api.sessionId=${sessionId}`
      : `Evolok evolok.api.service=${sessionService}`;

    const response = await fetch(ic + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401 && typeof onUnauthorized === 'function') onUnauthorized();
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Evolok ${response.status}${errorText ? ': ' + errorText : ''}`);
    }
    return response.json();
  };

  // Paso 1 + 2: crea sesión y lee el perfil. Devuelve { sessionId, guid, operator, groups }.
  const login = async (email, password) => {
    const created = await request('POST', '/session', {
      body: {
        realmName: realm,
        authenticationSchemeName: scheme,
        identifiers: [{ name: 'email_address', value: email }],
        validators: [{ name: 'password', value: password }],
      },
    });
    const sessionId = created?.mainSession?.sessionId;
    const guid = created?.guid;
    if (!sessionId || !guid) throw new Error('Evolok login: respuesta sin sessionId/guid');

    const { userProfile } = await request('GET', `/userProfile/${guid}`, { sessionId });
    const operator = {
      guid: userProfile.guid,
      email: attributeValue(userProfile, 'email_address') || email,
      name: attributeValue(userProfile, 'display_name') || '',
      brand: userProfile.brand,
    };
    // Roles desde el endpoint dedicado: el userProfile no trae roleAssignments de forma fiable.
    const roleResponse = await request('GET', `/userProfile/${guid}/role`, { sessionId });
    const groups = activeRoleNames(roleResponse?.roleAssignment);
    session = { sessionId, guid, operator, groups };
    return { ...session };
  };

  const logout = () => {
    session = null;
  };

  // Rehidratación desde el snapshot persistido (App.jsx al arrancar).
  const setSession = (snapshot) => {
    session = snapshot || null;
  };
  const getSession = () => (session ? { ...session } : null);
  const getAuthToken = () => session?.sessionId || null;

  // Lo consume createAuthApi (que recorta el prefijo {consoleId}-). roleOverride se ignora: el rol
  // activo lo decide la app en el paso de resolve (no hay unión de roles).
  const getEvolokSession = async () =>
    session
      ? { operator: session.operator, groups: session.groups }
      : { operator: null, groups: [] };

  return { login, logout, setSession, getSession, getAuthToken, getEvolokSession };
}
