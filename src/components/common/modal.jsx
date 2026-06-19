import { useContext } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { ModalContext } from '@/common/providers/ModalProvider';

const Modal = () => {
  const { modal, remove } = useContext(ModalContext);

  if (!modal || !modal.open) return null;

  const primaryColor = modal.variant === 'error' ? 'error' : 'primary';

  const handlePrimary = () => {
    if (modal.onSubmit) {
      modal.onSubmit();
    }
    remove();
  };

  const handleSecondary = () => {
    if (modal.secondaryBtnHandler) {
      modal.secondaryBtnHandler();
    }
    remove();
  };

  return (
    <Dialog open={modal.open} onClose={remove} aria-labelledby="modal-title">
      {modal.title && <DialogTitle id="modal-title">{modal.title}</DialogTitle>}
      <DialogContent>
        {typeof modal.content === 'string' ? (
          <DialogContentText>{modal.content}</DialogContentText>
        ) : (
          modal.content
        )}
      </DialogContent>
      <DialogActions>
        {modal.secondaryBtnText && (
          <Button onClick={handleSecondary} color="inherit">
            {modal.secondaryBtnText}
          </Button>
        )}
        <Button variant="contained" color={primaryColor} onClick={handlePrimary}>
          {modal.confirmText || 'Aceptar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Modal;
