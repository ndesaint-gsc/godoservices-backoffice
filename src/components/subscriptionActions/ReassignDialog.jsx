import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from '@mui/material';

// Paso 1 de "reasignar titular": pide el email destino. El paso 2 (doble
// confirmación con el mensaje "de <old> a <new>, ¿continuar?") lo lanza la vista
// vía ModalContext cuando este diálogo confirma — igual que el BO antiguo
// (modal del email -> modal #confirmReassign).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ReassignDialog = ({ open, currentEmail, onClose, onConfirm }) => {
  const [email, setEmail] = useState('');

  const trimmed = email.trim();
  const valid = EMAIL_RE.test(trimmed);

  const handleClose = () => {
    setEmail('');
    onClose();
  };

  const handleConfirm = () => {
    if (!valid) return;
    onConfirm(trimmed);
    setEmail('');
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>Reasignar titular</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Introduce el email del nuevo titular de la suscripción
          {currentEmail ? ` (titular actual: ${currentEmail})` : ''}.
        </DialogContentText>
        <TextField
          autoFocus
          label="Email del nuevo titular"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={Boolean(trimmed) && !valid}
          helperText={Boolean(trimmed) && !valid ? 'Introduce un email válido' : ''}
          fullWidth
          size="small"
          placeholder="ejemplo@correo.com"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Cancelar
        </Button>
        <Button variant="contained" onClick={handleConfirm} disabled={!valid}>
          Continuar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReassignDialog;
