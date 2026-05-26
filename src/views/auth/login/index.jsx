import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { loginUser } from '@/common/features/auth/authSlice';
import { getLandingRoute } from '@/common/router/getLandingRoute';
import { selectHasCustomer } from '@/common/features/customer/customerSlice';

const schema = yup.object({
  email: yup.string().required('El email es obligatorio').email('Email no válido'),
  password: yup.string().required('La contraseña es obligatoria').min(1),
});

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { isAuthenticated, isLoading, error, user } = useSelector((state) => state.auth);
  const hasCustomer = useSelector(selectHasCustomer);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getLandingRoute(user.roles, hasCustomer), { replace: true });
    }
  }, [isAuthenticated, user, hasCustomer, navigate]);

  useEffect(() => {
    if (error) {
      enqueueSnackbar(typeof error === 'string' ? error : 'Error al iniciar sesión', {
        variant: 'error',
      });
    }
  }, [error, enqueueSnackbar]);

  const onSubmit = (values) => {
    dispatch(loginUser(values));
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 400 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Iniciar sesión
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            MVP: el login acepta cualquier email/password.
          </Typography>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Stack spacing={2}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                autoComplete="email"
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
              />
              <TextField
                label="Contraseña"
                type="password"
                fullWidth
                autoComplete="current-password"
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={16} /> : null}
              >
                Entrar
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
