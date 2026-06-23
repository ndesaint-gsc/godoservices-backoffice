# web-backoffice-static

Consola de operador (backoffice) del grupo Godó en React. Reemplaza progresivamente la consola legada server-rendered (Groovy) y consume la API REST bajo `/perfil/console/**`. Un operador busca un usuario y gestiona sus datos, suscripciones, notificaciones y facturación, además de herramientas globales.

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

Todo cuelga de **`/perfil/console`** (el proxy de Vite reenvía `/perfil/*` al backend):
- **web-lv** (`ConsoleUserController`/`ConsoleViewController`/`ConsoleInvoiceController`): `…/user/**`, `…/views/**`, `…/invoices/**`.
- **web-core** (`ConsoleAuthController`/`ConsoleConfigurationController`/`ConsoleAdminController`): `…/auth/**`, `…/configuration/**`, y endpoints admin.

> Los endpoints de **web-core** requieren recompilar web-core en local; si no, dan **404** (`/auth/me`, `/auth/permissions`, retención, etc.).

## Funcionalidades

- **Datos** — ficha del usuario: ver identificación, editar datos personales, reset/verificación de contraseña, desbloquear, invalidar caché, eliminar, vincular/desvincular NIF.
- **Suscripciones** — Digitales, Impresas y beneficiario, Mobile (Apple/Google) con acciones, Accesos temporales (crear/revocar rol), Crear telemática (enviar oferta), y beneficiarios corporativos (alta/baja/import/export).
- **Notificaciones** — opt-ins + newsletters/intereses.
- **Facturación** — listar/PDF, sustitutiva/rectificativa/abono, recalcular, dirección fiscal.
- **Herramientas** (global, sin cliente) — crear usuario, NIF masivo, roles masivo, landings, retención, buscar por externalId.
- **Permisos** (`/permisos`, solo ADMIN) — editor de la matriz rol→permisos.

## Auth, roles y permisos

- **Auth + rol del operador → delegados a un IdP** (Evolok hoy / `Director`-LDAP empresarial a futuro; **decisión abierta**), detrás de un seam. **Actualmente MOCKEADO**: `GET /perfil/console/auth/me` no exige sesión y devuelve un operador fijo + rol por defecto `ADMIN` (override dev `?role=`).
- **Permisos por rol → definidos en la app** (no en el IdP), en 3 dimensiones: `tabs` (visible/hidden), `actions` (allowed/denied), `fields` (editable/viewable/hidden). Catálogo **por aplicación** (`appId='lv-console'`), pensado para reutilizarse en otros backoffices SaaS.
- El front consume `/auth/me` (`authSlice.loadPermissions`) y gobierna la UI con `useTabVisible` / `useActionAllowed` / `useFieldMode` (`src/common/permissions/permissions.js`). Default-deny en acciones.
- **Roles**: ADMIN, MANAGER, FINANCE_EDITOR, FINANCE_VIEWER, VIEWER. En DEV, el *role switcher* de la topbar previsualiza los permisos de cada rol.
- **Editor**: `views/permisos` edita la matriz (PUT `/perfil/console/auth/permissions`); persistencia **en memoria** por ahora.
- La matriz vacía para que Business defina roles×permisos está en **`docs/permissions-matrix.{md,csv}`**.

Pendiente (futuro): IdP real tras el seam, enforcement por permiso en backend, persistencia real del registry.

## Layout

```
src/
  views/<feature>/index.jsx          páginas (datos, suscripciones/*, notificaciones, facturacion, herramientas/*, permisos)
  components/<feature>/              tablas/diálogos/forms por área + components/common (nav, topbar, main, modal)
  services/                          http.js + <entity>.service.js (operator, permissionsAdmin, datos, billing, subscriptions, …)
  config/endpoints.json
  common/
    features/auth/authSlice.js           operador, rol y permisos (loadPermissions)
    features/customer/customerSlice.js   usuario cargado
    permissions/permissions.js           APP_ID + useTabVisible/useActionAllowed/useFieldMode
    permissions/ (privileges.js, useHasPrivilege)   gating legacy (shim)
    providers/ModalProvider/
    router/                          Routes + AuthenticatedRoute + UnauthenticatedRoute + nav.config (tabKey/placement)
    store/store.js                   RTK store + redux-persist
    theme/                           tema multi-marca (LV/MD/R1)
```

Path alias: `@/` → `src/`.

## Convenciones

- ES modules. Default-export de la página/componente; named-export de hooks y helpers.
- 2 espacios, comillas simples, punto y coma, trailing commas.
- Alias `@/` en todos los imports.
- Los service files exportan un objeto con los métodos.
- `useActionAllowed`/`useTabVisible`/`useFieldMode` para gating; `guid` del cliente cargado vía `customer?.raw?.evUser?.guid`.
- Sin comentarios salvo lo no obvio.
