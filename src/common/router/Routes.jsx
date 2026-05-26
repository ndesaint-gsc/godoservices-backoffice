import { useEffect, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import { Role } from '@/common/roles/role';
import AuthenticatedRoute from '@/common/router/AuthenticatedRoute';
import UnauthenticatedRoute from '@/common/router/UnauthenticatedRoute';
import { selectHasCustomer } from '@/common/features/customer/customerSlice';
import Login from '@/views/auth/login';
import Home from '@/views/home';
import Data from '@/views/data';
import Subscriptions from '@/views/subscriptions';
import Invoices from '@/views/invoices';
import NotFound from '@/views/notFound';

const RequireCustomer = ({ children }) => {
  const hasCustomer = useSelector(selectHasCustomer);
  const { enqueueSnackbar } = useSnackbar();
  const notified = useRef(false);
  useEffect(() => {
    if (!hasCustomer && !notified.current) {
      notified.current = true;
      enqueueSnackbar('Busca un usuario primero', { variant: 'info' });
    }
  }, [hasCustomer, enqueueSnackbar]);
  if (!hasCustomer) return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => (
  <Routes>
    <Route
      path="/login"
      element={
        <UnauthenticatedRoute>
          <Login />
        </UnauthenticatedRoute>
      }
    />
    <Route
      path="/"
      element={
        <AuthenticatedRoute>
          <Home />
        </AuthenticatedRoute>
      }
    />
    <Route
      path="/data"
      element={
        <AuthenticatedRoute
          allowedRoles={[
            Role.Viewer,
            Role.FinanceViewer,
            Role.FinanceEditor,
            Role.Manager,
            Role.Admin,
          ]}
        >
          <RequireCustomer>
            <Data />
          </RequireCustomer>
        </AuthenticatedRoute>
      }
    />
    <Route
      path="/subscriptions"
      element={
        <AuthenticatedRoute
          allowedRoles={[
            Role.FinanceViewer,
            Role.FinanceEditor,
            Role.Manager,
            Role.Admin,
          ]}
        >
          <RequireCustomer>
            <Subscriptions />
          </RequireCustomer>
        </AuthenticatedRoute>
      }
    />
    <Route
      path="/invoices"
      element={
        <AuthenticatedRoute
          allowedRoles={[
            Role.FinanceViewer,
            Role.FinanceEditor,
            Role.Manager,
            Role.Admin,
          ]}
        >
          <RequireCustomer>
            <Invoices />
          </RequireCustomer>
        </AuthenticatedRoute>
      }
    />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRoutes;
