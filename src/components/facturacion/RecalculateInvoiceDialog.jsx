import { useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import billingService from '@/services/billing.service';
import { euroFormatter } from './invoiceActions';
import {
  areLinesValid,
  buildRecalculateLines,
  buildRecalculatePayload,
  isValidBase,
  isValidIva,
  isValidPeriod,
  lineImporte,
  lineIvaImport,
  totalBase,
  totalInvoice,
  totalIva,
} from './recalculateInvoice';

const formatAmount = (value) =>
  Number.isFinite(value) ? euroFormatter.format(value) : euroFormatter.format(0);

// "Recalcular factura" — the legacy recalculateInvoiceModal ported to React.
// Loads the editable line data for the transaction, lets the operator edit base
// / %IVA / period per line (import is derived), validates (period <= 365 días),
// and runs `onConfirm(payload)` with the RecalculateInvoice[] to save.
const RecalculateInvoiceDialog = ({ open, transactionId, onClose, onConfirm }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [meta, setMeta] = useState(null);
  const [lines, setLines] = useState([]);

  useEffect(() => {
    if (!open || !transactionId) return undefined;
    let active = true;
    setLoading(true);
    setLines([]);
    setMeta(null);
    billingService
      .getRecalculateData(transactionId)
      .then((data) => {
        if (!active) return;
        setMeta(data || null);
        setLines(buildRecalculateLines(data));
      })
      .catch((error) => {
        if (!active) return;
        enqueueSnackbar('Error al cargar los datos de recálculo: ' + error.message, {
          variant: 'error',
        });
        onClose();
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, transactionId]);

  const updateLine = (index, field) => (event) => {
    const { value } = event.target;
    setLines((previous) =>
      previous.map((line, lineIndex) =>
        lineIndex === index ? { ...line, [field]: value } : line,
      ),
    );
  };

  const handleSubmit = async () => {
    if (!areLinesValid(lines)) {
      enqueueSnackbar('Revisa las líneas: base (#.##), %IVA (0-99) y periodo ≤ 365 días.', {
        variant: 'error',
      });
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm(buildRecalculatePayload(lines));
      onClose();
    } catch (error) {
      enqueueSnackbar('Error: ' + error.message, { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const isBundle = lines.length > 1;
  const busy = loading || submitting;

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>Recalcular factura</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            {meta && (
              <Stack direction="row" spacing={4} flexWrap="wrap" useFlexGap>
                <Typography variant="body2">
                  <strong>Nº de factura:</strong> {meta.invoiceId || '—'}
                </Typography>
                <Typography variant="body2">
                  <strong>Tipo de transacción:</strong> {meta.transactionType || '—'}
                </Typography>
              </Stack>
            )}

            {lines.map((line, index) => {
              const baseError = line.base !== '' && !isValidBase(line.base);
              const ivaError = line.ivaPercentage !== '' && !isValidIva(line.ivaPercentage);
              const periodError = !isValidPeriod(line.startDate, line.endDate);
              return (
                <Box
                  key={index}
                  sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}
                >
                  {isBundle && (
                    <Typography variant="overline" color="text.secondary">
                      Bundle: {index}
                    </Typography>
                  )}
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                      gap: 2,
                      mt: 1,
                    }}
                  >
                    <TextField
                      label="Base imponible"
                      value={line.base}
                      onChange={updateLine(index, 'base')}
                      disabled={submitting}
                      size="small"
                      error={baseError}
                      helperText={baseError ? 'Formato #.##' : ' '}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label="% IVA"
                      value={line.ivaPercentage}
                      onChange={updateLine(index, 'ivaPercentage')}
                      disabled={submitting}
                      size="small"
                      error={ivaError}
                      helperText={ivaError ? 'Entero 0-99' : ' '}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label="Fecha inicio"
                      type="date"
                      value={line.startDate}
                      onChange={updateLine(index, 'startDate')}
                      disabled={submitting}
                      size="small"
                      error={periodError}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label="Fecha fin"
                      type="date"
                      value={line.endDate}
                      onChange={updateLine(index, 'endDate')}
                      disabled={submitting}
                      size="small"
                      error={periodError}
                      helperText={periodError ? 'Periodo inválido (≤ 365 días)' : ' '}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Box>
                  <Stack direction="row" spacing={4} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
                    <Typography variant="body2" color="text.secondary">
                      Importe IVA: {formatAmount(lineIvaImport(line))}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Importe: {formatAmount(lineImporte(line))}
                    </Typography>
                  </Stack>
                </Box>
              );
            })}

            <Divider />
            <Stack spacing={0.5} alignItems="flex-end">
              <Typography variant="body2">
                Base imponible: {formatAmount(totalBase(lines))}
              </Typography>
              <Typography variant="body2">Total IVA: {formatAmount(totalIva(lines))}</Typography>
              <Typography variant="subtitle2">
                TOTAL FACTURA: {formatAmount(totalInvoice(lines))}
              </Typography>
            </Stack>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button type="button" variant="text" onClick={onClose} disabled={busy}>
          Cancelar
        </Button>
        <Button
          type="button"
          variant="contained"
          onClick={handleSubmit}
          disabled={busy || lines.length === 0 || !areLinesValid(lines)}
          startIcon={submitting ? <CircularProgress size={16} /> : null}
        >
          Enviar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecalculateInvoiceDialog;
