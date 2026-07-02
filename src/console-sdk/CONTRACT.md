# Console Integration — Contrato de endpoints (fuente de verdad)

Contrato compartido entre el **SDK React** (`src/console-sdk/`) y el **backend web-core**
(`com.grupogodo.welcome.console`). Genérico y reutilizable por cualquier producto; La Vanguardia
es el primer consumidor. Cualquier cambio de forma se hace aquí primero.

## Conceptos

- **product / appconsole**: identifican un backoffice concreto. Ej.: `product=lv`, `appconsole=console`.
- **appId**: identificador opaco del backoffice para el plano de sesión. Valor actual: `lv-console`
  (mapea a `product=lv`, `appconsole=console`). Un backoffice nuevo usa su propio `appId`.
- **rolePrefix**: `"{product}_{appconsole}_"` (guiones bajos). Ej.: `lv_console_`. Lo aplica/retira
  el backend de forma transparente: el Product Owner ve/entra el `rolename` **sin** prefijo; en Evolok
  el grupo vive **con** prefijo (`lv_console_editor`).
- **permissions**: objeto de 3 dimensiones
  ```
  {
    tabs:    { "<tabKey>":    "visible" | "hidden" },
    actions: { "<actionKey>": "allowed" | "denied" },
    fields:  { "<fieldKey>":  "editable" | "viewable" | "hidden" }
  }
  ```
  Semántica de defaults (front): tabs = optimista-visible hasta cargar, luego estricto; actions =
  default-deny; fields = default `editable`.

## Dos planos de seguridad

| Plano | Base path | Auth | Quién lo usa |
|---|---|---|---|
| **Sesión** (verificación + editor in-console) | `/perfil/console/**` | Sesión operador: cookie `ev_gg_bo` o `?sessionId=<valor>` | El front de la consola (SDK) |
| **Provisioning** (S2S) | `/perfil/console-admin/**` | Header `X-Console-ApiKey: <key>` (resuelve product/appconsole/rolePrefix) | Backends de producto / scripts de alta |

> El plano provisioning usa una base distinta a propósito, para no cruzarse con el interceptor de
> sesión montado en `/perfil/console/**`.

---

## Plano SESIÓN — `/perfil/console/**`

### `GET /perfil/console/auth/me?app={appId}[&role={override}]`
Resuelve el operador y sus permisos efectivos desde la sesión Evolok.
`role` (override) es **solo DEV** para previsualizar permisos por rol; en prod lo ignora / lo resuelve
el backend desde los grupos Evolok de la sesión.
```jsonc
// 200
{
  "operator": { "id": "…", "email": "…", "name": "…" },
  "role":  "ADMIN",              // rol efectivo/primario (sin prefijo)
  "roles": ["ADMIN"],            // todos los roles del operador (sin prefijo)
  "permissions": { "tabs": {…}, "actions": {…}, "fields": {…} }  // ya fusionados
}
// 401 si no hay sesión válida
```

### `POST /perfil/console/auth/verify?app={appId}`
Verifica una o varias operaciones para el operador de la sesión. Usado por backends que quieran
confirmar antes de operar (y por el SDK para checks puntuales).
```jsonc
// body (una):   { "operation": "datos.delete" }
// 200:          { "allowed": true }
// body (batch): { "operations": ["datos.delete", "facturacion.rectify"] }
// 200:          { "results": { "datos.delete": true, "facturacion.rectify": false } }
```

### `GET /perfil/console/auth/permissions?app={appId}`
Catálogo + mapa actual, para el editor in-console (`/permisos`).
```jsonc
// 200
{
  "roles":   ["ADMIN", "MANAGER", …],   // sin prefijo
  "tabs":    ["datos", "facturacion", …],
  "actions": ["datos.delete", …],
  "fields":  ["datos.personalData", …],
  "permissions": { "ADMIN": { "tabs":{…}, "actions":{…}, "fields":{…} }, … }
}
```

### `PUT /perfil/console/auth/permissions?app={appId}&role={role}`
Guarda el mapa de un rol desde el editor in-console. Gated por meta-privilegio `permisos.edit`.
```jsonc
// body: { "tabs": {…}, "actions": {…}, "fields": {…} }
// 200
```

---

## Plano PROVISIONING — `/perfil/console-admin/**`  (header `X-Console-ApiKey`)

product/appconsole/rolePrefix se derivan del apikey; el cliente **no** los envía.

### Roles (nombres SIN prefijo de cara al PO)
```
GET    /perfil/console-admin/roles
       -> { "roles": [ { "name":"editor", "prefixedName":"lv_console_editor", "description":"…" } ] }

POST   /perfil/console-admin/roles          body: { "name":"editor", "description"?:"…" }
       -> 201 { "name":"editor", "prefixedName":"lv_console_editor", "description":"…" }

PUT    /perfil/console-admin/roles/{name}    body: { "description"?:"…" }
       -> 200 { … }

DELETE /perfil/console-admin/roles/{name}    -> 204
```

### Privilegios (mapa role→privilegios del producto)
```
GET    /perfil/console-admin/privileges
       -> { "permissions": { "<role>": { "tabs":{…}, "actions":{…}, "fields":{…} } } }

PUT    /perfil/console-admin/privileges/{role}   body: { "tabs":{…}, "actions":{…}, "fields":{…} }
       -> 200

DELETE /perfil/console-admin/privileges/{role}   -> 204
```

### Catálogo (universo de claves que el producto declara)
```
GET    /perfil/console-admin/catalog
       -> { "roles":[…], "tabs":[…], "actions":[…], "fields":[…] }

PUT    /perfil/console-admin/catalog   body: { "tabs":[…], "actions":[…], "fields":[…] }
       -> 200
```

> `/console-admin/privileges` (S2S, apikey) y `/console/auth/permissions` (sesión, editor) escriben
> el **mismo** store. Son dos rutas de acceso deliberadas al mismo dato.

---

## Notas de implementación (backend)

- El apikey → `(product, appconsole, tenant, rolePrefix)` se resuelve de config
  (`console.products.<apikey>` en `.properties`, o tabla equivalente).
- `me`/`verify` resuelven los grupos del operador del cuerpo de `POST /console/api/auth/{sessionId}`
  (hoy `EvolokUserServiceImpl.checkConsoleEvolokSessionStatus` devuelve solo el status → extender para
  devolver el body con grupos), retiran el `rolePrefix` y resuelven privilegios del store.
- El store (mapa role→privilegios + catálogo + roles) se persiste en PostgreSQL detrás de la interfaz
  `ConsolePermissionsStore` (reemplaza `ConsolePermissionsRegistry` en memoria).
- El alta/baja del grupo en Evolok va detrás del seam `ConsoleRoleProvider` (impl por-convenio de
  entrada; impl Evolok real cuando se confirme la API de admin de grupos del tenant).
