import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import { staticPage } from './scripts/prerender.mjs';

export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [solid({ ssr: true }), staticPage()],
  server: { host: '0.0.0.0', allowedHosts: true },
  build: { target: 'es2022', sourcemap: false, emptyOutDir: true },
});
