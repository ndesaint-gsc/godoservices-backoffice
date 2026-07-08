import { useContext, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useSnackbar } from 'notistack';
import { Box, Button, CircularProgress, Divider, Paper, Stack, Typography } from '@mui/material';
import { patchEvUser } from '@/common/features/customer/customerSlice';
import { ModalContext } from '@/common/providers/ModalProvider';
import billingService from '@/services/billing.service';
import FiscalAddressForm from './FiscalAddressForm';
import { useFiscalAddressForm } from './useFiscalAddressForm';
import {
  buildBlankFiscalPatch,
  buildFiscalDefaults,
  buildFiscalPayload,
} from './fiscalAddressSchema';

const SummaryField = ({ label, value }) => (
  <Box>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2">{value || '—'}</Typography>
  </Box>
);

const summaryGridStyles = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
  gap: 1.5,
  mt: 1.5,
};

const FiscalAddressCard = ({ evUser, canEdit, guid }) => {
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const modal = useContext(ModalContext);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    isLegalPerson,
    formState: { errors },
  } = useFiscalAddressForm(evUser);

  const hasFiscalData = Boolean(evUser.document_id || evUser.address1_street_name);

  const startEdit = () => {
    reset(buildFiscalDefaults(evUser));
    setEditing(true);
  };
  const cancelEdit = () => setEditing(false);

  const onSubmit = async (values) => {
    setSaving(true);
    const payload = buildFiscalPayload(guid, values, isLegalPerson);
    try {
      await billingService.updateFiscalAddress(payload);
      dispatch(patchEvUser(payload));
      enqueueSnackbar('Dirección fiscal actualizada', { variant: 'success' });
      setEditing(false);
    } catch (error) {
      enqueueSnackbar('Error al guardar: ' + error.message, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    modal.show({
      title: 'Eliminar dirección fiscal',
      content: 'Se borrarán todos los datos fiscales de este usuario. ¿Continuar?',
      confirmText: 'Eliminar',
      variant: 'error',
      onSubmit: async () => {
        setSaving(true);
        try {
          await billingService.deleteFiscalAddress(guid);
          dispatch(patchEvUser(buildBlankFiscalPatch()));
          enqueueSnackbar('Dirección fiscal eliminada', { variant: 'success' });
          setEditing(false);
        } catch (error) {
          enqueueSnackbar('Error al eliminar: ' + error.message, { variant: 'error' });
        } finally {
          setSaving(false);
        }
      },
    });
  };

  return (
    <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="overline" color="text.secondary">
            Facturación
          </Typography>
          <Typography variant="h6" sx={{ mt: 0.25 }}>
            Dirección fiscal
          </Typography>
        </Box>
        {canEdit && !editing && (
          <Button variant="outlined" size="small" onClick={startEdit}>
            {hasFiscalData ? 'Editar' : 'Añadir'}
          </Button>
        )}
      </Stack>

      {!editing ? (
        !hasFiscalData ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            El usuario no tiene dirección fiscal.
          </Typography>
        ) : (
          <Box sx={summaryGridStyles}>
            <SummaryField label="Tipo documento" value={evUser.document_type} />
            <SummaryField label="Documento" value={evUser.document_id} />
            <SummaryField label="Email facturación" value={evUser.billing_email} />
            <SummaryField
              label={evUser.document_type === 'CIF' ? 'Razón social' : 'Nombre'}
              value={[
                evUser.address1_first_name,
                evUser.address1_last_name_first,
                evUser.address1_last_name_second,
              ]
                .filter(Boolean)
                .join(' ')}
            />
            <SummaryField
              label="Dirección"
              value={[
                evUser.address1_street_type,
                evUser.address1_street_name,
                evUser.address1_street_number,
              ]
                .filter(Boolean)
                .join(' ')}
            />
            <SummaryField label="Código postal" value={evUser.address1_postcode} />
            <SummaryField label="Ciudad" value={evUser.address1_city} />
            <SummaryField label="País" value={evUser.address1_country} />
          </Box>
        )
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FiscalAddressForm
            control={control}
            errors={errors}
            isLegalPerson={isLegalPerson}
            disabled={saving}
          />
          <Divider sx={{ my: 2.5 }} />
          <Stack direction="row" spacing={1.5} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
            {hasFiscalData && (
              <Button
                type="button"
                variant="outlined"
                color="error"
                disabled={saving}
                onClick={confirmDelete}
                sx={{ mr: 'auto' }}
              >
                Eliminar dirección fiscal
              </Button>
            )}
            <Button
              type="button"
              variant="text"
              color="inherit"
              onClick={cancelEdit}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              startIcon={saving ? <CircularProgress size={16} /> : null}
            >
              Guardar
            </Button>
          </Stack>
        </form>
      )}
    </Paper>
  );
};

export default FiscalAddressCard;
