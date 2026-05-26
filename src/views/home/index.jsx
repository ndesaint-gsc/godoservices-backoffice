import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import { selectHasCustomer } from '@/common/features/customer/customerSlice';
import { getLandingRoute } from '@/common/router/getLandingRoute';

const Home = () => {
  const hasCustomer = useSelector(selectHasCustomer);
  const userRoles = useSelector((s) => s.auth.user?.roles || []);

  const target = getLandingRoute(userRoles, hasCustomer);

  useEffect(() => {
    if (target !== '/') return;
    const input = document.querySelector('input[aria-label="Buscar usuario"]');
    if (input) input.focus();
  }, [target]);

  if (target !== '/') return <Navigate to={target} replace />;

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
