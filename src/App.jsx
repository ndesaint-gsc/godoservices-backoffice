import Box from '@mui/material/Box';

import Routes from '@/common/router/Routes';
import Nav from '@/components/common/nav';
import Topbar from '@/components/common/topbar';
import Main from '@/components/common/main';
import Modal from '@/components/common/modal';

function App() {
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
