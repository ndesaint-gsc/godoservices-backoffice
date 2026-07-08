// Flat items have `path`. Group items have `children` (leaf paths) and toggle expansion.
// `tabKey` = clave de tab del registry de permisos del backend (visible/hidden por ROL ACTIVO): es lo
// único que gatea la visibilidad. `requiresCustomer` dims/locks until a customer is loaded.
export const NAV_ITEMS = [
  { path: '/', label: 'Inicio', icon: 'Home' },
  {
    path: '/datos',
    label: 'Datos',
    icon: 'Person',
    tabKey: 'datos',
    requiresCustomer: true,
  },
  {
    label: 'Suscripciones',
    icon: 'Subscriptions',
    tabKey: 'suscripciones',
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
    requiresCustomer: true,
  },
  {
    path: '/facturacion',
    label: 'Facturación',
    icon: 'Receipt',
    tabKey: 'facturacion',
    requiresCustomer: true,
  },
  {
    label: 'Herramientas',
    icon: 'Build',
    tabKey: 'herramientas',
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
  {
    path: '/configuracion',
    label: 'Configuración',
    icon: 'Settings',
    tabKey: 'configuracion',
    requiresCustomer: false,
    placement: 'bottom', // config técnica de la propia consola; visible vía tab 'configuracion' (god)
  },
  {
    path: '/integraciones',
    label: 'Integraciones',
    icon: 'Hub',
    tabKey: 'integraciones',
    requiresCustomer: false,
    placement: 'bottom', // admin de consolas de la plataforma (última); visible vía tab 'integraciones' (admin/god)
  },
];
