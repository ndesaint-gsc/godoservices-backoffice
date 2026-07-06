import { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Stack, TextField } from '@mui/material';
import { useSnackbar } from 'notistack';
import retentionService from '@/services/retention.service';

// Formulario del vídeo de retención (1 URL por tenant).
// POST /perfil/console/user/retention-video-update?urlVideo=<url>&tenant=<t>
const RetentionVideoForm = ({ tenant, currentUrl, canEdit, onSaved }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [url, setUrl] = useState(currentUrl || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setUrl(currentUrl || '');
  }, [currentUrl, tenant]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!url.trim() || saving) return;
    setSaving(true);
    try {
      await retentionService.updateVideo(url.trim(), tenant);
      enqueueSnackbar('Vídeo actualizado.', { variant: 'success' });
      onSaved?.();
    } catch (error) {
      enqueueSnackbar('Error al actualizar el vídeo: ' + error.message, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} alignItems="flex-start">
        <TextField
          label="URL del vídeo"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          fullWidth
          disabled={!canEdit}
          placeholder="https://…"
        />
        <Button
          type="submit"
          variant="contained"
          disabled={!canEdit || !url.trim() || saving}
          startIcon={saving ? <CircularProgress size={16} /> : null}
          sx={{ minWidth: 140, mt: { sm: 0.5 } }}
        >
          Actualizar
        </Button>
      </Stack>
    </Box>
  );
};

export default RetentionVideoForm;
