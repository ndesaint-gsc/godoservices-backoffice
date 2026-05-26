import { Box, Button, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useHasPrivilege } from '@/common/permissions/useHasPrivilege';
import { Priv } from '@/common/permissions/privileges';

const Invoices = () => {
  const canEdit = useHasPrivilege(Priv.EDIT_INVOICES);
  const { enqueueSnackbar } = useSnackbar();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Facturas
      </Typography>
      <Typography sx={{ mb: 2 }}>(Próximamente — listado de facturas.)</Typography>
      <Button
        variant="contained"
        disabled={!canEdit}
        onClick={() => enqueueSnackbar('Editando factura...', { variant: 'info' })}
      >
        Editar factura (demo)
      </Button>
      {!canEdit && (
        <Typography variant="caption" sx={{ ml: 2 }}>
          Modo lectura. No tienes permiso para editar.
        </Typography>
      )}
    </Box>
  );
};

export default Invoices;
