import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Default: https://up9.life/ root deploy.
// Subpath deploy: VITE_BASE=/moment/ npm run build
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || '/',
});
