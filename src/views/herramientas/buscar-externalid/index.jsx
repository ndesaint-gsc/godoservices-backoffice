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
import { useSnackbar } from 'notistack';
import toolsService from '@/services/tools.service';

const ResultField = ({ label, value }) => (
  <Box>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
      {value || '—'}
    </Typography>
  </Box>
);

const BuscarExternalId = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [externalId, setExternalId] = useState('');
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState(null);

  const handleSearch = async (event) => {
    event.preventDefault();
    const trimmedId = externalId.trim();
    if (!trimmedId || searching) return;
    setSearching(true);
    setResult(null);
    try {
      const lookup = await toolsService.findPurchaseByExternalId(trimmedId);
      setResult(lookup);
    } catch (error) {
      enqueueSnackbar('Error al buscar: ' + error.message, { variant: 'error' });
    } finally {
      setSearching(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="overline" color="text.secondary">
          Herramientas
        </Typography>
        <Typography variant="h4" sx={{ mt: 0.25 }}>
          Buscar suscripción por externalId
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Localiza una compra de Evolok por su referencia externa.
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', gap: 1.5 }}>
          <TextField
            label="externalId"
            value={externalId}
            onChange={(event) => setExternalId(event.target.value)}
            fullWidth
            autoFocus
            size="small"
            placeholder="Referencia externa de la compra"
          />
          <Button
            type="submit"
            variant="contained"
            disabled={searching || !externalId.trim()}
            sx={{ px: 4, minWidth: 120 }}
          >
            Buscar
          </Button>
        </Box>
      </Paper>

      {searching && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress size={28} />
        </Box>
      )}

      {!searching && result?.status === 'found' && (
        <Paper variant="outlined" sx={{ mt: 3, p: { xs: 3, md: 4 } }}>
          <Typography variant="overline" color="text.secondary">
            Resultado
          </Typography>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <ResultField label="Purchase ID" value={result.purchase.purchaseId} />
            <ResultField label="Account ID" value={result.purchase.accountId} />
          </Stack>
        </Paper>
      )}

      {!searching && result?.status === 'notFound' && (
        <Alert severity="warning" variant="outlined" sx={{ mt: 3 }}>
          No se encontró ninguna suscripción con ese externalId.
        </Alert>
      )}

      {!searching && result?.status === 'multiple' && (
        <Alert severity="warning" variant="outlined" sx={{ mt: 3 }}>
          Se encontraron varias suscripciones con ese externalId (conflicto). Afina la búsqueda.
        </Alert>
      )}
    </Box>
  );
};

export default BuscarExternalId;
