// Adaptador fino sobre el authService del edge-console-sdk (auth real contra Evolok).
// Lo usan http.js (getAuthToken/logout en el 401) y authSlice (login/logout).
import { consoleAuthService } from '@/services/console';

// { sessionId, guid, operator, groups } — 2 pasos contra Evolok (ver edge-console-sdk/auth.service.js).
const login = (email, password) => consoleAuthService.login(email, password);

const logout = async () => {
  consoleAuthService.logout();
  return true;
};

// sessionId de Evolok de la sesión actual (o null). En Fase 2 http.js lo mandará como ?sessionId=.
const getAuthToken = () => consoleAuthService.getAuthToken();

// Rehidratación del authService del SDK desde el snapshot persistido (App.jsx al arrancar).
const setSession = (snapshot) => consoleAuthService.setSession(snapshot);

const authService = { login, logout, getAuthToken, setSession };
export default authService;
