// edge-console-sdk/keys.js
// Catálogo de claves del lado cliente (mirror del catálogo backend, que es el autoritativo y llega
// por API en /auth/permissions o /console-admin/catalog). Centraliza aquí las claves que hoy viven
// como strings sueltos por las vistas, para tener una única fuente de nombres.

// --- Roles conocidos ---
export const Role = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  FINANCE_EDITOR: 'FINANCE_EDITOR',
  FINANCE_VIEWER: 'FINANCE_VIEWER',
  VIEWER: 'VIEWER',
};
export const ALL_ROLES = Object.values(Role);

// --- Tabs (dimensión de navegación) ---
export const Tab = {
  DATOS: 'datos',
  SUSCRIPCIONES: 'suscripciones',
  NOTIFICACIONES: 'notificaciones',
  FACTURACION: 'facturacion',
  HERRAMIENTAS: 'herramientas',
  PERMISOS: 'permisos',
  // Meta-tabs de la consola mentor: admin de consolas y config técnica (identificadores + apikey).
  INTEGRACIONES: 'integraciones',
  CONFIGURACION: 'configuracion',
};
export const ALL_TABS = Object.values(Tab);

// Tabs/acciones META RESERVADAS: toda consola tiene siempre su vista de permisos y de configuración;
// no se pueden borrar del catálogo (el backend las reañade). Espejo de ConsolePermissionsRegistry.
export const RESERVED_TABS = ['permisos', 'configuracion'];
export const RESERVED_ACTIONS = ['permisos.edit', 'configuracion.view'];

// --- Límites de longitud (espejo de web-core ConsoleNaming; el grupo Evolok {product}-{console}-{ROL}
// no debe exceder MAX_GROUP). El backend es el autoritativo; esto es solo UX (maxLength/validación). ---
export const Naming = {
  MAX_PRODUCT: 15,
  MAX_CONSOLE: 15,
  MAX_ROLENAME: 32,
  MAX_GROUP: 64,
  ID_RE: /^[a-z0-9]+$/, // product/console: minúsculas + dígitos, sin '-'
  ROLENAME_RE: /^[A-Za-z0-9_]+$/,
};

// --- Modelo legacy de privilegios (routing/nav) ---
// La autoridad de tabs/actions/fields es el snapshot de permisos (verify.js). Este modelo estático
// role→privilegio se mantiene por compatibilidad con el router/nav actuales (que usan `Priv`) hasta
// completar la migración. Idealmente se alimentaría del catálogo backend.
export const Priv = {
  READ_DATOS: 'READ_DATOS',
  EDIT_DATOS: 'EDIT_DATOS',
  READ_SUSCRIPCIONES: 'READ_SUSCRIPCIONES',
  EDIT_SUSCRIPCIONES: 'EDIT_SUSCRIPCIONES',
  READ_NOTIFICACIONES: 'READ_NOTIFICACIONES',
  EDIT_NOTIFICACIONES: 'EDIT_NOTIFICACIONES',
  READ_FACTURACION: 'READ_FACTURACION',
  EDIT_FACTURACION: 'EDIT_FACTURACION',
  READ_HERRAMIENTAS: 'READ_HERRAMIENTAS',
  EDIT_HERRAMIENTAS: 'EDIT_HERRAMIENTAS',
};

const PRIVILEGE_ROLES = {
  [Priv.READ_DATOS]: ['VIEWER', 'FINANCE_VIEWER', 'FINANCE_EDITOR', 'MANAGER', 'ADMIN'],
  [Priv.EDIT_DATOS]: ['MANAGER', 'ADMIN'],
  [Priv.READ_SUSCRIPCIONES]: ['VIEWER', 'MANAGER', 'ADMIN'],
  [Priv.EDIT_SUSCRIPCIONES]: ['MANAGER', 'ADMIN'],
  [Priv.READ_NOTIFICACIONES]: ['VIEWER', 'MANAGER', 'ADMIN'],
  [Priv.EDIT_NOTIFICACIONES]: ['MANAGER', 'ADMIN'],
  [Priv.READ_FACTURACION]: ['VIEWER', 'FINANCE_VIEWER', 'FINANCE_EDITOR', 'MANAGER', 'ADMIN'],
  [Priv.EDIT_FACTURACION]: ['FINANCE_EDITOR', 'MANAGER', 'ADMIN'],
  [Priv.READ_HERRAMIENTAS]: ['MANAGER', 'ADMIN'],
  [Priv.EDIT_HERRAMIENTAS]: ['ADMIN'],
};

// Función pura: ¿alguno de los roles del usuario concede el privilegio legacy?
export const hasPrivilege = (userRoles, priv) =>
  (userRoles || []).some((r) => PRIVILEGE_ROLES[priv]?.includes(r));
