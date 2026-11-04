import { defineConfig } from 'vite-plus';
import solid from 'vite-plugin-solid';

const generated = [
  'dist/**',
  '.astro/**',
  'src/generated/**',
  'public/dictionaries/**',
  'public/wordlists/**',
];

export default defineConfig({
  base: process.env.BASE_PATH || '/',
  // Astro owns production builds; this Vite+ config serves checks and DOM tests.
  envPrefix: ['VITE_', 'PUBLIC_'],
  plugins: [solid()],
  lint: {
    ignorePatterns: [...generated, 'src/data/*.json'],
    options: { typeAware: true, typeCheck: true },
  },
  fmt: {
    astro: true,
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
