// edge-console-sdk/paths.js
// Base de los endpoints del framework en backend. Solo plano ADMIN (apikey, inyectada por el proxy):
// admin de roles/privilegios/catálogo + carga del mapa por rol. La AUTH del operador NO está aquí:
// va directa contra Evolok desde el JS (ver auth.js). Ver CONTRACT.md.
export const BASE = '/perfil/edge/console';
export const ADMIN = BASE + '/admin';
// Admin de CONSOLAS de la plataforma (consola mentor): alta/baja/lista + config técnica del god.
// Autorización = enforcement por privilegio (sesión Evolok del operador), NO apikey.
export const CONSOLES = BASE + '/consoles';
