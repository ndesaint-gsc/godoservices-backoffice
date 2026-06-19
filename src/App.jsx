import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Box from '@mui/material/Box';

import Routes from '@/common/router/Routes';
import Nav from '@/components/common/nav';
import Topbar from '@/components/common/topbar';
import Main from '@/components/common/main';
import Modal from '@/components/common/modal';
import { selectCustomer, setCustomer } from '@/common/features/customer/customerSlice';
import userService from '@/services/user.service';

function App() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);
  const persistedGuid = useSelector(selectCustomer)?.guid;

  // The customer is persisted (reload keeps it + renders instantly from the store),
  // but a persisted snapshot can be stale vs the backend. On load, refresh it from
  // /info so the store reflects live data. Pages only ever read the store.
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
  );
}

export default App;
