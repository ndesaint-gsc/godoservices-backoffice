// edge-console-administrator/paths.js
// Planos de ADMINISTRACIÓN. La base (/perfil/edge/console) se reusa del núcleo (edge-console-core).
import { BASE } from '@/edge-console-core';

// ADMIN — administración de roles/privilegios/catálogo. Apikey inyectada por el proxy.
export const ADMIN = BASE + '/admin';
// CONSOLES — admin de CONSOLAS de la plataforma (consola mentor): alta/baja/lista + config del god.
// Autorización = enforcement por privilegio (sesión Evolok del operador), NO apikey.
export const CONSOLES = BASE + '/consoles';
