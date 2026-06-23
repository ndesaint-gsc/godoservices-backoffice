import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { APP_ID, useActionAllowed } from '@/common/permissions/permissions';
import permissionsAdminService from '@/services/permissionsAdmin.service';

const FIELD_MODES = ['editable', 'viewable', 'hidden'];

// Copia editable de los permisos del rol seleccionado a partir del catálogo del backend.
const cloneRolePerms = (catalog, role) => {
  const perms = catalog?.permissions?.[role] || {};
  return {
    tabs: { ...(perms.tabs || {}) },
    actions: { ...(perms.actions || {}) },
    fields: { ...(perms.fields || {}) },
  };
};

const Permisos = () => {
  const { enqueueSnackbar } = useSnackbar();
  const canEdit = useActionAllowed('permisos.edit');

  const [catalog, setCatalog] = useState(null); // { roles, tabs, actions, fields, permissions }
  const [role, setRole] = useState('');
  const [draft, setDraft] = useState(null); // { tabs, actions, fields } del rol seleccionado
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async (keepRole) => {
    setLoading(true);
    try {
      const data = await permissionsAdminService.getAll(APP_ID);
      const selected = keepRole || data.roles?.[0] || '';
      setCatalog(data);
      setRole(selected);
      setDraft(cloneRolePerms(data, selected));
    } catch (error) {
      enqueueSnackbar('Error al cargar permisos: ' + (error?.message || ''), { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRoleChange = (newRole) => {
    setRole(newRole);
    setDraft(cloneRolePerms(catalog, newRole));
  };

  const setTab = (key, visible) =>
    setDraft((d) => ({ ...d, tabs: { ...d.tabs, [key]: visible ? 'visible' : 'hidden' } }));
  const setAction = (key, allowed) =>
    setDraft((d) => ({ ...d, actions: { ...d.actions, [key]: allowed ? 'allowed' : 'denied' } }));
  const setField = (key, mode) =>
    setDraft((d) => ({ ...d, fields: { ...d.fields, [key]: mode } }));

  const onSave = async () => {
    setSaving(true);
    try {
      await permissionsAdminService.save(APP_ID, role, draft);
      enqueueSnackbar('Permisos guardados (en memoria del backend)', { variant: 'success' });
      await load(role);
    } catch (error) {
      enqueueSnackbar('Error al guardar: ' + (error?.message || ''), { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !catalog || !draft) {
    return (
      <Box sx={{ p: 4 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
        <Typography variant="overline" color="text.secondary">
          Permisos
        </Typography>
        <Typography variant="h6" sx={{ mt: 0.25, mb: 0.5 }}>
          Editor de permisos por rol · {APP_ID}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {canEdit
            ? 'Los cambios se guardan en memoria del backend (se pierden al reiniciar).'
            : 'Modo lectura. No tienes permiso para editar permisos.'}
        </Typography>
        <Box sx={{ mt: 2, maxWidth: 280 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="role-label">Rol</InputLabel>
            <Select
              labelId="role-label"
              label="Rol"
              value={role}
              onChange={(event) => onRoleChange(event.target.value)}
            >
              {catalog.roles.map((r) => (
                <MenuItem key={r} value={r}>
                  {r}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          Tabs (visible / oculto)
        </Typography>
        <Stack>
          {catalog.tabs.map((key) => (
            <FormControlLabel
              key={key}
              control={
                <Switch
                  size="small"
                  color="secondary"
                  checked={draft.tabs[key] === 'visible'}
                  onChange={(event) => setTab(key, event.target.checked)}
                  disabled={!canEdit || saving}
                />
              }
              label={key}
            />
          ))}
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          Acciones (permitida / denegada)
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
          {catalog.actions.map((key) => (
            <FormControlLabel
              key={key}
              control={
                <Switch
                  size="small"
                  color="secondary"
                  checked={draft.actions[key] === 'allowed'}
                  onChange={(event) => setAction(key, event.target.checked)}
                  disabled={!canEdit || saving}
                />
              }
              label={key}
            />
          ))}
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          Datos (editable / lectura / oculto)
        </Typography>
        {catalog.fields.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Sin datos configurables.
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            {catalog.fields.map((key) => (
              <Box
                key={key}
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}
              >
                <Typography variant="body2">{key}</Typography>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <Select
                    value={draft.fields[key] || 'viewable'}
                    onChange={(event) => setField(key, event.target.value)}
                    disabled={!canEdit || saving}
                  >
                    {FIELD_MODES.map((mode) => (
                      <MenuItem key={mode} value={mode}>
                        {mode}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            ))}
          </Stack>
        )}

        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={onSave}
            disabled={!canEdit || saving}
            startIcon={saving ? <CircularProgress size={16} /> : null}
          >
            Guardar rol {role}
          </Button>
        </Box>
      </Paper>
    </Stack>
  );
};

export default Permisos;
