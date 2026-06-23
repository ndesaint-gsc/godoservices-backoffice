import { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Plantilla CSV descargable (servida como estático en el tenant).
const TEMPLATE_URL = '/rsc/csv/beneficiarios-template-consola.csv';

// Carga masiva (importación) de beneficiarios. El proceso es asíncrono: el backend
// responde de inmediato y envía el resultado por email. Campos del multipart:
// subscriptionId (fijo por la suscripción), roleName, externalRef, email (para el
// resultado), forceAutoActivate y beneficiariesFile.
const ImportBeneficiariesForm = ({ subscriptionId, roleName, onImport, disabled }) => {
  const [file, setFile] = useState(null);
  const [externalRef, setExternalRef] = useState('');
  const [email, setEmail] = useState('');
  const [forceAutoActivate, setForceAutoActivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = file && isValidEmail(email.trim()) && !submitting && !disabled;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onImport({
        subscriptionId,
        roleName: roleName || '',
        externalRef: externalRef.trim(),
        email: email.trim(),
        forceAutoActivate,
        beneficiariesFile: file,
      });
      setFile(null);
      setExternalRef('');
      setEmail('');
      setForceAutoActivate(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">
          Sube un CSV con los beneficiarios. El proceso es asíncrono: el resultado se
          enviará por email.{' '}
          <Link href={TEMPLATE_URL} download>
            Descargar plantilla
          </Link>
        </Typography>
        <Box>
          <Button
            component="label"
            variant="outlined"
            startIcon={<UploadFileIcon />}
            disabled={submitting || disabled}
          >
            Seleccionar CSV
            <input
              type="file"
              accept=".csv"
              hidden
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {file ? file.name : 'Ningún fichero seleccionado'}
          </Typography>
        </Box>
        <TextField
          label="Referencia externa (opcional)"
          size="small"
          value={externalRef}
          onChange={(event) => setExternalRef(event.target.value)}
          disabled={submitting || disabled}
          fullWidth
        />
        <TextField
          label="Email para el resultado"
          type="email"
          size="small"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="ejemplo@correo.com"
          disabled={submitting || disabled}
          fullWidth
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={forceAutoActivate}
              onChange={(event) => setForceAutoActivate(event.target.checked)}
              disabled={submitting || disabled}
            />
          }
          label="Forzar auto-activación"
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            disabled={!canSubmit}
            startIcon={submitting ? <CircularProgress size={16} /> : null}
          >
            Importar
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

export default ImportBeneficiariesForm;
