import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { isBuiltin } from 'node:module';
async function scan(dir) { const result = []; for (const item of await readdir(dir, { withFileTypes: true })) { const file = path.join(dir, item.name); if (item.isDirectory()) result.push(...await scan(file)); else if (/\.[cm]?[jt]sx?$/.test(file)) result.push(file); } return result; }
const errors = [];
for (const file of await scan('src')) {
  const source = await readFile(file, 'utf8'); const imports = [...source.matchAll(/(?:from\s+|import\s*\(|require\s*\()(['"])(.*?)\1/g)].map(match => match[2]);
  const normalized = file.replaceAll('\\', '/');
  for (const specifier of imports) {
    if (normalized.includes('/renderer/') && (isBuiltin(specifier) || /^(electron$|@modelcontextprotocol\/)/.test(specifier) || specifier.includes('/main/'))) errors.push(`${file}: renderer cannot import ${specifier}`);
    if (normalized.includes('/shared/') && (isBuiltin(specifier) || /^(react|electron)/.test(specifier) || /renderer|\/main\//.test(specifier))) errors.push(`${file}: shared cannot import ${specifier}`);
    if (normalized.includes('/main/') && specifier.includes('/renderer/')) errors.push(`${file}: main cannot import renderer`);
  }
}
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; } else console.log('Layer boundaries: PASS');
