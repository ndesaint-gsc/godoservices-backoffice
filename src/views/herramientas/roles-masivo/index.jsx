import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Link,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import { useSnackbar } from 'notistack';
import { useHasPrivilege } from '@/common/permissions/useHasPrivilege';
import { useActionAllowed } from '@/common/permissions/permissions';
import { Priv } from '@/common/permissions/privileges';
import { sortByText } from '@/common/sort';
import rolesService from '@/services/roles.service';

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Fichero de ejemplo (una fila por GUID o por Email, sin cabecera — como espera el backend).
const EXAMPLE_ROWS = {
  guid: ['3fa85f64-5717-4562-b3fc-2c963f66afa6', '16fd2706-8baf-433b-82eb-8c7fada847da', '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'],
  email: ['usuario1@ejemplo.com', 'usuario2@ejemplo.com', 'usuario3@ejemplo.com'],
};

// Genera y descarga el CSV de ejemplo en cliente (sin depender de estáticos del tenant).
const downloadExample = (kind) => {
  const type = EXAMPLE_ROWS[kind] ? kind : 'email';
  const csv = EXAMPLE_ROWS[type].join('\r\n') + '\r\n';
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `roles-masivo-ejemplo-${type}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

// Contenido del fichero: cada fila es un GUID o un Email (igual que el select
// `contentOption` del backoffice antiguo).
const CONTENT_OPTIONS = [
  { value: 'guid', label: 'GUIDs' },
  { value: 'email', label: 'Emails' },
];

const RolesMasivo = () => {
  const { enqueueSnackbar } = useSnackbar();
  // Edición combinada con el gating por ACCIÓN (default-deny).
  const hasEditPriv = useHasPrivilege(Priv.EDIT_HERRAMIENTAS);
  const canRolesMasivo = useActionAllowed('herramientas.rolesMasivo');
  const canEdit = hasEditPriv && canRolesMasivo;

  const [csvFile, setCsvFile] = useState(null);
  const [email, setEmail] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [roleSelected, setRoleSelected] = useState('');
  const [contentOption, setContentOption] = useState('');

  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [catalogFailed, setCatalogFailed] = useState(false);
  const [manualRole, setManualRole] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!canEdit) return;
    let cancelled = false;
    setLoadingRoles(true);
    rolesService
      .getRoleCatalog()
      .then((catalog) => {
        if (cancelled) return;
        // Orden alfabético por el texto del rol (el backend no garantiza orden).
        setRoles(sortByText(catalog));
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
  }, [canEdit]);

  const datesValid = startDate && endDate && endDate >= startDate;
  const canSubmit =
    csvFile &&
    isValidEmail(email.trim()) &&
    datesValid &&
    roleSelected.trim() &&
    contentOption &&
    !uploading;

  const handleFileChange = (event) => {
    setCsvFile(event.target.files?.[0] || null);
  };

  const resetForm = () => {
    setCsvFile(null);
    setEmail('');
    setStartDate('');
    setEndDate('');
    setRoleSelected('');
    setContentOption('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('linkAssignRoleFile', csvFile);
      formData.append('email', email.trim());
      formData.append('startDate', startDate);
      formData.append('endDate', endDate);
      formData.append('roleSelected', roleSelected.trim());
      formData.append('contentOption', contentOption);
      await rolesService.assignMassive(formData);
      enqueueSnackbar(
        'Fichero enviado. Se procesará y recibirás el resultado por email.',
        { variant: 'success' },
      );
      resetForm();
    } catch (error) {
      enqueueSnackbar('Error al subir el fichero: ' + error.message, { variant: 'error' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="overline" color="text.secondary">
          Herramientas
        </Typography>
        <Typography variant="h4" sx={{ mt: 0.25 }}>
          Asignación masiva de roles
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Sube un CSV (UTF-8) con la lista de GUIDs o Emails. El proceso es asíncrono
          y el resultado se envía por email.
        </Typography>
      </Box>

      {!canEdit ? (
        <Alert severity="info" variant="outlined">
          No tienes permiso para esta acción.
        </Alert>
      ) : (
        <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 }, maxWidth: 520 }}>
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              {catalogFailed && (
                <Alert severity="warning" variant="outlined">
                  No se pudo cargar el catálogo de roles. Introduce el rol manualmente.
                </Alert>
              )}

              <Box>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<UploadFileIcon />}
                  disabled={uploading}
                >
                  Seleccionar CSV
                  <input type="file" accept=".csv" hidden onChange={handleFileChange} />
                </Button>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {csvFile ? csvFile.name : 'Ningún fichero seleccionado'}
                </Typography>
                <Link
                  component="button"
                  type="button"
                  onClick={() => downloadExample(contentOption)}
                  underline="hover"
                  sx={{ mt: 1, display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: '0.8125rem' }}
                >
                  <DownloadIcon fontSize="inherit" />
                  Descargar ejemplo ({contentOption === 'guid' ? 'GUIDs' : 'Emails'})
                </Link>
              </Box>

              <TextField
                label="Email para el resultado"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                fullWidth
                placeholder="ejemplo@correo.com"
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Fecha inicio"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Fecha fin"
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: startDate || undefined }}
                />
              </Stack>

              {/* Catálogo del EvolokConfig (tableRoles filtrados por roleTemporal). */}
              {manualRole ? (
                <TextField
                  label="Rol"
                  value={roleSelected}
                  onChange={(event) => setRoleSelected(event.target.value)}
                  required
                  fullWidth
                  placeholder="evolokRole"
                />
              ) : (
                <TextField
                  select
                  label="Rol"
                  value={roleSelected}
                  onChange={(event) => setRoleSelected(event.target.value)}
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
                select
                label="Contenido del fichero"
                value={contentOption}
                onChange={(event) => setContentOption(event.target.value)}
                required
                fullWidth
              >
                {CONTENT_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={!canSubmit}
                  startIcon={uploading ? <CircularProgress size={16} /> : null}
                >
                  Enviar
                </Button>
              </Box>
            </Stack>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default RolesMasivo;
