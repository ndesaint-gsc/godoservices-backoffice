import * as yup from 'yup';

// The fiscal attributes the backoffice writes. The save endpoint blanks any
// attribute it doesn't receive, so the form always submits the full set.
// (address1_country is locked to ES and added at submit time, not a field.)
export const FISCAL_FORM_FIELDS = [
  'document_type',
  'document_id',
  'billing_email',
  'address1_first_name',
  'address1_last_name_first',
  'address1_last_name_second',
  'address1_street_type',
  'address1_street_name',
  'address1_street_number',
  'address1_floor',
  'address1_door',
  'address1_postcode',
  'address1_city',
];

// Personal last names are required only for a natural person (NIF), not a
// company (CIF) — the classic conditional-required the form library handles.
const requiredForNif = (schema, message) =>
  schema.when('document_type', {
    is: 'NIF',
    then: (field) => field.required(message),
  });

export const fiscalSchema = yup.object({
  document_type: yup.string().required('Selecciona el tipo de documento'),
  document_id: yup.string().trim().required('El documento es obligatorio'),
  billing_email: yup.string().trim().email('Email no válido'),
  address1_first_name: yup.string().trim().required('El nombre o razón social es obligatorio'),
  address1_last_name_first: requiredForNif(
    yup.string().trim(),
    'El primer apellido es obligatorio',
  ),
  address1_last_name_second: requiredForNif(
    yup.string().trim(),
    'El segundo apellido es obligatorio',
  ),
  address1_street_type: yup.string().required('Selecciona el tipo de vía'),
  address1_street_name: yup.string().trim().required('La vía es obligatoria'),
  address1_street_number: yup.string().trim().required('El número es obligatorio'),
  address1_floor: yup.string().trim(),
  address1_door: yup.string().trim(),
  address1_postcode: yup
    .string()
    .trim()
    .required('El código postal es obligatorio')
    .matches(/^\d{5}$/, 'Debe tener 5 dígitos'),
  address1_city: yup.string().trim().required('La ciudad es obligatoria'),
});

// Form defaults from the stored evUser; document type defaults to CIF (legacy).
export const buildFiscalDefaults = (evUser) => {
  const defaults = {};
  FISCAL_FORM_FIELDS.forEach((name) => {
    defaults[name] = evUser?.[name] ?? '';
  });
  if (!defaults.document_type) defaults.document_type = 'CIF';
  return defaults;
};

// Build the save payload: full field set + guid + fiscalEnabled, country locked
// to ES. For a legal person (CIF) the personal last names are cleared.
export const buildFiscalPayload = (guid, values, isLegalPerson) => {
  const payload = { guid, fiscalEnabled: 'true', ...values, address1_country: 'ES' };
  if (isLegalPerson) {
    payload.address1_last_name_first = '';
    payload.address1_last_name_second = '';
  }
  return payload;
};

// The patch applied to the store when a fiscal address is deleted (all blank).
export const buildBlankFiscalPatch = () => {
  const blank = { fiscalEnabled: 'false', address1_country: '' };
  FISCAL_FORM_FIELDS.forEach((name) => {
    blank[name] = '';
  });
  return blank;
};
