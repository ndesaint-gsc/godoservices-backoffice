// edge-console-core — núcleo neutral del framework edge-console (sin redux/MUI).
//
// Contiene lo que comparten los DOS SDK y que no pertenece a ninguno en exclusiva:
//   - client        → cliente HTTP self-contained (createConsoleClient) + ConsoleError.
//   - keys          → modelo de claves (Role/Tab/Naming/RESERVED_*/Priv/hasPrivilege).
//   - paths (BASE)  → base de rutas del framework.
//
// Ambos SDK dependen de ESTE paquete, no entre sí:
//   - edge-console-sdk           (consumidor): núcleo + auth(Evolok) + privileges.resolve + verify + react/.
//   - edge-console-administrator (mentor):     núcleo + admin(roles/privilegios/catálogo) + consoles.
//
// No se entrega suelto a un tercero (a un tercero se le da solo edge-console-sdk). Ver CONTRACT.md.
export { createConsoleClient, ConsoleError } from './client';
export { BASE } from './paths';
export * as keys from './keys';
export * from './keys';
