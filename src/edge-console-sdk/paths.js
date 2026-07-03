// edge-console-sdk/paths.js
// Base de los endpoints del framework en backend. La AUTH del operador NO está aquí: va directa contra
// Evolok desde el JS (ver auth.js). Ver CONTRACT.md.
export const BASE = '/perfil/edge/console';
// CLIENT — CONSUMO (edge-console-sdk / tercero): carga del mapa de privilegios por rol. Apikey del
// producto inyectada por el proxy. Separado de la administración para que un tercero no la toque.
// Los planos de administración (…/admin, …/consoles) los define el paquete edge-console-administrator.
export const CLIENT = BASE + '/client';
