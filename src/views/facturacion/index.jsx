import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Alert, Paper, Stack, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { selectCustomer } from '@/common/features/customer/customerSlice';
import { useHasPrivilege } from '@/common/permissions/useHasPrivilege';
import { Priv } from '@/common/permissions/privileges';
import billingService from '@/services/billing.service';
import FiscalAddressCard from '@/components/facturacion/FiscalAddressCard';
import FiscalAddressDialog from '@/components/facturacion/FiscalAddressDialog';
import InvoicesTable from '@/components/facturacion/InvoicesTable';

const Facturacion = () => {
  const { enqueueSnackbar } = useSnackbar();
  const customer = useSelector(selectCustomer);
  const canEdit = useHasPrivilege(Priv.EDIT_FACTURACION);
  const evUser = customer?.raw?.evUser || {};
  const guid = evUser.guid;

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningAction, setRunningAction] = useState(false);
  // The fiscal-data popup shared by the three generate actions. `request` is the
  // billing call to run after the fiscal data is saved (substitute/rectify/negative).
  const [fiscalDialog, setFiscalDialog] = useState({ open: false, invoice: null, request: null });

  const loadInvoices = () => {
    setLoading(true);
    return billingService
      .getInvoices(guid)
      .then((data) => setInvoices(Array.isArray(data) ? data : []))
      .catch((error) => {
        setInvoices([]);
        enqueueSnackbar('Error al cargar facturas: ' + error.message, { variant: 'error' });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    billingService
      .getInvoices(guid)
      .then((data) => active && setInvoices(Array.isArray(data) ? data : []))
      .catch(() => active && setInvoices([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [guid]);

  const downloadInvoice = async (invoice, force) => {
    try {
      await billingService.downloadInvoicePdf(invoice.transactionId, invoice.invoiceId, force);
    } catch (error) {
      enqueueSnackbar('Error al descargar: ' + error.message, { variant: 'error' });
    }
  };

  // substitute / rectify / negative: open the fiscal-data popup; the actual
  // generate call runs after the fiscal data is saved (see onFiscalConfirm).
  const openFiscalDialog = (invoice, request) =>
    setFiscalDialog({ open: true, invoice, request });
  const closeFiscalDialog = () => setFiscalDialog((previous) => ({ ...previous, open: false }));

  // Runs once the dialog has saved the fiscal data: generate the document with
  // the now-current fiscal data, download it, and refresh the list.
  const onFiscalConfirm = async () => {
    const { invoice, request } = fiscalDialog;
    setRunningAction(true);
    try {
      const result = await request(invoice.transactionId, guid);
      if (result?.newTransactionId) {
        await billingService.downloadInvoicePdf(result.newTransactionId, result.newInvoiceId);
      }
      enqueueSnackbar('Factura generada', { variant: 'success' });
      await loadInvoices();
    } finally {
      setRunningAction(false);
    }
  };

  // Recalcular still needs the line-item editor (backend JSON endpoint pending).
  const notifyRecalculatePending = () =>
    enqueueSnackbar(
      '«Recalcular factura» requiere el editor de líneas de factura (endpoint JSON pendiente en el backend).',
      { variant: 'info' },
    );

  const invoiceHandlers = {
    onDownload: downloadInvoice,
    onSubstitute: (invoice) => openFiscalDialog(invoice, billingService.substitute),
    onRectify: (invoice) => openFiscalDialog(invoice, billingService.rectify),
    onNegative: (invoice) => openFiscalDialog(invoice, billingService.negative),
    onRecalculate: notifyRecalculatePending,
  };

  return (
    <Stack spacing={3}>
      <FiscalAddressCard evUser={evUser} canEdit={canEdit} guid={guid} />

      <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
        <Typography variant="overline" color="text.secondary">
          Facturación
        </Typography>
        <Typography variant="h6" sx={{ mt: 0.25, mb: 1.5 }}>
          Facturas
        </Typography>

        <InvoicesTable
          invoices={invoices}
          loading={loading}
          canEdit={canEdit}
          runningAction={runningAction}
          handlers={invoiceHandlers}
        />

        <Alert severity="info" variant="outlined" sx={{ mt: 3 }}>
          «Recalcular factura» requiere el editor de líneas de factura, pendiente del endpoint JSON
          del backend.
        </Alert>
      </Paper>

      <FiscalAddressDialog
        open={fiscalDialog.open}
        onClose={closeFiscalDialog}
        evUser={evUser}
        guid={guid}
        title="Usar los siguientes datos fiscales"
        onConfirm={onFiscalConfirm}
      />
    </Stack>
  );
};

export default Facturacion;
