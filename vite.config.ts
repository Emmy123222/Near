import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
    // Add process.env polyfill
    'process.env': {},
  },
  resolve: {
    alias: {
      buffer: 'buffer',
      process: 'process/browser',
      util: 'util',
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['buffer', 'process'],
  },
  // Add polyfills for Node.js modules
  esbuild: {
    define: {
      global: 'globalThis',
    },
  },
});