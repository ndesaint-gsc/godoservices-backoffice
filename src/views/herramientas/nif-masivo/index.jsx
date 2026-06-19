import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useSnackbar } from 'notistack';
import { useHasPrivilege } from '@/common/permissions/useHasPrivilege';
import { Priv } from '@/common/permissions/privileges';
import toolsService from '@/services/tools.service';

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const NifMasivo = () => {
  const { enqueueSnackbar } = useSnackbar();
  const canEdit = useHasPrivilege(Priv.EDIT_HERRAMIENTAS);

  const [csvFile, setCsvFile] = useState(null);
  const [email, setEmail] = useState('');
  const [uploading, setUploading] = useState(false);

  const canSubmit = csvFile && isValidEmail(email.trim()) && !uploading;

  const handleFileChange = (event) => {
    setCsvFile(event.target.files?.[0] || null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    setUploading(true);
    try {
      await toolsService.uploadNifs(csvFile, email.trim());
      enqueueSnackbar('Fichero enviado. Recibirás el resultado por email.', { variant: 'success' });
      setCsvFile(null);
      setEmail('');
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
          Vinculación masiva de NIFs
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Sube un CSV (UTF-8, separado por «;») con columnas Email;NIF;Resultado. El
          proceso es asíncrono y el resultado se envía por email.
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
              </Box>
              <TextField
                label="Email para el resultado"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                fullWidth
                placeholder="ejemplo@correo.com"
              />
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

export default NifMasivo;
