import { defineConfig } from 'astro/config';
import solid from '@astrojs/solid-js';

export default defineConfig({
  site: 'https://passphrase-generator.miyaji255.com',
  base: process.env.BASE_PATH || '/',
  output: 'static',
  trailingSlash: 'always',
  integrations: [solid()],
  build: { inlineStylesheets: 'always' },
  vite: {
    define: {
      'import.meta.env.PUBLIC_COMMIT_SHA': JSON.stringify(
        process.env.PUBLIC_COMMIT_SHA || process.env.WORKERS_CI_COMMIT_SHA || '',
      ),
    },
    build: { target: 'es2022', sourcemap: false },
  },
});
