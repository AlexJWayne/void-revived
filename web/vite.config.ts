import { preact } from '@preact/preset-vite';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const certificatePath = fileURLToPath(new URL('.certs/localhost.crt', import.meta.url));
const privateKeyPath = fileURLToPath(new URL('.certs/localhost.key', import.meta.url));
const https = process.env.VITE_DEV_HTTPS === 'true'
  ? {
      cert: readFileSync(certificatePath),
      key: readFileSync(privateKeyPath),
    }
  : undefined;

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [preact(), tailwindcss()],
  server: {
    https,
    port: 5190,
    strictPort: true,
  },
  preview: {
    port: 4190,
    strictPort: true,
  },
});
