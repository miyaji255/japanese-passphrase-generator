import { defineConfig } from 'astro/config';
import solid from '@astrojs/solid-js';

export default defineConfig({
  site: 'https://miyaji255.github.io',
  base: process.env.BASE_PATH || '/',
  output: 'static',
  trailingSlash: 'always',
  integrations: [solid()],
  build: { inlineStylesheets: 'always' },
  vite: { build: { target: 'es2022', sourcemap: false } },
});
