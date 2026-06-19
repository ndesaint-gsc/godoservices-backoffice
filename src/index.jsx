import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { SnackbarProvider } from 'notistack';
import CssBaseline from '@mui/material/CssBaseline';

import App from '@/App';
import store, { persistor } from '@/common/store/store';
import ModalProvider from '@/common/providers/ModalProvider';
import ScrollToTop from '@/common/router/ScrollToTop';
import BrandThemeProvider from '@/common/theme/BrandThemeProvider';
import BrandTitle from '@/common/theme/BrandTitle';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <BrandThemeProvider>
        <CssBaseline />
        <ModalProvider>
          <SnackbarProvider maxSnack={3} hideIconVariant>
            <BrowserRouter>
              <HelmetProvider>
                <BrandTitle />
                <ScrollToTop />
                <App />
              </HelmetProvider>
            </BrowserRouter>
          </SnackbarProvider>
        </ModalProvider>
      </BrandThemeProvider>
      </PersistGate>
    </Provider>
  </React.StrictMode>,
);
