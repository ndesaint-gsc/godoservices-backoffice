import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { buildFiscalDefaults, fiscalSchema } from './fiscalAddressSchema';

// Shared react-hook-form setup for the fiscal-address form, used by both the
// standalone card and the invoice-action dialog so they stay in sync.
// Returns the full useForm API plus a derived `isLegalPerson` (CIF) flag.
export const useFiscalAddressForm = (evUser) => {
  const form = useForm({
    resolver: yupResolver(fiscalSchema),
    defaultValues: buildFiscalDefaults(evUser),
  });
  const isLegalPerson = form.watch('document_type') === 'CIF';
  return { ...form, isLegalPerson };
};
