export const Priv = {
  READ_INVOICES: 'READ_INVOICES',
  EDIT_INVOICES: 'EDIT_INVOICES',
};

const PRIVILEGE_ROLES = {
  [Priv.READ_INVOICES]: ['FINANCE_VIEWER', 'FINANCE_EDITOR', 'MANAGER', 'ADMIN'],
  [Priv.EDIT_INVOICES]: ['FINANCE_EDITOR', 'ADMIN'],
};

export const hasPrivilege = (userRoles, priv) =>
  (userRoles || []).some((r) => PRIVILEGE_ROLES[priv]?.includes(r));
