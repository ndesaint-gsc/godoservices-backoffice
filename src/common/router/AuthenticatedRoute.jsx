import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { CircularProgress } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useEffect, useRef } from 'react';
import { useHasRoles } from '@/common/roles/useHasRoles';
import { getLandingRoute } from '@/common/router/getLandingRoute';
import { selectHasCustomer } from '@/common/features/customer/customerSlice';

const AuthenticatedRoute = ({ children, allowedRoles }) => {
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  const { isAuthenticated, isLoading, user } = useSelector((s) => s.auth);
  const hasCustomer = useSelector(selectHasCustomer);
  const allowed = useHasRoles(allowedRoles);
  const notifiedRef = useRef(false);

  const shouldDenyByRole =
    isAuthenticated && allowedRoles && allowedRoles.length > 0 && !allowed;

  useEffect(() => {
    if (shouldDenyByRole && !notifiedRef.current) {
      notifiedRef.current = true;
      enqueueSnackbar('No tienes permisos para acceder a esta vista', {
        variant: 'error',
      });
    }
  }, [shouldDenyByRole, enqueueSnackbar]);

  if (isLoading) return <CircularProgress />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (shouldDenyByRole) {
    return <Navigate to={getLandingRoute(user?.roles, hasCustomer)} replace />;
  }

  return children;
};

export default AuthenticatedRoute;
