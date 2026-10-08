import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

/** Hash original bytes; unreadable files fail verification. */
export async function sha256File(file) {
  return createHash('sha256').update(await readFile(file)).digest('hex');
}
