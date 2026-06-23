import { Priv } from '@/common/permissions/privileges';

// Flat items have `path`. Group items have `children` (leaf paths) and toggle expansion.
// `privilege` gates visibility (READ_*). `requiresCustomer` dims/locks until a customer is loaded.
// `tabKey` = clave de tab del registry de permisos del backend (visible/hidden por rol).
export const NAV_ITEMS = [
  { path: '/', label: 'Inicio', icon: 'Home' },
  {
    path: '/datos',
    label: 'Datos',
    icon: 'Person',
    tabKey: 'datos',
    privilege: Priv.READ_DATOS,
    requiresCustomer: true,
  },
  {
    label: 'Suscripciones',
    icon: 'Subscriptions',
    tabKey: 'suscripciones',
    privilege: Priv.READ_SUSCRIPCIONES,
    requiresCustomer: true,
    children: [
      { path: '/suscripciones/digitales', label: 'Digitales' },
      { path: '/suscripciones/impresas', label: 'Impresas y beneficiario' },
      { path: '/suscripciones/tienda', label: 'Mobile (Apple/Google)' },
      { path: '/suscripciones/accesos', label: 'Accesos temporales' },
      { path: '/suscripciones/crear', label: 'Crear telemática' },
    ],
  },
  {
    path: '/notificaciones',
    label: 'Notificaciones',
    icon: 'Notifications',
    tabKey: 'notificaciones',
    privilege: Priv.READ_NOTIFICACIONES,
    requiresCustomer: true,
  },
  {
    path: '/facturacion',
    label: 'Facturación',
    icon: 'Receipt',
    tabKey: 'facturacion',
    privilege: Priv.READ_FACTURACION,
    requiresCustomer: true,
  },
  {
    label: 'Herramientas',
    icon: 'Build',
    tabKey: 'herramientas',
    privilege: Priv.READ_HERRAMIENTAS,
    requiresCustomer: false,
    placement: 'bottom', // global, no depende del cliente → se ancla al fondo del nav
    children: [
      { path: '/herramientas/crear-usuario', label: 'Crear usuario' },
      { path: '/herramientas/nif-masivo', label: 'NIF masivo' },
      { path: '/herramientas/roles-masivo', label: 'Roles masivo' },
      { path: '/herramientas/landings', label: 'Landings' },
      { path: '/herramientas/retencion', label: 'Retención' },
      { path: '/herramientas/buscar-externalid', label: 'Buscar por externalId' },
    ],
  },
  {
    path: '/permisos',
    label: 'Permisos',
    icon: 'Security',
    tabKey: 'permisos',
    requiresCustomer: false,
    placement: 'bottom', // editor de permisos (meta); visible solo ADMIN vía tab 'permisos' del backend
  },
];
