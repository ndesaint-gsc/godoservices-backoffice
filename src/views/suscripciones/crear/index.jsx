import { useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Alert, Box, Paper, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { selectCustomer } from '@/common/features/customer/customerSlice';
import { useHasPrivilege } from '@/common/permissions/useHasPrivilege';
import { useActionAllowed } from '@/common/permissions/permissions';
import { Priv } from '@/common/permissions/privileges';
import { ModalContext } from '@/common/providers/ModalProvider';
import telemarketingService from '@/services/telemarketing.service';
import SendOfferForm from '@/components/suscripciones/SendOfferForm';

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// El backend devuelve 403 con { errorMessage } en caso de fallo (mismo formato que
// crear-usuario): el error de http.js trae "<status>: <body JSON>".
const readErrorMessage = (error) => {
  const rawMessage = error?.message || '';
  const jsonPart = rawMessage.slice(rawMessage.indexOf('{'));
  try {
    return JSON.parse(jsonPart).errorMessage || rawMessage;
  } catch {
    return rawMessage;
  }
};

const SuscCrear = () => {
  const { enqueueSnackbar } = useSnackbar();
  const modal = useContext(ModalContext);
  const customer = useSelector(selectCustomer);
  // Enviar oferta combina el privilegio de edición con la acción (default-deny).
  // OJO: el fichero vive en suscripciones/crear pero la clave es herramientas.sendOffer.
  const hasEditPriv = useHasPrivilege(Priv.EDIT_SUSCRIPCIONES);
  const canSendOffer = useActionAllowed('herramientas.sendOffer');
  const canEdit = hasEditPriv && canSendOffer;

  const evUser = customer?.raw?.evUser || {};
  const guid = evUser.guid;
  // Con usuario cargado se envía a su email/guid; sin usuario, email manual.
  const withUser = Boolean(guid);
  const customerEmail = customer?.email || evUser.email_address || '';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [email, setEmail] = useState('');
  const [product, setProduct] = useState('');
  const [paymentPlan, setPaymentPlan] = useState('');
  const [touched, setTouched] = useState(false);

  // El email mostrado/enviado: el del usuario cargado, o el introducido a mano.
  const offerEmail = withUser ? customerEmail : email;
  const emailError = !withUser && touched && !isValidEmail(email.trim());

  useEffect(() => {
    let active = true;
    setLoading(true);
    telemarketingService
      .getProducts()
      .then((data) => active && setProducts(Array.isArray(data) ? data : []))
      .catch((error) => {
        if (!active) return;
        setProducts([]);
        enqueueSnackbar('Error al cargar productos: ' + error.message, { variant: 'error' });
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Al cambiar de producto, el plan deja de ser válido (cada producto tiene los suyos).
  const onProductChange = (value) => {
    setProduct(value);
    setPaymentPlan('');
  };

  const resetForm = () => {
    setProduct('');
    setPaymentPlan('');
    if (!withUser) setEmail('');
    setTouched(false);
  };

  const confirmSend = (event) => {
    event.preventDefault();
    setTouched(true);
    if (!withUser && !isValidEmail(email.trim())) return;
    if (!product || !paymentPlan) return;

    const targetEmail = (withUser ? customerEmail : email).trim();
    const productName =
      products.find((candidate) => candidate.id === product)?.displayName || product;

    modal.show({
      title: 'Enviar oferta',
      content: `Se enviará la oferta de «${productName}» a ${targetEmail}. ¿Continuar?`,
      confirmText: 'Enviar',
      onSubmit: async () => {
        setSending(true);
        try {
          await telemarketingService.sendOffer({
            guid: withUser ? guid : '',
            emailTelemarketing: targetEmail,
            product,
            paymentPlan,
          });
          enqueueSnackbar('Oferta enviada correctamente', { variant: 'success' });
          resetForm();
        } catch (error) {
          enqueueSnackbar('Error al enviar la oferta: ' + readErrorMessage(error), {
            variant: 'error',
          });
        } finally {
          setSending(false);
        }
      },
    });
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="overline" color="text.secondary">
          Suscripciones · Telemarketing
        </Typography>
        <Typography variant="h4" sx={{ mt: 0.25 }}>
          Enviar oferta
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {withUser
            ? 'Se enviará la oferta telemática al usuario cargado.'
            : 'Envía una oferta telemática a un email (sin usuario cargado).'}
        </Typography>
      </Box>

      {!canEdit ? (
        <Alert severity="info" variant="outlined">
          No tienes permiso para enviar ofertas.
        </Alert>
      ) : (
        <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 }, maxWidth: 640 }}>
          <SendOfferForm
            products={products}
            loading={loading}
            sending={sending}
            withUser={withUser}
            email={offerEmail}
            emailError={emailError}
            product={product}
            paymentPlan={paymentPlan}
            onEmailChange={setEmail}
            onEmailBlur={() => setTouched(true)}
            onProductChange={onProductChange}
            onPaymentPlanChange={setPaymentPlan}
            onSubmit={confirmSend}
          />
        </Paper>
      )}
    </Box>
  );
};

export default SuscCrear;
