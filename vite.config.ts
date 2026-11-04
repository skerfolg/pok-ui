import {ItemArtStore} from './src/main/item-art';
import {PobRuntime} from './src/main/pob-runtime';
import {PobEditorData} from './src/main/pob-editor-data';
import { defineConfig } from 'vite';
import path from 'node:path';
import { GameDataStore } from './src/main/game-data';
import type { CatalogEntryType } from './src/shared/game-data';

export default defineConfig({
  root: 'src/renderer', base: './',
  plugins: [{ name: 'verified-pob-preview', configureServer(server) {
    const art=new ItemArtStore(path.resolve('resources/item-art'));
    const legacy = new GameDataStore(path.resolve('resources'),{allowCheckout:true}),runtime=new PobRuntime(path.resolve('resources/pob-runtime')),editor=new PobEditorData(path.resolve('resources/pob-editor'),runtime);
    server.httpServer?.once('close',()=>runtime.close());
    server.middlewares.use('/__pok-data', async (request, response) => {
      if (request.method !== 'GET') { response.statusCode = 405; response.end(); return; }
      try {
        const url = new URL(request.url || '/', 'http://127.0.0.1');
        let result: unknown;const data=(await editor.getInfo()).status==='ready'?editor:legacy;
        if(url.pathname==='/item-art'){const index=await art.index();result={...index,files:Object.fromEntries(Object.entries(index.files).map(([id,value])=>[id,{...value,url:'/__pok-data/item-art/'+id}]))};}
        else if(url.pathname.startsWith('/item-art/')){const asset=await art.asset(url.pathname.slice('/item-art/'.length));response.setHeader('Content-Type',asset.mime);response.end(asset.bytes);return;}
        else if (url.pathname === '/info') result = await data.getInfo();
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
