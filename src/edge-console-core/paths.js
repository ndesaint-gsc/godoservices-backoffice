// edge-console-core/paths.js
// Base de los endpoints del framework en backend. Compartida por ambos SDK. La AUTH del operador NO
// está aquí: va directa contra Evolok desde el JS (ver edge-console-sdk/auth.js). Ver CONTRACT.md.
// Los planos derivados los definen los SDK: CLIENT en edge-console-sdk; ADMIN/CONSOLES en administrator.
export const BASE = '/perfil/edge/console';
