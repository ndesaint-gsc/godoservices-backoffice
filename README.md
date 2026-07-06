# web-backoffice-static

Consola de operador (backoffice) del grupo Godó en React. Es la **consola MENTOR/plantilla** del framework de integración *web-and-console-integrations*: `consoleId = welcome-console` (producto **GGOBO**, id `welcome`, + appconsole `console`). De ella derivan las demás consolas de producto. Un operador busca un usuario y gestiona sus datos, suscripciones, notificaciones y facturación, además de herramientas globales, la administración de consolas de la plataforma y la configuración/permisos de la propia consola.

> El contrato del framework (fuente de verdad) está en [`src/edge-console-sdk/CONTRACT.md`](src/edge-console-sdk/CONTRACT.md); el SDK independiente en [`src/edge-console-sdk/`](src/edge-console-sdk/README.md).

## Stack

- Vite 6 + React 18.3 (JavaScript)
- React Router v6
- Redux Toolkit 2 + react-redux 9 + redux-persist
- MUI 6 + Emotion
- React Hook Form 7 + Yup 1
- notistack 3
- Node 22 LTS

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run preview
npm run lint
npm run format
```

## Env vars (`.env.{local,test,pro}`)

| Var | Propósito |
|---|---|
| `VITE_API_URL` | Base de las llamadas. **Vacío** en local (se usa el proxy de Vite, mismo origen → rutas relativas `/perfil/...`). |
| `VITE_BO_PROXY_TARGET` | Host backend al que el proxy de Vite reenvía `/perfil/*`. Local: `http://localhost:8078`; pre/pro: `https://[test.]lavanguardia.biz`. |
| `VITE_BO_SESSION_ID` | sessionId de consola Evolok, inyectado como `?sessionId=…` en cada request proxiado. Necesario para los endpoints de **datos** (que exigen sesión Evolok); el endpoint de auth/permisos está mockeado por ahora. |

`.env.local` está gitignored. `.env.test` / `.env.pro` se commitean.

## Backend / API

El proxy de Vite reenvía `/perfil/*` al backend. Dos familias:
- **Operación de la consola** bajo `/perfil/console/**` (web-lv: `…/user/**`, `…/views/**`, `…/invoices/**`; web-core: config, retención, etc.).
- **Framework de integración** bajo `/perfil/edge/console/**` (alias legacy: `/perfil/welcome/web-and-console-integrations/**`; web-core, paquete `com.grupogodo.edge.console`):
  - `…/admin/**` (apikey `X-Console-ApiKey` vía proxy): roles, privilegios y **catálogo** (tabs/acciones/datos) de la consola.
  - `…/consoles/**` (enforcement por sesión Evolok): alta/baja/edición de **consolas** de la plataforma + `/mine` (config técnica del god).

**Persistencia = EN MEMORIA (no hay DB todavía).** El registry de consolas (`ConsoleRegistry`) se **siembra** de la propiedad `console.products` (`.properties`) o de un default (`welcome-console`); el catálogo + mapa de roles/privilegios (`ConsolePermissionsRegistry`) se siembra desde código (`ConsolePermissionsCatalog`). Las mutaciones (crear consola/rol, editar catálogo/privilegios) viven solo en memoria → se pierden al reiniciar. PostgreSQL detrás de la misma firma es el pendiente principal.

> Los endpoints de **web-core** requieren recompilar web-core en local (JDK 8, Eclipse); si no, dan **404**.

## Funcionalidades

- **Datos** — ficha del usuario: ver identificación, editar datos personales, reset/verificación de contraseña, desbloquear, invalidar caché, eliminar, vincular/desvincular NIF.
- **Suscripciones** — Digitales, Impresas y beneficiario, Mobile (Apple/Google) con acciones, Accesos temporales (crear/revocar rol), Crear telemática (enviar oferta), y beneficiarios corporativos (alta/baja/import/export).
- **Notificaciones** — opt-ins + newsletters/intereses.
- **Facturación** — listar/PDF, sustitutiva/rectificativa/abono, recalcular, dirección fiscal.
- **Herramientas** (global, sin cliente) — crear usuario, NIF masivo, roles masivo (con **fichero de ejemplo** descargable, generado en cliente según GUIDs/Emails), landings, retención, buscar por externalId.
- **Permisos** (`/permisos`) — editor de la matriz rol→permisos de la consola. Lista tabs/acciones/datos **desde el JSON del backend** (catálogo), en orden alfabético y a 2 columnas.
- **Configuración** (`/configuracion`) — config técnica de la propia consola (identificadores + apikey del god) **y editor del catálogo** (tabs/acciones/datos que aparecen en Permisos). `permisos` y `configuracion` son tabs reservadas (siempre presentes, no borrables); sin duplicados.
- **Integraciones** (`/integraciones`, última del nav) — admin de las **consolas de la plataforma**: alta/baja/edición (todos los campos, con generador de apikey). Cada consola tiene un god (rol `GOD`, acceso total) con email.

## Auth, roles y permisos

Modelo del framework (ver `edge-console-sdk/CONTRACT.md`):
- **Auth del operador + sus ROLES → DIRECTO contra Evolok desde el JS** (reusando el IC web; la app aporta `getEvolokSession`). El SDK recibe los grupos `{consoleId}-{ROL}` y **quita el prefijo** → roles pelados. En DEV hay un **mock** (`services/console.js` → `getEvolokSession`) que respeta el *role switcher*; TODO: cablear el IC real.
- **El backend hace solo**: (1) admin de roles/privilegios + **catálogo**; (2) cargar el mapa de privilegios por rol(es); (3) **enforcement** de operaciones (`@ConsolePrivilege`, valida `ev_gg_bo` contra Evolok con caché). Flag `EvolokConfig.consoleMock` (default true): en dev, apikey no exigida y enforcement omitido.
- **Permisos por rol** en 3 dimensiones: `tabs` (visible/hidden), `actions` (allowed/denied), `fields` (editable/viewable/hidden). El **catálogo** (universo de claves) lo define cada consola y se edita desde **Configuración**; se guarda en el mismo JSON que el mapa rol→privilegios.
- **`appId = welcome-console`** (`src/common/permissions/permissions.js`). El front resuelve permisos (`authSlice.loadPermissions` → `auth.getOperator` + `privileges.resolve`) y gobierna la UI con `useTabVisible` / `useActionAllowed` / `useFieldMode`. Default-deny en acciones.
- **Rol `GOD`** (grupo Evolok `{consoleId}-god`): acceso TOTAL y **reservado** (no creable/editable/borrable). Roles de negocio: ADMIN, MANAGER, FINANCE_EDITOR, FINANCE_VIEWER, VIEWER (+ los que defina cada consola). En DEV, el *role switcher* de la topbar previsualiza cada rol.
- **Límites de longitud** (Evolok): product ≤15, console ≤15 (`[a-z0-9]`), rolename ≤32 (`[A-Za-z0-9_]`), grupo total ≤64.

**Persistencia: EN MEMORIA** (registry de consolas, catálogo, roles y privilegios). No hay DB. Pendiente: PostgreSQL detrás de la firma, provider Evolok real del seam de roles, y cablear el IC web real en el SDK.

## Layout

```
src/
  edge-console-sdk/                       SDK independiente del framework (sin redux/MUI): client, auth (Evolok),
                                     admin (roles/privilegios/catálogo), consoles (alta/edición/config god),
                                     verify, keys, react/ (provider+hooks). CONTRACT.md = fuente de verdad.
  views/<feature>/index.jsx          páginas (datos, suscripciones/*, notificaciones, facturacion,
                                     herramientas/*, permisos, configuracion, integraciones)
  components/<feature>/              tablas/diálogos/forms por área + components/common (nav, topbar, main, modal)
  services/                          http.js + <entity>.service.js (operator, permissionsAdmin, integrations, …)
  config/endpoints.json
  common/
    features/auth/authSlice.js           operador, rol y permisos (loadPermissions)
    features/customer/customerSlice.js   usuario cargado
    permissions/permissions.js           APP_ID='welcome-console' + useTabVisible/useActionAllowed/useFieldMode (reexport del SDK)
    permissions/ (privileges.js, useHasPrivilege)   gating legacy (shim)
    providers/ModalProvider/
    router/                          Routes + AuthenticatedRoute + UnauthenticatedRoute + nav.config (tabKey/placement)
    store/store.js                   RTK store + redux-persist
    theme/                           tema multi-marca (LV/MD/R1). Botones (buildTheme.js): compactos; outlined/text
                                     RELLENOS por color (invertidos); excepción `color="inherit"` = cancelar/cerrar
                                     (fondo blanco, texto negro, borde) — el único ghost.
```

Path alias: `@/` → `src/`.

## Convenciones

- ES modules. Default-export de la página/componente; named-export de hooks y helpers.
- 2 espacios, comillas simples, punto y coma, trailing commas.
- Alias `@/` en todos los imports.
- Los service files exportan un objeto con los métodos.
- `useActionAllowed`/`useTabVisible`/`useFieldMode` para gating; `guid` del cliente cargado vía `customer?.raw?.evUser?.guid`.
- Botones: por defecto van rellenos. Para **Cancelar/Cerrar** usa `color="inherit"` (queda blanco con texto negro).
- Sin comentarios salvo lo no obvio.
