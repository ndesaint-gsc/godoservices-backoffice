// Brand theming driven by user roles.
//
// Resolution rules (see resolveBrand):
//   - Any GODO_ROLES role  -> Godó (hard override, e.g. ADMIN/DEV).
//   - Exclusively LV roles  -> La Vanguardia.
//   - Exclusively MD roles  -> Mundo Deportivo.
//   - Both, or neither      -> Godó (default fallback).
//
// The three buckets below are filled from the existing functional roles.
// Current values are a DEMO mapping; replace with the real LV/MD role strings
// when known (Godó stays the fallback regardless).

import lvLogo from '@/assets/brand/lv.svg';
import mdLogo from '@/assets/brand/md.svg';
import godoLogo from '@/assets/brand/godo.png';

export const Brand = {
  Godo: 'godo',
  LV: 'lv',
  MD: 'md',
};

// TODO: replace demo values with the real role strings per brand.
export const GODO_ROLES = ['ADMIN'];
export const LV_ROLES = ['STUDENT'];
export const MD_ROLES = ['VIEWER'];

const intersects = (a, b) => a.some((x) => b.includes(x));

export function resolveBrand(roles = []) {
  if (intersects(roles, GODO_ROLES)) return Brand.Godo;

  const hasLV = intersects(roles, LV_ROLES);
  const hasMD = intersects(roles, MD_ROLES);

  if (hasLV && !hasMD) return Brand.LV;
  if (hasMD && !hasLV) return Brand.MD;
  return Brand.Godo;
}

// Per-brand visuals. `secondary` is the brand accent (drives the active-nav
// indicator, input focus, etc.). `detail` is the yellow highlight applied to the
// active-nav left bar; null means "fall back to the accent". `logo`/`logoHeight`
// drive the sidebar header (a "BACKOFFICE" overline sits above the logo).
// Colors + logos sourced from lavanguardia.com / mundodeportivo.com / grupogodo.
export const BRANDS = {
  [Brand.Godo]: {
    key: Brand.Godo,
    label: 'Godó',
    docTitle: 'Backoffice Godó',
    secondary: { main: '#e60012', dark: '#b3000e', light: '#fde2e4', contrastText: '#ffffff' },
    detail: null,
    logo: godoLogo,
    logoHeight: 22,
  },
  [Brand.LV]: {
    key: Brand.LV,
    label: 'La Vanguardia',
    docTitle: 'Backoffice La Vanguardia',
    secondary: { main: '#001c4c', dark: '#001233', light: '#dfe6f0', contrastText: '#ffffff' },
    detail: '#ffd700',
    logo: lvLogo,
    logoHeight: 18,
  },
  [Brand.MD]: {
    key: Brand.MD,
    label: 'Mundo Deportivo',
    docTitle: 'Backoffice Mundo Deportivo',
    secondary: { main: '#cf0013', dark: '#9e000e', light: '#fde2e4', contrastText: '#ffffff' },
    detail: '#ffe400',
    logo: mdLogo,
    logoHeight: 38,
  },
};
