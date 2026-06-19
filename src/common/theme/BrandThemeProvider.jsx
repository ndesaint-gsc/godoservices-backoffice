import { useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { buildTheme } from './buildTheme';
import { useBrand } from './useBrand';

// Wraps the app in a MUI theme matching the active brand. Rebuilds only when the
// resolved brand changes.
export default function BrandThemeProvider({ children }) {
  const brand = useBrand();
  const theme = useMemo(() => buildTheme(brand), [brand]);
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
