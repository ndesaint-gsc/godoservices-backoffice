// console-sdk/auth.js
// AUTH del operador = DIRECTA contra Evolok (no pasa por nuestro backend). El SDK no habla con Evolok
// por su cuenta: la app le pasa `getEvolokSession` (que reusa el IC web / evl-accounts.js) y aquí solo
// se normaliza: se quitan los grupos con el prefijo {consoleId}- → roles pelados (el prefijo se OCULTA
// en el JS). El mapa de privilegios de esos roles se pide al backend (ver index.js → privileges.resolve).

export function createAuthApi(config = {}) {
  const { consoleId, getEvolokSession } = config;
  const prefix = consoleId ? consoleId + '-' : '';

  // grupo Evolok ({consoleId}-ROL) → rol pelado en MAYÚSCULAS; si no lleva el prefijo del console, se
  // ignora (pertenece a otro console/producto).
  const strip = (group) => {
    if (!group) return null;
    if (prefix && group.startsWith(prefix)) return group.slice(prefix.length).toUpperCase();
    return null;
  };

  return {
    // Devuelve { operator, roles } del operador logueado en Evolok. roleOverride: solo DEV.
    getOperator: async (roleOverride) => {
      if (typeof getEvolokSession !== 'function') return { operator: null, roles: [] };
      const session = await getEvolokSession(roleOverride);
      const groups = session?.groups || [];
      const roles = groups.map(strip).filter(Boolean);
      return { operator: session?.operator || null, roles };
    },
  };
}
