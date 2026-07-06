// edge-console-sdk/privileges.js
// CONSUMO del mapa de privilegios — plano CLIENT (…/client/**, apikey del producto inyectada por el
// proxy). Dado el conjunto de roles del operador (que auth.js obtiene DIRECTO de Evolok, ya sin
// prefijo), pide al backend el mapa fusionado { tabs, actions, fields } para pintar la UI. No
// administra nada (eso es el paquete edge-console-administrator).
import { CLIENT } from './paths';

const EMPTY_PERMS = { tabs: {}, actions: {}, fields: {} };

export function createPrivilegesApi(client) {
  return {
    // Carga el mapa de privilegios (fusionado) para los roles dados. Los roles vienen de Evolok.
    resolve: (roles) =>
      client
        .get(CLIENT + '/privileges/resolve', { params: { roles: (roles || []).join(',') } })
        .then((r) => r?.permissions || EMPTY_PERMS),
  };
}
