import { preact } from '@preact/preset-vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [preact(), tailwindcss()],
  server: {
    port: 5190,
    strictPort: true,
  },
  preview: {
    port: 4190,
    strictPort: true,
  },
});
