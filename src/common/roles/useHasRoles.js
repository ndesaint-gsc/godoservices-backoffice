import { useSelector } from 'react-redux';

export const useHasRoles = (allowedRoles) => {
  const userRoles = useSelector((state) => state.auth.user?.roles || []);
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.some((role) => userRoles.includes(role));
};
