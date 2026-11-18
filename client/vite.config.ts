import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icon-*.png', 'maskable-icon.png'],
      manifest: {
        name: 'CareCompanion',
        short_name: 'CareCompanion',
        description: 'Elderly Care & Medication Management',
        theme_color: '#0d7a73',
        background_color: '#faf9f7',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        start_url: '/',
        scope: '/',
        categories: ['health', 'medical'],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^\/api\/v1\/(doses\/today|checkin\/today)/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-critical',
              expiration: { maxEntries: 10, maxAgeSeconds: 300 },
            },
          },
        ],
      },
      devOptions: { enabled: true },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
});
