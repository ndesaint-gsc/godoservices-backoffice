# Web & Console Integrations — Contrato (fuente de verdad)

Framework para integrar webs y consolas de terceros al sistema Godó. Backend en web-core
(`com.grupogodo.welcome.webandconsoleintegrations`); **consola mentor / plantilla de todas**:
godoservices-backoffice (futura welcome-console). LV (`/perfil/console`) es un cliente más. Cambios de
forma → aquí primero.

**Base de endpoints backend:** `/perfil/welcome/web-and-console-integrations`

## Modelo (importante)

- **Autenticación del operador y sus ROLES → DIRECTO contra Evolok, desde el JS** (reusando el IC web,
  `evl-accounts.js`). NO pasa por nuestro backend. El JS recibe los grupos Evolok
  (`{consoleId}-{ROL}`) y **oculta/quita el prefijo** → roles pelados (MAYÚSCULAS).
- **Nuestro backend hace SOLO:**
  1. **Admin de roles y privilegios** (definir/crear/editar/borrar roles + su mapa de privilegios + catálogo).
  2. **Cargar el mapa de privilegios por rol(es)** (dado role(s) → `{tabs,actions,fields}` fusionado).
  3. **Enforcement** de operaciones de consola (interceptor `@ConsolePrivilege`, ver abajo).
  4. **Admin de consolas de la plataforma** (alta/baja/lista de consolas + config técnica del god).
- **Auth del backend admin de roles/privilegios = apikey** (`X-Console-ApiKey`), **inyectada por el
  proxy/BFF** de la consola (nunca en el navegador). El apikey resuelve `(product, appconsole, rolePrefix)`.

`consoleId` = id del backoffice, derivado de `{product}-{appconsole}`. La consola MENTOR
(godoservices-backoffice) es el producto GGOBO (id `welcome`) + appconsole `console` → `welcome-console`.
`rolePrefix = "{consoleId}-"` (p.ej. `welcome-console-`); grupo Evolok = `welcome-console-EDITOR`. Flag
`EvolokConfig.consoleMock` (default true): en dev, el apikey no se exige (producto por defecto) y el
enforcement se omite.

### Límites de longitud (Evolok)

El grupo Evolok resultante es `{product}-{appconsole}-{ROLENAME}` (god: `{product}-{appconsole}-god`).
No hay límite declarado en el código; el tope real lo impone el tenant Evolok. Se fija uno **conservador**
(`ConsoleNaming`, web-core) y se derivan los sublímites — validado en backend (400) y en el front (UX):

| id | máx | charset |
|----|-----|---------|
| `product` | 15 | `[a-z0-9]` (sin `-`) |
| `appconsole` (console) | 15 | `[a-z0-9]` (sin `-`) |
| `rolename` | 32 | `[A-Za-z0-9_]` (→ MAYÚSCULAS) |
| **grupo Evolok total** | **64** | `{product}-{appconsole}-{ROLENAME}` |

### Rol god (por consola)

Cada consola tiene un administrador **god**: grupo Evolok `{consoleId}-god` → rol pelado **`GOD`**.
- **Acceso TOTAL** garantizado (special-case del motor): siempre ve/puede todo — tabs, acciones, fields
  y el admin de roles/privilegios — **sin depender del mapa** de privilegios.
- Se le asigna un **email** (`godEmail`) en el alta de la consola.
- Es un rol **RESERVADO**: una consola **no puede crearlo, editarlo ni borrarlo** (el backend rechaza
  `POST/PUT/DELETE …/admin/roles/GOD` y `…/admin/privileges/GOD` con 400). No aparece en el editor.

### Admin de integración

El **admin de integración** (quien da de alta/baja consolas) **no es un plano aparte con apikey**: es un
**rol con la tab `integraciones` (y las acciones `integraciones.*`) permitida**. Se autoriza por el mismo
enforcement (sesión Evolok del operador). Vive en la consola mentor (godoservices-backoffice).

---

## Backend — plano ADMIN `…/admin/**` (apikey)

### Roles (nombre SIN prefijo de cara al PO; el backend pone el grupo Evolok)
```
GET    …/admin/roles                         -> { "roles": [ { "name":"EDITOR", "prefixedName":"welcome-console-EDITOR", "description":"…" } ] }
POST   …/admin/roles     { "name", "description" }   -> 201 { name, prefixedName, description }   (description OBLIGATORIA → 400 si falta)
PUT    …/admin/roles/{name}  { "description" }       -> 200                                       (description OBLIGATORIA)
DELETE …/admin/roles/{name}                          -> 204
```

### Membresías de rol (usuarios asignados al grupo Evolok, con ventana opcional)
```
GET    …/admin/roles/{name}/members                          -> { "members": [ { email, role, group, startDate, endDate } ] }
POST   …/admin/roles/{name}/members  { email, startDate?, endDate? }  -> { email, role, group, startDate, endDate }   (email OBLIGATORIO; fechas ISO opcionales, null = sin límite)
DELETE …/admin/roles/{name}/members?email=…                  -> 204
```
Asigna/quita un usuario (email) al **grupo Evolok** del rol (`{consoleId}-{ROL}`), con fechas de
inicio/fin opcionales. Va por el seam `ConsoleRoleProvider` (impl por convenio hoy; la impl Evolok real
creará la membresía temporal en Evolok). No altera el catálogo/privilegios (la membresía es de Evolok).

> `GOD` es un rol **RESERVADO**: `POST/PUT/DELETE …/admin/roles/GOD` y `PUT/DELETE …/admin/privileges/GOD`
> devuelven **400** (no creable/editable/borrable por la consola; el god siempre conserva acceso total).

### Privilegios (mapa role→privilegios)
```
GET    …/admin/privileges                    -> { "permissions": { "<role>": { tabs, actions, fields } } }
PUT    …/admin/privileges/{role}   { tabs, actions, fields }   -> 200
DELETE …/admin/privileges/{role}                               -> 204
```

### Catálogo (universo de claves de la consola)
```
GET    …/admin/catalog   -> { roles, tabs, actions, fields }
PUT    …/admin/catalog   { tabs, actions, fields }   -> 200
```
El catálogo define **qué tabs/acciones/datos** existen en la consola; es lo que pinta la vista de
**Permisos** (y lo edita el god desde la vista de **Configuración**). Reglas:
- **Sin duplicados** en tabs, acciones ni datos (dedup en backend).
- **Tabs/acciones reservadas** siempre presentes y **no borrables**: tabs `permisos` + `configuracion`,
  acciones `permisos.edit` + `configuracion.view`. Toda consola tiene SIEMPRE su vista de permisos
  («accesos y permisos») y de configuración, aunque su catálogo esté vacío (el acceso a ellas se rige
  igualmente por roles/privilegios, o el god que tiene acceso total).
- Se guarda **en el mismo JSON** que el mapa de roles/privilegios de la consola
  (`{ roles, tabs, actions, fields, permissions:{role→{tabs,actions,fields}} }`; hoy en memoria).
- En la vista de Permisos las tres dimensiones se listan **por orden alfabético**, en **2 columnas**.

### Editor / carga de mapa (lo que consume la consola)
```
GET    …/admin/permissions                   -> { roles, tabs, actions, fields, permissions }   (payload del editor)
GET    …/admin/privileges/resolve?roles=A,B  -> { "permissions": { tabs, actions, fields } }     (fusionado; roles vienen de Evolok)
```

**permissions**: `{ tabs:{k:"visible"|"hidden"}, actions:{k:"allowed"|"denied"}, fields:{k:"editable"|"viewable"|"hidden"} }`.
Defaults front: tabs optimista-visible hasta cargar; actions default-deny; fields default `editable`.

---

## Backend — Enforcement de operaciones (no HTTP propio)

Las operaciones de una consola (p.ej. bajo `/perfil/console/**` en welcome/console) se anotan con
`@ConsolePrivilege("tab.action")`. El `ConsolePrivilegeInterceptor`:
- resuelve los roles del operador **contra Evolok** (valida `ev_gg_bo`, saca grupos, quita prefijo) —
  con caché LRU+TTL corto (`ConsoleRolesCache`, seam; default in-memory) para no llamar a Evolok en
  cada operación;
- comprueba la operación contra el mapa de privilegios;
- MOCK → pasa; sin sesión válida → 401; no permitido → 403.

> Este enforcement lo reusa cualquier consola (welcome/console y futuras) registrando el interceptor
> en sus rutas. La consola de un producto separado puede, en su lugar, llamar a `…/admin/privileges/resolve`
> y validar la sesión Evolok por su cuenta.

---

## Backend — plano CONSOLAS `…/consoles/**` (admin de integración + config del god)

Admin de las consolas de la plataforma (consola mentor). **Autorización = enforcement por privilegio**
(sesión Evolok, NO apikey); el operador pasa `?app={consoleId}` = la consola desde la que opera.

```
GET    …/consoles              (integraciones.view)   -> { "consoles": [ { consoleId, product, appconsole, godEmail, godRole, godGroup, hasApiKey, apiKeyMasked } ] }
POST   …/consoles              (integraciones.create) { product, console, godEmail }
                                                       -> 201 { consoleId, product, appconsole, godEmail, godRole, godGroup, apiKey }   (apiKey EN CLARO, UNA vez)
PUT    …/consoles/{consoleId}  (integraciones.edit)   { product, console, godEmail, apiKey? }
                                                       -> 200 { …masked }   (el god edita todos los campos; apiKey vacío = conservar; cambiar product/console = rename)
DELETE …/consoles/{consoleId}  (integraciones.delete) -> 204   (welcome-console = mentor → 400, NO borrable)
GET    …/consoles/mine?app=    (configuracion.view)   -> { consoleId, product, appconsole, rolePrefix, godRole, godGroup, godEmail, apiKey }   (config técnica; apiKey EN CLARO)
```

- **Alta**: `consoleId = {product}-{console}`; se **genera** la apikey y se asocia `godEmail` (los tres
  campos son **obligatorios** → 400 si faltan; consola duplicada → 409). La apikey se devuelve **una sola
  vez**; en la lista va **enmascarada** (`apiKeyMasked`, `hasApiKey`).
- **Config técnica del god** (`/consoles/mine`): identificadores + apikey **en claro** de la propia
  consola, para que el god configure el proxy de su producto. La ve el god (rol `GOD`, acceso total) o
  quien tenga `configuracion.view`.
- **Persistencia (seam listo)**: el estado runtime vive en memoria (`ConsoleRegistry` + la estática
  `ConsolePermissionsRegistry` + descripciones), y `ConsoleConfigService` lo **sincroniza** con el seam
  **`ConsoleConfigStore`** — un documento JSON por consola (`ConsoleConfigDocument`: meta + catalog +
  permissions + roleDescriptions), pensado para una columna `content` JSONB keyed por `consoleId`.
  - **Al arranque** (`restore()`) carga del store y reconstruye los registries; **en cada mutación**
    (`persist()`) guarda el snapshot. **Cache** `ConsoleConfigCache` (LRU N + TTL, `ensureLoaded()` cache-first)
    delante del store para que la verificación de accesos no vaya al store en cada request.
  - **Persistencia real = MISMO mecanismo que EvolokConfig**: `ContentConsoleConfigStore` guarda un Content
    de nickel (`ConsoleConfigsContent`, tipo `CONSOLE_CONFIGS`) en DB **POSTGRES_CACHED** vía
    `ContentRepository`+`TransactionService`. Se activa con **`console.config.store=content`**; por defecto
    `InMemoryConsoleConfigStore` (`@ConditionalOnMissingBean`, sin durabilidad, no depende de DB en dev).
  - ⚠️ **PENDIENTE (no hecho aún)**: la tabla de contenido **NO se autocrea** al arrancar (nickel solo llama
    `createTable` en tests). Antes de usar `store=content` hay que crearla en TES (y pre/pro):
    `CREATE TABLE IF NOT EXISTS lv_console_configs (id TEXT PRIMARY KEY, json JSONB, creationinstant timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP);`
    (nombre = `{tenantCode}_{typeCode}` = `lv` + `console-configs`; confirmar prefijo con `lv_evolok_config`).
  - **welcome-console (mentor) queda FUERA del store**: su config es hardcodeada (seed de código,
    `ConsolePermissionsCatalog` + default de `ConsoleRegistry`); no se persiste ni se restaura, para no
    perderla nunca. El registry de consolas además se **siembra** de la propiedad `console.products`
    (`.properties`: `consoleId:product:appconsole:apiKey:godEmail;…`) o del default `welcome-console`.

## Cliente (SDK React `console-sdk`)

```js
const sdk = createConsole({ consoleId: 'welcome-console', getEvolokSession });   // getEvolokSession = IC web
const { operator, roles } = await sdk.auth.getOperator();      // Evolok directo; prefijo ya quitado
const permissions = await sdk.privileges.resolve(roles);       // mapa fusionado (backend)
sdk.verify.actionAllowed(permissions, 'datos.delete');         // puro, sobre el snapshot
// admin de roles/privilegios + catálogo (apikey vía proxy):
await sdk.admin.roles.create('editor', 'Editor de contenidos');
await sdk.admin.savePermissions('EDITOR', { tabs, actions, fields });
const catalog = await sdk.admin.catalog.get();                 // { roles, tabs, actions, fields }
await sdk.admin.catalog.set({ tabs, actions, fields });        // define el catálogo (sin dups; reservadas fijas)
// admin de consolas de la plataforma + config técnica del god (enforcement por sesión):
const list = await sdk.consoles.list();
const created = await sdk.consoles.create('running', 'console', 'god@grupogodo.com'); // created.apiKey (una vez)
await sdk.consoles.update('running-console', { product, console, godEmail, apiKey }); // god edita todo
await sdk.consoles.remove('running-console');
const myConfig = await sdk.consoles.mine();    // { consoleId, rolePrefix, godGroup, apiKey, … }
```

## Backend — clases (web-core `…webandconsoleintegrations`)

- `controller/ConsoleProvisioningController` — plano `…/admin/**` (roles/privilegios/catálogo; protege `GOD` reservado).
- `controller/IntegrationConsolesController` — plano `…/consoles/**` (alta/baja/lista de consolas + `/mine` config del god).
- `auth/ConsoleApiKeyControl` + `ConsoleApiKeyInterceptor` — apikey (plano `…/admin/**`).
- `auth/ConsolePrivilege` + `ConsolePrivilegeInterceptor` — enforcement (planos `/perfil/console/**` y `…/consoles/**`).
- `service/ConsoleOperatorResolver` — roles desde Evolok (con `ConsoleRolesCache`).
- `service/ConsoleRolesCache` (seam) + `impl/InMemoryConsoleRolesCache` + `ConsoleRolesCacheConfig` (@ConditionalOnMissingBean).
- `service/ConsoleRegistry` — CRUD de consolas (consoleId/apiKey→producto, `godEmail`, `create`/`remove`/`list`, `GOD_ROLE`).
- `service/ConsoleRoleProvider` + `impl/NamingConsoleRoleProvider` (por convenio de nombre).
- `privileges/ConsolePermissionsRegistry` (motor estático; `GOD` = acceso total special-case + reservado; welcome-console se registra vía `WelcomeConsolePermissionsSeed`).
- **Persistencia**: `service/ConsoleConfigStore` (seam) + `impl/InMemoryConsoleConfigStore` + `ConsoleConfigStoreConfig` (@ConditionalOnMissingBean) + `service/ConsoleConfigService` (restore/persist, excluye welcome-console) + `service/ConsoleConfigDocument` (JSON por consola). Default in-memory; DB (JSONB) = drop-in bean.
- Provisioning del grupo en Evolok = seam `ConsoleRoleProvider` (TODO impl real).
