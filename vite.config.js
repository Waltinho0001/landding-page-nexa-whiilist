import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  
  // 🔑 CRUCIAL: Paths relativos para assets funcionarem em qualquer CDN/subdiretório
  base: './',
  
  // Mantém configuração de pasta
  root: './frontend',
  
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    sourcemap: false,
    // Garante que CSS seja extraído corretamente
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  
  server: {
    port: 5173,
    open: true,
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './frontend/src'),
    },
  },
  
  css: {
    postcss: './frontend/postcss.config.js',
  },
});