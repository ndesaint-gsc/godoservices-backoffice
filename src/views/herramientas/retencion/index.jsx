import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useHasPrivilege } from '@/common/permissions/useHasPrivilege';
import { useActionAllowed } from '@/common/permissions/permissions';
import { Priv } from '@/common/permissions/privileges';
import retentionService from '@/services/retention.service';
import { RETENTION_TYPES, itemsForType } from '@/components/retention/retentionTypes';
import RetentionVideoForm from '@/components/retention/RetentionVideoForm';
import RetentionContentTable from '@/components/retention/RetentionContentTable';

const TENANTS = [
  { value: 'LV', label: 'La Vanguardia' },
  { value: 'MD', label: 'Mundo Deportivo' },
  { value: 'R1', label: 'RAC1' },
];

const TYPE_ORDER = ['OFFER', 'ARTICLE', 'FEATURE', 'SECTION'];

const HtRetencion = () => {
  const { enqueueSnackbar } = useSnackbar();
  const canRead = useHasPrivilege(Priv.READ_HERRAMIENTAS);
  // Edición (vídeo/imagen/contenido) combinada con el gating por ACCIÓN (default-deny).
  const hasEditPriv = useHasPrivilege(Priv.EDIT_HERRAMIENTAS);
  const canRetentionEdit = useActionAllowed('herramientas.retentionEdit');
  const canEdit = hasEditPriv && canRetentionEdit;

  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState('LV');
  const [tab, setTab] = useState(0);

  const load = () => {
    setLoading(true);
    return retentionService
      .getConfig(false)
      .then((data) => setConfig(data || null))
      .catch((error) => {
        setConfig(null);
        enqueueSnackbar('Error al cargar la configuración de retención: ' + error.message, {
          variant: 'error',
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!canRead) {
      setLoading(false);
      return undefined;
    }
    let active = true;
    setLoading(true);
    retentionService
      .getConfig(false)
      .then((data) => active && setConfig(data || null))
      .catch((error) => {
        if (!active) return;
        setConfig(null);
        enqueueSnackbar('Error al cargar la configuración de retención: ' + error.message, {
          variant: 'error',
        });
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canRead]);

  // Config del tenant seleccionado dentro del Map<Tenants, Config>.
  const tenantConfig = useMemo(() => config?.config?.[tenant] || null, [config, tenant]);
  const activeType = RETENTION_TYPES[TYPE_ORDER[tab]];
  const activeItems = useMemo(
    () => (tenantConfig ? itemsForType(tenantConfig, activeType) : []),
    [tenantConfig, activeType],
  );

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="overline" color="text.secondary">
          Herramientas
        </Typography>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.25 }}>
          <Typography variant="h4">Configuración de retención</Typography>
          {config?.environment ? (
            <Chip size="small" label={config.environment} variant="outlined" />
          ) : null}
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Ofertas, artículos, features, secciones, vídeo e imágenes de la landing de retención por
          marca.
        </Typography>
      </Box>

      {!canRead ? (
        <Alert severity="info" variant="outlined">
          No tienes permiso para ver esta sección.
        </Alert>
      ) : loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 6 }}>
          <CircularProgress size={28} />
        </Box>
      ) : !config ? (
        <Alert severity="warning" variant="outlined">
          No se ha podido cargar la configuración de retención.
        </Alert>
      ) : (
        <Stack spacing={3}>
          <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3 } }}>
            <TextField
              select
              label="Marca"
              value={tenant}
              onChange={(event) => setTenant(event.target.value)}
              sx={{ minWidth: 240 }}
            >
              {TENANTS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Paper>

          {!tenantConfig ? (
            <Alert severity="info" variant="outlined">
              No hay configuración de retención para {tenant}.
            </Alert>
          ) : (
            <>
              <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3 } }}>
                <Typography variant="h6" sx={{ mb: 1.5 }}>
                  Vídeo
                </Typography>
                <RetentionVideoForm
                  tenant={tenant}
                  currentUrl={tenantConfig.video?.url}
                  canEdit={canEdit}
                  onSaved={load}
                />
              </Paper>

              <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3 } }}>
                <Tabs
                  value={tab}
                  onChange={(event, value) => setTab(value)}
                  sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
                >
                  {TYPE_ORDER.map((typeKey) => (
                    <Tab key={typeKey} label={RETENTION_TYPES[typeKey].label} />
                  ))}
                </Tabs>
                <RetentionContentTable
                  key={`${tenant}-${activeType.apiType}`}
                  typeDef={activeType}
                  items={activeItems}
                  tenant={tenant}
                  canEdit={canEdit}
                  onSaved={load}
                />
                {!canEdit ? (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
                    Solo lectura: no tienes permiso de edición.
                  </Typography>
                ) : null}
              </Paper>
            </>
          )}
        </Stack>
      )}
    </Box>
  );
};

export default HtRetencion;
