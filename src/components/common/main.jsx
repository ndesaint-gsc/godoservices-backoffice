import { Box } from '@mui/material';

const Main = ({ children }) => (
  <Box
    component="main"
    sx={{
      flexGrow: 1,
      p: 3,
      minWidth: 0,
    }}
  >
    {children}
  </Box>
);

export default Main;
