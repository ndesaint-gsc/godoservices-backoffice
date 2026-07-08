import { useContext, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useSnackbar } from 'notistack';
import { ModalContext } from '@/common/providers/ModalProvider';
import { sortByText } from '@/common/sort';
import SubscriptionsTable from '@/components/suscripciones/SubscriptionsTable';
import beneficiariesService from '@/services/beneficiaries.service';
import { useBeneficiaries } from './useBeneficiaries';
import AddBeneficiaryForm from './AddBeneficiaryForm';
import ImportBeneficiariesForm from './ImportBeneficiariesForm';

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Panel de gestión de beneficiarios de UNA suscripción corporativa/digital.
// Pestañas: Lista (tabla + borrar), Añadir (form individual), Importar (CSV async),
// Exportar (pide email, async). Los mensajes de import/export avisan de que el
// resultado llegará por email. El borrado se confirma vía el ModalProvider global.
// `actions` = gating por ACCIÓN (default-deny, rol activo) de cada operación de beneficiarios:
// { add, delete, import, export }. Cada control se rige por su propia acción.
const BeneficiariesDialog = ({ open, onClose, guid, subscription, actions = {} }) => {
  const { enqueueSnackbar } = useSnackbar();
  const modal = useContext(ModalContext);
  const canAdd = !!actions.add;
  const canDelete = !!actions.delete;
  const canImport = !!actions.import;
  const canExport = !!actions.export;
  const [tab, setTab] = useState('list');
  const [exportEmail, setExportEmail] = useState('');
  const [exporting, setExporting] = useState(false);

  // subscriptionId que esperan los endpoints de beneficiarios = purchaseId de la
  // suscripción (el modelo Beneficiary mapea subscriptionId<-purchaseId). Fallback a orderId.
  const subscriptionId = subscription?.purchaseId || subscription?.orderId || '';

  const { data, loading, reload } = useBeneficiaries(guid, subscriptionId, open);

  const handleAdd = async (beneficiary) => {
    try {
      await beneficiariesService.add(guid, beneficiary);
      enqueueSnackbar('Beneficiario añadido correctamente.', { variant: 'success' });
      await reload();
    } catch (error) {
      enqueueSnackbar('Error al añadir el beneficiario: ' + error.message, {
        variant: 'error',
      });
    }
  };

  const confirmRemove = (beneficiary) => {
    modal.show({
      title: 'Eliminar beneficiario',
      content: `Se va a eliminar al beneficiario ${beneficiary.email || ''}. ¿Continuar?`,
      confirmText: 'Eliminar',
      variant: 'error',
      onSubmit: async () => {
        try {
          await beneficiariesService.remove(guid, subscriptionId, beneficiary.key);
          enqueueSnackbar('Beneficiario eliminado correctamente.', { variant: 'success' });
          await reload();
        } catch (error) {
          enqueueSnackbar('Error al eliminar el beneficiario: ' + error.message, {
            variant: 'error',
          });
        }
      },
    });
  };

  const handleImport = async (payload) => {
    try {
      await beneficiariesService.importFile(guid, payload);
      enqueueSnackbar('Petición de importación enviada. El resultado se enviará por email.', {
        variant: 'success',
      });
      // El alta es asíncrona; recargamos por si algunos ya se reflejan.
      await reload();
    } catch (error) {
      enqueueSnackbar('Error al importar el fichero: ' + error.message, {
        variant: 'error',
      });
    }
  };

  const handleExport = async (event) => {
    event.preventDefault();
    const email = exportEmail.trim();
    if (!isValidEmail(email) || exporting) return;
    setExporting(true);
    try {
      await beneficiariesService.exportFile(guid, { subscriptionId, email });
      enqueueSnackbar('Petición de exportación enviada. El fichero se enviará por email.', {
        variant: 'success',
      });
      setExportEmail('');
    } catch (error) {
      enqueueSnackbar('Error al exportar la lista: ' + error.message, {
        variant: 'error',
      });
    } finally {
      setExporting(false);
    }
  };

  const columns = [
    { key: 'email', label: 'Email' },
    { key: 'roleName', label: 'Rol' },
    { key: 'externalRef', label: 'Ref. externa' },
    { key: 'grantStatus', label: 'Estado', render: (row) => row.grantStatus || 'PENDING' },
    ...(canDelete
      ? [
          {
            key: 'actions',
            label: '',
            align: 'right',
            render: (row) => (
              <Tooltip title={row.key ? 'Eliminar' : 'No borrable (pendiente sin grant)'}>
                <span>
                  <IconButton
                    size="small"
                    color="error"
                    disabled={!row.key}
                    onClick={() => confirmRemove(row)}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            ),
          },
        ]
      : []),
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        Beneficiarios
        <Typography variant="body2" color="text.secondary">
          {subscription?.productName || subscriptionId}
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
          aria-label="Cerrar"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Tabs value={tab} onChange={(event, value) => setTab(value)} sx={{ mb: 2 }}>
          <Tab value="list" label="Lista" />
          {canAdd && <Tab value="add" label="Añadir" />}
          {canImport && <Tab value="import" label="Importar CSV" />}
          {canExport && <Tab value="export" label="Exportar" />}
        </Tabs>

        {tab === 'list' && (
          <SubscriptionsTable
            columns={columns}
            rows={sortByText(data, (row) => row?.email ?? '')}
            loading={loading}
            emptyText="Esta suscripción no tiene beneficiarios."
          />
        )}

        {tab === 'add' && canAdd && (
          <Box sx={{ pt: 1 }}>
            <AddBeneficiaryForm subscriptionId={subscriptionId} onAdd={handleAdd} />
          </Box>
        )}

        {tab === 'import' && canImport && (
          <Box sx={{ pt: 1 }}>
            <ImportBeneficiariesForm
              subscriptionId={subscriptionId}
              roleName={subscription?.role}
              onImport={handleImport}
            />
          </Box>
        )}

        {tab === 'export' && canExport && (
          <Box component="form" onSubmit={handleExport} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Genera la lista de beneficiarios. El proceso es asíncrono: el fichero se enviará por
              email.
            </Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              alignItems={{ sm: 'center' }}
            >
              <TextField
                label="Email para el fichero"
                type="email"
                size="small"
                value={exportEmail}
                onChange={(event) => setExportEmail(event.target.value)}
                placeholder="ejemplo@correo.com"
                disabled={exporting}
                sx={{ flexGrow: 1 }}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={!isValidEmail(exportEmail.trim()) || exporting}
              >
                Exportar
              </Button>
            </Stack>
          </Box>
        )}

        <Divider sx={{ mt: 3 }} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cerrar
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default BeneficiariesDialog;
