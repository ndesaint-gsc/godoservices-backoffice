import { TextField } from '@mui/material';

// Read/edit field: disabled (read-only) unless `editable`. Drives the per-domain
// read-vs-edit pattern — pass `editable={useHasPrivilege(Priv.EDIT_X)}`.
const FormField = ({ label, value, onChange, editable = false, ...rest }) => (
  <TextField
    label={label}
    value={value ?? ''}
    onChange={onChange}
    disabled={!editable}
    fullWidth
    size="small"
    InputLabelProps={{ shrink: true }}
    {...rest}
  />
);

export default FormField;
