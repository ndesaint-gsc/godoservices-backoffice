import {
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import { sortByText } from '@/common/sort';

// Etiqueta visible de producto / plan de pago (displayName con fallback a name).
const offerItemText = (item) => item?.displayName || item?.name || '';

// Formulario de envío de oferta telemática (presentacional). El estado y el envío
// los gobierna la vista suscripciones/crear; aquí solo se pinta el form.
//
// Modos:
//  - withUser=false: email manual editable (sin usuario cargado).
//  - withUser=true:  el email es el del usuario cargado y se muestra deshabilitado.
//
// El select de plan de pago se filtra por el producto seleccionado: solo se ofrecen
// los paymentPlans de ese producto (mismo criterio que el BO antiguo).
const SendOfferForm = ({
  products,
  loading,
  sending,
  withUser,
  email,
  emailError,
  product,
  paymentPlan,
  onEmailChange,
  onEmailBlur,
  onProductChange,
  onPaymentPlanChange,
  onSubmit,
}) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  const sortedProducts = sortByText(products, offerItemText);
  const selectedProduct = products.find((candidate) => candidate.id === product);
  const paymentPlans = sortByText(selectedProduct?.paymentPlans || [], offerItemText);
  const canSubmit = Boolean(product) && Boolean(paymentPlan) && (withUser || !emailError);

  return (
    <Box component="form" onSubmit={onSubmit}>
      <Stack spacing={2.5}>
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          onBlur={onEmailBlur}
          error={emailError}
          helperText={
            withUser
              ? 'Se enviará al email del usuario cargado.'
              : emailError
                ? 'Introduce un email válido'
                : ''
          }
          disabled={withUser}
          fullWidth
          placeholder="ejemplo@correo.com"
        />

        <TextField
          select
          label="Producto"
          value={product}
          onChange={(event) => onProductChange(event.target.value)}
          fullWidth
        >
          <MenuItem value="" disabled>
            Selecciona un producto
          </MenuItem>
          {sortedProducts.map((productOption) => (
            <MenuItem key={productOption.id} value={productOption.id}>
              {productOption.displayName || productOption.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Plan de pago"
          value={paymentPlan}
          onChange={(event) => onPaymentPlanChange(event.target.value)}
          disabled={!product}
          fullWidth
          helperText={!product ? 'Selecciona antes un producto.' : ''}
        >
          <MenuItem value="" disabled>
            Selecciona un plan de pago
          </MenuItem>
          {paymentPlans.map((plan) => (
            <MenuItem key={plan.id} value={plan.id}>
              {plan.displayName || plan.name}
            </MenuItem>
          ))}
        </TextField>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            disabled={sending || !canSubmit}
            startIcon={sending ? <CircularProgress size={16} /> : null}
          >
            Enviar oferta
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

export default SendOfferForm;
