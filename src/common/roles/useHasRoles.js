import { useSelector } from 'react-redux';

export const useHasRoles = (allowedRoles) => {
  const userRoles = useSelector((s) => s.auth.user?.roles || []);
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.some((r) => userRoles.includes(r));
};
