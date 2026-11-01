import { defineConfig } from 'vite';
import path from 'node:path';
import { GameDataStore } from './src/main/game-data';
import type { CatalogEntryType } from './src/shared/game-data';

export default defineConfig({
  root: 'src/renderer', base: './',
  plugins: [{ name: 'verified-pob-preview', configureServer(server) {
    const data = new GameDataStore(path.resolve('resources'),{allowCheckout:true});
    server.middlewares.use('/__pok-data', async (request, response) => {
      if (request.method !== 'GET') { response.statusCode = 405; response.end(); return; }
      try {
        const url = new URL(request.url || '/', 'http://127.0.0.1');
        let result: unknown;
        if (url.pathname === '/info') result = await data.getInfo();
        else if (url.pathname === '/catalog') result = await data.query({
          type: url.searchParams.get('type') as CatalogEntryType || undefined,
          query: url.searchParams.get('query') || undefined,
          category: url.searchParams.get('category') || undefined,
          offset: Number(url.searchParams.get('offset') || 0), limit: Number(url.searchParams.get('limit') || 50),
        });
        else if (url.pathname === '/entry') result = await data.getEntry(url.searchParams.get('type') as CatalogEntryType, url.searchParams.get('id') || '');
        else if (url.pathname === '/tree') result = await data.loadTree(url.searchParams.get('version') || '');
        else if (url.pathname === '/asset') {
          const asset = await data.asset(url.searchParams.get('url') || '');
          response.setHeader('Content-Type', asset.mime); response.end(Buffer.from(asset.body)); return;
        } else { response.statusCode = 404; response.end(); return; }
        response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify(result));
      } catch (error) {
        response.statusCode = 400; response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify({ error: String(error) }));
      }
    });
  } }],
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  build: { outDir: '../../dist/renderer', emptyOutDir: true },
});
