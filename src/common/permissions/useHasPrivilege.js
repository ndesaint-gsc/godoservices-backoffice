import { useSelector } from 'react-redux';
import { hasPrivilege } from '@/common/permissions/privileges';

export const useHasPrivilege = (priv) => {
  const userRoles = useSelector((s) => s.auth.user?.roles || []);
  return hasPrivilege(userRoles, priv);
};
