import { useState } from 'react';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

// Menú de acciones por fila para las tablas de tienda (Apple / Google / Terceros).
// Presentacional: el estado de las acciones (confirmaciones, llamadas al
// servicio, recarga) lo gobierna la vista vía los callbacks onUnassign /
// onForce / onReassign. `disabled` apaga el menú (sin privilegio o acción en
// curso).
const SubscriptionActionsMenu = ({ row, disabled, onUnassign, onForce, onReassign }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const run = (handler) => () => {
    handleClose();
    handler(row);
  };

  return (
    <>
      <IconButton
        size="small"
        aria-label="Acciones de la suscripción"
        disabled={disabled}
        onClick={handleOpen}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem onClick={run(onForce)}>
          <ListItemIcon>
            <LocalShippingIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Forzar entrega</ListItemText>
        </MenuItem>
        <MenuItem onClick={run(onReassign)}>
          <ListItemIcon>
            <SwapHorizIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Reasignar titular</ListItemText>
        </MenuItem>
        <MenuItem onClick={run(onUnassign)} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <LinkOffIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Desasignar</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default SubscriptionActionsMenu;
