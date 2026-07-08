import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Box from '@mui/material/Box';

import Routes from '@/common/router/Routes';
import Nav from '@/components/common/nav';
import Topbar from '@/components/common/topbar';
import Main from '@/components/common/main';
import Modal from '@/components/common/modal';
import { selectCustomer, setCustomer } from '@/common/features/customer/customerSlice';
import { loadPermissions, logout } from '@/common/features/auth/authSlice';
import { selectPermissions, selectRole } from '@/common/permissions/permissions';
import { ConsoleProvider } from '@/edge-console-sdk/react';
import userService from '@/services/user.service';
import authService from '@/services/auth.service';
import { setOnUnauthorized } from '@/services/console';

function App() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);
  const persistedGuid = useSelector(selectCustomer)?.guid;
  const session = useSelector((s) => s.auth.session);
  const activeRole = useSelector((s) => s.auth.role);
  // Snapshot de permisos para el edge-console-sdk (los hooks useTabVisible/… lo leen del provider).
  const permissions = useSelector(selectPermissions);
  const role = useSelector(selectRole);
  const roles = useSelector((s) => s.auth.availableRoles) || (role ? [role] : []);

  useEffect(() => {
    setOnUnauthorized(() => dispatch(logout()));
  }, [dispatch]);

  // The customer is persisted (reload keeps it + renders instantly from the store),
  // but a persisted snapshot can be stale vs the backend. On load, refresh it from
  // /info so the store reflects live data. Pages only ever read the store.
  // Rol + permisos del operador desde el backend (registry por app). Al montar si ya estaba
  // autenticado y cuando isAuthenticated pasa a true tras el login.
  useEffect(() => {
    if (!isAuthenticated) return;
    if (session) authService.setSession(session);
    dispatch(loadPermissions(activeRole));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    if (isAuthenticated && persistedGuid) {
      userService.searchByEmail(persistedGuid).then((fresh) => {
        if (fresh) dispatch(setCustomer(fresh));
      });
    }
    // Run once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ConsoleProvider value={{ permissions, role, roles }}>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Nav />
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Topbar />
          <Main>
            <Routes />
          </Main>
        </Box>
        <Modal />
      </Box>
    </ConsoleProvider>
  );
}

export default App;
