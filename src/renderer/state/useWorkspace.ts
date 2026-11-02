import { applyManualXml, undoInputSnapshot, workspaceInputVersions } from '../../shared/build-revision';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppState, BuildDocument, BuildEdit } from '../../shared/contracts';
import { createDefaultState } from '../../shared/state';
import { editBuild } from '../../shared/pob-document';
import { api } from '../services/api';
export function useWorkspace() {
  const [state, setState] = useState<AppState>(createDefaultState);
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState('불러오는 중');
  const [error, setError] = useState('');
  const queue = useRef<Promise<void>>(Promise.resolve());
  const version = useRef(0);
  const latest = useRef(state);
  useEffect(() => { let alive = true; api.loadState().then(value => { if (alive) { latest.current = value; setState(value); setLoaded(true); setSaveStatus('저장됨'); } }).catch(reason => { if (alive) setError(String(reason)); }); return () => { alive = false; }; }, []);
  const update = useCallback((fn: (state: AppState) => AppState) => {
    const base=latest.current;
    const next = fn(latest.current); if (next === latest.current) return; latest.current = next; setState(next);
    const current = ++version.current; setSaveStatus('저장 중…');
    queue.current = queue.current.catch(() => {}).then(async() => api.saveState(next,await workspaceInputVersions(base.builds))).then(() => { if (version.current === current) setSaveStatus('저장됨'); });
    void queue.current.catch(reason => { setError(String(reason)); setSaveStatus('저장 실패'); });
  }, []);
  const changeBuild = useCallback((id: string, fn: (build: BuildDocument) => BuildDocument) => update(s => ({ ...s, builds: s.builds.map(b => b.id === id ? fn(b) : b) })), [update]);
  const applyEdit = useCallback((id: string, edit: BuildEdit, label: string) => changeBuild(id, build => {
    const xml = editBuild(build.xml, edit); if (xml === build.xml) return build;
    return applyManualXml({...build,documentSchemaVersion:2},xml,label);
  }), [changeBuild]);
  const undo = useCallback((id: string) => changeBuild(id, build => {
    return undoInputSnapshot({...build,documentSchemaVersion:2});
  }), [changeBuild]);
  const flush = useCallback(() => queue.current, []);
  return { state, loaded, update, changeBuild, applyEdit, undo, saveStatus, error, setError, flush };
}
