import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Deploy under https://up9.life/moment/ by default.
// Root domain deploy: VITE_BASE=/ npm run build
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || '/moment/',
});
