import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const vendorGroups: Array<{ name: string; match: string[] }> = [
  { name: 'vendor-react', match: ['react', 'react-dom', 'scheduler'] },
  { name: 'vendor-router', match: ['react-router', '@remix-run/router'] },
  { name: 'vendor-store', match: ['zustand'] },
  { name: 'vendor-i18n', match: ['i18next', 'react-i18next'] },
  { name: 'vendor-oss', match: ['ali-oss'] },
  { name: 'vendor-content', match: ['marked', 'dompurify', 'jszip', 'file-saver'] },
  { name: 'vendor-network', match: ['axios'] },
  { name: 'vendor-icon', match: ['lucide-react'] },
];

export default defineConfig({
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
      '/images': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          for (const group of vendorGroups) {
            if (group.match.some((pkg) => id.includes(`/node_modules/${pkg}/`) || id.includes(`\\node_modules\\${pkg}\\`))) {
              return group.name;
            }
          }

          return 'vendor-misc';
        },
      },
    },
  },
});
