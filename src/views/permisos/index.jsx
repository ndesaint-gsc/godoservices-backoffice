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
  TextField,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { APP_ID, useActionAllowed } from '@/common/permissions/permissions';
import { Naming } from '@/edge-console-sdk';
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
  const [rolesMeta, setRolesMeta] = useState({}); // name -> { prefixedName, description }
  const [role, setRole] = useState('');
  const [draft, setDraft] = useState(null); // { tabs, actions, fields } del rol seleccionado
  const [roleDesc, setRoleDesc] = useState(''); // descripción editable del rol seleccionado
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newRole, setNewRole] = useState(''); // rolename pelado (el backend le pone el prefijo Evolok)
  const [newRoleDesc, setNewRoleDesc] = useState(''); // descripción obligatoria del nuevo rol

  const load = async (keepRole) => {
    setLoading(true);
    try {
      const [data, roles] = await Promise.all([
        permissionsAdminService.getAll(),
        permissionsAdminService.listRoles(),
      ]);
      // Solo rolename pelado + descripción; el prefijo Evolok ({product}-{console}-) se oculta en JS.
      const meta = {};
      (roles || []).forEach((r) => {
        meta[r.name] = { description: r.description || '' };
      });
      const selected = keepRole || data.roles?.[0] || '';
      setCatalog(data);
      setRolesMeta(meta);
      setRole(selected);
      setDraft(cloneRolePerms(data, selected));
      setRoleDesc(meta[selected]?.description || '');
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

  const onRoleChange = (newSelected) => {
    setRole(newSelected);
    setDraft(cloneRolePerms(catalog, newSelected));
    setRoleDesc(rolesMeta[newSelected]?.description || '');
  };

  const setTab = (key, visible) =>
    setDraft((d) => ({ ...d, tabs: { ...d.tabs, [key]: visible ? 'visible' : 'hidden' } }));
  const setAction = (key, allowed) =>
    setDraft((d) => ({ ...d, actions: { ...d.actions, [key]: allowed ? 'allowed' : 'denied' } }));
  const setField = (key, mode) => setDraft((d) => ({ ...d, fields: { ...d.fields, [key]: mode } }));

  const onSave = async () => {
    setSaving(true);
    try {
      await permissionsAdminService.save(role, draft);
      enqueueSnackbar('Permisos guardados (en memoria del backend)', { variant: 'success' });
      await load(role);
    } catch (error) {
      enqueueSnackbar('Error al guardar: ' + (error?.message || ''), { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const onCreateRole = async () => {
    const name = newRole.trim();
    const description = newRoleDesc.trim();
    if (!name || !description) return; // descripción obligatoria
    setSaving(true);
    try {
      const created = await permissionsAdminService.createRole(name, description);
      enqueueSnackbar(`Rol creado: ${created?.name}`, { variant: 'success' });
      setNewRole('');
      setNewRoleDesc('');
      await load(created?.name);
    } catch (error) {
      enqueueSnackbar('Error al crear rol: ' + (error?.message || ''), { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const onSaveDesc = async () => {
    const description = roleDesc.trim();
    if (!description) return; // descripción obligatoria
    setSaving(true);
    try {
      await permissionsAdminService.updateRole(role, description);
      enqueueSnackbar('Descripción actualizada', { variant: 'success' });
      await load(role);
    } catch (error) {
      enqueueSnackbar('Error al actualizar descripción: ' + (error?.message || ''), {
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const onDeleteRole = async () => {
    if (!role) return;
    if (!window.confirm(`¿Borrar el rol ${role}? Se eliminan también sus privilegios.`)) return;
    setSaving(true);
    try {
      await permissionsAdminService.deleteRole(role);
      enqueueSnackbar(`Rol borrado: ${role}`, { variant: 'success' });
      await load();
    } catch (error) {
      enqueueSnackbar('Error al borrar rol: ' + (error?.message || ''), { variant: 'error' });
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
          Gestión de roles
        </Typography>

        {/* Alta de rol: nombre pelado + descripción (obligatoria). El backend crea el grupo Evolok
            {consoleId}-{ROL}. */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          sx={{ alignItems: 'flex-start' }}
        >
          <TextField
            size="small"
            label="Nuevo rol"
            value={newRole}
            onChange={(event) => setNewRole(event.target.value)}
            disabled={!canEdit || saving}
            inputProps={{ maxLength: Naming.MAX_ROLENAME }}
            helperText={`Máx. ${Naming.MAX_ROLENAME}`}
            sx={{ minWidth: 180 }}
          />
          <TextField
            size="small"
            label="Descripción (obligatoria)"
            value={newRoleDesc}
            onChange={(event) => setNewRoleDesc(event.target.value)}
            disabled={!canEdit || saving}
            required
            fullWidth
          />
          <Button
            variant="contained"
            onClick={onCreateRole}
            disabled={!canEdit || saving || !newRole.trim() || !newRoleDesc.trim()}
          >
            Añadir rol
          </Button>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {/* Descripción del rol seleccionado (editable, obligatoria) + baja. */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          sx={{ alignItems: 'flex-start' }}
        >
          <TextField
            size="small"
            label={`Descripción de ${role}`}
            value={roleDesc}
            onChange={(event) => setRoleDesc(event.target.value)}
            disabled={!canEdit || saving}
            required
            error={canEdit && !roleDesc.trim()}
            helperText={canEdit && !roleDesc.trim() ? 'La descripción es obligatoria' : ' '}
            fullWidth
          />
          <Button
            variant="outlined"
            onClick={onSaveDesc}
            disabled={!canEdit || saving || !roleDesc.trim()}
          >
            Guardar descripción
          </Button>
          <Button
            color="error"
            variant="outlined"
            onClick={onDeleteRole}
            disabled={!canEdit || saving}
          >
            Borrar rol
          </Button>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          Tabs (visible / oculto)
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
          {[...catalog.tabs]
            .sort((a, b) => a.localeCompare(b))
            .map((key) => (
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
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          Acciones (permitida / denegada)
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
          {[...catalog.actions]
            .sort((a, b) => a.localeCompare(b))
            .map((key) => (
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
          <Box
            sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 }}
          >
            {[...catalog.fields]
              .sort((a, b) => a.localeCompare(b))
              .map((key) => (
                <Box
                  key={key}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                  }}
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
          </Box>
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
