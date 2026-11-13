import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite dev server. The API address comes from VITE_API_URL in .env.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
