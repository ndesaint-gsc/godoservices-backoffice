import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useSnackbar } from 'notistack';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import { patchEvUser } from '@/common/features/customer/customerSlice';
import billingService from '@/services/billing.service';
import FiscalAddressForm from './FiscalAddressForm';
import { useFiscalAddressForm } from './useFiscalAddressForm';
import { buildFiscalDefaults, buildFiscalPayload } from './fiscalAddressSchema';

// "Usar los siguientes datos fiscales" — the legacy popup shared by the three
// invoice generate-actions. Enviar saves the (possibly edited) fiscal data,
// then runs `onConfirm` (the substitute / rectify / negative call). Mirrors
// completeInvoiceModal: save-then-generate.
const FiscalAddressDialog = ({ open, onClose, evUser, guid, title, onConfirm }) => {
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    isLegalPerson,
    formState: { errors },
  } = useFiscalAddressForm(evUser);

  // Re-prefill from the current user each time the dialog opens.
  useEffect(() => {
    if (open) reset(buildFiscalDefaults(evUser));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      const payload = buildFiscalPayload(guid, values, isLegalPerson);
      await billingService.updateFiscalAddress(payload);
      dispatch(patchEvUser(payload));
      // Fiscal data saved → run the generate call (download + reload live there).
      await onConfirm();
      onClose();
    } catch (error) {
      enqueueSnackbar('Error: ' + error.message, { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent>
          <FiscalAddressForm
            control={control}
            errors={errors}
            isLegalPerson={isLegalPerson}
            disabled={submitting}
          />
        </DialogContent>
        <DialogActions>
          <Button type="button" variant="text" color="inherit" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} /> : null}
          >
            Enviar
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default FiscalAddressDialog;
