import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // React 核心
            if (id.includes('react') || id.includes('scheduler')) {
              return 'vendor-react';
            }
            // 状态管理
            if (id.includes('zustand')) {
              return 'vendor-store';
            }
            // 图标
            if (id.includes('lucide-react')) {
              return 'vendor-icon';
            }
            // 工具库
            if (id.includes('axios') || id.includes('dayjs') || id.includes('lodash')) {
              return 'vendor-util';
            }
            // 默认 vendor
            return 'vendor-lib';
          }
        },
      },
    },
  },
});
