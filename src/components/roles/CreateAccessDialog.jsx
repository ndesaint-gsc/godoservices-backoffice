import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import subscriptionsService from '@/services/subscriptions.service';
import rolesService from '@/services/roles.service';
import { sortByText } from '@/common/sort';

// Fecha mínima de vencimiento: mañana (igual que el Groovy, que usaba now + 1 día).
const tomorrowISO = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
};

// Diálogo "Crear acceso temporal".
// Form: select de rol (catálogo de roles temporales del EvolokConfig) + fecha de
// vencimiento. Envía con subscriptionsService.createRole(role, date, evUser):
//   POST /perfil/console/user/createRole?role=<role>&date=<yyyy-MM-dd>  body: evUser.
const CreateAccessDialog = ({ open, evUser, onClose, onCreated }) => {
  const { enqueueSnackbar } = useSnackbar();
  const minDate = tomorrowISO();

  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [catalogFailed, setCatalogFailed] = useState(false);
  const [manualRole, setManualRole] = useState(false);

  const [role, setRole] = useState('');
  const [date, setDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setRole('');
    setDate('');
    setManualRole(false);
    setCatalogFailed(false);
    let cancelled = false;
    setLoadingRoles(true);
    rolesService
      .getRoleCatalog()
      .then((catalog) => {
        if (cancelled) return;
        // El catálogo llega sin orden garantizado: orden alfabético por el texto del rol.
        setRoles(sortByText(catalog));
        // Si el catálogo viene vacío, caemos a input manual para no bloquear.
        if (!catalog.length) setManualRole(true);
      })
      .catch(() => {
        if (cancelled) return;
        setCatalogFailed(true);
        setManualRole(true);
      })
      .finally(() => {
        if (!cancelled) setLoadingRoles(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const canSubmit = role.trim() && date && date >= minDate && !saving && !loadingRoles;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    try {
      await subscriptionsService.createRole(role.trim(), date, evUser);
      enqueueSnackbar('Acceso temporal creado', { variant: 'success' });
      onCreated?.();
    } catch (error) {
      enqueueSnackbar('Error al crear el acceso: ' + error.message, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Crear acceso temporal</DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            {catalogFailed && (
              <Alert severity="warning" variant="outlined">
                No se pudo cargar el catálogo de roles. Introduce el rol manualmente.
              </Alert>
            )}

            {/* TODO: el catálogo se obtiene del EvolokConfig (tableRoles filtrados por
                roleTemporal). Si en el futuro hay un endpoint dedicado de roles
                asignables, sustituir rolesService.getRoleCatalog() por ese. */}
            {roles.length > 0 && (
              <FormControlLabel
                control={
                  <Switch
                    checked={manualRole}
                    onChange={(event) => {
                      setManualRole(event.target.checked);
                      setRole('');
                    }}
                  />
                }
                label="Introducir rol manualmente"
              />
            )}

            {manualRole ? (
              <TextField
                label="Rol"
                value={role}
                onChange={(event) => setRole(event.target.value)}
                required
                fullWidth
                placeholder="evolokRole"
              />
            ) : (
              <TextField
                select
                label="Rol"
                value={role}
                onChange={(event) => setRole(event.target.value)}
                required
                fullWidth
                disabled={loadingRoles}
                helperText={loadingRoles ? 'Cargando roles…' : ''}
              >
                {roles.map((roleName) => (
                  <MenuItem key={roleName} value={roleName}>
                    {roleName}
                  </MenuItem>
                ))}
              </TextField>
            )}

            <TextField
              label="Fecha de vencimiento"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: minDate }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={saving} color="inherit">
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!canSubmit}
            startIcon={saving ? <CircularProgress size={16} /> : null}
          >
            Crear
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default CreateAccessDialog;
