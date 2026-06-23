import { http } from '@/services/http';
import { apiUrl } from '@/services/endpoints';

// Telemarketing / Enviar oferta. Base /perfil/console/user (mismo controlador que
// suscripciones/facturación: ConsoleUserController).

// GET /perfil/console/user/products -> Product[] (catálogo de productos telemáticos).
// Cada Product trae: { id, name, displayName, paymentPlans: [{ id, name, displayName }, ...] }.
// El select de planes se filtra por product.name (igual que el BO antiguo agrupaba
// las opciones de paymentPlan por el name del producto).
const getProducts = () => http.get(apiUrl('/perfil/console/user/products'));

// POST /perfil/console/user/send-offer/  body: TelematicPurchase
//   { guid, emailTelemarketing, product, paymentPlan }
// donde `product` y `paymentPlan` son los IDs seleccionados. Sin usuario cargado el
// guid va vacío y manda el email manual; con usuario cargado va su guid (y su email).
// Respuesta OK (200) o 403 con { errorMessage } — se maneja como en crear-usuario.
const sendOffer = ({ guid, emailTelemarketing, product, paymentPlan }) =>
  http.post(apiUrl('/perfil/console/user/send-offer/'), {
    guid: guid || '',
    emailTelemarketing: emailTelemarketing || '',
    product,
    paymentPlan,
  });

const telemarketingService = { getProducts, sendOffer };

export default telemarketingService;
