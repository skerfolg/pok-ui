export interface BundleSwapEntry {
  label: string;
  target: string;
  staged: string;
  backupName: string;
}

export interface BundleSwapFileSystem {
  mkdir?: (path: string, options?: { recursive?: boolean }) => Promise<unknown>;
  rename?: (from: string, to: string) => Promise<void>;
  rm?: (path: string, options?: { recursive?: boolean; force?: boolean }) => Promise<void>;
  stat?: (path: string) => Promise<unknown>;
}

export function ensureInside(parent: string, child: string, label: string): void;

export function performAtomicSwap(options: {
  workspace: string;
  backupsRoot: string;
  entries: BundleSwapEntry[];
  fs?: Partial<BundleSwapFileSystem>;
}): Promise<string>;
