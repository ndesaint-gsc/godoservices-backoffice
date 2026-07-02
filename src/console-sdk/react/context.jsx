// console-sdk/react/context.jsx
// Adaptador React OPCIONAL del SDK. Mantiene el SDK core agnóstico de React/redux: el snapshot de
// permisos se inyecta vía `value`, así la app decide de dónde sale (redux, estado propio, sdk.auth…).

import { createContext, useContext, useMemo } from 'react';

const ConsoleContext = createContext({ permissions: null, role: null, roles: [] });

export function ConsoleProvider({ value, children }) {
  const permissions = value?.permissions ?? null;
  const role = value?.role ?? null;
  const roles = value?.roles ?? (role ? [role] : []);
  const snapshot = useMemo(() => ({ permissions, role, roles }), [permissions, role, roles]);
  return <ConsoleContext.Provider value={snapshot}>{children}</ConsoleContext.Provider>;
}

export const useConsole = () => useContext(ConsoleContext);

export { ConsoleContext };
