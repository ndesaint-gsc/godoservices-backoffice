import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_BO_PROXY_TARGET || 'https://www.lavanguardia.biz';
  const sessionId = env.VITE_BO_SESSION_ID || '';
  const evolokTarget = env.VITE_EVOLOK_PROXY_TARGET || 'https://ev.lavanguardia.biz';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/ic': {
          target: evolokTarget,
          changeOrigin: true,
          secure: false,
        },
        '/perfil': {
          target,
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req) => {
              // Strip browser CORS headers: this is now a server-to-server call,
              // so the backend must not see Origin/Referer (Spring rejects
              // non-GET cross-origin requests with "Invalid CORS request").
              proxyReq.removeHeader('origin');
              proxyReq.removeHeader('referer');
              if (!sessionId) return;
              const url = new URL(req.url, target);
              if (!url.searchParams.has('sessionId')) {
                url.searchParams.set('sessionId', sessionId);
                proxyReq.path = url.pathname + url.search;
              }
            });
          },
        },
      },
    },
  };
});
