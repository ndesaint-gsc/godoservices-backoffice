import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ContentCopy from '@mui/icons-material/ContentCopy';
import Delete from '@mui/icons-material/Delete';
import Edit from '@mui/icons-material/Edit';
import Check from '@mui/icons-material/Check';
import Close from '@mui/icons-material/Close';
import Autorenew from '@mui/icons-material/Autorenew';
import { useSnackbar } from 'notistack';
import { useActionAllowed } from '@/common/permissions/permissions';
import { Naming } from '@/console-sdk';
import integrationsService from '@/services/integrations.service';

// Generador de apikey (cliente): 32 hex, como la del backend. El backend la guarda tal cual.
const genApiKey = () => {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID().replace(/-/g, '');
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
};

// Admin de integración (consola mentor): alta/baja/lista de consolas de la plataforma. Cada consola
// tiene un god (rol {consoleId}-god) con acceso total, al que se asigna un email. La apikey se genera
// en el alta y se muestra UNA sola vez (luego va enmascarada). Gated por tab/acciones `integraciones.*`.
const Integraciones = () => {
  const { enqueueSnackbar } = useSnackbar();
  const canCreate = useActionAllowed('integraciones.create');
  const canEdit = useActionAllowed('integraciones.edit');
  const canDelete = useActionAllowed('integraciones.delete');

  const [consoles, setConsoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState('');
  const [consoleName, setConsoleName] = useState('');
  const [godEmail, setGodEmail] = useState('');
  const [created, setCreated] = useState(null); // { consoleId, godGroup, apiKey } — apikey en claro, una vez
  const [editingId, setEditingId] = useState(null); // consoleId en edición
  const [editDraft, setEditDraft] = useState(null); // { product, console, godEmail, apiKey }

  // Validez de los ids (espejo de ConsoleNaming): charset minúsculas+dígitos y longitud máx.
  const productOk = !product.trim() || Naming.ID_RE.test(product.trim());
  const consoleOk = !consoleName.trim() || Naming.ID_RE.test(consoleName.trim());
  const formValid =
    productOk && consoleOk && product.trim() && consoleName.trim() && godEmail.trim();

  // Validez del borrador de edición.
  const editProductOk = editDraft && Naming.ID_RE.test((editDraft.product || '').trim());
  const editConsoleOk = editDraft && Naming.ID_RE.test((editDraft.console || '').trim());
  const editValid = editProductOk && editConsoleOk && editDraft?.godEmail?.trim();

  const load = async () => {
    setLoading(true);
    try {
      setConsoles(await integrationsService.listConsoles());
    } catch (error) {
      enqueueSnackbar('Error al cargar consolas: ' + (error?.message || ''), { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copy = (text) => {
    if (navigator.clipboard) navigator.clipboard.writeText(text);
    enqueueSnackbar('Copiado al portapapeles', { variant: 'info' });
  };

  const onCreate = async () => {
    const p = product.trim();
    const c = consoleName.trim();
    const email = godEmail.trim();
    if (!p || !c || !email) return; // product, console y godEmail obligatorios
    setSaving(true);
    try {
      const res = await integrationsService.createConsole(p, c, email);
      setCreated(res);
      enqueueSnackbar(`Consola creada: ${res?.consoleId}`, { variant: 'success' });
      setProduct('');
      setConsoleName('');
      setGodEmail('');
      await load();
    } catch (error) {
      enqueueSnackbar('Error al crear consola: ' + (error?.message || ''), { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (consoleId) => {
    if (!window.confirm(`¿Borrar la consola ${consoleId}?`)) return;
    setSaving(true);
    try {
      await integrationsService.removeConsole(consoleId);
      enqueueSnackbar(`Consola borrada: ${consoleId}`, { variant: 'success' });
      await load();
    } catch (error) {
      enqueueSnackbar('Error al borrar consola: ' + (error?.message || ''), { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (c) => {
    setEditingId(c.consoleId);
    // apiKey vacío = conservar la actual (no se recupera la real, va enmascarada en la lista).
    setEditDraft({ product: c.product, console: c.appconsole, godEmail: c.godEmail || '', apiKey: '' });
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft(null);
  };
  const setDraft = (key, value) => setEditDraft((d) => ({ ...d, [key]: value }));

  const onSaveEdit = async () => {
    if (!editValid) return;
    setSaving(true);
    try {
      const res = await integrationsService.updateConsole(editingId, {
        product: editDraft.product.trim(),
        console: editDraft.console.trim(),
        godEmail: editDraft.godEmail.trim(),
        apiKey: editDraft.apiKey.trim(), // vacío = sin cambios
      });
      enqueueSnackbar(`Consola actualizada: ${res?.consoleId || editingId}`, { variant: 'success' });
      cancelEdit();
      await load();
    } catch (error) {
      enqueueSnackbar('Error al actualizar consola: ' + (error?.message || ''), { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
        <Typography variant="overline" color="text.secondary">
          Integraciones
        </Typography>
        <Typography variant="h6" sx={{ mt: 0.25, mb: 0.5 }}>
          Consolas de la plataforma
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Alta/baja de consolas (producto + consola). Cada una tiene un administrador «god» (email +
          rol reservado con acceso total) y una apikey generada. Cambios en memoria del backend.
        </Typography>
      </Paper>

      {created && (
        <Alert severity="success" onClose={() => setCreated(null)}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Consola «{created.consoleId}» creada. Guarda la apikey — no se vuelve a mostrar.
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <TextField
              size="small"
              label="API key"
              value={created.apiKey || ''}
              InputProps={{ readOnly: true }}
              sx={{ minWidth: 340, fontFamily: 'monospace' }}
            />
            <Tooltip title="Copiar apikey">
              <IconButton onClick={() => copy(created.apiKey)} size="small">
                <ContentCopy fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <Typography variant="caption" color="text.secondary">
            Grupo Evolok del god: <code>{created.godGroup}</code>
          </Typography>
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          Nueva consola
        </Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ alignItems: 'flex-start' }}>
          <TextField
            size="small"
            label="Producto"
            placeholder="p.ej. welcome"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            disabled={!canCreate || saving}
            inputProps={{ maxLength: Naming.MAX_PRODUCT }}
            error={!productOk}
            helperText={!productOk ? 'Minúsculas y dígitos, sin «-»' : `Máx. ${Naming.MAX_PRODUCT}`}
            sx={{ minWidth: 160 }}
          />
          <TextField
            size="small"
            label="Consola"
            placeholder="p.ej. console"
            value={consoleName}
            onChange={(e) => setConsoleName(e.target.value)}
            disabled={!canCreate || saving}
            inputProps={{ maxLength: Naming.MAX_CONSOLE }}
            error={!consoleOk}
            helperText={!consoleOk ? 'Minúsculas y dígitos, sin «-»' : `Máx. ${Naming.MAX_CONSOLE}`}
            sx={{ minWidth: 160 }}
          />
          <TextField
            size="small"
            type="email"
            label="Email del god (obligatorio)"
            value={godEmail}
            onChange={(e) => setGodEmail(e.target.value)}
            disabled={!canCreate || saving}
            required
            fullWidth
          />
          <Button variant="contained" onClick={onCreate} disabled={!canCreate || saving || !formValid}>
            Crear consola
          </Button>
        </Stack>
        {product.trim() && consoleName.trim() && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            consoleId: <code>{`${product.trim()}-${consoleName.trim()}`}</code> · god:{' '}
            <code>{`${product.trim()}-${consoleName.trim()}-god`}</code>
          </Typography>
        )}
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          Consolas registradas
        </Typography>
        {loading ? (
          <Box sx={{ p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : consoles.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No hay consolas registradas.
          </Typography>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>consoleId</TableCell>
                  <TableCell>Producto</TableCell>
                  <TableCell>Consola</TableCell>
                  <TableCell>Email god</TableCell>
                  <TableCell>API key</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {consoles.map((c) => {
                  const isEditing = editingId === c.consoleId;
                  if (isEditing) {
                    return (
                      <TableRow key={c.consoleId} hover>
                        <TableCell>
                          <code>{`${(editDraft.product || '').trim()}-${(editDraft.console || '').trim()}`}</code>
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={editDraft.product}
                            onChange={(e) => setDraft('product', e.target.value)}
                            inputProps={{ maxLength: Naming.MAX_PRODUCT }}
                            error={!editProductOk}
                            sx={{ width: 120 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={editDraft.console}
                            onChange={(e) => setDraft('console', e.target.value)}
                            inputProps={{ maxLength: Naming.MAX_CONSOLE }}
                            error={!editConsoleOk}
                            sx={{ width: 120 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="email"
                            value={editDraft.godEmail}
                            onChange={(e) => setDraft('godEmail', e.target.value)}
                            error={!editDraft.godEmail?.trim()}
                            sx={{ minWidth: 200 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            placeholder="(sin cambios)"
                            value={editDraft.apiKey}
                            onChange={(e) => setDraft('apiKey', e.target.value)}
                            InputProps={{
                              sx: { fontFamily: 'monospace' },
                              endAdornment: (
                                <Tooltip title="Generar apikey nueva">
                                  <IconButton size="small" edge="end" onClick={() => setDraft('apiKey', genApiKey())}>
                                    <Autorenew fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              ),
                            }}
                            sx={{ minWidth: 260 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Guardar">
                            <span>
                              <IconButton size="small" color="primary" onClick={onSaveEdit} disabled={saving || !editValid}>
                                <Check fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Cancelar">
                            <IconButton size="small" onClick={cancelEdit} disabled={saving}>
                              <Close fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  }
                  return (
                    <TableRow key={c.consoleId} hover>
                      <TableCell>
                        <code>{c.consoleId}</code>
                      </TableCell>
                      <TableCell>{c.product}</TableCell>
                      <TableCell>{c.appconsole}</TableCell>
                      <TableCell>{c.godEmail || <em>—</em>}</TableCell>
                      <TableCell>
                        {c.hasApiKey ? (
                          <code>{c.apiKeyMasked}</code>
                        ) : (
                          <Chip size="small" label="sin key" variant="outlined" />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Editar consola">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => startEdit(c)}
                              disabled={!canEdit || saving || !!editingId}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Borrar consola">
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => onDelete(c.consoleId)}
                              disabled={!canDelete || saving || !!editingId}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}
        <Divider sx={{ my: 2 }} />
        <Typography variant="caption" color="text.secondary">
          La apikey solo se muestra completa en el alta; después va enmascarada. El god puede
          consultarla en «Configuración».
        </Typography>
      </Paper>
    </Stack>
  );
};

export default Integraciones;
