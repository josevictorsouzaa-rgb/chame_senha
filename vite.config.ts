import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  plugins: [
    react(),
    legacy({
      // Lowered targets for better TV compatibility
      targets: ['chrome >= 60', 'safari >= 11', 'ios >= 11', 'firefox >= 60', 'edge >= 79'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
      renderLegacyChunks: true,
      modernPolyfills: true
    })
  ],
  server: {
    port: 3000,
    host: true, // Listen on all addresses (0.0.0.0)
    strictPort: true,
    cors: true,
    proxy: {
      '/socket.io': {
        target: 'http://127.0.0.1:3001', // Use IPv4 loopback explicitly
        ws: true,
        changeOrigin: true,
        secure: false,
      }
    }
  },
  preview: {
    port: 3000,
    host: true,
    strictPort: true,
    cors: true,
    proxy: {
      '/socket.io': {
        target: 'http://127.0.0.1:3001',
        ws: true,
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    target: 'es2015',
    minify: 'terser',
  }
});