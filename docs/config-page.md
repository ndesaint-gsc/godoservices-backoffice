# Configuración page — design

> ⚠️ **DESACTUALIZADO / COLISIÓN DE RUTA (jul-2026).** La ruta `/configuracion` y la vista
> `src/views/configuracion/index.jsx` las ocupa ahora la **config técnica de la consola + editor de
> catálogo** del framework *web-and-console-integrations* (identificadores + apikey del god + tabs/
> acciones/datos). Este documento describe una función **distinta**: un editor curado de la config
> remota de Evolok (statusFront, feature flags, cooldown). Sigue **pendiente** y necesita **otra ruta/
> nombre** (p.ej. `/configuracion-evolok` o dentro de Herramientas). Ver `../src/console-sdk/CONTRACT.md`.

Status: **design approved** (prototype validated 2026-05-29). Not yet implemented (route pending re-assignment).
Prototype: `../../prototype-config-page.html` (throwaway, MUI + real cooldown).

## Goal

New top-level **"Configuración"** page (outside Herramientas) to edit a small
**curated subset** of the remote Evolok config. Submit POSTs the whole config
back; a soft 10-min cooldown throttles repeated saves.

## Architecture — 2-repo BFF (secrets never reach the browser)

```
[React: Configuración page]
   │  GET  curated  →  { dotPathKey: value }   (whitelist only, NO secrets)
   │  POST curated  ←  { dotPathKey: value }   (curated only)
   ▼
[web-core BFF]  read whitelist ─┐        ┌─ apply whitelist (dot-path setters)
   getConfigurationEV(false) ───┤ merge  ├─ setConfigurationEV(full serialized)
   (full typed EvolokConfig) ───┘        └─ secrets untouched, ride along
```

The full config contains live secrets (AWS/Stripe/PayPal/Paycomet/Google/Apple
keys, DB passwords). They **must never be serialized to the frontend**. The
backend reads the full typed `EvolokConfig`, exposes only whitelisted fields,
and on write merges only whitelisted keys back onto the full object.

The "guard on the first line" of the raw config response is a **non-issue** with
this approach: web-core deals in the typed POJO internally; no raw text is
round-tripped through the browser.

## Backend (web-core)

- Existing service (reused): `BackofficeService.getConfigurationEV(boolean)` /
  `setConfigurationEV(String)` (see `BackofficeServiceImpl`, ~line 538).
- Existing raw endpoints: `BackofficeController` `@ ev/backoffice/config`
  (GET typed `EvolokConfig`, POST raw body). **Do not call these from the browser.**
- **Add 2 curated endpoints** delegating to `BackofficeService`:
  - `GET  config-curated`  → read whitelist (dot-paths) from full POJO → return `{key:value}` map.
  - `POST config-curated`  → receive `{key:value}` → load full POJO → apply **only
    whitelisted dot-paths** → `setConfigurationEV(serialized)`. Non-whitelisted keys ignored.
- **Whitelist = server-side constant**, dot-path aware. Single source of truth for
  what is readable AND writable (security boundary on write too).
- ⚠️ VERIFY AT BUILD:
  - exact controller/prefix the React app reaches — app calls `/perfil/user/evbk/*`
    (Vite proxies `/perfil` → web-core via lavanguardia.biz), but `evbk` isn't in the
    current web-core checkout. Confirm controller location; **another agent may be
    editing this area** — coordinate to avoid collision.
  - where `setConfigurationEV` persists (couchbase per code comment) — confirm
    full-object write is atomic/safe.

## Frontend (godoservices-backoffice)

- View: `src/views/configuracion/index.jsx`; route `/configuracion`; **top-level
  nav item** in `nav.config.js` (outside Herramientas), `Settings` icon.
- Privileges: add `READ_CONFIG` / `EDIT_CONFIG` to `privileges.js` (admin-tier).
  Gate page render + submit (mirror `datos` `canEdit`).
- Service `src/services/config.service.js`: `getConfig()`, `saveConfig(values)`.
- **Descriptor array** (presentation only): `{ key (dot-path), label, control, options? }`.
  Controls: `text`→TextField · `number`→TextField type=number ·
  `boolean`→TextField select (true/false) · `select`→TextField select (options).
- Flow: mount → GET → prefill → edit → submit (POST all curated values) →
  re-GET to confirm → start cooldown.

### Soft cooldown (validated in prototype)

- `localStorage`, single per-device key (`cfg:lastSave`), timestamp of last
  **successful** POST. Window = 10 min.
- On mount: read → if `< 10 min`, start locked with live `MM:SS` countdown.
- Locked = warning banner + countdown; **fields stay editable, submit disabled**
  (button shows `Disponible en MM:SS`); auto-unlocks at 0, no reload.
- Failed save does **not** start the cooldown.
- Soft guard only — clearing storage / another browser bypasses it (accepted).

## Starter whitelist (review/extend at impl)

| key | control | notes |
|---|---|---|
| `statusFront` | select | `ONLY_EVOLOK` / `EVOLOK` / `LEGACY` (confirm enum) |
| `status` | select | `EVOLOK` / `LEGACY` (confirm enum) |
| `modeEvolokIn` | select | `QUEUE` / … (confirm enum) |
| `evolokUserConfig.devicesLimit` | number | nested dot-path, device limit |
| `checkoutVersion` | number | |
| `invoicesVersion` | number | |
| `lockEvFrontEnd` | boolean | feature flag |
| `lockPaypalOnCheckout` | boolean | feature flag |
| `lockTelematicCheckout` | boolean | feature flag |
| `traceDebug` | boolean | debug toggle |

Open: finalize the enum option sets for the three selects from the backend types.
