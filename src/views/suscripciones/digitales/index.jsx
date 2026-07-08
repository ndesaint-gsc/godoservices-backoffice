import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Button, Paper, Typography } from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import { selectCustomer } from '@/common/features/customer/customerSlice';
import { useActionAllowed } from '@/common/permissions/permissions';
import subscriptionsService from '@/services/subscriptions.service';
import SubscriptionsTable from '@/components/suscripciones/SubscriptionsTable';
import { useSubscriptions } from '@/components/suscripciones/useSubscriptions';
import { formatDate, sortByStartDateDesc } from '@/components/suscripciones/format';
import BeneficiariesDialog from '@/components/beneficiaries/BeneficiariesDialog';

// Una suscripción admite beneficiarios si es corporativa o ya los tiene.
const supportsBeneficiaries = (row) => row.corporate || row.hasBeneficiaries;

const SuscDigitales = () => {
  const customer = useSelector(selectCustomer);
  const guid = customer?.raw?.evUser?.guid;
  // Gating por ACCIÓN (default-deny, rol activo) de cada acción de beneficiarios.
  const beneficiaryActions = {
    add: useActionAllowed('suscripciones.beneficiaryAdd'),
    delete: useActionAllowed('suscripciones.beneficiaryDelete'),
    import: useActionAllowed('suscripciones.beneficiaryImport'),
    export: useActionAllowed('suscripciones.beneficiaryExport'),
  };
  const { data, loading } = useSubscriptions(
    subscriptionsService.getDigital,
    guid,
    'suscripciones digitales',
  );

  // Suscripción seleccionada para gestionar sus beneficiarios (abre el dialog).
  const [selected, setSelected] = useState(null);

  const columns = [
    { key: 'productName', label: 'Producto' },
    { key: 'paymentPlan', label: 'Plan de pago' },
    { key: 'role', label: 'Rol' },
    { key: 'status', label: 'Estado' },
    { key: 'startDate', label: 'Inicio', render: (row) => formatDate(row.startDate) },
    { key: 'endDate', label: 'Fin', render: (row) => formatDate(row.endDate) },
    { key: 'beneficiaries', label: 'Beneficiarios', align: 'right' },
    {
      key: 'beneficiariesAction',
      label: '',
      align: 'right',
      render: (row) =>
        supportsBeneficiaries(row) ? (
          <Button
            size="small"
            variant="outlined"
            startIcon={<GroupIcon fontSize="small" />}
            onClick={() => setSelected(row)}
          >
            Beneficiarios
          </Button>
        ) : null,
    },
  ];

  return (
    <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
      <Typography variant="overline" color="text.secondary">
        Suscripciones
      </Typography>
      <Typography variant="h6" sx={{ mt: 0.25, mb: 1.5 }}>
        Digitales
      </Typography>
      <SubscriptionsTable
        columns={columns}
        rows={sortByStartDateDesc(data)}
        loading={loading}
        emptyText="El usuario no tiene suscripciones digitales."
      />
      <BeneficiariesDialog
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        guid={guid}
        subscription={selected}
        actions={beneficiaryActions}
      />
    </Paper>
  );
};

export default SuscDigitales;
