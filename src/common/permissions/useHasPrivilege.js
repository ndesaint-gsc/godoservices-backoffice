import { useSelector } from 'react-redux';
import { hasPrivilege } from '@/common/permissions/privileges';

export const useHasPrivilege = (privilege) => {
  const userRoles = useSelector((state) => state.auth.user?.roles || []);
  return hasPrivilege(userRoles, privilege);
};
