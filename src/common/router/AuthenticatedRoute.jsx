import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { CircularProgress } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useEffect, useRef } from 'react';
import { useTabVisible } from '@/common/permissions/permissions';

// Requires auth and, if `requiredTab` is set, that tab visible for the active role. Denied → home.
const AuthenticatedRoute = ({ children, requiredTab }) => {
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  const { isAuthenticated, isLoading } = useSelector((state) => state.auth);
  const tabVisible = useTabVisible(requiredTab);
  const notifiedRef = useRef(false);

  const shouldDeny = isAuthenticated && requiredTab && !tabVisible;

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
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AuthenticatedRoute;
