import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  plugins: [
    react(),
    // This plugin creates a version of the code compatible with old browsers (Smart TVs)
    legacy({
      targets: ['chrome >= 64', 'edge >= 79', 'safari >= 11', 'firefox >= 67'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
      renderLegacyChunks: true,
      modernPolyfills: true
    })
  ],
  server: {
    port: 3000,
    host: '0.0.0.0', 
    strictPort: true,
    allowedHosts: true, // Allow all hosts for local network
    cors: true
  },
  preview: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: true,
  },
  build: {
    target: 'es2015', // Lowers the JS target version
    minify: 'terser', // Uses better minification for old devices
  }
});