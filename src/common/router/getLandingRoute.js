import { Role } from '@/common/roles/role';

const DATA_ALLOWED_ROLES = [
  Role.Viewer,
  Role.FinanceViewer,
  Role.FinanceEditor,
  Role.Manager,
  Role.Admin,
];

// If a customer is loaded AND the operator has the role to see /data, land there.
// Otherwise land on / (the empty-state home that prompts for a search).
export const getLandingRoute = (userRoles = [], hasCustomer = false) => {
  if (hasCustomer && userRoles.some((r) => DATA_ALLOWED_ROLES.includes(r))) {
    return '/data';
  }
  return '/';
};
