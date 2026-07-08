import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ContentCopy from '@mui/icons-material/ContentCopy';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Lock from '@mui/icons-material/Lock';
import Add from '@mui/icons-material/Add';
import { useSnackbar } from 'notistack';
import { useActionAllowed } from '@/common/permissions/permissions';
import { RESERVED_TABS, RESERVED_ACTIONS } from '@/edge-console-sdk';
import integrationsService from '@/services/integrations.service';
import permissionsAdminService from '@/services/permissionsAdmin.service';

// Config técnica de la propia consola (para el god): identificadores + apikey EN CLARO (para configurar
// el proxy) y el EDITOR DEL CATÁLOGO (tabs/acciones/datos) que define qué aparece en la vista de
// permisos. `permisos` y `configuracion` son tabs reservadas (siempre presentes, no borrables). El
// catálogo se guarda junto al mapa de roles/privilegios (mismo JSON por consola).
const ReadonlyField = ({ label, value, mono, copy, onCopy }) => (
  <TextField
    label={label}
    value={value || ''}
    fullWidth
    size="small"
    InputProps={{
      readOnly: true,
      sx: mono ? { fontFamily: 'monospace' } : undefined,
      endAdornment: copy ? (
        <InputAdornment position="end">
          <Tooltip title="Copiar">
            <IconButton size="small" onClick={onCopy} edge="end">
              <ContentCopy fontSize="small" />
            </IconButton>
          </Tooltip>
        </InputAdornment>
      ) : undefined,
    }}
  />
);

// Editor de una dimensión del catálogo (tabs / acciones / datos): chips ordenados alfabéticamente,
// las reservadas con candado (no borrables), alta con dedup.
const DimensionEditor = ({ label, help, items, reserved, canEdit, onAdd, onRemove }) => {
  const [value, setValue] = useState('');
  const reservedSet = new Set(reserved || []);
  const sorted = [...(items || [])].sort((a, b) => a.localeCompare(b));
  const add = () => {
    const v = value.trim();
    if (!v) return;
    onAdd(v);
    setValue('');
  };
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      {help && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          {help}
        </Typography>
      )}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1.5 }}>
        {sorted.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            Sin entradas.
          </Typography>
        )}
        {sorted.map((key) => {
          const isReserved = reservedSet.has(key);
          return (
            <Chip
              key={key}
              size="small"
              label={key}
              variant={isReserved ? 'filled' : 'outlined'}
              icon={isReserved ? <Lock sx={{ fontSize: 14 }} /> : undefined}
              onDelete={canEdit && !isReserved ? () => onRemove(key) : undefined}
              sx={{ fontFamily: 'monospace' }}
            />
          );
        })}
      </Box>
      {canEdit && (
        <Stack direction="row" spacing={1}>
          <TextField
            size="small"
            placeholder={`Nueva entrada de ${label.toLowerCase()}`}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                add();
              }
            }}
            sx={{ minWidth: 260 }}
          />
          <Button
            size="small"
            variant="outlined"
            startIcon={<Add />}
            onClick={add}
            disabled={!value.trim()}
          >
            Añadir
          </Button>
        </Stack>
      )}
    </Box>
  );
};

const Configuracion = () => {
  const { enqueueSnackbar } = useSnackbar();
  const canEditCatalog = useActionAllowed('permisos.edit');

  const [config, setConfig] = useState(null);
  const [catalog, setCatalog] = useState(null); // { tabs, actions, fields } (editable)
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [cfg, cat] = await Promise.all([
        integrationsService.myConfig(),
        permissionsAdminService.getCatalog(),
      ]);
      setConfig(cfg);
      setCatalog({
        tabs: cat?.tabs || [],
        actions: cat?.actions || [],
        fields: cat?.fields || [],
      });
    } catch (error) {
      enqueueSnackbar('Error al cargar la configuración: ' + (error?.message || ''), {
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copy = (text) => {
    if (navigator.clipboard) navigator.clipboard.writeText(text || '');
    enqueueSnackbar('Copiado al portapapeles', { variant: 'info' });
  };

  // Alta con dedup (no puede haber dos con el mismo nombre en la misma dimensión).
  const addKey = (dim, key) => {
    setCatalog((c) => {
      if (c[dim].includes(key)) {
        enqueueSnackbar(`«${key}» ya existe en ${dim}`, { variant: 'warning' });
        return c;
      }
      return { ...c, [dim]: [...c[dim], key] };
    });
  };
  const removeKey = (dim, key) =>
    setCatalog((c) => ({ ...c, [dim]: c[dim].filter((k) => k !== key) }));

  const onSaveCatalog = async () => {
    setSaving(true);
    try {
      await permissionsAdminService.setCatalog({
        tabs: catalog.tabs,
        actions: catalog.actions,
        fields: catalog.fields,
      });
      enqueueSnackbar('Catálogo guardado (en memoria del backend)', { variant: 'success' });
      await load();
    } catch (error) {
      enqueueSnackbar('Error al guardar el catálogo: ' + (error?.message || ''), {
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (!config) {
    return (
      <Paper variant="outlined" sx={{ p: 4 }}>
        <Typography variant="body2" color="text.secondary">
          No se pudo cargar la configuración de la consola.
        </Typography>
      </Paper>
    );
  }

  const apiKey = config.apiKey || '';
  const maskedKey = apiKey ? '•'.repeat(Math.min(apiKey.length, 32)) : '';

  return (
    <Stack spacing={3}>
      <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
        <Typography variant="overline" color="text.secondary">
          Configuración
        </Typography>
        <Typography variant="h6" sx={{ mt: 0.25, mb: 0.5 }}>
          Configuración técnica · {config.consoleId}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Identificadores, apikey y catálogo de permisos de tu consola.
        </Typography>
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          Identificadores
        </Typography>
        <Stack spacing={2}>
          <ReadonlyField
            label="consoleId"
            value={config.consoleId}
            mono
            copy
            onCopy={() => copy(config.consoleId)}
          />
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <ReadonlyField label="Producto" value={config.product} />
            <ReadonlyField label="Consola" value={config.appconsole} />
          </Stack>
          <ReadonlyField label="Prefijo de rol (Evolok)" value={config.rolePrefix} mono />
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <ReadonlyField
              label="Grupo Evolok del god"
              value={config.godGroup}
              mono
              copy
              onCopy={() => copy(config.godGroup)}
            />
            <ReadonlyField label="Email del god" value={config.godEmail} />
          </Stack>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          API key
        </Typography>
        <TextField
          label="API key"
          value={showKey ? apiKey : maskedKey}
          fullWidth
          size="small"
          InputProps={{
            readOnly: true,
            sx: { fontFamily: 'monospace' },
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title={showKey ? 'Ocultar' : 'Mostrar'}>
                  <IconButton size="small" onClick={() => setShowKey((s) => !s)} edge="end">
                    {showKey ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Copiar apikey">
                  <IconButton size="small" onClick={() => copy(apiKey)} edge="end">
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ),
          }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Trátala como un secreto. Se envía en la cabecera <code>X-Console-ApiKey</code> del plano
          admin.
        </Typography>
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Catálogo de permisos
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          Define las tabs, acciones y datos de esta consola. Es lo que aparece en la vista de
          Permisos. <code>permisos</code> y <code>configuracion</code> son reservadas (siempre
          presentes, no borrables). Sin duplicados. Se guarda junto al mapa de roles/privilegios.
          {!canEditCatalog && ' · Modo lectura (no tienes permiso para editar el catálogo).'}
        </Typography>
        <Stack spacing={2.5}>
          <DimensionEditor
            label="Tabs"
            help="Entradas de navegación (visible/oculto por rol)."
            items={catalog?.tabs}
            reserved={RESERVED_TABS}
            canEdit={canEditCatalog && !saving}
            onAdd={(k) => addKey('tabs', k)}
            onRemove={(k) => removeKey('tabs', k)}
          />
          <Divider />
          <DimensionEditor
            label="Acciones"
            help="Operaciones namespaced tab.accion (permitida/denegada por rol)."
            items={catalog?.actions}
            reserved={RESERVED_ACTIONS}
            canEdit={canEditCatalog && !saving}
            onAdd={(k) => addKey('actions', k)}
            onRemove={(k) => removeKey('actions', k)}
          />
          <Divider />
          <DimensionEditor
            label="Datos"
            help="Bloques de datos (editable/lectura/oculto por rol)."
            items={catalog?.fields}
            reserved={[]}
            canEdit={canEditCatalog && !saving}
            onAdd={(k) => addKey('fields', k)}
            onRemove={(k) => removeKey('fields', k)}
          />
        </Stack>
        {canEditCatalog && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={onSaveCatalog}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={16} /> : null}
              >
                Guardar catálogo
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Stack>
  );
};

export default Configuracion;
