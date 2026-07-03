# console-sdk

Módulo **independiente** (sin redux/MUI, con sus propios clientes de endpoint) para integrar una
consola/backoffice con el sistema Godó. Contrato en [`CONTRACT.md`](./CONTRACT.md).

**Modelo:**
- **Auth del operador + roles → DIRECTO contra Evolok** (la app pasa `getEvolokSession`, que reusa el IC
  web). El SDK quita el prefijo `{consoleId}-` de los grupos → roles pelados.
- **Backend** (plano `…/admin/**`, apikey inyectada por el proxy): admin de roles/privilegios + carga
  del mapa por rol.
- **Verificación en pantalla**: funciones puras sobre el snapshot de permisos.

## Estructura

```
console-sdk/
  client.js      createConsoleClient({ baseUrl, apiKey, onUnauthorized })   // apiKey solo S2S; en navegador la pone el proxy
  auth.js        getOperator(roleOverride) → { operator, roles }            // Evolok directo; quita prefijo
  admin.js       getPermissions(), savePermissions(role, perms),
                 roles.{list,create,update,remove}, catalog.{get,set}       // …/admin/** (apikey)
  consoles.js    list(), create(product,console,godEmail), remove(id), mine()  // …/consoles/** (sesión)
  paths.js       BASE, ADMIN, CONSOLES
  verify.js      tabVisible(perms,key), actionAllowed(perms,key), fieldMode(perms,key)   (puras)
  keys.js        Role, ALL_ROLES, Tab, Priv, hasPrivilege(roles,priv)
  react/         <ConsoleProvider value={{permissions,role,roles}}>, useConsole(),
                 useTabVisible/useActionAllowed/useFieldMode/useHasPrivilege
  index.js       createConsole(config) → { client, auth, admin, privileges, verify, keys }
```

## Interfaz de uso

```js
import { createConsole } from '@/console-sdk';

// getEvolokSession: lo aporta la app (IC web / evl-accounts.js). Devuelve { operator, groups }.
const sdk = createConsole({ consoleId: 'welcome-console', getEvolokSession });

// 1) Auth + roles desde Evolok (prefijo ya quitado):
const { operator, roles } = await sdk.auth.getOperator();
// 2) Mapa de privilegios de esos roles (backend):
const permissions = await sdk.privileges.resolve(roles);
// 3) Verificación local (sin ir al backend en cada render):
sdk.verify.tabVisible(permissions, 'facturacion');
sdk.verify.actionAllowed(permissions, 'datos.delete');
sdk.verify.fieldMode(permissions, 'datos.personalData'); // 'editable'|'viewable'|'hidden'

// Admin de roles/privilegios (apikey inyectada por el proxy):
const editor = await sdk.admin.getPermissions();          // { roles, tabs, actions, fields, permissions }
await sdk.admin.savePermissions('EDITOR', { tabs, actions, fields });
await sdk.admin.roles.create('editor', 'Editor de contenidos'); // description obligatoria (GOD reservado)
await sdk.admin.roles.remove('editor');

// Admin de consolas de la plataforma + config técnica del god (enforcement por sesión Evolok):
const consoles = await sdk.consoles.list();                          // apikey enmascarada
const created = await sdk.consoles.create('running', 'console', 'god@grupogodo.com'); // created.apiKey una vez
await sdk.consoles.remove('running-console');
const myConfig = await sdk.consoles.mine();               // { consoleId, rolePrefix, godGroup, apiKey, … }
```

**Modelo god / admin de integración:** cada consola tiene un god (grupo Evolok `{consoleId}-god` → rol
`GOD`) con **acceso total** y un `godEmail`; `GOD` es **reservado** (no creable/editable/borrable). El
**admin de integración** es un rol con la tab `integraciones` permitida (no un plano apikey aparte).

### React

```jsx
import { ConsoleProvider, useTabVisible, useActionAllowed } from '@/console-sdk/react';

<ConsoleProvider value={{ permissions, role, roles }}>
  <App />
</ConsoleProvider>;

const canDelete = useActionAllowed('datos.delete');
const showFactu = useTabVisible('facturacion');
```

## Reutilización en otro producto

Cambia `consoleId` (y aporta su `getEvolokSession`). Los nombres de roles/tabs/actions/fields los
declara cada producto en su catálogo backend y llegan por API.
