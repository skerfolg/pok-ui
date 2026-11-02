import { mkdir, rename, rm, stat } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { isAbsolute, join, relative } from 'node:path';

const defaultFs = { mkdir, rename, rm, stat };

export function ensureInside(parent, child, label) {
  const rel = relative(parent, child);
  if (!rel || rel === '..' || rel.startsWith('..\\') || rel.startsWith('../') || isAbsolute(rel)) throw new Error(`${label} is outside ${parent}`);
}

async function exists(path, fs = defaultFs) {
  try {
    await fs.stat(path);
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

function backupRoot(backupsRoot) {
  return join(backupsRoot, new Date().toISOString().replace(/[:.]/g, '-') + '-' + randomUUID());
}

function rollbackFailure(error, rollbackErrors, root) {
  if (!rollbackErrors.length) return error;
  const rollbackSummary = rollbackErrors.map(item => item?.message ?? String(item)).join('; ');
  return new AggregateError(
    [error, ...rollbackErrors],
    `Atomic bundle swap failed and rollback was incomplete; backup retained at ${root}: ${error.message}; rollback errors: ${rollbackSummary}`
  );
}

export async function performAtomicSwap({ workspace, backupsRoot, entries, fs: overrides = {} }) {
  const fs = { ...defaultFs, ...overrides };
  const root = backupRoot(backupsRoot);
  ensureInside(workspace, root, 'backupRoot');
  for (const entry of entries) {
    ensureInside(workspace, entry.target, entry.label);
    ensureInside(workspace, entry.staged, `staged ${entry.label}`);
  }
  await fs.mkdir(root, { recursive: true });
  const prepared = entries.map(entry => ({ ...entry, backup: join(root, entry.backupName) }));
  for (const entry of prepared) ensureInside(root, entry.backup, `backup ${entry.label}`);
  const movedOriginals = [];
  const installedReplacements = [];
  try {
    for (const entry of prepared) {
      if (await exists(entry.target, fs)) {
        await fs.rename(entry.target, entry.backup);
        movedOriginals.push(entry);
      }
    }
    for (const entry of prepared) {
      await fs.rename(entry.staged, entry.target);
      installedReplacements.push(entry);
    }
    return root;
  } catch (error) {
    const rollbackErrors = [];
    for (const entry of installedReplacements.slice().reverse()) {
      try {
        if (await exists(entry.target, fs)) await fs.rm(entry.target, { recursive: true, force: true });
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
    }
    for (const entry of movedOriginals.slice().reverse()) {
      try {
        if (await exists(entry.backup, fs)) await fs.rename(entry.backup, entry.target);
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
    }
    throw rollbackFailure(error, rollbackErrors, root);
  }
}
