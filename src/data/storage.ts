import { openDatabaseSync } from 'expo-sqlite';
import { AppState, readState, serializeState } from './model';

// One atomic snapshot for the prototype. The event journal is retained inside it.
// A later migration can split tables without changing screen code.
let db: ReturnType<typeof openDatabaseSync> | undefined;
function database() {
  if (!db) {
    const connection = openDatabaseSync('red-control.db');
    connection.execSync(
      'PRAGMA journal_mode = WAL; CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY CHECK(id=1), value TEXT NOT NULL);',
    );
    db = connection;
  }
  return db;
}
export function load(): AppState | null {
  const row = database().getFirstSync<{ value: string }>('SELECT value FROM app_state WHERE id=1');
  return row ? readState(row.value) : null;
}
export function persist(state: AppState): void {
  database().runSync(
    'INSERT INTO app_state(id,value) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value',
    serializeState(state),
  );
}
