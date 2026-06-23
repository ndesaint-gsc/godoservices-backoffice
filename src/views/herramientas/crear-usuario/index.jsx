import { useContext, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useHasPrivilege } from '@/common/permissions/useHasPrivilege';
import { useActionAllowed } from '@/common/permissions/permissions';
import { Priv } from '@/common/permissions/privileges';
import { ModalContext } from '@/common/providers/ModalProvider';
import toolsService from '@/services/tools.service';

const BRANDS = [
  { value: 'LV', label: 'La Vanguardia' },
  { value: 'MD', label: 'Mundo Deportivo' },
  { value: 'R1', label: 'RAC1' },
];

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const readErrorMessage = (error) => {
  const rawMessage = error?.message || '';
  const jsonPart = rawMessage.slice(rawMessage.indexOf('{'));
  try {
    return JSON.parse(jsonPart).errorMessage || rawMessage;
  } catch {
    return rawMessage;
  }
};

const CrearUsuario = () => {
  const { enqueueSnackbar } = useSnackbar();
  const modal = useContext(ModalContext);
  // Edición combinada con el gating por ACCIÓN (default-deny). Ambos hooks se llaman
  // siempre (no en cortocircuito) para no romper el orden de hooks de React.
  const hasEditPriv = useHasPrivilege(Priv.EDIT_HERRAMIENTAS);
  const canCreateUser = useActionAllowed('herramientas.createUser');
  const canEdit = hasEditPriv && canCreateUser;

  const [email, setEmail] = useState('');
  const [brand, setBrand] = useState('LV');
  const [creating, setCreating] = useState(false);
  const [touched, setTouched] = useState(false);

  const emailError = touched && !isValidEmail(email.trim());

  const confirmCreate = (event) => {
    event.preventDefault();
    setTouched(true);
    if (!isValidEmail(email.trim())) return;
    modal.show({
      title: 'Crear usuario',
      content: `Se va a crear un nuevo usuario ${email.trim()} (${brand}). ¿Continuar?`,
      confirmText: 'Crear',
      onSubmit: async () => {
        setCreating(true);
        try {
          await toolsService.createUser({ email: email.trim(), brand });
          enqueueSnackbar('Usuario creado', { variant: 'success' });
          setEmail('');
          setBrand('LV');
          setTouched(false);
        } catch (error) {
          enqueueSnackbar('Error al crear usuario: ' + readErrorMessage(error), { variant: 'error' });
        } finally {
          setCreating(false);
        }
      },
    });
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="overline" color="text.secondary">
          Herramientas
        </Typography>
        <Typography variant="h4" sx={{ mt: 0.25 }}>
          Crear usuario
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Crea una cuenta nueva desde el backoffice.
        </Typography>
      </Box>

      {!canEdit ? (
        <Alert severity="info" variant="outlined">
          No tienes permiso para crear usuarios.
        </Alert>
      ) : (
        <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 }, maxWidth: 520 }}>
          <Box component="form" onSubmit={confirmCreate}>
            <Stack spacing={2.5}>
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onBlur={() => setTouched(true)}
                error={emailError}
                helperText={emailError ? 'Introduce un email válido' : ''}
                fullWidth
                autoFocus
                placeholder="ejemplo@correo.com"
              />
              <TextField
                select
                label="Marca"
                value={brand}
                onChange={(event) => setBrand(event.target.value)}
                fullWidth
              >
                {BRANDS.map((brandOption) => (
                  <MenuItem key={brandOption.value} value={brandOption.value}>
                    {brandOption.label}
                  </MenuItem>
                ))}
              </TextField>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={creating}
                  startIcon={creating ? <CircularProgress size={16} /> : null}
                >
                  Crear usuario
                </Button>
              </Box>
            </Stack>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default CrearUsuario;
