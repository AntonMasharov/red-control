import { AppState, readState, serializeState } from './model';
const KEY = 'red-control:v1';
export function load(): AppState | null {
  const raw = localStorage.getItem(KEY);
  return raw ? readState(raw) : null;
}
export function persist(state: AppState): void {
  localStorage.setItem(KEY, serializeState(state));
}
