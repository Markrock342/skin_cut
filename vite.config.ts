import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8787',
      // รูป SortSkin R2 ไม่มี CORS — proxy ให้โหลดและ export ได้บน localhost
      '/sortskin-assets': {
        target: 'https://pub-603937e0ef90496f818f5e96bc337ba7.r2.dev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sortskin-assets/, ''),
      },
    },
  },
  preview: {
    proxy: {
      '/sortskin-assets': {
        target: 'https://pub-603937e0ef90496f818f5e96bc337ba7.r2.dev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sortskin-assets/, ''),
      },
    },
  },
});
