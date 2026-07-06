import { useState } from 'react';
import {
  Box,
  Button,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { sortByText } from '@/common/sort';
import RetentionEditDialog from './RetentionEditDialog';

// Tabla read-only de los items de un tipo de retención, con edición por fila.
// Mismo estilo que SubscriptionsTable. `items` viene de itemsForType(config, typeDef).
const RetentionContentTable = ({ typeDef, items, tenant, canEdit, onSaved }) => {
  const [editing, setEditing] = useState(null); // { item, index }

  if (!items || items.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No hay {typeDef.label.toLowerCase()} para {tenant}.
      </Typography>
    );
  }

  // Orden de presentación alfabético por el título visible del tipo, conservando
  // el índice original (es el que necesita el endpoint de edición).
  const rows = sortByText(
    items.map((item, index) => ({ item, index })),
    (entry) => String(entry.item?.[typeDef.titleField] ?? ''),
  );

  return (
    <Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell align="right" sx={{ width: 64 }}>
                Índice
              </TableCell>
              <TableCell>{typeDef.singular}</TableCell>
              <TableCell>URL</TableCell>
              {canEdit ? <TableCell align="right">Acción</TableCell> : null}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(({ item, index }) => {
              const title = item[typeDef.titleField];
              return (
                <TableRow key={index} hover>
                  <TableCell align="right">{index}</TableCell>
                  <TableCell>{title == null || title === '' ? '—' : title}</TableCell>
                  <TableCell sx={{ maxWidth: 280, wordBreak: 'break-word' }}>
                    {item.url ? (
                      <Link href={item.url} target="_blank" rel="noopener" variant="body2">
                        {item.url}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  {canEdit ? (
                    <TableCell align="right">
                      <Button
                        size="small"
                        startIcon={<EditIcon fontSize="small" />}
                        onClick={() => setEditing({ item, index })}
                      >
                        Editar
                      </Button>
                    </TableCell>
                  ) : null}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <RetentionEditDialog
        open={!!editing}
        typeDef={typeDef}
        item={editing?.item}
        index={editing?.index}
        tenant={tenant}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          onSaved?.();
        }}
      />
    </Box>
  );
};

export default RetentionContentTable;
