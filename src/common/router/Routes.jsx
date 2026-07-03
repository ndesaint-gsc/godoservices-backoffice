import { useEffect, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import { Priv } from '@/common/permissions/privileges';
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

// Customer-scoped page: auth + READ privilege + a loaded customer.
const Scoped = ({ priv, children }) => (
  <AuthenticatedRoute requiredPrivilege={priv}>
    <RequireCustomer>{children}</RequireCustomer>
  </AuthenticatedRoute>
);

// Global tool page: auth + READ privilege, no customer needed.
const Global = ({ priv, children }) => (
  <AuthenticatedRoute requiredPrivilege={priv}>{children}</AuthenticatedRoute>
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

    <Route path="/datos" element={<Scoped priv={Priv.READ_DATOS}><Datos /></Scoped>} />

    <Route
      path="/suscripciones"
      element={<Navigate to="/suscripciones/digitales" replace />}
    />
    <Route path="/suscripciones/digitales" element={<Scoped priv={Priv.READ_SUSCRIPCIONES}><SuscDigitales /></Scoped>} />
    <Route path="/suscripciones/impresas" element={<Scoped priv={Priv.READ_SUSCRIPCIONES}><SuscImpresas /></Scoped>} />
    <Route path="/suscripciones/tienda" element={<Scoped priv={Priv.READ_SUSCRIPCIONES}><SuscTienda /></Scoped>} />
    <Route path="/suscripciones/accesos" element={<Scoped priv={Priv.READ_SUSCRIPCIONES}><SuscAccesos /></Scoped>} />
    <Route path="/suscripciones/crear" element={<Scoped priv={Priv.READ_SUSCRIPCIONES}><SuscCrear /></Scoped>} />

    <Route path="/notificaciones" element={<Scoped priv={Priv.READ_NOTIFICACIONES}><Notificaciones /></Scoped>} />
    <Route path="/facturacion" element={<Scoped priv={Priv.READ_FACTURACION}><Facturacion /></Scoped>} />

    <Route
      path="/herramientas"
      element={<Navigate to="/herramientas/crear-usuario" replace />}
    />
    <Route path="/herramientas/crear-usuario" element={<Global priv={Priv.READ_HERRAMIENTAS}><HtCrearUsuario /></Global>} />
    <Route path="/herramientas/nif-masivo" element={<Global priv={Priv.READ_HERRAMIENTAS}><HtNifMasivo /></Global>} />
    <Route path="/herramientas/roles-masivo" element={<Global priv={Priv.READ_HERRAMIENTAS}><HtRolesMasivo /></Global>} />
    <Route path="/herramientas/landings" element={<Global priv={Priv.READ_HERRAMIENTAS}><HtLandings /></Global>} />
    <Route path="/herramientas/retencion" element={<Global priv={Priv.READ_HERRAMIENTAS}><HtRetencion /></Global>} />
    <Route path="/herramientas/buscar-externalid" element={<Global priv={Priv.READ_HERRAMIENTAS}><HtBuscarExternalId /></Global>} />

    {/* Editor de permisos (meta): solo auth; el acceso real se gobierna por el tab 'permisos' (ADMIN). */}
    <Route path="/permisos" element={<AuthenticatedRoute><Permisos /></AuthenticatedRoute>} />
    {/* Admin de integración (consolas de la plataforma): gated por el tab 'integraciones'. */}
    <Route path="/integraciones" element={<AuthenticatedRoute><Integraciones /></AuthenticatedRoute>} />
    {/* Config técnica de la propia consola (god): gated por el tab 'configuracion'. */}
    <Route path="/configuracion" element={<AuthenticatedRoute><Configuracion /></AuthenticatedRoute>} />

    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRoutes;
