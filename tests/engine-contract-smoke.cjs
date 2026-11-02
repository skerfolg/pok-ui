// Read-only protocol audit of an isolated, pinned engine. Never uses personal builds.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
require('tsx/cjs');
const { unwrapMcp } = require('../src/main/pok.ts');
const { createBlankXml } = require('../src/shared/pob-document.ts');
const { encodePob } = require('../src/main/pob-files.ts');

(async () => {
  const root = process.env.POK_SMOKE_ENGINE_ROOT;
  const python = process.env.POK_SMOKE_PYTHON;
  if (!root || !python) throw new Error('Set POK_SMOKE_ENGINE_ROOT (isolated snapshot) and POK_SMOKE_PYTHON');
  const output = path.resolve('.local/normalization/contract.json');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
  const { StdioClientTransport } = await import('@modelcontextprotocol/sdk/client/stdio.js');
  const client = new Client({ name: 'pok-ui-contract-audit', version: '1' });
  const transport = new StdioClientTransport({ command: python, args: ['-m', 'pok.mcp'], cwd: root,
    env: { ...process.env, PYTHONPATH: path.join(root, 'src'), PYTHONDONTWRITEBYTECODE: '1', PYTHONUTF8: '1' }, stderr: 'pipe' });
  transport.stderr?.on('data', () => {});
  const report = { at: new Date().toISOString(), checks: {} };
  const deadline = setTimeout(() => { fs.writeFileSync(output, JSON.stringify({ ...report, timeout: true }, null, 2)); process.exit(1); }, 180000);
  try {
    await client.connect(transport, { timeout: 15000 });
    report.tools = (await client.listTools()).tools;
    fs.writeFileSync(output, JSON.stringify(report, null, 2));
    let connected;
    try { connected = { connected: true, info: unwrapMcp(await client.callTool({ name: 'server_info', arguments: {} }, undefined, { timeout: 30000 })) }; }
    catch (error) { connected = { connected: true, infoError: { message: error.message, code: error.code } }; }
    // server_info includes a local path; keep the saved evidence portable.
    const info = connected.info && { ...connected.info };
    if (info) delete info.source_root;
    report.connection = { ...connected, info };
    const manifest = fs.readFileSync(path.join(root, 'knowledge/ingest/manifest.json'));
    report.kb = { ...JSON.parse(manifest), manifestSha256: createHash('sha256').update(manifest).digest('hex') };
    report.missingDesktopTools = ['compute_pob_xml', 'render_pob_item'].filter(name => !report.tools.some(t => t.name === name));
    if (connected.connected) {
      for (const [name, args] of [
        ['restore_pob_spec', { build_code: encodePob(createBlankXml()), assume_first_stat_set: false }],
        ['compute_pob', { build_spec: { class_name: 'Sorceress', level: 1 }, stats: ['Life'] }],
        ['assemble_pob', { build_spec: { class_name: 'Sorceress', level: 1 }, slug: 'synthetic-contract-audit', purpose: 'recommendation', stats: ['Life'] }],
      ]) {
        try { report.checks[name] = unwrapMcp(await client.callTool({ name, arguments: args }, undefined, { timeout: 30000 })); }
        catch (error) { report.checks[name] = { error: error.message }; }
      }
    }
  } catch (error) {
    report.error = { message: error.message, code: error.code }; process.exitCode = 1;
  } finally {
    await client.close(); clearTimeout(deadline);
    fs.writeFileSync(output, JSON.stringify(report, null, 2));
    console.log(output);
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
