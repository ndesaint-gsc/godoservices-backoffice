# console-sdk

Módulo **independiente** para integrar cualquier consola/backoffice de producto con el backend Godó.
Cubre tres cosas y **solo** esas: **auth** del operador, **admin** de roles/privilegios y
**verificación** de permisos. Trae sus propios clientes de endpoint (no usa `services/http.js` de la
app) y no depende de redux ni de MUI. El adaptador React es opcional (`console-sdk/react`).

El contrato de endpoints está en [`CONTRACT.md`](./CONTRACT.md).

## Estructura

```
console-sdk/
  client.js      createConsoleClient({ baseUrl, appId, apiKey, getSessionId, onUnauthorized })
  auth.js        getMe(), verify(op), verifyMany(ops)                    (plano sesión)
  admin.js       session: getPermissions(), savePermissions(role, perms)
                 apikey:  roles.{list,create,update,remove},
                          privileges.{getAll,set,remove}, catalog.{get,set}
  verify.js      tabVisible(perms,key), actionAllowed(perms,key), fieldMode(perms,key)  (puras)
  keys.js        Role, ALL_ROLES, Tab, Priv, hasPrivilege(roles,priv)
  react/         <ConsoleProvider value={{permissions,role,roles}}>, useConsole(),
                 useTabVisible/useActionAllowed/useFieldMode/useHasPrivilege
  index.js       createConsole(config) → { client, auth, admin, verify, keys }
```

## Interfaz de uso

### Dentro de la consola (plano sesión)

```js
import { createConsole } from '@/console-sdk';

const sdk = createConsole({ appId: 'lv-console' }); // baseUrl relativo; sesión por cookie ev_gg_bo

const me = await sdk.auth.getMe();      // { operator, role, roles, permissions }
const allowed = await sdk.auth.verify('datos.delete'); // check backend puntual → boolean

// verificación local sobre el snapshot (sin ir al backend en cada render):
sdk.verify.tabVisible(me.permissions, 'facturacion');
sdk.verify.actionAllowed(me.permissions, 'datos.delete');
sdk.verify.fieldMode(me.permissions, 'datos.personalData'); // 'editable'|'viewable'|'hidden'

// editor de permisos in-console:
const { roles, tabs, actions, fields, permissions } = await sdk.admin.getPermissions();
await sdk.admin.savePermissions('MANAGER', { tabs, actions, fields });
```

### React

```jsx
import { ConsoleProvider, useTabVisible, useActionAllowed } from '@/console-sdk/react';

// En la raíz, alimentando el snapshot desde donde lo tenga la app (redux, estado propio…):
<ConsoleProvider value={{ permissions, role, roles }}>
  <App />
</ConsoleProvider>;

// En cualquier componente:
const canDelete = useActionAllowed('datos.delete');
const showFactu = useTabVisible('facturacion');
```

### Provisioning (S2S, otro producto o script de alta)

```js
const sdk = createConsole({ apiKey: process.env.CONSOLE_API_KEY });

await sdk.admin.roles.create('editor', 'Editor de contenidos'); // backend prefija → lv_console_editor
await sdk.admin.privileges.set('editor', {
  tabs: { datos: 'visible' },
  actions: { 'datos.delete': 'denied' },
  fields: {},
});
await sdk.admin.catalog.set({ tabs: [...], actions: [...], fields: [...] });
```

## Reutilización en otro producto

Cambia `appId` (sesión) o el `apiKey` (provisioning). Nada más del SDK es específico de LV: los
nombres de roles/tabs/actions/fields los declara cada producto en su catálogo backend y llegan por API.
