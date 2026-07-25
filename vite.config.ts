import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'android-chrome-192x192.png', 'android-chrome-512x512.png'],
        workbox: {
          maximumFileSizeToCacheInBytes: 5000000,
          // Never precache version.json — our own custom update-check
          // mechanism (App.tsx) needs this file to always be fetched fresh
          // from the network, not served from the service worker's cache,
          // or "New update available" would never detect real changes.
          globIgnores: ['version.json'],
          runtimeCaching: [
            {
              urlPattern: /\/version\.json$/,
              handler: 'NetworkOnly',
            },
          ],
        },
        manifest: {
          name: 'EJCASHH',
          short_name: 'EJCASHH',
          description: 'EJCASHH Digital Marketing Services',
          theme_color: '#ffffff',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: 'android-chrome-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'android-chrome-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'apple-touch-icon.png',
              sizes: '180x180',
              type: 'image/png',
            },
          ],
        },
      }),
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
