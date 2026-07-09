// edge-console-sdk/paths.js
// Plano CLIENT del consumidor, derivado de la base del núcleo (edge-console-core). La AUTH del operador
// NO está aquí: va directa contra Evolok desde el JS (ver auth.js). Ver CONTRACT.md.
import { BASE } from '@/edge-console-core';

// Se re-exporta BASE para no romper a los consumidores que la importaban de este paquete.
export { BASE };
// CLIENT — CONSUMO (edge-console-sdk / tercero): carga del mapa de privilegios por rol. Apikey del
// producto inyectada por el proxy. Separado de la administración para que un tercero no la toque.
// Los planos de administración (…/admin, …/consoles) los define el paquete edge-console-administrator.
export const CLIENT = BASE + '/client';
