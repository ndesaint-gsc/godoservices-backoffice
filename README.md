# web-backoffice-static

React backoffice for the Godó group.

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

| Var | Purpose |
|---|---|
| `VITE_API_URL` | Base URL for service calls. Leave empty when using the Vite dev proxy (same-origin). |
| `VITE_BO_PROXY_TARGET` | Real BO target host for the `/perfil/*` Vite proxy. |
| `VITE_BO_SESSION_ID` | Evolok BO session token, auto-injected as `?sessionId=…` on every proxied request. Refresh by visiting the live BO and copying the param. |

`.env.local` is gitignored. `.env.test` / `.env.pro` are committed.

## Layout

```
src/
  views/<feature>/index.jsx          page-level
  components/common/                 nav, topbar, main, modal
  services/                          http.js + api.service.js + <entity>.service.js
  config/configApi.json              resource map
  common/
    features/<entity>/<entity>Slice.js   RTK slices
    hooks/
    providers/ModalProvider/
    roles/                           role enum + useHasRoles + withRoles
    permissions/                     privilege map + useHasPrivilege
    router/                          Routes + AuthenticatedRoute + UnauthenticatedRoute + ScrollToTop + getLandingRoute + nav.config
    store/store.js                   RTK store w/ redux-persist (whitelist: auth)
```

Path alias: `@/` → `src/`.

## Conventions

- ES modules. Default-export the page/component; named-export hooks and helpers.
- 2-space indent, single quotes, semicolons, trailing commas.
- Path alias `@/` for all imports.
- Service files export an object literal of methods.
- No comments unless non-obvious.
