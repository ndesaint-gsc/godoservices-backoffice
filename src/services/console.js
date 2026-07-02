// Singleton del console-sdk para esta app (plano sesión). Los servicios y el authSlice delegan aquí.
import { createConsole } from '@/console-sdk';
import { APP_ID } from '@/common/permissions/permissions';
import authService from '@/services/auth.service';

const sdk = createConsole({
  appId: APP_ID,
  // sesión por cookie ev_gg_bo (el proxy Vite la inyecta como ?sessionId= en DEV).
  onUnauthorized: () => {
    authService.logout();
  },
});

export default sdk;
