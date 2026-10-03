import { beforeEach, afterEach, expect, jest, test } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { useApplication } from '../src/app/useApplication';
import { actions, boot } from '../src/data/store';
import { precinctCatalog } from '../src/data/model';
import { acts } from '../src/content/acts';

jest.mock('expo-crypto', () => ({ randomUUID: () => String(Math.random()) }));
jest.mock('../src/data/storage', () => ({ load: () => null, persist: jest.fn() }));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'light' },
}));
beforeEach(() => {
  jest.useFakeTimers();
  boot();
  const station = precinctCatalog[0];
  actions.selectContext(station.electionId, station.id, 'Наблюдатель');
  jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(null);
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});
test('application navigates, counts turnout, opens sheets and clears replaced messages', async () => {
  const { result, unmount } = await renderHook(() => useApplication());
  expect(result.current.contextReady).toBe(true);
  await act(() => result.current.navigate('contacts'));
  expect(result.current.tab).toBe('contacts');
  const count = result.current.count;
  await act(() => result.current.increment());
  expect(result.current.count).toBe(count + 1);
  await act(() => result.current.setTurnout(true));
  expect(result.current.turnout).toBe(true);
  await act(() => result.current.notify('Первое'));
  await act(() => jest.advanceTimersByTime(4000));
  await act(() => result.current.notify('Второе'));
  await act(() => jest.advanceTimersByTime(1000));
  expect(result.current.toast).toBe('Второе');
  await act(() => jest.advanceTimersByTime(3500));
  expect(result.current.toast).toBe('');
  await unmount();
  expect(result.current.toast).toBe('');
});
test('application reports failed actions and preserves navigation', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  const { result } = await renderHook(() => useApplication());
  let succeeded: boolean | undefined;
  await act(() => {
    succeeded = result.current.run(() => {
      throw new Error('quota');
    });
  });
  expect(succeeded).toBe(false);
  expect(result.current.toast).toContain('Не удалось сохранить');
  await act(() => {
    succeeded = result.current.run(() => {}, 'Сохранено');
  });
  expect(succeeded).toBe(true);
  expect(result.current.toast).toBe('Сохранено');
});
test('deep links accept known legal provisions and ignore unknown or malformed URLs', async () => {
  let listener: ((event: { url: string }) => void) | undefined;
  const remove = jest.fn();
  jest.spyOn(Linking, 'addEventListener').mockImplementation((_event, callback) => {
    listener = callback;
    return { remove } as unknown as ReturnType<typeof Linking.addEventListener>;
  });
  const norm = acts[0].id + '/1';
  jest.mocked(Linking.getInitialURL).mockResolvedValue('redcontrol://norm/' + norm);
  const { result, unmount } = await renderHook(() => useApplication());
  expect(result.current.linkedNorm).toBe(norm);
  await act(() => listener!({ url: 'broken url' }));
  await act(() => listener!({ url: 'redcontrol://norm/unknown/1' }));
  expect(result.current.linkedNorm).toBe(norm);
  await act(() => listener!({ url: 'https://example.test/?norm=' + norm }));
  expect(result.current.linkedNorm).toBe(norm);
  await unmount();
  expect(remove).toHaveBeenCalled();
});
test('unavailable initial link does not prevent startup', async () => {
  jest.mocked(Linking.getInitialURL).mockRejectedValue(new Error('unavailable'));
  const { result } = await renderHook(() => useApplication());
  expect(result.current.contextReady).toBe(true);
  expect(result.current.linkedNorm).toBeUndefined();
});
