import { Controller } from 'react-hook-form';
import { Box, MenuItem, TextField } from '@mui/material';
import { DOCUMENT_TYPES, STREET_TYPES } from '@/common/profileOptions';

const gridStyles = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
  gap: 2.5,
  mt: 1.5,
};

// One react-hook-form Controller-bound MUI field. Selects pass `select` + children.
const ControlledField = ({ control, errors, name, label, disabled, select, children, ...rest }) => (
  <Controller
    name={name}
    control={control}
    render={({ field }) => (
      <TextField
        {...field}
        label={label}
        select={select}
        disabled={disabled}
        fullWidth
        size="small"
        InputLabelProps={{ shrink: true }}
        error={!!errors[name]}
        helperText={errors[name]?.message}
        {...rest}
      >
        {children}
      </TextField>
    )}
  />
);

// Presentational fiscal-address fields driven by react-hook-form. The parent
// owns the form (useForm + schema); this only lays out the inputs.
// `isLegalPerson` (CIF) hides the personal last-name fields, mirroring the
// legacy form's CIF/NIF conditional layout.
const FiscalAddressForm = ({ control, errors, isLegalPerson, disabled }) => {
  const fieldProps = { control, errors, disabled };
  return (
    <Box sx={gridStyles}>
      <ControlledField {...fieldProps} name="document_type" label="Tipo documento" select>
        {DOCUMENT_TYPES.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </ControlledField>
      <ControlledField {...fieldProps} name="document_id" label="Documento" />
      <ControlledField {...fieldProps} name="billing_email" label="Email facturación" />
      <ControlledField
        {...fieldProps}
        name="address1_first_name"
        label={isLegalPerson ? 'Razón social' : 'Nombre'}
      />
      {!isLegalPerson && (
        <ControlledField {...fieldProps} name="address1_last_name_first" label="Primer apellido" />
      )}
      {!isLegalPerson && (
        <ControlledField
          {...fieldProps}
          name="address1_last_name_second"
          label="Segundo apellido"
        />
      )}
      <ControlledField {...fieldProps} name="address1_street_type" label="Tipo de vía" select>
        <MenuItem value="">
          <em>Seleccionar…</em>
        </MenuItem>
        {STREET_TYPES.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </ControlledField>
      <ControlledField {...fieldProps} name="address1_street_name" label="Nombre de la vía" />
      <ControlledField {...fieldProps} name="address1_street_number" label="Número" />
      <ControlledField {...fieldProps} name="address1_floor" label="Piso" />
      <ControlledField {...fieldProps} name="address1_door" label="Puerta" />
      <ControlledField {...fieldProps} name="address1_postcode" label="Código postal" />
      <ControlledField {...fieldProps} name="address1_city" label="Ciudad" />
      {/* Country is locked to Spain, matching the legacy fiscal form. */}
      <TextField
        label="País"
        value="España"
        disabled
        fullWidth
        size="small"
        InputLabelProps={{ shrink: true }}
      />
    </Box>
  );
};

export default FiscalAddressForm;
