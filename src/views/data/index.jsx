import { useSelector } from 'react-redux';
import { Box, Chip, Paper, Stack, TextField, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { selectCustomer } from '@/common/features/customer/customerSlice';

const formatTimestamp = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('es-ES');
};

const formatBool = (value) => {
  if (value === true) return 'true';
  if (value === false) return 'false';
  return '';
};

const Field = ({ label, value }) => (
  <TextField
    label={label}
    value={value ?? ''}
    disabled
    fullWidth
    size="small"
    InputLabelProps={{ shrink: true }}
  />
);

const StateChip = ({ state }) => {
  if (!state) return null;
  const isActive = String(state).toUpperCase() === 'ACTIVE';
  return (
    <Chip
      size="small"
      label={state}
      sx={{
        bgcolor: isActive ? 'success.light' : 'action.selected',
        color: isActive ? 'success.main' : 'text.secondary',
        fontWeight: 600,
      }}
    />
  );
};

const VerifiedBadge = ({ verified }) => {
  if (verified === true) {
    return (
      <Chip
        icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
        label="Verificado"
        size="small"
        sx={{ bgcolor: 'success.light', color: 'success.main', fontWeight: 600 }}
      />
    );
  }
  if (verified === false) {
    return (
      <Chip
        icon={<CancelIcon sx={{ fontSize: 16 }} />}
        label="No verificado"
        size="small"
        sx={{ bgcolor: 'error.light', color: 'error.main', fontWeight: 600 }}
      />
    );
  }
  return null;
};

const Data = () => {
  const customer = useSelector(selectCustomer);
  const data = customer?.raw;
  if (!data) return null;
  const u = data.evUser || {};

  return (
    <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 0.5 }}
      >
        <Box>
          <Typography variant="overline" color="text.secondary">
            Usuario
          </Typography>
          <Typography variant="h5" sx={{ mt: 0.25 }}>
            {u.display_name || u.email_address || '—'}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <StateChip state={u.state} />
          <VerifiedBadge verified={u.email_verified} />
          {u.brand && (
            <Chip
              label={u.brand}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 600, borderColor: 'divider' }}
            />
          )}
        </Stack>
      </Stack>

      <Typography variant="overline" color="text.secondary" sx={{ mt: 3, display: 'block' }}>
        Datos de identificación
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          gap: 2.5,
          mt: 1.5,
        }}
      >
        <Field label="GUID" value={u.guid} />
        <Field label="UID" value={u.uid} />
        <Field label="Email" value={u.email_address} />

        <Field label="Username" value={u.display_name} />
        <Field label="Fecha de Registro (Evolok)" value={formatTimestamp(u.created)} />
        <Field label="Fecha de Registro (Legacy)" value={formatTimestamp(u.legacyRegistrationDate)} />

        <Field label="Estado Evolok" value={u.state} />
        <Field label="Verificado" value={formatBool(u.email_verified)} />
        <Field label="ID Tarjeta Club" value={u.fidelity_card_id} />

        <Field label="LV Consentimiento" value={u.LVConsent} />
        <Field label="MD Consentimiento" value={u.MDConsent} />
        <Field label="R1 Consentimiento" value={u.R1Consent} />

        <Field label="Brand" value={u.brand} />
      </Box>
    </Paper>
  );
};

export default Data;
