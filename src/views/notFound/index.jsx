import { Link as RouterLink } from 'react-router-dom';
import { Box, Link, Typography } from '@mui/material';

const NotFound = () => (
  <Box sx={{ textAlign: 'center', mt: 8 }}>
    <Typography variant="h3" gutterBottom>
      404
    </Typography>
    <Typography sx={{ mb: 2 }}>Página no encontrada</Typography>
    <Link component={RouterLink} to="/home">
      Volver al inicio
    </Link>
  </Box>
);

export default NotFound;
