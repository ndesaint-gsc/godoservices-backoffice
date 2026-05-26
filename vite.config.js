import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_BO_PROXY_TARGET || 'https://www.lavanguardia.biz';
  const sessionId = env.VITE_BO_SESSION_ID || '';

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
        '/perfil': {
          target,
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req) => {
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
