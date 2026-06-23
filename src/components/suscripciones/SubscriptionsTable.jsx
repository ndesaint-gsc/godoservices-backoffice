import {
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

// Tabla genérica de suscripciones (read-only). `columns`: [{ key, label, align?, render? }].
// `render(row)` opcional; si no, usa row[key]. Mismo estilo que InvoicesTable.
const SubscriptionsTable = ({ columns, rows, loading, emptyText }) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {emptyText}
      </Typography>
    );
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column.key} align={column.align}>
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={row.subscriptionId || row.id || row.orderId || index} hover>
              {columns.map((column) => {
                const value = column.render ? column.render(row) : row[column.key];
                return (
                  <TableCell key={column.key} align={column.align}>
                    {value == null || value === '' ? '—' : value}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default SubscriptionsTable;
