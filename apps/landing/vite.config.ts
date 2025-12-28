import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5177, // Landing page port
  },
  build: {
    outDir: 'dist',
  },
  base: '/', // Root path for landing page
});
