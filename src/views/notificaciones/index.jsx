import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  FormGroup,
  Paper,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { patchEvUser, selectCustomer } from '@/common/features/customer/customerSlice';
import { useHasPrivilege } from '@/common/permissions/useHasPrivilege';
import { useActionAllowed } from '@/common/permissions/permissions';
import { Priv } from '@/common/permissions/privileges';
import { sortByText } from '@/common/sort';
import notificationsService from '@/services/notifications.service';

// Etiqueta visible de un item de catálogo (name con fallback a id).
const catalogText = (item) => item?.name ?? String(item?.id ?? '');

// evUser boolean opt-ins -> label.
const OPT_INS = [
  { name: 'Optins', label: 'La Vanguardia' },
  { name: 'MDOptin', label: 'Mundo Deportivo' },
  { name: 'R1Optin', label: 'RAC1' },
  { name: 'ThirdPartyOptin', label: 'Terceras empresas' },
];

const toBoolean = (value) => value === true || value === 'true';

// evUser guarda newsletters/intereses como ids separados por '|'.
const splitIds = (value) => (value ? String(value).split('|').filter(Boolean) : []);

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

const sameIdSet = (firstIds, secondIds) =>
  firstIds.length === secondIds.length &&
  [...firstIds].sort().join('|') === [...secondIds].sort().join('|');

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

// Grupo editable de checkboxes desde un catálogo (id -> name), con selección marcada.
const CatalogCheckboxes = ({ catalog, selectedIds, onToggle, disabled, emptyText }) => {
  if (!catalog.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        {emptyText}
      </Typography>
    );
  }
  return (
    <FormGroup sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' } }}>
      {catalog.map((item) => (
        <FormControlLabel
          key={item.id}
          control={
            <Checkbox
              size="small"
              color="secondary"
              checked={selectedIds.includes(item.id)}
              onChange={() => onToggle(item.id)}
              disabled={disabled}
            />
          }
          label={item.name || item.id}
        />
      ))}
    </FormGroup>
  );
};

const Notificaciones = () => {
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const customer = useSelector(selectCustomer);
  const canEdit = useHasPrivilege(Priv.EDIT_NOTIFICACIONES);
  // Gating por ACCIÓN (default-deny): opt-ins y catálogo (newsletters/intereses) por separado.
  const canEditOptins = useActionAllowed('notificaciones.editOptins');
  const canEditCatalog = useActionAllowed('notificaciones.editCatalog');

  const customerData = customer?.raw;
  const evUser = customerData?.evUser || {};
  const currentNewsletters = splitIds(evUser.newsletters);
  const currentGenInterests = splitIds(evUser.genInterests);
  const editorialInterests = customerData?.editorialInterests || [];

  const [optIns, setOptIns] = useState(buildInitialOptIns(evUser));
  const [saving, setSaving] = useState(false);

  // Catálogos globales (EvolokConfig). Generales = category == null; el resto (sport/editorial)
  // se queda solo-lectura por inconsistencia legacy (el form guarda sportInterests pero el
  // dato leído es interests_editorial → no se puede pre-marcar de forma fiable).
  const [newslettersCatalog, setNewslettersCatalog] = useState([]);
  const [generalInterestsCatalog, setGeneralInterestsCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [selectedNewsletters, setSelectedNewsletters] = useState(currentNewsletters);
  const [selectedGenInterests, setSelectedGenInterests] = useState(currentGenInterests);
  const [savingCatalog, setSavingCatalog] = useState(false);

  // Re-sync de opt-ins y selección desde el store al cambiar de cliente / refetch.
  useEffect(() => {
    setOptIns(buildInitialOptIns(evUser));
    setSelectedNewsletters(splitIds(customerData?.evUser?.newsletters));
    setSelectedGenInterests(splitIds(customerData?.evUser?.genInterests));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerData]);

  // Carga de catálogos (una vez; son globales, no dependen del cliente).
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [newsletters, interests] = await Promise.all([
          notificationsService.getNewslettersCatalog(),
          notificationsService.getInterestsCatalog(),
        ]);
        if (!active) return;
        // El backend devuelve listas planas (ya deduplicadas). Las usamos directas.
        const allInterests = Array.isArray(interests) ? interests : [];
        setNewslettersCatalog(sortByText(Array.isArray(newsletters) ? newsletters : [], catalogText));
        setGeneralInterestsCatalog(
          sortByText(allInterests.filter((item) => item.category == null), catalogText),
        );
      } catch (error) {
        if (active) enqueueSnackbar('No se pudo cargar el catálogo: ' + readErrorMessage(error), { variant: 'error' });
      } finally {
        if (active) setCatalogLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!customerData) return null;

  const handleToggle = (optInName) => (event) =>
    setOptIns((previousOptIns) => ({ ...previousOptIns, [optInName]: event.target.checked }));

  const toggleId = (setter) => (id) =>
    setter((previous) =>
      previous.includes(id) ? previous.filter((value) => value !== id) : [...previous, id],
    );

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

  // Guarda newsletters + intereses generales (array de ids), solo los grupos que cambiaron.
  const handleSaveCatalog = async () => {
    const attributes = [];
    if (!sameIdSet(selectedNewsletters, currentNewsletters)) {
      attributes.push({ name: 'newsletters', value: selectedNewsletters });
    }
    if (!sameIdSet(selectedGenInterests, currentGenInterests)) {
      attributes.push({ name: 'genInterests', value: selectedGenInterests });
    }
    if (attributes.length === 0) {
      enqueueSnackbar('No hay cambios que guardar', { variant: 'info' });
      return;
    }
    setSavingCatalog(true);
    try {
      await notificationsService.updateAttributes(evUser.guid, attributes);
      // evUser guarda los ids como string separada por '|'.
      dispatch(
        patchEvUser({
          newsletters: selectedNewsletters.join('|'),
          genInterests: selectedGenInterests.join('|'),
        }),
      );
      enqueueSnackbar('Newsletters e intereses actualizados', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Error al guardar: ' + readErrorMessage(error), { variant: 'error' });
    } finally {
      setSavingCatalog(false);
    }
  };

  const catalogDirty =
    !sameIdSet(selectedNewsletters, currentNewsletters) ||
    !sameIdSet(selectedGenInterests, currentGenInterests);

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
              disabled={saving || !canEditOptins}
              startIcon={saving ? <CircularProgress size={16} /> : null}
            >
              Guardar cambios
            </Button>
          </Box>
        )}
      </Paper>

      {/* Newsletters + intereses generales (editables vía catálogo EvolokConfig). */}
      <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
        <Typography variant="overline" color="text.secondary">
          Newsletters
        </Typography>
        <Typography variant="h6" sx={{ mt: 0.25, mb: 1.5 }}>
          Suscripciones
        </Typography>
        {catalogLoading ? (
          <CircularProgress size={20} />
        ) : (
          <CatalogCheckboxes
            catalog={newslettersCatalog}
            selectedIds={selectedNewsletters}
            onToggle={toggleId(setSelectedNewsletters)}
            disabled={!canEdit || savingCatalog}
            emptyText="No hay catálogo de newsletters disponible."
          />
        )}

        <Typography variant="overline" color="text.secondary" sx={{ mt: 3, display: 'block' }}>
          Intereses
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600, mt: 1, mb: 0.5 }}>
          Generales
        </Typography>
        {catalogLoading ? (
          <CircularProgress size={20} />
        ) : (
          <CatalogCheckboxes
            catalog={generalInterestsCatalog}
            selectedIds={selectedGenInterests}
            onToggle={toggleId(setSelectedGenInterests)}
            disabled={!canEdit || savingCatalog}
            emptyText="No hay catálogo de intereses generales disponible."
          />
        )}

        <Typography variant="body2" sx={{ fontWeight: 600, mt: 2, mb: 0.5 }}>
          Editoriales
        </Typography>
        <SubscriptionChips items={editorialInterests} emptyText="Sin intereses editoriales." />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          Solo lectura: el dato leído (interests_editorial) no coincide con el atributo que
          edita el backoffice antiguo (sportInterests); pendiente de unificar para edición segura.
        </Typography>

        {canEdit && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleSaveCatalog}
              disabled={savingCatalog || catalogLoading || !catalogDirty || !canEditCatalog}
              startIcon={savingCatalog ? <CircularProgress size={16} /> : null}
            >
              Guardar cambios
            </Button>
          </Box>
        )}
      </Paper>
    </Stack>
  );
};

export default Notificaciones;
