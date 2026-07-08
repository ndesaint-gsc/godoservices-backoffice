import { useState } from 'react';
import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
  buildInvoiceActions,
  euroFormatter,
  formatInvoiceDate,
  STATE_LABELS,
} from './invoiceActions';

const StateChip = ({ state }) => {
  const normalizedState = String(state || '').toUpperCase();
  const isPaid = normalizedState === 'PAID';
  return (
    <Chip
      size="small"
      label={STATE_LABELS[normalizedState] || state || '—'}
      sx={{
        bgcolor: isPaid ? 'success.light' : 'action.selected',
        color: isPaid ? 'success.main' : 'text.secondary',
        fontWeight: 600,
      }}
    />
  );
};

// `handlers` is the action callback bag (see invoiceActions.buildInvoiceActions).
// `actionAllowed` maps each gated action's `perm` key (facturacion.substitute /
// rectify / negative / recalculate) to whether `useActionAllowed` permits it, so
// each menu item is disabled visually when its permission is denied. Actions with no
// `perm` (download / regenerate) are always available (read operations).
const InvoicesTable = ({ invoices, loading, runningAction, handlers, actionAllowed = {} }) => {
  const [actionMenu, setActionMenu] = useState({ anchor: null, invoice: null });
  const openActionMenu = (event, invoice) =>
    setActionMenu({ anchor: event.currentTarget, invoice });
  const closeActionMenu = () => setActionMenu({ anchor: null, invoice: null });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (invoices.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        El usuario no tiene facturas.
      </Typography>
    );
  }

  return (
    <>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nº Suscripción</TableCell>
              <TableCell>Nº Factura</TableCell>
              <TableCell>Producto</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell align="right">Importe</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.map((invoice) => {
              const hasActions = buildInvoiceActions(invoice, handlers).length > 0;
              return (
                <TableRow key={invoice.transactionId} hover>
                  <TableCell>{invoice.subscriptionId}</TableCell>
                  <TableCell>{invoice.invoiceId}</TableCell>
                  <TableCell>{invoice.productName}</TableCell>
                  <TableCell>{formatInvoiceDate(invoice.date)}</TableCell>
                  <TableCell align="right">
                    {typeof invoice.grossAmount === 'number'
                      ? euroFormatter.format(invoice.grossAmount)
                      : invoice.grossAmount}
                  </TableCell>
                  <TableCell>
                    <StateChip state={invoice.state} />
                  </TableCell>
                  <TableCell align="center">
                    {hasActions && (
                      <IconButton
                        size="small"
                        disabled={runningAction}
                        onClick={(event) => openActionMenu(event, invoice)}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        anchorEl={actionMenu.anchor}
        open={Boolean(actionMenu.anchor)}
        onClose={closeActionMenu}
      >
        {actionMenu.invoice &&
          buildInvoiceActions(actionMenu.invoice, handlers).map((action) => (
            <MenuItem
              key={action.key}
              disabled={action.perm ? !actionAllowed[action.perm] : false}
              onClick={() => {
                closeActionMenu();
                action.onClick();
              }}
            >
              {action.label}
            </MenuItem>
          ))}
      </Menu>
    </>
  );
};

export default InvoicesTable;
