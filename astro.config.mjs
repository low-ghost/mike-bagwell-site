import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { utimes } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const contentDir = path.join(rootDir, 'src/content');
const assetsDir = path.join(rootDir, 'src/assets');

/**
 * Workaround for Astro content-layer reloads that fail with
 * `astro:server-app.js` and leave the page store stale until restart.
 * Touching a page that imports the collection forces a clean rebuild path.
 */
function contentReloadPlugin() {
  const touchTargets = [
    path.join(rootDir, 'src/pages/writing.astro'),
    path.join(rootDir, 'src/pages/index.astro'),
    path.join(rootDir, 'src/pages/books.astro'),
    path.join(rootDir, 'src/components/Gallery.astro'),
  ];

  return {
    name: 'content-full-reload',
    configureServer(server) {
      let timer = null;
      let touching = false;

      const onContentChange = (file) => {
        if (touching) return;
        const normalized = path.normalize(file);
        if (
          !normalized.startsWith(contentDir) &&
          !normalized.startsWith(assetsDir)
        ) {
          return;
        }
        // Ignore our own page touches
        if (touchTargets.some((t) => normalized === path.normalize(t))) return;

        clearTimeout(timer);
        timer = setTimeout(async () => {
          touching = true;
          const now = new Date();
          try {
            await Promise.all(touchTargets.map((t) => utimes(t, now, now)));
          } catch {
            // Pages may be briefly locked; next edit will retry.
          } finally {
            setTimeout(() => {
              touching = false;
            }, 750);
          }
        }, 120);
      };

      server.watcher.add([contentDir, assetsDir]);
      server.watcher.on('change', onContentChange);
      server.watcher.on('add', onContentChange);
      server.watcher.on('unlink', onContentChange);
    },
  };
}

export default defineConfig({
  site: 'https://mikebagwell.me',
  trailingSlash: 'always',
  compressHTML: true,
  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.includes('?'),
      serialize(item) {
        // Prefer trailing-slash locs to match Cloudflare Pages and canonicals.
        if (item.url && !item.url.endsWith('/')) {
          item.url = `${item.url}/`;
        }
        return item;
      },
    }),
    mdx(),
  ],
  vite: {
    plugins: [tailwindcss(), contentReloadPlugin()],
  },
});
