import { beforeEach, afterEach, expect, jest, test } from '@jest/globals';
import { Linking, Platform, Share } from 'react-native';
import { exportText } from '../src/data/export';
import { load, persist } from '../src/data/storage.web';
import { freshState, serializeState } from '../src/data/model';
import { openOriginal } from '../src/content/originals';
import { openLocalFile } from '../src/content/open-local-file';
import { Asset } from 'expo-asset';
import * as FS from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';

jest.mock('expo-asset', () => ({ Asset: { fromModule: jest.fn() } }));
jest.mock('expo-file-system/legacy', () => ({
  cacheDirectory: 'file:///cache/',
  copyAsync: jest.fn<() => Promise<void>>(),
  getContentUriAsync: jest.fn<() => Promise<string>>(),
}));
jest.mock('expo-intent-launcher', () => ({ startActivityAsync: jest.fn<() => Promise<void>>() }));
jest.mock('expo-sharing', () => ({ shareAsync: jest.fn<() => Promise<void>>() }));
const originalOS = Platform.OS;
const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
beforeEach(() => {
  jest.clearAllMocks();
});
afterEach(() => {
  Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
  else Reflect.deleteProperty(globalThis, 'localStorage');
  jest.restoreAllMocks();
});
function platform(os: string) {
  Object.defineProperty(Platform, 'OS', { value: os, configurable: true });
}
function storage(value: string | null = null) {
  const api = { getItem: jest.fn(() => value), setItem: jest.fn() };
  Object.defineProperty(globalThis, 'localStorage', { value: api, configurable: true });
  return api;
}
test('web storage distinguishes missing, valid and corrupt snapshots and propagates failed writes', () => {
  const api = storage();
  expect(load()).toBeNull();
  const state = freshState();
  persist(state);
  expect(api.setItem).toHaveBeenCalledWith('red-control:v1', serializeState(state));
  storage(serializeState(state));
  expect(load()?.version).toBe(state.version);
  storage('{broken');
  expect(() => load()).toThrow();
  const denied = storage();
  denied.getItem.mockImplementation(() => {
    throw new Error('denied');
  });
  denied.setItem.mockImplementation(() => {
    throw new Error('quota');
  });
  expect(() => load()).toThrow('denied');
  expect(() => persist(state)).toThrow('quota');
});
test('native export shares exact text and propagates cancellation errors', async () => {
  platform('ios');
  const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });
  await exportText('жалоба.txt', 'Русский текст');
  expect(share).toHaveBeenCalledWith({ title: 'жалоба.txt', message: 'Русский текст' });
  share.mockRejectedValueOnce(new Error('unavailable'));
  await expect(exportText('backup.json', '{}')).rejects.toThrow('unavailable');
});
test('Android viewer receives a content URI and read permission; iOS shares the file', async () => {
  platform('android');
  jest.mocked(FS.getContentUriAsync).mockResolvedValue('content://document');
  await openLocalFile('file:///law.pdf', 'application/pdf');
  expect(IntentLauncher.startActivityAsync).toHaveBeenCalledWith('android.intent.action.VIEW', {
    data: 'content://document',
    type: 'application/pdf',
    flags: 1,
  });
  expect(Sharing.shareAsync).not.toHaveBeenCalled();
  platform('ios');
  await openLocalFile('file:///law.pdf', 'application/pdf');
  expect(Sharing.shareAsync).toHaveBeenCalledWith('file:///law.pdf', {
    mimeType: 'application/pdf',
    dialogTitle: 'Открыть исходный файл',
  });
});
test('original documents open by URL on web and use downloaded local assets on native', async () => {
  const downloadAsync = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
  jest.mocked(Asset.fromModule).mockReturnValue({
    uri: 'https://example.test/law.pdf',
    localUri: 'file:///bundled/law.pdf',
    downloadAsync,
  } as unknown as Asset);
  const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  platform('web');
  await openOriginal({ asset: 1, name: 'law.pdf', mime: 'application/pdf' });
  expect(openURL).toHaveBeenCalledWith('https://example.test/law.pdf');
  expect(downloadAsync).not.toHaveBeenCalled();
  platform('ios');
  await openOriginal({ asset: 1, name: 'law.pdf', mime: 'application/pdf' });
  expect(FS.copyAsync).toHaveBeenCalledWith({
    from: 'file:///bundled/law.pdf',
    to: 'file:///cache/law.pdf',
  });
  downloadAsync.mockRejectedValueOnce(new Error('download failed'));
  await expect(
    openOriginal({ asset: 1, name: 'law.pdf', mime: 'application/pdf' }),
  ).rejects.toThrow('download failed');
});

test('web export downloads exact contents and releases resources even if the browser refuses the click', async () => {
  platform('web');
  jest.useFakeTimers();
  const descriptors = new Map<string, PropertyDescriptor | undefined>();
  const anchor = { href: '', download: '', click: jest.fn(), remove: jest.fn() };
  const appendChild = jest.fn();
  const revoke = jest.fn();
  const createDescriptor = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
  const revokeDescriptor = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');
  for (const name of ['document', 'Blob'])
    descriptors.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
  const blobs: unknown[][] = [];
  class TestBlob {
    constructor(...args: unknown[]) {
      blobs.push(args);
    }
  }
  try {
    Object.defineProperty(globalThis, 'document', {
      value: { createElement: () => anchor, body: { appendChild } },
      configurable: true,
    });
    Object.defineProperty(globalThis, 'Blob', { value: TestBlob, configurable: true });
    Object.defineProperty(URL, 'createObjectURL', {
      value: () => 'blob:export',
      configurable: true,
    });
    Object.defineProperty(URL, 'revokeObjectURL', { value: revoke, configurable: true });
    await exportText('backup.json', '{"name":"Наблюдатель"}', 'application/json');
    expect(anchor.download).toBe('backup.json');
    expect(anchor.href).toBe('blob:export');
    expect(blobs[0]).toEqual([['{"name":"Наблюдатель"}'], { type: 'application/json' }]);
    expect(appendChild).toHaveBeenCalledWith(anchor);
    expect(anchor.remove).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(1000);
    expect(revoke).toHaveBeenCalledWith('blob:export');
    anchor.click.mockImplementationOnce(() => {
      throw new Error('blocked');
    });
    await expect(exportText('failed.txt', 'text')).rejects.toThrow('blocked');
    expect(anchor.remove).toHaveBeenCalledTimes(2);
    jest.advanceTimersByTime(1000);
    expect(revoke).toHaveBeenCalledTimes(2);
  } finally {
    for (const [name, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    }
    if (createDescriptor) Object.defineProperty(URL, 'createObjectURL', createDescriptor);
    else Reflect.deleteProperty(URL, 'createObjectURL');
    if (revokeDescriptor) Object.defineProperty(URL, 'revokeObjectURL', revokeDescriptor);
    else Reflect.deleteProperty(URL, 'revokeObjectURL');
    jest.useRealTimers();
  }
});
