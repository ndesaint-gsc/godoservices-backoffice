// console-sdk/keys.js
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
};
export const ALL_TABS = Object.values(Tab);

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
