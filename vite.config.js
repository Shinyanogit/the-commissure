import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const root = dirname(fileURLToPath(import.meta.url));

// Multi-page build: every surgery page must be an explicit entry, otherwise
// `vite build` only emits index.html and the other pages 404 in production.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        accf: resolve(root, 'accf.html'),
        acdf: resolve(root, 'acdf.html'),
        pcdf: resolve(root, 'pcdf.html'),
        pcf: resolve(root, 'pcf.html'),
      },
    },
  },
});
