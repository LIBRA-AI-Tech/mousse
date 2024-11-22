import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import checker from 'vite-plugin-checker';

export default defineConfig({
  base: "/",
  plugins: [
    react(),
    checker({
      eslint: {
        lintCommand: 'eslint "./src/**/*.{js,jsx,ts,tsx}"',
      },
    }),
  ],
  preview: {
    port: 8000,
    strictPort: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://api:8000',
        changeOrigin: true,
        secure: false,
      }
    },
    port: 8000,
    strictPort: true,
    host: true,
    origin: 'http://0.0.0.0:3000',
  },
});
