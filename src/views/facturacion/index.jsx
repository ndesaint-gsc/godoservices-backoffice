import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Paper, Stack, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { selectCustomer } from '@/common/features/customer/customerSlice';
import { useActionAllowed, useFieldMode } from '@/common/permissions/permissions';
import billingService from '@/services/billing.service';
import FiscalAddressCard from '@/components/facturacion/FiscalAddressCard';
import FiscalAddressDialog from '@/components/facturacion/FiscalAddressDialog';
import InvoicesTable from '@/components/facturacion/InvoicesTable';
import RecalculateInvoiceDialog from '@/components/facturacion/RecalculateInvoiceDialog';

const Facturacion = () => {
  const { enqueueSnackbar } = useSnackbar();
  const customer = useSelector(selectCustomer);
  // Gating por acción del registry de permisos del backend (rol activo).
  const canSubstitute = useActionAllowed('facturacion.substitute');
  const canRectify = useActionAllowed('facturacion.rectify');
  const canNegative = useActionAllowed('facturacion.negative');
  const canRecalculate = useActionAllowed('facturacion.recalculate');
  const canFiscalEdit = useActionAllowed('facturacion.fiscalEdit');
  // Modo de campo de la dirección fiscal: 'editable' | 'viewable' | 'hidden'.
  const fiscalAddressMode = useFieldMode('facturacion.fiscalAddress');
  // Mapa de permisos por acción de fila, consumido por InvoicesTable para
  // deshabilitar visualmente cada item según su `perm`.
  const invoiceActionAllowed = {
    'facturacion.substitute': canSubstitute,
    'facturacion.rectify': canRectify,
    'facturacion.negative': canNegative,
    'facturacion.recalculate': canRecalculate,
  };
  const evUser = customer?.raw?.evUser || {};
  const guid = evUser.guid;

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningAction, setRunningAction] = useState(false);
  // The fiscal-data popup shared by the three generate actions. `request` is the
  // billing call to run after the fiscal data is saved (substitute/rectify/negative).
  const [fiscalDialog, setFiscalDialog] = useState({ open: false, invoice: null, request: null });
  // The recalculate editor popup; tracks which invoice is being recalculated.
  const [recalculateDialog, setRecalculateDialog] = useState({ open: false, invoice: null });

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
  const openFiscalDialog = (invoice, request) => setFiscalDialog({ open: true, invoice, request });
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

  // Recalcular: open the line-item editor; the save call runs on confirm.
  const openRecalculateDialog = (invoice) => setRecalculateDialog({ open: true, invoice });
  const closeRecalculateDialog = () =>
    setRecalculateDialog((previous) => ({ ...previous, open: false }));

  // Runs once the editor has been submitted with the edited lines: save the
  // recalculation, then (legacy behaviour) force-regenerate the PDF and refresh
  // the list. `lines` is the RecalculateInvoice[] built by the dialog.
  const onRecalculateConfirm = async (lines) => {
    const { invoice } = recalculateDialog;
    setRunningAction(true);
    try {
      await billingService.recalculateInvoice(invoice.transactionId, lines);
      enqueueSnackbar('Factura recalculada', { variant: 'success' });
      await loadInvoices();
      await billingService.downloadInvoicePdf(invoice.transactionId, invoice.invoiceId, true);
    } finally {
      setRunningAction(false);
    }
  };

  // Guarda una acción por permiso: si no está allowed, avisa y no la ejecuta.
  // TODO 2ª pasada: pasar estos flags a InvoicesTable para deshabilitar también el botón.
  const guardAction = (allowed, fn) => (invoice) => {
    if (!allowed) {
      enqueueSnackbar('No tienes permiso para esta acción', { variant: 'warning' });
      return;
    }
    fn(invoice);
  };

  const invoiceHandlers = {
    onDownload: downloadInvoice,
    onSubstitute: guardAction(canSubstitute, (invoice) =>
      openFiscalDialog(invoice, billingService.substitute),
    ),
    onRectify: guardAction(canRectify, (invoice) =>
      openFiscalDialog(invoice, billingService.rectify),
    ),
    onNegative: guardAction(canNegative, (invoice) =>
      openFiscalDialog(invoice, billingService.negative),
    ),
    onRecalculate: guardAction(canRecalculate, openRecalculateDialog),
  };

  return (
    <Stack spacing={3}>
      {/* Modo de campo: 'hidden' no renderiza el bloque fiscal; 'viewable' lo
          muestra en solo-lectura sin botón de edición; 'editable' como siempre. */}
      {fiscalAddressMode !== 'hidden' && (
        <FiscalAddressCard
          evUser={evUser}
          canEdit={canFiscalEdit && fiscalAddressMode === 'editable'}
          guid={guid}
        />
      )}

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
          runningAction={runningAction}
          handlers={invoiceHandlers}
          actionAllowed={invoiceActionAllowed}
        />
      </Paper>

      <FiscalAddressDialog
        open={fiscalDialog.open}
        onClose={closeFiscalDialog}
        evUser={evUser}
        guid={guid}
        title="Usar los siguientes datos fiscales"
        onConfirm={onFiscalConfirm}
      />

      <RecalculateInvoiceDialog
        open={recalculateDialog.open}
        transactionId={recalculateDialog.invoice?.transactionId}
        onClose={closeRecalculateDialog}
        onConfirm={onRecalculateConfirm}
      />
    </Stack>
  );
};

export default Facturacion;
