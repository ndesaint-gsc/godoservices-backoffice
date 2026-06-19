import { http } from '@/services/http';
import { apiUrl } from '@/services/endpoints';

const toQueryString = (params) => '?' + new URLSearchParams(params).toString();

// GET /perfil/evbk/invoices/get-invoices?guid=<guid> -> Invoice[] (JSON)
const getInvoices = (guid) =>
  http.get(apiUrl('/perfil/evbk/invoices/get-invoices' + toQueryString({ guid })));

const invoicePdfUrl = (transactionId, force = false) =>
  apiUrl(
    '/perfil/evbk/invoices/get-pdf' +
      toQueryString(force ? { transactionId, force: 'true' } : { transactionId }),
  );

// Direct-link download (the legacy mechanism, proven in production): a same-origin
// anchor with a `download` attribute. The browser fetches the proxied URL (sessionId
// injected by the dev proxy) and saves it as <fileName>.pdf. No blob URLs — those
// were being saved under their UUID with no extension.
const downloadInvoicePdf = (transactionId, fileName, force = false) => {
  const downloadLink = document.createElement('a');
  downloadLink.href = invoicePdfUrl(transactionId, force);
  downloadLink.download = (fileName || transactionId) + '.pdf';
  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();
};

// Generate complete / rectified / negative invoices. Each returns
// { newTransactionId, newInvoiceId } for the freshly generated document.
const substitute = (transactionId, guid) =>
  http.get(apiUrl('/perfil/evbk/invoices/substitutive' + toQueryString({ transactionId, guid })));

const rectify = (transactionId, guid) =>
  http.get(apiUrl('/perfil/evbk/invoices/rectification' + toQueryString({ transactionId, guid })));

const negative = (transactionId, guid) =>
  http.get(apiUrl('/perfil/evbk/invoices/negative' + toQueryString({ transactionId, guid })));

// Fiscal address — same endpoint the live backoffice uses. The backend writes
// EVERY fiscal attribute on each call (omitted fields are blanked), and reads
// the guid from the body, so always POST the FULL field set including guid.
const updateFiscalAddress = (fiscalAddress) =>
  http.post(apiUrl('/perfil/user/evbk/update-fiscal-address'), fiscalAddress);

// Clearing the fiscal address = POST with only the guid; the server then blanks
// all fiscal fields (there is no separate delete endpoint).
const deleteFiscalAddress = (guid) =>
  http.post(apiUrl('/perfil/user/evbk/update-fiscal-address'), { guid });

const billingService = {
  getInvoices,
  invoicePdfUrl,
  downloadInvoicePdf,
  substitute,
  rectify,
  negative,
  updateFiscalAddress,
  deleteFiscalAddress,
};

export default billingService;
