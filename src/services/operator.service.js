// Delegación fina al console-sdk. Mantiene la firma para no tocar authSlice.
import sdk from '@/services/console';

// GET /perfil/console/auth/me -> { operator, role, roles, permissions }
// `app` se ignora (el sdk ya lo tiene); `roleOverride` solo DEV.
const getMe = (app, roleOverride) => sdk.auth.getMe(roleOverride);

const operatorService = { getMe };
export default operatorService;
