import { Priv } from '@/common/permissions/privileges';

// Flat items have `path`. Group items have `children` (leaf paths) and toggle expansion.
// `privilege` gates visibility (READ_*). `requiresCustomer` dims/locks until a customer is loaded.
export const NAV_ITEMS = [
  { path: '/', label: 'Inicio', icon: 'Home' },
  {
    path: '/datos',
    label: 'Datos',
    icon: 'Person',
    privilege: Priv.READ_DATOS,
    requiresCustomer: true,
  },
  {
    label: 'Suscripciones',
    icon: 'Subscriptions',
    privilege: Priv.READ_SUSCRIPCIONES,
    requiresCustomer: true,
    children: [
      { path: '/suscripciones/digitales', label: 'Digitales' },
      { path: '/suscripciones/invitaciones', label: 'Invitaciones' },
      { path: '/suscripciones/tienda', label: 'Tienda (Apple/Google)' },
      { path: '/suscripciones/accesos', label: 'Accesos temporales' },
      { path: '/suscripciones/crear', label: 'Crear telemática' },
    ],
  },
  {
    path: '/notificaciones',
    label: 'Notificaciones',
    icon: 'Notifications',
    privilege: Priv.READ_NOTIFICACIONES,
    requiresCustomer: true,
  },
  {
    path: '/facturacion',
    label: 'Facturación',
    icon: 'Receipt',
    privilege: Priv.READ_FACTURACION,
    requiresCustomer: true,
  },
  {
    label: 'Herramientas',
    icon: 'Build',
    privilege: Priv.READ_HERRAMIENTAS,
    requiresCustomer: false,
    children: [
      { path: '/herramientas/crear-usuario', label: 'Crear usuario' },
      { path: '/herramientas/nif-masivo', label: 'NIF masivo' },
      { path: '/herramientas/roles-masivo', label: 'Roles masivo' },
      { path: '/herramientas/landings', label: 'Landings' },
      { path: '/herramientas/retencion', label: 'Retención' },
      { path: '/herramientas/buscar-externalid', label: 'Buscar por externalId' },
    ],
  },
];
