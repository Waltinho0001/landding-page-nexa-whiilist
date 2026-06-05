import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix para __dirname em ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  
  // 🔑 CRUCIAL: Usa paths relativos para assets funcionarem em qualquer subdiretório/CDN
  base: './',
  
  // Mantém a configuração de pasta do frontend
  root: './frontend',
  
  build: {
    // Output na raiz para a Vercel encontrar
    outDir: '../dist',
    emptyOutDir: true,
    // Otimizações para produção
    assetsDir: 'assets',
    sourcemap: false,
    // Garante que o manifest seja gerado corretamente
    manifest: false,
  },
  
  server: {
    port: 5173,
    open: true,
    // Permite CORS para desenvolvimento local com backend separado
    cors: true,
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './frontend/src'),
    },
  },
  
  // Otimização de dependências para build mais rápido
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react'],
  },
});