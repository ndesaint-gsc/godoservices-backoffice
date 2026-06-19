import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { patchEvUser, selectCustomer } from '@/common/features/customer/customerSlice';
import { useHasPrivilege } from '@/common/permissions/useHasPrivilege';
import { Priv } from '@/common/permissions/privileges';
import notificationsService from '@/services/notifications.service';

// evUser boolean opt-ins -> label.
const OPT_INS = [
  { name: 'Optins', label: 'La Vanguardia' },
  { name: 'MDOptin', label: 'Mundo Deportivo' },
  { name: 'R1Optin', label: 'RAC1' },
  { name: 'ThirdPartyOptin', label: 'Terceras empresas' },
];

const toBoolean = (value) => value === true || value === 'true';

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

const buildInitialOptIns = (evUser) =>
  OPT_INS.reduce((optIns, optIn) => ({ ...optIns, [optIn.name]: toBoolean(evUser?.[optIn.name]) }), {});

const SubscriptionChips = ({ items, emptyText }) => {
  if (!items.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        {emptyText}
      </Typography>
    );
  }
  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      {items.map((item) => {
        const label = typeof item === 'string' ? item : item.name || item.id;
        return <Chip key={label} label={label} size="small" variant="outlined" />;
      })}
    </Stack>
  );
};

const Notificaciones = () => {
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const customer = useSelector(selectCustomer);
  const canEdit = useHasPrivilege(Priv.EDIT_NOTIFICACIONES);

  const customerData = customer?.raw;
  const evUser = customerData?.evUser || {};
  const newsletters = customerData?.newsletters || [];
  const generalInterests = customerData?.genInterests || [];
  const editorialInterests = customerData?.editorialInterests || [];

  const [optIns, setOptIns] = useState(buildInitialOptIns(evUser));
  const [saving, setSaving] = useState(false);

  // Re-sync from the store on customer change / post-save refetch.
  useEffect(() => {
    setOptIns(buildInitialOptIns(evUser));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerData]);

  if (!customerData) return null;

  const handleToggle = (optInName) => (event) =>
    setOptIns((previousOptIns) => ({ ...previousOptIns, [optInName]: event.target.checked }));

  const handleSave = async () => {
    const changedOptIns = OPT_INS.filter(
      (optIn) => optIns[optIn.name] !== toBoolean(evUser[optIn.name]),
    );
    if (changedOptIns.length === 0) {
      enqueueSnackbar('No hay cambios que guardar', { variant: 'info' });
      return;
    }
    const attributes = changedOptIns.map((optIn) => ({ name: optIn.name, value: optIns[optIn.name] }));
    setSaving(true);
    try {
      await notificationsService.updateAttributes(evUser.guid, attributes);
      const savedValues = Object.fromEntries(
        changedOptIns.map((optIn) => [optIn.name, optIns[optIn.name]]),
      );
      dispatch(patchEvUser(savedValues));
      enqueueSnackbar('Notificaciones actualizadas', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Error al guardar: ' + readErrorMessage(error), { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack spacing={3}>
      {/* Notification opt-ins (editable) */}
      <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
        <Typography variant="overline" color="text.secondary">
          Notificaciones
        </Typography>
        <Typography variant="h6" sx={{ mt: 0.25, mb: 1 }}>
          Permisos de comunicación
        </Typography>
        {!canEdit && (
          <Typography variant="caption" color="text.secondary">
            Modo lectura. No tienes permiso para editar.
          </Typography>
        )}
        <Stack sx={{ mt: 1 }}>
          {OPT_INS.map((optIn) => (
            <FormControlLabel
              key={optIn.name}
              control={
                <Switch
                  checked={!!optIns[optIn.name]}
                  onChange={handleToggle(optIn.name)}
                  disabled={!canEdit || saving}
                  color="secondary"
                />
              }
              label={optIn.label}
            />
          ))}
        </Stack>
        {canEdit && (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={16} /> : null}
            >
              Guardar cambios
            </Button>
          </Box>
        )}
      </Paper>

      {/* Newsletters + Interests — current subscriptions (read-only until the
          EvolokConfig catalog is exposed as JSON for full edit). */}
      <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
        <Typography variant="overline" color="text.secondary">
          Newsletters
        </Typography>
        <Typography variant="h6" sx={{ mt: 0.25, mb: 1.5 }}>
          Suscripciones actuales
        </Typography>
        <SubscriptionChips items={newsletters} emptyText="Sin newsletters suscritas." />

        <Typography variant="overline" color="text.secondary" sx={{ mt: 3, display: 'block' }}>
          Intereses
        </Typography>
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Generales
          </Typography>
          <SubscriptionChips items={generalInterests} emptyText="Sin intereses generales." />
          <Typography variant="body2" sx={{ fontWeight: 600, mt: 2, mb: 0.5 }}>
            Editoriales
          </Typography>
          <SubscriptionChips items={editorialInterests} emptyText="Sin intereses editoriales." />
        </Box>

        <Alert severity="info" variant="outlined" sx={{ mt: 3 }}>
          La edición de newsletters e intereses requiere el catálogo de EvolokConfig
          como JSON (pendiente). De momento se muestran las suscripciones actuales.
        </Alert>
      </Paper>
    </Stack>
  );
};

export default Notificaciones;
