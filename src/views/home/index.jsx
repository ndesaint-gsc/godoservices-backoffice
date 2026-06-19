import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import { selectHasCustomer } from '@/common/features/customer/customerSlice';
import { getLandingRoute } from '@/common/router/getLandingRoute';

const Home = () => {
  const hasCustomer = useSelector(selectHasCustomer);
  const userRoles = useSelector((state) => state.auth.user?.roles || []);

  const landingRoute = getLandingRoute(userRoles, hasCustomer);

  useEffect(() => {
    if (landingRoute !== '/') return;
    const searchInput = document.querySelector('input[aria-label="Buscar usuario"]');
    if (searchInput) searchInput.focus();
  }, [landingRoute]);

  if (landingRoute !== '/') return <Navigate to={landingRoute} replace />;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        gap: 1.5,
      }}
    >
      <PersonSearchIcon sx={{ fontSize: 72, color: 'text.disabled' }} />
      <Typography variant="h4">
        {hasCustomer
          ? 'Tu rol no permite ver los datos de este usuario'
          : 'Busca un usuario para empezar'}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
        {hasCustomer
          ? 'Cambia de rol o de usuario desde la barra superior.'
          : 'Escribe un UID, email, username o ID de cliente en la barra superior.'}
      </Typography>
    </Box>
  );
};

export default Home;
