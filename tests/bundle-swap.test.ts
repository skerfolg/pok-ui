import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, stat, writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { performAtomicSwap } from '../scripts/bundle-swap.mjs';

async function exists(path: string): Promise<boolean> {
  return Boolean(await stat(path).catch(() => undefined));
}

async function tempRoot(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'pok-ui-swap-'));
}

async function cleanup(root: string): Promise<void> {
  assert.ok(resolve(root).startsWith(resolve(tmpdir(), 'pok-ui-swap-')));
  await rm(root, { recursive: true, force: true });
}

test('bundle swap leaves originals in place when the first original move fails', async () => {
  const root = await tempRoot();
  try {
    const resources = join(root, 'resources');
    const lock = join(root, 'pok-runtime.lock.json');
    const stagedResources = join(root, '.stage', 'resources');
    const stagedLock = join(root, '.stage', 'pok-runtime.lock.json');
    await mkdir(stagedResources, { recursive: true });
    await writeFile(join(resources), 'original resources', 'utf8');
    await writeFile(lock, 'original lock', 'utf8');
    await writeFile(join(stagedResources, 'marker'), 'staged resources', 'utf8');
    await writeFile(stagedLock, 'staged lock', 'utf8');

    const fs = {
      rename: async (from: string, to: string) => {
        if (from === resources) throw new Error('first backup denied');
        await import('node:fs/promises').then(module => module.rename(from, to));
      }
    };

    await assert.rejects(
      performAtomicSwap({
        workspace: root,
        backupsRoot: join(root, '.local', 'bundle-backups'),
        entries: [
          { label: 'resources', target: resources, staged: stagedResources, backupName: 'resources' },
          { label: 'lock', target: lock, staged: stagedLock, backupName: 'pok-runtime.lock.json' }
        ],
        fs
      }),
      /first backup denied/
    );
    assert.equal(await readFile(resources, 'utf8'), 'original resources');
    assert.equal(await readFile(lock, 'utf8'), 'original lock');
  } finally { await cleanup(root); }
});

test('bundle swap restores backed up originals when a staged replacement is missing', async () => {
  const root = await tempRoot();
  try {
    const resources = join(root, 'resources');
    const lock = join(root, 'pok-runtime.lock.json');
    const stagedResources = join(root, '.stage', 'resources');
    const stagedLock = join(root, '.stage', 'pok-runtime.lock.json');
    await mkdir(resources, { recursive: true });
    await mkdir(stagedResources, { recursive: true });
    await writeFile(join(resources, 'marker'), 'original resources', 'utf8');
    await writeFile(lock, 'original lock', 'utf8');
    await writeFile(join(stagedResources, 'marker'), 'staged resources', 'utf8');

    await assert.rejects(
      performAtomicSwap({
        workspace: root,
        backupsRoot: join(root, '.local', 'bundle-backups'),
        entries: [
          { label: 'resources', target: resources, staged: stagedResources, backupName: 'resources' },
          { label: 'lock', target: lock, staged: stagedLock, backupName: 'pok-runtime.lock.json' }
        ]
      }),
      /ENOENT|no such file|cannot find/i
    );
    assert.equal(await readFile(join(resources, 'marker'), 'utf8'), 'original resources');
    assert.equal(await readFile(lock, 'utf8'), 'original lock');
  } finally { await cleanup(root); }
});

test('bundle swap does not treat permission errors as missing originals', async () => {
  const root = await tempRoot();
  try {
    const resources = join(root, 'resources');
    const stagedResources = join(root, '.stage', 'resources');
    await mkdir(resources, { recursive: true });
    await mkdir(stagedResources, { recursive: true });
    await writeFile(join(resources, 'marker'), 'original resources', 'utf8');
    await writeFile(join(stagedResources, 'marker'), 'staged resources', 'utf8');
    const denied = Object.assign(new Error('stat denied'), { code: 'EACCES' });

    await assert.rejects(
      performAtomicSwap({
        workspace: root,
        backupsRoot: join(root, '.local', 'bundle-backups'),
        entries: [{ label: 'resources', target: resources, staged: stagedResources, backupName: 'resources' }],
        fs: { stat: async (path: string) => {
          if (path === resources) throw denied;
          return import('node:fs/promises').then(module => module.stat(path));
        } }
      }),
      /stat denied/
    );
    assert.equal(await readFile(join(resources, 'marker'), 'utf8'), 'original resources');
  } finally { await cleanup(root); }
});

test('bundle swap preserves both originals when a later target installation fails', async () => {
  const root = await tempRoot();
  try {
    const resources = join(root, 'resources');
    const lock = join(root, 'pok-runtime.lock.json');
    const stagedResources = join(root, '.stage', 'resources');
    const stagedLock = join(root, '.stage', 'pok-runtime.lock.json');
    await mkdir(resources, { recursive: true });
    await mkdir(stagedResources, { recursive: true });
    await writeFile(join(resources, 'marker'), 'original resources', 'utf8');
    await writeFile(lock, 'original lock', 'utf8');
    await writeFile(join(stagedResources, 'marker'), 'staged resources', 'utf8');
    await writeFile(stagedLock, 'staged lock', 'utf8');

    const fs = {
      rename: async (from: string, to: string) => {
        if (from === stagedLock) throw new Error('lock install denied');
        await import('node:fs/promises').then(module => module.rename(from, to));
      }
    };

    await assert.rejects(
      performAtomicSwap({
        workspace: root,
        backupsRoot: join(root, '.local', 'bundle-backups'),
        entries: [
          { label: 'resources', target: resources, staged: stagedResources, backupName: 'resources' },
          { label: 'lock', target: lock, staged: stagedLock, backupName: 'pok-runtime.lock.json' }
        ],
        fs
      }),
      /lock install denied/
    );
    assert.equal(await readFile(join(resources, 'marker'), 'utf8'), 'original resources');
    assert.equal(await readFile(lock, 'utf8'), 'original lock');
    assert.equal(await exists(join(resources, 'marker')), true);
  } finally { await cleanup(root); }
});

test('bundle swap surfaces rollback failures and retains backups', async () => {
  const root = await tempRoot();
  try {
    const resources = join(root, 'resources');
    const lock = join(root, 'pok-runtime.lock.json');
    const backups = join(root, '.local', 'bundle-backups');
    const stagedResources = join(root, '.stage', 'resources');
    const stagedLock = join(root, '.stage', 'pok-runtime.lock.json');
    await mkdir(resources, { recursive: true });
    await mkdir(stagedResources, { recursive: true });
    await writeFile(join(resources, 'marker'), 'original resources', 'utf8');
    await writeFile(lock, 'original lock', 'utf8');
    await writeFile(join(stagedResources, 'marker'), 'staged resources', 'utf8');
    await writeFile(stagedLock, 'staged lock', 'utf8');

    const fs = {
      rename: async (from: string, to: string) => {
        if (from === stagedLock) throw new Error('lock install denied');
        await import('node:fs/promises').then(module => module.rename(from, to));
      },
      rm: async () => { throw new Error('cleanup denied'); }
    };

    await assert.rejects(
      performAtomicSwap({
        workspace: root,
        backupsRoot: backups,
        entries: [
          { label: 'resources', target: resources, staged: stagedResources, backupName: 'resources' },
          { label: 'lock', target: lock, staged: stagedLock, backupName: 'pok-runtime.lock.json' }
        ],
        fs
      }),
      /rollback was incomplete.*cleanup denied|cleanup denied.*rollback was incomplete/s
    );
    const [backupName] = await readdir(backups);
    assert.equal(await readFile(join(backups, backupName, 'resources', 'marker'), 'utf8'), 'original resources');
    assert.equal(await readFile(lock, 'utf8'), 'original lock');
  } finally { await cleanup(root); }
});
