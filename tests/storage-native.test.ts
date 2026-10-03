import { beforeEach, expect, jest, test } from '@jest/globals';
import { openDatabaseSync } from 'expo-sqlite';
import { freshState, serializeState } from '../src/data/model';
import type * as Storage from '../src/data/storage';

jest.mock('expo-sqlite', () => ({ openDatabaseSync: jest.fn() }));
const connection = { execSync: jest.fn(), getFirstSync: jest.fn(), runSync: jest.fn() };
let storage: typeof Storage;
beforeEach(() => {
  jest.clearAllMocks();
  connection.execSync.mockImplementation(() => {});
  connection.getFirstSync.mockReturnValue(null);
  jest
    .mocked(openDatabaseSync)
    .mockReturnValue(connection as unknown as ReturnType<typeof openDatabaseSync>);
  jest.isolateModules(() => {
    storage = require('../src/data/storage');
  });
});
test('SQLite lazily creates one database and writes a parameterized atomic snapshot', () => {
  expect(openDatabaseSync).not.toHaveBeenCalled();
  expect(storage.load()).toBeNull();
  const state = freshState();
  storage.persist(state);
  expect(openDatabaseSync).toHaveBeenCalledTimes(1);
  expect(connection.execSync).toHaveBeenCalledWith(
    expect.stringContaining('CREATE TABLE IF NOT EXISTS app_state'),
  );
  expect(connection.runSync).toHaveBeenCalledWith(
    expect.stringContaining('VALUES(1,?)'),
    serializeState(state),
  );
  connection.getFirstSync.mockReturnValue({ value: serializeState(state) });
  expect(storage.load()?.version).toBe(state.version);
});
test('SQLite initialization retries after failure and never exposes an uninitialized connection', () => {
  connection.execSync.mockImplementationOnce(() => {
    throw new Error('locked');
  });
  expect(() => storage.load()).toThrow('locked');
  expect(storage.load()).toBeNull();
  expect(openDatabaseSync).toHaveBeenCalledTimes(2);
  expect(connection.execSync).toHaveBeenCalledTimes(2);
});
test('SQLite corruption and write errors are propagated without deleting records', () => {
  connection.getFirstSync.mockReturnValue({ value: '{invalid' });
  expect(() => storage.load()).toThrow();
  connection.runSync.mockImplementationOnce(() => {
    throw new Error('full');
  });
  expect(() => storage.persist(freshState())).toThrow('full');
  expect(connection.execSync).toHaveBeenCalledTimes(1);
});
