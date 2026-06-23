// Pure helpers for the recalculate-invoice editor: line state building, the
// derived IVA/import math, and the date validation. No JSX so it stays
// trivially unit-testable. Mirrors the legacy recalculateInvoiceModal logic
// (backofficeInvoicesManager.js): per-line base/ivaPercentage are edited, the
// import column is derived, and the period must be <= 365 days.

const MILLISECONDS_PER_YEAR = 365 * 24 * 60 * 60 * 1000;

// The GET returns ISO datetime strings for start/end; the native date input
// works in "YYYY-MM-DD". Convert both ways.
export const toDateInputValue = (isoValue) =>
  isoValue ? String(isoValue).slice(0, 10) : '';

// Build editable line state from the recalculate-data payload. Each line keeps
// the editable fields (base, ivaPercentage, startDate, endDate) plus the
// original values for the read-only "Actual" column.
export const buildRecalculateLines = (data) => {
  const list = Array.isArray(data?.recalculateInvoiceList) ? data.recalculateInvoiceList : [];
  const sharedStart = toDateInputValue(data?.startDate);
  const sharedEnd = toDateInputValue(data?.endDate);
  return list.map((line) => ({
    invoiceId: line.invoiceId ?? data?.invoiceId ?? '',
    originalBase: line.base,
    originalIvaPercentage: line.ivaPercentage,
    originalIvaImport: line.ivaImport,
    originalImporte: line.importe,
    base: line.base != null ? String(line.base) : '',
    ivaPercentage: line.ivaPercentage != null ? String(line.ivaPercentage) : '',
    // Each line shows the subscription period; the legacy form drives start/end
    // per line (the period is shared but edited on every bundle row).
    startDate: toDateInputValue(line.startDate) || sharedStart,
    endDate: toDateInputValue(line.endDate) || sharedEnd,
  }));
};

const parseNumber = (value) => {
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

// ivaImport = base * ivaPercentage / 100; importe = base + ivaImport.
export const lineIvaImport = (line) =>
  (parseNumber(line.base) * parseNumber(line.ivaPercentage)) / 100;

export const lineImporte = (line) => parseNumber(line.base) + lineIvaImport(line);

// Totals across all lines (the legacy footer: base imponible / total IVA / total).
export const totalBase = (lines) => lines.reduce((sum, line) => sum + parseNumber(line.base), 0);
export const totalIva = (lines) => lines.reduce((sum, line) => sum + lineIvaImport(line), 0);
export const totalInvoice = (lines) => totalBase(lines) + totalIva(lines);

// Base must be a positive number with at most 2 decimals (legacy "#.##").
export const isValidBase = (value) => /^\d+(\.\d{1,2})?$/.test(String(value).trim());

// IVA must be an integer 0-99 (legacy validateIVAField).
export const isValidIva = (value) => {
  const text = String(value).trim();
  if (!/^\d+$/.test(text)) return false;
  const number = Number(text);
  return number >= 0 && number <= 99;
};

// Period must be present, start < end, and span <= 365 days (legacy datesYearValidation).
export const isValidPeriod = (startDate, endDate) => {
  if (!startDate || !endDate) return false;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
  const difference = end - start;
  return difference > 0 && difference <= MILLISECONDS_PER_YEAR;
};

export const isLineValid = (line) =>
  isValidBase(line.base) &&
  isValidIva(line.ivaPercentage) &&
  isValidPeriod(line.startDate, line.endDate);

export const areLinesValid = (lines) => lines.length > 0 && lines.every(isLineValid);

// Build the POST body: a RecalculateInvoice[] with the edited values. Dates are
// sent as ISO strings (legacy convertToIso) and the derived import fields are
// recomputed so the payload is self-consistent.
export const buildRecalculatePayload = (lines) =>
  lines.map((line) => ({
    invoiceId: line.invoiceId,
    base: parseNumber(line.base),
    ivaPercentage: parseNumber(line.ivaPercentage),
    ivaImport: lineIvaImport(line),
    importe: lineImporte(line),
    startDate: new Date(line.startDate).toISOString(),
    endDate: new Date(line.endDate).toISOString(),
  }));
