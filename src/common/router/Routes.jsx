import { useEffect, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import AuthenticatedRoute from '@/common/router/AuthenticatedRoute';
import UnauthenticatedRoute from '@/common/router/UnauthenticatedRoute';
import { selectHasCustomer } from '@/common/features/customer/customerSlice';
import Login from '@/views/auth/login';
import Home from '@/views/home';
import NotFound from '@/views/notFound';
import Datos from '@/views/datos';
import SuscDigitales from '@/views/suscripciones/digitales';
import SuscImpresas from '@/views/suscripciones/impresas';
import SuscTienda from '@/views/suscripciones/tienda';
import SuscAccesos from '@/views/suscripciones/accesos';
import SuscCrear from '@/views/suscripciones/crear';
import Notificaciones from '@/views/notificaciones';
import Facturacion from '@/views/facturacion';
import HtCrearUsuario from '@/views/herramientas/crear-usuario';
import HtNifMasivo from '@/views/herramientas/nif-masivo';
import HtRolesMasivo from '@/views/herramientas/roles-masivo';
import HtLandings from '@/views/herramientas/landings';
import HtRetencion from '@/views/herramientas/retencion';
import HtBuscarExternalId from '@/views/herramientas/buscar-externalid';
import Permisos from '@/views/permisos';
import Integraciones from '@/views/integraciones';
import Configuracion from '@/views/configuracion';

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

// Customer-scoped page: auth + tab visible (rol activo) + a loaded customer.
const Scoped = ({ tab, children }) => (
  <AuthenticatedRoute requiredTab={tab}>
    <RequireCustomer>{children}</RequireCustomer>
  </AuthenticatedRoute>
);

// Global tool page: auth + tab visible (rol activo), no customer needed.
const Global = ({ tab, children }) => (
  <AuthenticatedRoute requiredTab={tab}>{children}</AuthenticatedRoute>
);

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
      path="/datos"
      element={
        <Scoped tab="datos">
          <Datos />
        </Scoped>
      }
    />

    <Route path="/suscripciones" element={<Navigate to="/suscripciones/digitales" replace />} />
    <Route
      path="/suscripciones/digitales"
      element={
        <Scoped tab="suscripciones">
          <SuscDigitales />
        </Scoped>
      }
    />
    <Route
      path="/suscripciones/impresas"
      element={
        <Scoped tab="suscripciones">
          <SuscImpresas />
        </Scoped>
      }
    />
    <Route
      path="/suscripciones/tienda"
      element={
        <Scoped tab="suscripciones">
          <SuscTienda />
        </Scoped>
      }
    />
    <Route
      path="/suscripciones/accesos"
      element={
        <Scoped tab="suscripciones">
          <SuscAccesos />
        </Scoped>
      }
    />
    <Route
      path="/suscripciones/crear"
      element={
        <Scoped tab="suscripciones">
          <SuscCrear />
        </Scoped>
      }
    />

    <Route
      path="/notificaciones"
      element={
        <Scoped tab="notificaciones">
          <Notificaciones />
        </Scoped>
      }
    />
    <Route
      path="/facturacion"
      element={
        <Scoped tab="facturacion">
          <Facturacion />
        </Scoped>
      }
    />

    <Route path="/herramientas" element={<Navigate to="/herramientas/crear-usuario" replace />} />
    <Route
      path="/herramientas/crear-usuario"
      element={
        <Global tab="herramientas">
          <HtCrearUsuario />
        </Global>
      }
    />
    <Route
      path="/herramientas/nif-masivo"
      element={
        <Global tab="herramientas">
          <HtNifMasivo />
        </Global>
      }
    />
    <Route
      path="/herramientas/roles-masivo"
      element={
        <Global tab="herramientas">
          <HtRolesMasivo />
        </Global>
      }
    />
    <Route
      path="/herramientas/landings"
      element={
        <Global tab="herramientas">
          <HtLandings />
        </Global>
      }
    />
    <Route
      path="/herramientas/retencion"
      element={
        <Global tab="herramientas">
          <HtRetencion />
        </Global>
      }
    />
    <Route
      path="/herramientas/buscar-externalid"
      element={
        <Global tab="herramientas">
          <HtBuscarExternalId />
        </Global>
      }
    />

    {/* Editor de permisos (meta): gated por el tab 'permisos' (ADMIN/GOD). */}
    <Route
      path="/permisos"
      element={
        <AuthenticatedRoute requiredTab="permisos">
          <Permisos />
        </AuthenticatedRoute>
      }
    />
    {/* Admin de integración (consolas de la plataforma): gated por el tab 'integraciones'. */}
    <Route
      path="/integraciones"
      element={
        <AuthenticatedRoute requiredTab="integraciones">
          <Integraciones />
        </AuthenticatedRoute>
      }
    />
    {/* Config técnica de la propia consola (god): gated por el tab 'configuracion'. */}
    <Route
      path="/configuracion"
      element={
        <AuthenticatedRoute requiredTab="configuracion">
          <Configuracion />
        </AuthenticatedRoute>
      }
    />

    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRoutes;
