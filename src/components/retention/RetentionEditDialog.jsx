import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useSnackbar } from 'notistack';
import retentionService from '@/services/retention.service';
import { FIELD_KINDS } from './retentionTypes';

const IMAGE_ACCEPT = '.jpg,.jpeg,.png,.gif';

// Inicializa el estado del formulario a partir del item y la definición de campos.
const initialForm = (typeDef, item) => {
  const form = {};
  typeDef.fields.forEach((field) => {
    const value = item ? item[field.name] : undefined;
    form[field.name] = field.type === FIELD_KINDS.BOOL ? !!value : (value ?? '');
  });
  return form;
};

// Diálogo de edición de un item de retención (OFFER/ARTICLE/FEATURE/SECTION).
// Envía POST retention-update/{type} con { ...campos, index, tenant }.
// La imagen se sube aparte (upload-retention-image) y su URL se vuelca en imageUrl.
const RetentionEditDialog = ({ open, typeDef, item, index, tenant, onClose, onSaved }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (open && typeDef) setForm(initialForm(typeDef, item));
  }, [open, typeDef, item]);

  if (!typeDef) return null;

  const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const handleImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploadingImage(true);
    try {
      const result = await retentionService.uploadImage(file, tenant);
      if (result?.url) {
        setField('imageUrl', result.url);
        enqueueSnackbar('Imagen subida.', { variant: 'success' });
      } else {
        const warn = result?.warning || result?.error || 'Respuesta sin URL';
        enqueueSnackbar('No se pudo subir la imagen: ' + warn, { variant: 'warning' });
      }
    } catch (error) {
      enqueueSnackbar('Error al subir la imagen: ' + error.message, { variant: 'error' });
    } finally {
      setUploadingImage(false);
    }
  };

  const missingRequired = typeDef.fields.some(
    (field) => field.required && !String(form[field.name] ?? '').trim(),
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (missingRequired || saving) return;
    setSaving(true);
    const body = { index: String(index), tenant };
    typeDef.fields.forEach((field) => {
      const value = form[field.name];
      body[field.name] = field.type === FIELD_KINDS.BOOL ? String(!!value) : (value ?? '');
    });
    try {
      await retentionService.updateContent(typeDef.apiType, body);
      enqueueSnackbar(`${typeDef.singular} actualizada.`, { variant: 'success' });
      onSaved?.();
    } catch (error) {
      enqueueSnackbar('Error al guardar: ' + error.message, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {typeDef.singular} · índice {index} · {tenant}
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            {typeDef.fields.map((field) => {
              if (field.type === FIELD_KINDS.BOOL) {
                return (
                  <FormControlLabel
                    key={field.name}
                    control={
                      <Switch
                        checked={!!form[field.name]}
                        onChange={(event) => setField(field.name, event.target.checked)}
                      />
                    }
                    label={field.label}
                  />
                );
              }
              if (field.image) {
                return (
                  <Box key={field.name}>
                    <TextField
                      label={field.label}
                      value={form[field.name] ?? ''}
                      onChange={(event) => setField(field.name, event.target.value)}
                      fullWidth
                    />
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Button
                        component="label"
                        variant="outlined"
                        size="small"
                        startIcon={<UploadFileIcon />}
                        disabled={uploadingImage}
                      >
                        Subir imagen
                        <input type="file" accept={IMAGE_ACCEPT} hidden onChange={handleImage} />
                      </Button>
                      {uploadingImage ? <CircularProgress size={18} /> : null}
                      <Typography variant="caption" color="text.secondary">
                        jpg · jpeg · png · gif
                      </Typography>
                    </Box>
                  </Box>
                );
              }
              return (
                <TextField
                  key={field.name}
                  label={field.label}
                  value={form[field.name] ?? ''}
                  onChange={(event) => setField(field.name, event.target.value)}
                  required={field.required}
                  fullWidth
                />
              );
            })}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={saving} color="inherit">
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={missingRequired || saving}
            startIcon={saving ? <CircularProgress size={16} /> : null}
          >
            Guardar
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default RetentionEditDialog;
