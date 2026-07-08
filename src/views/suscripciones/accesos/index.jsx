import { useContext, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { selectCustomer, setCustomer } from '@/common/features/customer/customerSlice';
import { useActionAllowed } from '@/common/permissions/permissions';
import { ModalContext } from '@/common/providers/ModalProvider';
import userService from '@/services/user.service';
import subscriptionsService from '@/services/subscriptions.service';
import CreateAccessDialog from '@/components/roles/CreateAccessDialog';

const formatDate = (milliseconds) => {
  if (!milliseconds) return null;
  const date = new Date(milliseconds);
  return Number.isNaN(date.getTime()) ? String(milliseconds) : date.toLocaleDateString('es-ES');
};

const Accesos = () => {
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const modal = useContext(ModalContext);
  const customer = useSelector(selectCustomer);
  // Gating por ACCIÓN (default-deny, rol activo): crear acceso temporal / revocar.
  const canRoleCreate = useActionAllowed('suscripciones.roleCreate');
  const canRoleRevoke = useActionAllowed('suscripciones.roleRevoke');
  const [revoking, setRevoking] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const evUser = customer?.raw?.evUser || {};
  const roleAssignments = evUser.roleAssignments || [];

  const refreshCustomer = async () => {
    const freshCustomer = await userService.searchByEmail(evUser.guid);
    if (freshCustomer) dispatch(setCustomer(freshCustomer));
  };

  const confirmRevoke = (roleAssignment) => {
    modal.show({
      title: 'Revocar acceso temporal',
      content: `Se va a revocar el acceso con el rol ${roleAssignment.roleName}. ¿Continuar?`,
      confirmText: 'Revocar',
      variant: 'error',
      onSubmit: async () => {
        setRevoking(true);
        try {
          await subscriptionsService.revokeRole(roleAssignment.roleName, evUser);
          enqueueSnackbar('Acceso revocado', { variant: 'success' });
          await refreshCustomer();
        } catch (error) {
          enqueueSnackbar('Error: ' + error.message, { variant: 'error' });
        } finally {
          setRevoking(false);
        }
      },
    });
  };

  const handleCreated = async () => {
    setCreateOpen(false);
    await refreshCustomer();
  };

  return (
    <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            Suscripciones
          </Typography>
          <Typography variant="h6" sx={{ mt: 0.25 }}>
            Accesos temporales
          </Typography>
        </Box>
        {canRoleCreate && (
          <Button variant="contained" onClick={() => setCreateOpen(true)}>
            Crear acceso temporal
          </Button>
        )}
      </Stack>

      {roleAssignments.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No hay accesos digitales temporales a mostrar.
        </Typography>
      ) : (
        <List disablePadding>
          {roleAssignments.map((roleAssignment, index) => {
            const isTemporal = roleAssignment.endDate > 0;
            return (
              <Box key={roleAssignment.roleName + index}>
                {index > 0 && <Divider />}
                <ListItem
                  disableGutters
                  sx={{ py: 1.5, display: 'flex', justifyContent: 'space-between', gap: 2 }}
                  secondaryAction={
                    canRoleRevoke && isTemporal ? (
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        disabled={revoking}
                        onClick={() => confirmRevoke(roleAssignment)}
                      >
                        Revocar
                      </Button>
                    ) : null
                  }
                >
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography sx={{ fontWeight: 600 }}>{roleAssignment.roleName}</Typography>
                      {!isTemporal && <Chip size="small" label="Permanente" variant="outlined" />}
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      Desde {formatDate(roleAssignment.startDate) || '—'}
                      {isTemporal ? ` · Hasta ${formatDate(roleAssignment.endDate)}` : ''}
                    </Typography>
                  </Box>
                </ListItem>
              </Box>
            );
          })}
        </List>
      )}

      {canRoleCreate && (
        <CreateAccessDialog
          open={createOpen}
          evUser={evUser}
          onClose={() => setCreateOpen(false)}
          onCreated={handleCreated}
        />
      )}
    </Paper>
  );
};

export default Accesos;
