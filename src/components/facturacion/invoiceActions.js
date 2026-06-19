// Pure helpers for the invoices table: formatting + the per-invoice action list.
// No JSX here so it stays trivially unit-testable.

export const euroFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
});

export const formatInvoiceDate = (milliseconds) => {
  if (!milliseconds) return '';
  const date = new Date(milliseconds);
  return Number.isNaN(date.getTime()) ? String(milliseconds) : date.toLocaleDateString('es-ES');
};

export const STATE_LABELS = {
  PAID: 'Pagada',
  PENDING: 'Corporativa',
  SUBSTITUTED: 'Sustituida',
  RECTIFIED: 'Rectificada',
  REFUNDED: 'Abonada',
};

// Build the action list for an invoice, mirroring the legacy conditions.
// `handlers` = { onDownload(invoice, force), onSubstitute(invoice),
//                onRectify(invoice), onNegative(invoice), onRecalculate(invoice) }.
export const buildInvoiceActions = (invoice, handlers) => {
  const actions = [];
  const addAction = (key, label, onClick) => {
    if (!actions.some((action) => action.key === key)) actions.push({ key, label, onClick });
  };

  if (invoice.downloadAction) addAction('download', 'Descargar', () => handlers.onDownload(invoice, false));

  if (invoice.state === 'PAID' && !invoice.corporate) {
    if (!invoice.downloadAction) addAction('download', 'Descargar', () => handlers.onDownload(invoice, false));
    if (invoice.downloadForceOption) {
      addAction('regenerate', 'Regenerar factura', () => handlers.onDownload(invoice, true));
    }
    if (invoice.transactionType !== 'REFUND') {
      if (invoice.type === 'SIMPLIFIED') {
        addAction('complete', 'Generar factura completa', () => handlers.onSubstitute(invoice));
      } else if (['COMPLETE', 'RECTIFICATION', 'SUBSTITUTIVE'].includes(invoice.type)) {
        addAction('rectify', 'Cambiar datos fiscales', () => handlers.onRectify(invoice));
      }
    }
  }

  if (invoice.corporate && invoice.state === 'PENDING') {
    if (!invoice.downloadAction) addAction('download', 'Descargar', () => handlers.onDownload(invoice, false));
    if (invoice.downloadForceOption) {
      addAction('regenerate', 'Regenerar factura', () => handlers.onDownload(invoice, true));
    }
    if (['COMPLETE', 'RECTIFICATION'].includes(invoice.type)) {
      addAction('rectify', 'Cambiar datos fiscales', () => handlers.onRectify(invoice));
    }
    if (['CORPORATE', 'EMPRESALV', 'EMPLV_RECTI', 'CORP_RECTI'].includes(invoice.transactionType)) {
      addAction('negative', 'Generar abono', () => handlers.onNegative(invoice));
    }
  }

  if (
    !invoice.recalculateInvoiceAction &&
    (invoice.invoiceId?.includes('FS') || invoice.invoiceId?.includes('FO'))
  ) {
    addAction('recalculate', 'Recalcular factura', () => handlers.onRecalculate(invoice));
    if (!invoice.downloadForceOption) {
      addAction('regenerate', 'Regenerar factura', () => handlers.onDownload(invoice, true));
    }
  }

  return actions;
};
