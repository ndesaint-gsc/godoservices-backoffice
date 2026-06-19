import { useSelector } from 'react-redux';
import { resolveBrand, BRANDS } from './brand';

// Resolves the active brand from the logged-in user's roles. Reactive: switching
// roles (via the role switcher) re-resolves and re-themes the app.
export function useBrand() {
  const roles = useSelector((state) => state.auth.user?.roles || []);
  return resolveBrand(roles);
}

// Convenience: the full brand descriptor (label, docTitle, colors).
export function useBrandConfig() {
  return BRANDS[useBrand()];
}
