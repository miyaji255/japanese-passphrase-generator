import { readFile, writeFile, readdir, unlink } from 'node:fs/promises';
import { resolve, basename } from 'node:path';
import { createServer } from 'vite-plus';
import type { Plugin } from 'vite-plus';
import { readManifest } from './data.ts';

interface PageRenderer {
  renderPage: () => { page: string; hydrationScript: string };
}

export function staticPage(): Plugin {
  let root: string;
  let output: string;
  let base: string;
  return {
    name: 'static-passphrase-page',
    apply: 'build',
    configResolved(config) {
      root = config.root;
      output = resolve(root, config.build.outDir);
      base = config.base;
    },
    async closeBundle() {
      const server = await createServer({
        root,
        configFile: resolve(root, 'vite.config.ts'),
        optimizeDeps: { noDiscovery: true, include: [] },
        server: { middlewareMode: true },
        appType: 'custom',
      });
      try {
        const { renderPage } = (await server.ssrLoadModule(
          '/src/entry-server.tsx',
        )) as PageRenderer;
        const { page, hydrationScript } = renderPage();
        const index = resolve(output, 'index.html');
        let html = await readFile(index, 'utf8');
        html = html.replace('<div id="root"></div>', `<div id="root">${page}</div>`);
        for (const match of html.matchAll(
          /<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g,
        )) {
          const href = match[1];
          if (!href || !href.startsWith(base))
            throw new Error('Stylesheet does not use the configured base path');
          const css = await readFile(resolve(output, href.slice(base.length)), 'utf8');
          html = html.replace(match[0], `<style>${css}</style>`);
        }
        const manifest = readManifest();
        const preload = `<link rel="preload" href="${base}${manifest.url.replace(/^\//, '')}" as="fetch" crossorigin>`;
        html = html
          .replace('</title>', `</title>${preload}`)
          .replace('</head>', `${hydrationScript}</head>`);
        await writeFile(index, html);
        const directory = resolve(output, 'dictionaries');
        for (const name of await readdir(directory))
          if (name !== basename(manifest.url)) await unlink(resolve(directory, name));
        console.log('Prerendered static UI, inlined CSS, and preloaded the dictionary.');
      } finally {
        await server.close();
      }
    },
  };
}
