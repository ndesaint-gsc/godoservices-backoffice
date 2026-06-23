import { useSelector } from 'react-redux';
import { Paper, Stack, Typography } from '@mui/material';
import { selectCustomer } from '@/common/features/customer/customerSlice';
import subscriptionsService from '@/services/subscriptions.service';
import SubscriptionsTable from '@/components/suscripciones/SubscriptionsTable';
import { useSubscriptions } from '@/components/suscripciones/useSubscriptions';
import { formatDate, sortByStartDateDesc } from '@/components/suscripciones/format';

const printColumns = [
  { key: 'number', label: 'Nº Suscripción', render: (row) => row.number || row.id },
  { key: 'clientName', label: 'Cliente' },
  { key: 'publication', label: 'Publicación' },
  { key: 'role', label: 'Rol' },
  { key: 'frequency', label: 'Frecuencia' },
  { key: 'billing', label: 'Facturación' },
  { key: 'startDate', label: 'Inicio', render: (row) => formatDate(row.startDate) },
  { key: 'endDate', label: 'Fin', render: (row) => formatDate(row.endDate) },
  { key: 'active', label: 'Estado', render: (row) => (row.active ? 'Activa' : 'Inactiva') },
];

const beneficiaryColumns = [
  {
    key: 'product',
    label: 'Producto',
    render: (row) => row.product?.name || row.product?.productName || row.product?.description,
  },
  { key: 'subscriptionId', label: 'ID Suscripción' },
  { key: 'owner', label: 'Titular' },
  { key: 'startDate', label: 'Inicio', render: (row) => formatDate(row.startDate) },
  { key: 'endDate', label: 'Fin', render: (row) => formatDate(row.endDate) },
];

const SuscImpresas = () => {
  const customer = useSelector(selectCustomer);
  const guid = customer?.raw?.evUser?.guid;
  const print = useSubscriptions(subscriptionsService.getPrint, guid, 'suscripciones impresas');
  const beneficiary = useSubscriptions(
    subscriptionsService.getBeneficiary,
    guid,
    'suscripciones como beneficiario',
  );

  return (
    <Stack spacing={3}>
      <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
        <Typography variant="overline" color="text.secondary">
          Suscripciones
        </Typography>
        <Typography variant="h6" sx={{ mt: 0.25, mb: 1.5 }}>
          Impresas
        </Typography>
        <SubscriptionsTable
          columns={printColumns}
          rows={sortByStartDateDesc(print.data)}
          loading={print.loading}
          emptyText="El usuario no tiene suscripciones impresas."
        />
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
        <Typography variant="overline" color="text.secondary">
          Suscripciones
        </Typography>
        <Typography variant="h6" sx={{ mt: 0.25, mb: 1.5 }}>
          Como beneficiario
        </Typography>
        <SubscriptionsTable
          columns={beneficiaryColumns}
          rows={sortByStartDateDesc(beneficiary.data)}
          loading={beneficiary.loading}
          emptyText="El usuario no es beneficiario de ninguna suscripción."
        />
      </Paper>
    </Stack>
  );
};

export default SuscImpresas;
