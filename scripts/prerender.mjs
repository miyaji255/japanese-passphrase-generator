import { readFile, writeFile, readdir, unlink } from 'node:fs/promises';
import { resolve, basename } from 'node:path';
import { createServer } from 'vite';

export function staticPage() {
  let root;
  let output;
  let base;
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
        configFile: resolve(root, 'vite.config.js'),
        optimizeDeps: { noDiscovery: true, include: [] },
        server: { middlewareMode: true },
        appType: 'custom',
      });
      try {
        const { renderPage } = await server.ssrLoadModule('/src/entry-server.jsx');
        const { page, hydrationScript } = renderPage();
        const index = resolve(output, 'index.html');
        let html = await readFile(index, 'utf8');
        html = html.replace('<div id="root"></div>', `<div id="root">${page}</div>`);
        // Small CSS: one less request on the first visit. Keep JS/dictionaries cacheable.
        const stylesheet = /<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g;
        for (const match of html.matchAll(stylesheet)) {
          if (!match[1].startsWith(base)) throw new Error('Stylesheet does not use the configured base path');
          const css = await readFile(resolve(output, match[1].slice(base.length)), 'utf8');
          html = html.replace(match[0], `<style>${css}</style>`);
        }
        const manifest = JSON.parse(await readFile(resolve(root, 'src/generated/dictionaries.json'), 'utf8'));
        const preload = `<link rel="preload" href="${base}${manifest.url.replace(/^\//, '')}" as="fetch" crossorigin>`;
        // Discover the dictionary before the stylesheet bytes arrive.
        html = html.replace('</title>', `</title>${preload}`);
        html = html.replace('</head>', `${hydrationScript}</head>`);
        await writeFile(index, html);
        // Remove obsolete dictionaries retained by incremental static-output copies.
        const dictionaryDirectory = resolve(output, 'dictionaries');
        for (const name of await readdir(dictionaryDirectory)) {
          if (name !== basename(manifest.url)) await unlink(resolve(dictionaryDirectory, name));
        }
        console.log('Prerendered static UI, inlined CSS, and preloaded the default dictionary.');
      } finally {
        await server.close();
      }
    },
  };
}
