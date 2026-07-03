import { createTheme } from '@mui/material/styles';
import { BRANDS, Brand } from './brand';

// Estilo "relleno" para botones outlined/text: fondo = color.main, texto = contrastText (invierte el
// outlined clásico), hover a color.dark, y estado disabled estándar. Resuelve el color del ownerState
// (primary por defecto; secondary/error/warning/success/info si se indica).
function filledButton(theme, ownerState) {
  const key =
    ownerState?.color && ownerState.color !== 'inherit' ? ownerState.color : 'primary';
  const pal = theme.palette[key] || theme.palette.primary;
  return {
    backgroundColor: pal.main,
    color: pal.contrastText,
    border: '1px solid ' + pal.main,
    '&:hover': {
      backgroundColor: pal.dark || pal.main,
      borderColor: pal.dark || pal.main,
    },
    '&.Mui-disabled': {
      backgroundColor: theme.palette.action.disabledBackground,
      color: theme.palette.action.disabled,
      borderColor: theme.palette.action.disabledBackground,
    },
  };
}

// Builds the MUI theme for a given brand. Neutrals, typography, shape and the
// component layout are shared across brands; only the accent (secondary), the
// yellow `brandDetail` highlight, and the accent-driven focus/active states
// change per brand.
export function buildTheme(brandKey = Brand.Godo) {
  const brand = BRANDS[brandKey] || BRANDS[Brand.Godo];
  const accent = brand.secondary.main;
  const detail = brand.detail || accent;

  return createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#111111',
        dark: '#000000',
        light: '#f4f4f5',
        contrastText: '#ffffff',
      },
      secondary: brand.secondary,
      // Custom slot: the yellow brand highlight (active-nav bar). Falls back to
      // the accent when the brand has no detail color (Godó).
      brandDetail: { main: detail },
      error: { main: '#dc2626', light: '#fee2e2' },
      warning: { main: '#d97706', light: '#fef3c7' },
      success: { main: '#16a34a', light: '#dcfce7' },
      background: { default: '#fafafa', paper: '#ffffff' },
      text: { primary: '#0a0a0a', secondary: '#6b7280', disabled: '#9ca3af' },
      divider: '#e5e5e5',
      action: {
        hover: 'rgba(0, 0, 0, 0.04)',
        selected: 'rgba(0, 0, 0, 0.06)',
      },
    },
    shape: { borderRadius: 8 },
    typography: {
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
      h4: { fontWeight: 600, fontSize: '1.875rem', letterSpacing: '-0.025em', lineHeight: 1.2 },
      h5: { fontWeight: 600, fontSize: '1.25rem', letterSpacing: '-0.01em', lineHeight: 1.3 },
      h6: { fontWeight: 600, fontSize: '0.95rem', letterSpacing: '-0.005em' },
      subtitle1: { fontWeight: 500 },
      subtitle2: { fontWeight: 500, fontSize: '0.8125rem' },
      body1: { fontSize: '0.9rem', lineHeight: 1.55 },
      body2: { fontSize: '0.825rem', lineHeight: 1.5 },
      caption: { fontSize: '0.75rem', color: '#6b7280' },
      button: { fontWeight: 500, textTransform: 'none', letterSpacing: 0 },
      overline: { fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.08em' },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: '#fafafa',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
          },
        },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0 },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: '1px solid #e5e5e5',
            backgroundColor: '#ffffff',
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true, disableRipple: false },
        styleOverrides: {
          root: {
            borderRadius: 8,
            paddingInline: 18,
            paddingBlock: 8,
            fontWeight: 500,
          },
          containedPrimary: {
            backgroundColor: '#111111',
            '&:hover': { backgroundColor: '#000000' },
          },
          // Todos los botones llevan FONDO: las variantes outlined y text se pintan rellenas
          // (fondo = color, texto = contraste; invierte el outlined clásico). Aplica a cualquier
          // `color` (primary/secondary/error/…). Los IconButton y los Chip no se ven afectados.
          outlined: ({ theme, ownerState }) => filledButton(theme, ownerState),
          text: ({ theme, ownerState }) => filledButton(theme, ownerState),
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          outlined: {
            borderColor: '#e5e5e5',
          },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0, variant: 'outlined' },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: '#ffffff',
            '& fieldset': { borderColor: '#e5e5e5' },
            '&:hover fieldset': { borderColor: '#d1d5db' },
            '&.Mui-focused fieldset': { borderColor: accent, borderWidth: 1 },
            '&.Mui-disabled': {
              backgroundColor: '#f5f5f5',
              '& fieldset': { borderColor: '#e5e5e5' },
              '& input': { WebkitTextFillColor: '#4b5563' },
            },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: '#6b7280',
            '&.Mui-focused': { color: accent },
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            border: '1px solid #e5e5e5',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 500, borderRadius: 6 },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
    },
  });
}
