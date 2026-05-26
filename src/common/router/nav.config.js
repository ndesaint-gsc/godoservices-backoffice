import { Role } from '@/common/roles/role';

export const NAV_ITEMS = [
  { path: '/', label: 'Inicio', icon: 'Home' },
  {
    path: '/data',
    label: 'Datos',
    icon: 'People',
    allowedRoles: [
      Role.Viewer,
      Role.FinanceViewer,
      Role.FinanceEditor,
      Role.Manager,
      Role.Admin,
    ],
    requiresCustomer: true,
  },
  {
    path: '/subscriptions',
    label: 'Suscripciones',
    icon: 'Subscriptions',
    allowedRoles: [
      Role.FinanceViewer,
      Role.FinanceEditor,
      Role.Manager,
      Role.Admin,
    ],
    requiresCustomer: true,
  },
  {
    path: '/invoices',
    label: 'Facturas',
    icon: 'Receipt',
    allowedRoles: [
      Role.FinanceViewer,
      Role.FinanceEditor,
      Role.Manager,
      Role.Admin,
    ],
    requiresCustomer: true,
  },
];
