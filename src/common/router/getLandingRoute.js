import { hasPrivilege, Priv } from '@/common/permissions/privileges';

// After login no customer is loaded yet -> land on / (empty state prompting a search).
// Once a customer is loaded and the operator can read Datos, /datos is the natural home.
export const getLandingRoute = (userRoles = [], hasCustomer = false) => {
  if (hasCustomer && hasPrivilege(userRoles, Priv.READ_DATOS)) {
    return '/datos';
  }
  return '/';
};
