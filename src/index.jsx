import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { SnackbarProvider } from 'notistack';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import App from '@/App';
import store, { persistor } from '@/common/store/store';
import ModalProvider from '@/common/providers/ModalProvider';
import ScrollToTop from '@/common/router/ScrollToTop';

const backofficeTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#111111',
      dark: '#000000',
      light: '#f4f4f5',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#e60012',
      dark: '#b3000e',
      light: '#fde2e4',
      contrastText: '#ffffff',
    },
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
          '&.Mui-focused fieldset': { borderColor: '#e60012', borderWidth: 1 },
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
          '&.Mui-focused': { color: '#e60012' },
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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider theme={backofficeTheme}>
        <CssBaseline />
        <ModalProvider>
          <SnackbarProvider maxSnack={3} hideIconVariant>
            <BrowserRouter>
              <HelmetProvider>
                <Helmet>
                  <title>Backoffice La Vanguardia</title>
                </Helmet>
                <ScrollToTop />
                <App />
              </HelmetProvider>
            </BrowserRouter>
          </SnackbarProvider>
        </ModalProvider>
      </ThemeProvider>
      </PersistGate>
    </Provider>
  </React.StrictMode>,
);
