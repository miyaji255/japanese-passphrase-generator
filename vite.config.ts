import { defineConfig } from 'vite-plus';
import solid from 'vite-plugin-solid';
import { staticPage } from './scripts/prerender.ts';

const generated = ['dist/**', 'src/generated/**', 'public/dictionaries/**', 'public/wordlists/**'];

export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [solid({ ssr: process.env.NODE_ENV !== 'test' }), staticPage()],
  server: { host: '0.0.0.0' },
  build: { target: 'es2022', sourcemap: false, emptyOutDir: true },
  lint: {
    ignorePatterns: [...generated, 'src/data/*.json'],
    options: { typeAware: true, typeCheck: true },
  },
  fmt: {
    singleQuote: true,
    printWidth: 100,
    ignorePatterns: [...generated, 'src/data/*.json'],
  },
  test: {
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    environment: 'happy-dom',
    setupFiles: ['tests/setup.ts'],
  },
});
