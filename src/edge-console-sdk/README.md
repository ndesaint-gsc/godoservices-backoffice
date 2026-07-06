# edge-console-sdk

Módulo **independiente** (sin redux/MUI, con sus propios clientes de endpoint) para integrar una
consola/backoffice con el sistema Godó. Contrato en [`CONTRACT.md`](./CONTRACT.md).

**Dos SDK sobre un mismo núcleo** (`client`/`keys`/`verify` compartidos):
- **`createConsole`** (`@/edge-console-sdk`) — **CONSUMIDOR**: lo que se entrega a un tercero. Consume
  auth/roles/privilegios; no administra nada.
- **`createConsoleAdmin`** (`@/edge-console-administrator`) — **ADMINISTRACIÓN**: solo la consola
  mentor (godoservices). Administra roles/privilegios/catálogo + consolas de la plataforma.

**Modelo:**
- **Auth del operador + roles → DIRECTO contra Evolok** (la app pasa `getEvolokSession`, que reusa el IC
  web). El SDK quita el prefijo `{consoleId}-` de los grupos → roles pelados.
- **Backend**: consumo en plano `…/client/**` (apikey del producto vía proxy); admin en `…/admin/**`
  (apikey) y `…/consoles/**` (sesión Evolok).
- **Verificación en pantalla**: funciones puras sobre el snapshot de permisos.

## Estructura

```
edge-console-sdk/
  client.js       createConsoleClient({ baseUrl, apiKey, onUnauthorized })   // apiKey solo S2S; en navegador la pone el proxy   ← núcleo
  keys.js         Role, ALL_ROLES, Tab, Priv, hasPrivilege(roles,priv), Naming, RESERVED_*             ← núcleo
  verify.js       tabVisible(perms,key), actionAllowed(perms,key), fieldMode(perms,key)   (puras)      ← núcleo
  paths.js        BASE, CLIENT, ADMIN, CONSOLES
  // --- consumidor (createConsole) ---
  auth.js         getOperator(roleOverride) → { operator, roles }            // Evolok directo; quita prefijo
  privileges.js   resolve(roles) → { tabs, actions, fields }                 // …/client/** (apikey)
  react/          <ConsoleProvider value={{permissions,role,roles}}>, useConsole(),
                  useTabVisible/useActionAllowed/useFieldMode/useHasPrivilege
  index.js        createConsole(config) → { client, auth, privileges, verify, keys }
  // --- administración (createConsoleAdmin) ---
  admin.js        getPermissions(), savePermissions(role, perms),
                  roles.{list,create,update,remove,members}, catalog.{get,set}   // …/admin/** (apikey)
  consoles.js     list(), create(product,console,godEmail), update(id,…), remove(id), mine()  // …/consoles/** (sesión)
  administrator.js createConsoleAdmin(config) → { client, admin, consoles, keys }
```

## Interfaz de uso

```js
// ===== edge-console-sdk (CONSUMIDOR / tercero) =====
import { createConsole } from '@/edge-console-sdk';

// getEvolokSession: lo aporta la app (IC web / evl-accounts.js). Devuelve { operator, groups }.
const sdk = createConsole({ consoleId: 'welcome-console', getEvolokSession });

// 1) Auth + roles desde Evolok (prefijo ya quitado):
const { operator, roles } = await sdk.auth.getOperator();
// 2) Mapa de privilegios de esos roles (backend …/client/**):
const permissions = await sdk.privileges.resolve(roles);
// 3) Verificación local (sin ir al backend en cada render):
sdk.verify.tabVisible(permissions, 'facturacion');
sdk.verify.actionAllowed(permissions, 'datos.delete');
sdk.verify.fieldMode(permissions, 'datos.personalData'); // 'editable'|'viewable'|'hidden'

// ===== edge-console-administrator (ADMINISTRACIÓN / mentor) =====
import { createConsoleAdmin } from '@/edge-console-administrator';

const admin = createConsoleAdmin({ consoleId: 'welcome-console' });

// Admin de roles/privilegios (apikey inyectada por el proxy):
const editor = await admin.admin.getPermissions();          // { roles, tabs, actions, fields, permissions }
await admin.admin.savePermissions('EDITOR', { tabs, actions, fields });
await admin.admin.roles.create('editor', 'Editor de contenidos'); // description obligatoria (GOD reservado)
await admin.admin.roles.remove('editor');

// Admin de consolas de la plataforma + config técnica del god (enforcement por sesión Evolok):
const consoles = await admin.consoles.list();                          // apikey enmascarada
const created = await admin.consoles.create('running', 'console', 'god@grupogodo.com'); // created.apiKey una vez
await admin.consoles.remove('running-console');
const myConfig = await admin.consoles.mine();               // { consoleId, rolePrefix, godGroup, apiKey, … }
```

**Modelo god / admin de integración:** cada consola tiene un god (grupo Evolok `{consoleId}-god` → rol
`GOD`) con **acceso total** y un `godEmail`; `GOD` es **reservado** (no creable/editable/borrable). El
**admin de integración** es un rol con la tab `integraciones` permitida (no un plano apikey aparte).

### React

```jsx
import { ConsoleProvider, useTabVisible, useActionAllowed } from '@/edge-console-sdk/react';

<ConsoleProvider value={{ permissions, role, roles }}>
  <App />
</ConsoleProvider>;

const canDelete = useActionAllowed('datos.delete');
const showFactu = useTabVisible('facturacion');
```

## Reutilización en otro producto

Cambia `consoleId` (y aporta su `getEvolokSession`). Los nombres de roles/tabs/actions/fields los
declara cada producto en su catálogo backend y llegan por API.
