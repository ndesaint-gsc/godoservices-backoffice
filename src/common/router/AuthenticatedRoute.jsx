import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { CircularProgress } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useEffect, useRef } from 'react';
import { useHasPrivilege } from '@/common/permissions/useHasPrivilege';
import { getLandingRoute } from '@/common/router/getLandingRoute';
import { selectHasCustomer } from '@/common/features/customer/customerSlice';

const AuthenticatedRoute = ({ children, requiredPrivilege }) => {
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  const { isAuthenticated, isLoading, user } = useSelector((state) => state.auth);
  const hasCustomer = useSelector(selectHasCustomer);
  const allowed = useHasPrivilege(requiredPrivilege);
  const notifiedRef = useRef(false);

  const shouldDeny = isAuthenticated && requiredPrivilege && !allowed;

  useEffect(() => {
    if (shouldDeny && !notifiedRef.current) {
      notifiedRef.current = true;
      enqueueSnackbar('No tienes permisos para acceder a esta vista', {
        variant: 'error',
      });
    }
  }, [shouldDeny, enqueueSnackbar]);

  if (isLoading) return <CircularProgress />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (shouldDeny) {
    return <Navigate to={getLandingRoute(user?.roles, hasCustomer)} replace />;
  }

  return children;
};

export default AuthenticatedRoute;
