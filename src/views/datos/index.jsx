import { useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { useSnackbar } from 'notistack';
import { patchEvUser, selectCustomer, setCustomer } from '@/common/features/customer/customerSlice';
import { useHasPrivilege } from '@/common/permissions/useHasPrivilege';
import { useActionAllowed, useFieldMode } from '@/common/permissions/permissions';
import { Priv } from '@/common/permissions/privileges';
import { ModalContext } from '@/common/providers/ModalProvider';
import { GENDERS, LANGUAGES, COUNTRIES } from '@/common/profileOptions';
import userService from '@/services/user.service';
import datosService from '@/services/datos.service';

const formatTimestamp = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('es-ES');
};

const formatBool = (value) => {
  if (value === true) return 'true';
  if (value === false) return 'false';
  return '';
};

// birth_date is stored/validated as "YYYY/MM/DD HH:MM:SS". A native date input
// works in "YYYY-MM-DD", so convert both ways and keep form state in the
// backend format (so the changed-field diff compares correctly).
const toDateInputValue = (storedValue) =>
  storedValue ? String(storedValue).slice(0, 10).replace(/\//g, '-') : '';
const fromDateInputValue = (dateInputValue) =>
  dateInputValue ? dateInputValue.replace(/-/g, '/') + ' 00:00:00' : '';

// Pull a human-readable reason out of the backend error (validationErrors / errorMessage).
const readErrorMessage = (error) => {
  const rawMessage = error?.message || '';
  const jsonPart = rawMessage.slice(rawMessage.indexOf('{'));
  try {
    const parsed = JSON.parse(jsonPart);
    if (parsed.validationErrors?.length) {
      return parsed.validationErrors
        .map((validationError) => `${validationError.field}: ${validationError.message}`)
        .join('; ');
    }
    return parsed.errorMessage || rawMessage;
  } catch {
    return rawMessage;
  }
};

const ReadOnlyField = ({ label, value }) => (
  <TextField
    label={label}
    value={value ?? ''}
    disabled
    fullWidth
    size="small"
    InputLabelProps={{ shrink: true }}
  />
);

const StateChip = ({ state }) => {
  if (!state) return null;
  const isActive = String(state).toUpperCase() === 'ACTIVE';
  return (
    <Chip
      size="small"
      label={state}
      sx={{
        bgcolor: isActive ? 'success.light' : 'action.selected',
        color: isActive ? 'success.main' : 'text.secondary',
        fontWeight: 600,
      }}
    />
  );
};

const VerifiedBadge = ({ verified }) => {
  if (verified === true) {
    return (
      <Chip
        icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
        label="Verificado"
        size="small"
        sx={{ bgcolor: 'success.light', color: 'success.main', fontWeight: 600 }}
      />
    );
  }
  if (verified === false) {
    return (
      <Chip
        icon={<CancelIcon sx={{ fontSize: 16 }} />}
        label="No verificado"
        size="small"
        sx={{ bgcolor: 'error.light', color: 'error.main', fontWeight: 600 }}
      />
    );
  }
  return null;
};

const fieldGridStyles = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
  gap: 2.5,
  mt: 1.5,
};

// Editable personal-data fields: attribute name -> label. Saved as
// { attributes: [{name, value}] }.
const PERSONAL_FIELDS = [
  { name: 'first_name', label: 'Nombre' },
  { name: 'last_name_first', label: 'Primer apellido' },
  { name: 'last_name_second', label: 'Segundo apellido' },
  { name: 'birth_date', label: 'Fecha de nacimiento', type: 'date' },
  { name: 'gender', label: 'Sexo', type: 'select', options: GENDERS },
  { name: 'phone_number', label: 'Teléfono' },
  { name: 'language', label: 'Idioma', type: 'select', options: LANGUAGES },
  { name: 'address2_country', label: 'País', type: 'select', options: COUNTRIES },
  { name: 'address2_postcode', label: 'Código postal' },
];

const buildInitialForm = (evUser) =>
  PERSONAL_FIELDS.reduce(
    (form, field) => ({ ...form, [field.name]: evUser?.[field.name] ?? '' }),
    {},
  );

const Datos = () => {
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const modal = useContext(ModalContext);
  const customer = useSelector(selectCustomer);
  const canEdit = useHasPrivilege(Priv.EDIT_DATOS);
  // Gating por ACCIÓN desde el registry de permisos del backend (action[key] === 'allowed').
  // Patrón: cada botón comprueba su acción namespaced. (TODO: cablear el resto de vistas/acciones:
  // facturacion.substitute/rectify/negative/recalculate/fiscalEdit, suscripciones.*, notificaciones.*,
  // herramientas.* — mismas claves que ConsolePermissionsCatalog en el backend.)
  const canEditPersonal = useActionAllowed('datos.editPersonal');
  const canResetPassword = useActionAllowed('datos.resetPassword');
  const canSendVerification = useActionAllowed('datos.sendVerification');
  const canInvalidateCache = useActionAllowed('datos.invalidateCache');
  const canUnblock = useActionAllowed('datos.unblock');
  const canDelete = useActionAllowed('datos.delete');
  const canNifLink = useActionAllowed('datos.nifLink');
  const canNifUnlink = useActionAllowed('datos.nifUnlink');

  // Modo de campo (default-deny vía 'editable' por defecto del motor):
  // - personalData: 'editable' edita; 'viewable' solo-lectura sin botón guardar; 'hidden' oculta el bloque.
  // - identification: bloque read-only; 'hidden' oculta, cualquier otro valor ('editable'/'viewable') muestra.
  const personalDataMode = useFieldMode('datos.personalData');
  const identificationMode = useFieldMode('datos.identification');
  const personalReadOnly = personalDataMode !== 'editable';

  const customerData = customer?.raw;
  const evUser = customerData?.evUser || {};

  const [form, setForm] = useState(buildInitialForm(evUser));
  const [saving, setSaving] = useState(false);
  const [runningAction, setRunningAction] = useState(false);
  const [nifInput, setNifInput] = useState('');

  // Re-sync the form whenever the customer data changes — on customer switch
  // AND after a save/action refetch (setCustomer makes a new object), so the
  // fields reflect what's actually stored instead of going stale.
  useEffect(() => {
    setForm(buildInitialForm(evUser));
    setNifInput(evUser?.nif ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerData]);

  if (!customerData) return null;

  const refreshCustomer = async () => {
    const freshCustomer = await userService.searchByEmail(evUser.guid);
    if (freshCustomer) dispatch(setCustomer(freshCustomer));
  };

  const handleFieldChange = (fieldName) => (event) =>
    setForm((previousForm) => ({ ...previousForm, [fieldName]: event.target.value }));

  const handleSave = async () => {
    // Only send fields that actually changed.
    const changedFields = PERSONAL_FIELDS.filter(
      (field) => (form[field.name] ?? '') !== (evUser[field.name] ?? ''),
    );
    if (changedFields.length === 0) {
      enqueueSnackbar('No hay cambios que guardar', { variant: 'info' });
      return;
    }
    const attributes = changedFields.map((field) => ({ name: field.name, value: form[field.name] }));
    setSaving(true);
    try {
      await datosService.updateUser(evUser.guid, attributes);
      // Patch the store with exactly what was saved so it (and the persisted copy)
      // are correct without depending on a refetch that could race the backend.
      const savedValues = Object.fromEntries(
        changedFields.map((field) => [field.name, form[field.name]]),
      );
      dispatch(patchEvUser(savedValues));
      enqueueSnackbar('Datos actualizados', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Error al guardar: ' + readErrorMessage(error), { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const runCredentialAction = async (action, successMessage) => {
    setRunningAction(true);
    try {
      await action();
      enqueueSnackbar(successMessage, { variant: 'success' });
      await refreshCustomer();
    } catch (error) {
      enqueueSnackbar('Error: ' + readErrorMessage(error), { variant: 'error' });
    } finally {
      setRunningAction(false);
    }
  };

  const confirmDeleteUser = () => {
    modal.show({
      title: 'Eliminar usuario',
      content: `Vas a eliminar al usuario ${evUser.email_address || evUser.guid}. Esta acción no se puede deshacer. ¿Continuar?`,
      confirmText: 'Eliminar',
      variant: 'error',
      onSubmit: () => runCredentialAction(() => datosService.deleteUser(evUser), 'Usuario eliminado'),
    });
  };

  const renderEditableField = (field) => {
    if (field.type === 'date') {
      return (
        <TextField
          key={field.name}
          label={field.label}
          type="date"
          value={toDateInputValue(form[field.name])}
          onChange={(event) =>
            setForm((previousForm) => ({
              ...previousForm,
              [field.name]: fromDateInputValue(event.target.value),
            }))
          }
          disabled={!canEdit || saving || personalReadOnly}
          fullWidth
          size="small"
          InputLabelProps={{ shrink: true }}
        />
      );
    }
    if (field.type === 'select') {
      const valueInOptions = field.options.some((option) => option.value === form[field.name]);
      return (
        <TextField
          key={field.name}
          select
          label={field.label}
          value={valueInOptions ? form[field.name] : ''}
          onChange={handleFieldChange(field.name)}
          disabled={!canEdit || saving || personalReadOnly}
          fullWidth
          size="small"
          InputLabelProps={{ shrink: true }}
        >
          <MenuItem value="">
            <em>Seleccionar…</em>
          </MenuItem>
          {field.options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      );
    }
    return (
      <TextField
        key={field.name}
        label={field.label}
        value={form[field.name] ?? ''}
        onChange={handleFieldChange(field.name)}
        disabled={!canEdit || saving || personalReadOnly}
        fullWidth
        size="small"
        InputLabelProps={{ shrink: true }}
      />
    );
  };

  const hasAnyAuthProvider =
    customerData.hasEmail ||
    customerData.hasFacebook ||
    customerData.hasGoogle ||
    customerData.hasApple;

  return (
    <Stack spacing={3}>
      {/* Identity (read-only). Bloque read-only: 'hidden' lo oculta, el resto lo muestra. */}
      {identificationMode !== 'hidden' && (
      <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
          <Box>
            <Typography variant="overline" color="text.secondary">
              Usuario
            </Typography>
            <Typography variant="h5" sx={{ mt: 0.25 }}>
              {evUser.display_name || evUser.email_address || '—'}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <StateChip state={evUser.state} />
            <VerifiedBadge verified={evUser.email_verified} />
            {evUser.brand && (
              <Chip
                label={evUser.brand}
                size="small"
                variant="outlined"
                sx={{ fontWeight: 600, borderColor: 'divider' }}
              />
            )}
          </Stack>
        </Stack>

        <Typography variant="overline" color="text.secondary" sx={{ mt: 3, display: 'block' }}>
          Datos de identificación
        </Typography>
        <Box sx={fieldGridStyles}>
          <ReadOnlyField label="GUID" value={evUser.guid} />
          <ReadOnlyField label="UID" value={evUser.uid} />
          <ReadOnlyField label="Email" value={evUser.email_address} />
          <ReadOnlyField label="Username" value={evUser.display_name} />
          <ReadOnlyField label="Fecha de Registro (Evolok)" value={formatTimestamp(evUser.created)} />
          <ReadOnlyField
            label="Fecha de Registro (Legacy)"
            value={formatTimestamp(evUser.legacyRegistrationDate)}
          />
          <ReadOnlyField label="Estado Evolok" value={evUser.state} />
          <ReadOnlyField label="Verificado" value={formatBool(evUser.email_verified)} />
          <ReadOnlyField label="ID Tarjeta Club" value={evUser.fidelity_card_id} />
          <ReadOnlyField label="LV Consentimiento" value={evUser.LVConsent} />
          <ReadOnlyField label="MD Consentimiento" value={evUser.MDConsent} />
          <ReadOnlyField label="R1 Consentimiento" value={evUser.R1Consent} />
          <ReadOnlyField label="Brand" value={evUser.brand} />
        </Box>
      </Paper>
      )}

      {/* Personal data (editable with EDIT_DATOS). Modo de campo:
          'hidden' oculta el bloque; 'viewable' lo deja solo-lectura sin botón guardar. */}
      {personalDataMode !== 'hidden' && (
      <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
        <Typography variant="overline" color="text.secondary">
          Perfil del usuario
        </Typography>
        <Typography variant="h6" sx={{ mt: 0.25 }}>
          Datos personales
        </Typography>
        {(!canEdit || personalReadOnly) && (
          <Typography variant="caption" color="text.secondary">
            Modo lectura. No tienes permiso para editar.
          </Typography>
        )}
        <Box sx={fieldGridStyles}>{PERSONAL_FIELDS.map(renderEditableField)}</Box>
        {canEdit && !personalReadOnly && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving || !canEditPersonal}
              startIcon={saving ? <CircularProgress size={16} /> : null}
            >
              Guardar cambios
            </Button>
          </Box>
        )}
      </Paper>
      )}

      {/* Credentials */}
      <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
        <Typography variant="overline" color="text.secondary">
          Credenciales
        </Typography>
        <Typography variant="h6" sx={{ mt: 0.25, mb: 1.5 }}>
          Proveedores de autenticación
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          {customerData.hasEmail && <Chip size="small" label="Email" variant="outlined" />}
          {customerData.hasFacebook && <Chip size="small" label="Facebook" variant="outlined" />}
          {customerData.hasGoogle && <Chip size="small" label="Google" variant="outlined" />}
          {customerData.hasApple && <Chip size="small" label="Apple" variant="outlined" />}
          {!hasAnyAuthProvider && (
            <Typography variant="body2" color="text.secondary">
              No tiene cuenta social asociada
            </Typography>
          )}
        </Stack>

        <Divider sx={{ mb: 2 }} />

        {!canEdit ? (
          <Typography variant="caption" color="text.secondary">
            Modo lectura. No tienes permiso para ejecutar acciones.
          </Typography>
        ) : (
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            <Button
              variant="outlined"
              color="success"
              disabled={runningAction || !canResetPassword}
              onClick={() =>
                runCredentialAction(
                  () => datosService.resetPassword(evUser),
                  'Email de cambio de contraseña enviado',
                )
              }
            >
              Reenviar email de cambio contraseña
            </Button>
            <Button
              variant="outlined"
              color="success"
              disabled={runningAction || !canSendVerification}
              onClick={() =>
                runCredentialAction(
                  () => datosService.sendVerification(evUser),
                  'Email de verificación enviado',
                )
              }
            >
              Reenviar email de verificación
            </Button>
            <Button
              variant="outlined"
              disabled={runningAction || !canInvalidateCache}
              onClick={() =>
                runCredentialAction(() => datosService.invalidateCache(evUser.guid), 'Caché invalidada')
              }
            >
              Invalidar caché
            </Button>
            <Button
              variant="outlined"
              disabled={runningAction || !canUnblock}
              onClick={() =>
                runCredentialAction(() => datosService.unblockUser(evUser.guid), 'Usuario desbloqueado')
              }
            >
              Desbloquear usuario
            </Button>
            <Button variant="outlined" color="error" disabled={runningAction || !canDelete} onClick={confirmDeleteUser}>
              Eliminar usuario
            </Button>
          </Stack>
        )}
      </Paper>

      {/* NIF/NIE (vincular / desvincular) */}
      <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
        <Typography variant="overline" color="text.secondary">
          Identificación fiscal
        </Typography>
        <Typography variant="h6" sx={{ mt: 0.25, mb: 1.5 }}>
          NIF / NIE
        </Typography>
        {!canEdit ? (
          <Typography variant="caption" color="text.secondary">
            Modo lectura. No tienes permiso para ejecutar acciones.
          </Typography>
        ) : (
          <Stack direction="row" spacing={1.5} alignItems="flex-start" flexWrap="wrap" useFlexGap>
            <TextField
              label="NIF / NIE"
              value={nifInput}
              onChange={(event) => setNifInput(event.target.value)}
              disabled={runningAction}
              size="small"
              sx={{ minWidth: 240 }}
              InputLabelProps={{ shrink: true }}
            />
            <Button
              variant="outlined"
              color="success"
              disabled={runningAction || !nifInput.trim() || !canNifLink}
              onClick={() =>
                runCredentialAction(
                  () => datosService.linkNif(evUser.guid, nifInput.trim()),
                  'NIF vinculado',
                )
              }
            >
              Vincular
            </Button>
            <Button
              variant="outlined"
              color="error"
              disabled={runningAction || !canNifUnlink}
              onClick={() =>
                runCredentialAction(() => datosService.unlinkNif(evUser.guid), 'NIF desvinculado')
              }
            >
              Desvincular
            </Button>
          </Stack>
        )}
      </Paper>
    </Stack>
  );
};

export default Datos;
