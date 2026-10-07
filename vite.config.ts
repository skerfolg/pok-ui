import { defineConfig } from 'vite';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
export default defineConfig({
  root: 'src/renderer', base: './',
  plugins: [{ name: 'local-pob-tree-preview', configureServer(server) {
    const root = path.resolve('resources/passive-tree');
    server.middlewares.use('/__pok-tree', async (request, response) => {
      const matched = /^\/(\d+_\d+)\/([a-zA-Z0-9._-]+\.(?:json|webp|png))$/.exec(request.url?.split('?')[0] ?? '');
      if (!matched) { response.statusCode = 404; response.end(); return; }
      const file = path.join(root, matched[1], matched[2]);
      try { await stat(file); response.setHeader('Content-Type', file.endsWith('.json') ? 'application/json' : file.endsWith('.webp') ? 'image/webp' : 'image/png'); createReadStream(file).on('error', () => response.destroy()).pipe(response); }
      catch { response.statusCode = 404; response.end(); }
    });
  } }],
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  build: { outDir: '../../dist/renderer', emptyOutDir: true },
});
