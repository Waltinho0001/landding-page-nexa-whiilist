import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: './frontend', // <--- DIZ AO VITE QUE O CÓDIGO ESTÁ NA PASTA FRONTEND
  build: {
    outDir: '../dist', // <--- DIZ PARA SALVAR O BUILD NA PASTA DIST DA RAIZ
    emptyOutDir: true,
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
});