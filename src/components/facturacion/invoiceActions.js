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
// Each action carries a `perm` tag (the permission action key that gates it, or
// null for the always-available download/regenerate) so the table can disable
// the menu item visually per `useActionAllowed`.
export const buildInvoiceActions = (invoice, handlers) => {
  const actions = [];
  const addAction = (key, label, onClick, perm = null) => {
    if (!actions.some((action) => action.key === key)) actions.push({ key, label, onClick, perm });
  };

  if (invoice.downloadAction)
    addAction('download', 'Descargar', () => handlers.onDownload(invoice, false));

  if (invoice.state === 'PAID' && !invoice.corporate) {
    if (!invoice.downloadAction)
      addAction('download', 'Descargar', () => handlers.onDownload(invoice, false));
    if (invoice.downloadForceOption) {
      addAction('regenerate', 'Regenerar factura', () => handlers.onDownload(invoice, true));
    }
    if (invoice.transactionType !== 'REFUND') {
      if (invoice.type === 'SIMPLIFIED') {
        addAction(
          'complete',
          'Generar factura completa',
          () => handlers.onSubstitute(invoice),
          'facturacion.substitute',
        );
      } else if (['COMPLETE', 'RECTIFICATION', 'SUBSTITUTIVE'].includes(invoice.type)) {
        addAction(
          'rectify',
          'Cambiar datos fiscales',
          () => handlers.onRectify(invoice),
          'facturacion.rectify',
        );
      }
    }
  }

  if (invoice.corporate && invoice.state === 'PENDING') {
    if (!invoice.downloadAction)
      addAction('download', 'Descargar', () => handlers.onDownload(invoice, false));
    if (invoice.downloadForceOption) {
      addAction('regenerate', 'Regenerar factura', () => handlers.onDownload(invoice, true));
    }
    if (['COMPLETE', 'RECTIFICATION'].includes(invoice.type)) {
      addAction(
        'rectify',
        'Cambiar datos fiscales',
        () => handlers.onRectify(invoice),
        'facturacion.rectify',
      );
    }
    if (['CORPORATE', 'EMPRESALV', 'EMPLV_RECTI', 'CORP_RECTI'].includes(invoice.transactionType)) {
      addAction(
        'negative',
        'Generar abono',
        () => handlers.onNegative(invoice),
        'facturacion.negative',
      );
    }
  }

  if (
    !invoice.recalculateInvoiceAction &&
    (invoice.invoiceId?.includes('FS') || invoice.invoiceId?.includes('FO'))
  ) {
    addAction(
      'recalculate',
      'Recalcular factura',
      () => handlers.onRecalculate(invoice),
      'facturacion.recalculate',
    );
    if (!invoice.downloadForceOption) {
      addAction('regenerate', 'Regenerar factura', () => handlers.onDownload(invoice, true));
    }
  }

  return actions;
};
