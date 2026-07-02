// console-sdk/auth.js
// Plano SESIÓN: identidad del operador y verificación puntual contra el backend.

export function createAuthApi(client) {
  const app = client.appId;
  return {
    // GET /perfil/console/auth/me -> { operator, role, roles, permissions }
    // roleOverride: solo DEV, para previsualizar los permisos de un rol.
    getMe: (roleOverride) =>
      client.get('/perfil/console/auth/me', { params: { app, role: roleOverride } }),

    // POST /perfil/console/auth/verify { operation } -> boolean
    verify: (operation) =>
      client
        .post('/perfil/console/auth/verify', { operation }, { params: { app } })
        .then((r) => !!r?.allowed),

    // POST /perfil/console/auth/verify { operations:[...] } -> { op: boolean }
    verifyMany: (operations) =>
      client
        .post('/perfil/console/auth/verify', { operations }, { params: { app } })
        .then((r) => r?.results || {}),
  };
}
