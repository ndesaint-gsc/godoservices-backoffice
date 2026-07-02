// console-sdk/react/hooks.js
// Hooks finos: leen el snapshot del ConsoleContext y delegan en las funciones puras de verify.js /
// keys.js. Ningún acoplamiento a redux ni al shape state.auth.* — eso queda del lado de la app, que
// alimenta el <ConsoleProvider>.

import { useConsole } from './context';
import { tabVisible, actionAllowed, fieldMode } from '../verify';
import { hasPrivilege } from '../keys';

export const useTabVisible = (tabKey) => tabVisible(useConsole().permissions, tabKey);
export const useActionAllowed = (actionKey) => actionAllowed(useConsole().permissions, actionKey);
export const useFieldMode = (fieldKey) => fieldMode(useConsole().permissions, fieldKey);
export const useHasPrivilege = (priv) => hasPrivilege(useConsole().roles, priv);
