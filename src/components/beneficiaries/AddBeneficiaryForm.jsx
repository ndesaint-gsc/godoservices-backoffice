import { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Stack,
  TextField,
} from '@mui/material';

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Alta individual de un beneficiario. Construye el Beneficiary mínimo
// { subscriptionId, email } y, si "Auto-aceptar" está marcado, marca
// beneficiaryAutoAccept para que el service vaya a POST .../beneficiaries/accepted
// (el backend fuerza ahí autoActivate + skipEmailInvitation).
const AddBeneficiaryForm = ({ subscriptionId, onAdd, disabled }) => {
  const [email, setEmail] = useState('');
  const [autoAccept, setAutoAccept] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = isValidEmail(email.trim()) && !submitting && !disabled;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onAdd({
        subscriptionId,
        email: email.trim(),
        beneficiaryAutoAccept: autoAccept,
      });
      setEmail('');
      setAutoAccept(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
        <TextField
          label="Email del beneficiario"
          type="email"
          size="small"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="ejemplo@correo.com"
          disabled={submitting || disabled}
          sx={{ flexGrow: 1 }}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={autoAccept}
              onChange={(event) => setAutoAccept(event.target.checked)}
              disabled={submitting || disabled}
            />
          }
          label="Auto-aceptar"
        />
        <Button
          type="submit"
          variant="contained"
          disabled={!canSubmit}
          startIcon={submitting ? <CircularProgress size={16} /> : null}
        >
          Añadir
        </Button>
      </Stack>
    </Box>
  );
};

export default AddBeneficiaryForm;
