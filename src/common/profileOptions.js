import countriesData from '@/config/countries.es.json';
import streetTypesData from '@/config/streetTypes.es.json';

// Mirrors the legacy backoffice selects (BackofficeLayout.getGenders/getLanguages
// + data/countries.es.json). value = stored code, label = displayed text.
export const GENDERS = [
  { value: 'MALE', label: 'Hombre' },
  { value: 'FEMALE', label: 'Mujer' },
  { value: 'UNKNOWN', label: 'Desconocido' },
];

export const LANGUAGES = [
  { value: 'CA', label: 'Catalán' },
  { value: 'ES', label: 'Castellano' },
  { value: 'NA', label: 'Desconocido' },
];

// Countries sorted by Spanish name (the legacy combobox renders them alphabetically).
export const COUNTRIES = Object.entries(countriesData.countries)
  .map(([value, label]) => ({ value, label }))
  .sort((a, b) => a.label.localeCompare(b.label, 'es'));

// Fiscal document types. The legacy fiscal form only offers CIF (legal person)
// and NIF (natural person); the form shows different name fields per type.
export const DOCUMENT_TYPES = [
  { value: 'NIF', label: 'NIF / DNI' },
  { value: 'CIF', label: 'CIF' },
];

// Street types for the fiscal-address "tipo de vía" select (mirrors the legacy
// streetTypes.es.json, rendered alphabetically by label like the backoffice).
// TODO: replace this local copy with a backend catalog endpoint (web-core
// StreetsService) so it isn't duplicated per front-end.
export const STREET_TYPES = Object.entries(streetTypesData.streetTypes)
  .map(([value, label]) => ({ value, label }))
  .sort((a, b) => a.label.localeCompare(b.label, 'es'));
