import { test, expect, jest, beforeAll, beforeEach } from '@jest/globals';
import { Turnout } from '../src/screens/Turnout';
import { countFor, localDate } from '../src/data/model';
import { useTurnout } from '../src/features/turnout/useTurnout';
import {
  activeElection,
  electionStages,
  canCheck,
  validNoteTarget,
  taskRecordId,
} from '../src/data/model';
import { exportText } from '../src/data/export';
import React from 'react';
import { act, render, screen, fireEvent, renderHook } from '@testing-library/react-native';
import { FeedbackContext } from '../src/ui/feedback';
import { SheetHost } from '../src/ui/components';
import { Contacts } from '../src/screens/Contacts';
import { Complaints } from '../src/screens/Complaints';
import { Roadmap } from '../src/screens/Roadmap';
import { Profile } from '../src/screens/Profile';
import { actions, boot, getState } from '../src/data/store';
import { precinctCatalog, membersFor, readState, serializeState } from '../src/data/model';
import { useLaws } from '../src/features/laws/useLaws';
import { useSources } from '../src/features/laws/useSources';

jest.mock('expo-crypto', () => {
  let id = 0;
  return { randomUUID: () => 'test-id-' + ++id };
});
jest.mock('../src/data/storage', () => ({ load: () => null, persist: jest.fn() }));
jest.mock('../src/data/export', () => ({ exportText: jest.fn(async () => {}) }));
jest.mock('expo-video', () => ({ useVideoPlayer: () => ({}), VideoView: () => null }));
const feedback = {
  run: (fn: () => void) => {
    fn();
    return true;
  },
  notify: jest.fn(),
  message: '',
};
function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <FeedbackContext.Provider value={feedback}>
      {children}
      <SheetHost openTurnout={() => {}} />
    </FeedbackContext.Provider>
  );
}
beforeAll(() => boot());
beforeEach(() => {
  const station = precinctCatalog.find((p) => p.electionId === 'municipal-2026')!;
  actions.selectContext(station.electionId, station.id, 'Иван Иванов');
});

test('contacts add, edit, and delete through the existing UI', async () => {
  await render(
    <Wrapper>
      <Contacts />
    </Wrapper>,
  );
  await fireEvent.press(screen.getByText('Добавить контакт'));
  await fireEvent.changeText(screen.getByLabelText('Имя'), 'Юрист Тест');
  await fireEvent.changeText(screen.getByLabelText('Телефон'), '+79991234567');
  await fireEvent.press(screen.getByText('Сохранить контакт'));
  expect(screen.getByText('Юрист Тест')).toBeTruthy();
  await fireEvent.press(screen.getByText('Изменить'));
  await fireEvent.changeText(screen.getByLabelText('Имя'), 'Юрист Изменён');
  await fireEvent.press(screen.getByText('Сохранить контакт'));
  expect(screen.getByText('Юрист Изменён')).toBeTruthy();
  await fireEvent.press(screen.getByText('Удалить'));
  await fireEvent.press(screen.getByText('Удалить контакт'));
  expect(screen.queryByText('Юрист Изменён')).toBeNull();
});

test('opening a violation produces only its complaint and saves an independent document', async () => {
  await render(
    <Wrapper>
      <Complaints />
    </Wrapper>,
  );
  await fireEvent.press(screen.getByText('Не дают ознакомиться с реестром'));
  expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  expect(screen.queryByText('Подготовить обращение')).toBeNull();
  const text = screen.getByLabelText('Текст обращения');
  expect(text.props.value).toContain('реестром');
  expect(text.props.value).not.toContain('нет доступа к списку');
  expect(Object.values(getState().complaintComposers ?? {})[0].selected).toEqual(['register']);
  await fireEvent.press(screen.getByText('Сохранить черновик'));
  expect(getState().complaints.at(0)?.text).toContain('ЖАЛОБА');
  expect(Object.values(getState().complaintComposers ?? {})[0].selected).toEqual([]);
  await fireEvent.press(screen.getByText('Экспортировать текст'));
  expect(exportText).toHaveBeenCalled();
});

test('repeated roadmap trips maintain separate checklists', async () => {
  await render(
    <Wrapper>
      <Roadmap />
    </Wrapper>,
  );
  await fireEvent.press(screen.getByText('Голосование на дому'));
  await fireEvent.press(screen.getByText('Добавить выезд'));
  expect(getState().trips.length).toBe(1);
  await fireEvent.press(screen.getAllByRole('checkbox')[0]);
  await fireEvent.changeText(screen.getByLabelText('Заметки к этапу'), 'Первый выезд');
  await fireEvent(screen.getByLabelText('Заметки к этапу'), 'blur');
  expect(screen.getByText('✓ Сохранено')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Закрыть окно'));
  await fireEvent.press(screen.getByText('Добавить выезд'));
  expect(getState().trips.length).toBe(2);
  expect(screen.getAllByRole('checkbox')[0].props.accessibilityState.checked).toBe(false);
  expect(screen.getByLabelText('Заметки к этапу').props.value).toBe('');
  const restored = readState(serializeState(getState()));
  expect(restored.trips.length).toBe(2);
  expect(Object.values(restored.notes)).toContain('Первый выезд');
});

test('commission members can be edited, added, and saved', async () => {
  await render(
    <Wrapper>
      <Profile onClose={() => {}} />
    </Wrapper>,
  );
  expect(screen.queryByText('Изменить состав комиссии')).toBeNull();
  await fireEvent.press(screen.getByLabelText('Изменить: Председатель'));
  expect(screen.getAllByLabelText('Фамилия, имя, отчество')).toHaveLength(1);
  await fireEvent.changeText(screen.getByLabelText('Фамилия, имя, отчество'), 'Не сохранять');
  await fireEvent.press(screen.getByText('Отмена'));
  expect(membersFor(getState()).some((member) => member.name === 'Не сохранять')).toBe(false);
  await fireEvent.press(screen.getByLabelText('Добавить члена комиссии'));
  const names = screen.getAllByLabelText('Фамилия, имя, отчество');
  await fireEvent.changeText(names.at(-1)!, 'Новый член комиссии');
  await fireEvent.press(screen.getByText('Сохранить'));
  expect(membersFor(getState()).some((member) => member.name === 'Новый член комиссии')).toBe(true);
  await fireEvent.press(screen.getByLabelText('Изменить: Член комиссии'));
  await fireEvent.press(screen.getByText('Удалить члена комиссии'));
  await fireEvent.press(screen.getByText('Сохранить'));
  expect(membersFor(getState()).some((member) => member.name === 'Новый член комиссии')).toBe(
    false,
  );
});

test('laws and sources react to campaign switching', async () => {
  const { result } = await renderHook(() => ({ laws: useLaws(), sources: useSources() }));
  const count = result.current.laws.length;
  const station = precinctCatalog.find((p) => p.electionId === 'state-duma-2026')!;
  await act(() => actions.selectContext(station.electionId, station.id, 'Иван Иванов'));
  expect(result.current.laws.length).toBeGreaterThan(count);
  expect(
    result.current.sources.every((source) =>
      result.current.laws.some((law) => law.sourceIds.includes(source.id)),
    ),
  ).toBe(true);
});

test('a repeatable sequential stage rejects trips belonging to another stage', () => {
  const state = getState();
  const stage = electionStages(activeElection(state), state.day).find(
    (stage) => stage.id === 'protocol',
  )!;
  expect(stage.repeatable).toBe(true);
  expect(() => actions.trip('arrival')).toThrow();
  const trip = actions.trip(stage.id);
  expect(canCheck(getState(), stage.id, stage.items[0].id, trip.id)).toBe(true);
  expect(
    canCheck(
      getState(),
      'home',
      electionStages(activeElection(state), state.day).find((stage) => stage.id === 'home')!
        .items[0].id,
      trip.id,
    ),
  ).toBe(false);
  actions.check(stage.id, stage.items[0].id, trip.id);
  expect(
    validNoteTarget(getState(), 'item:' + taskRecordId(stage, stage.items[0].id, trip.id)),
  ).toBe(true);
  expect(readState(serializeState(getState())).trips.at(-1)?.stageId).toBe(stage.id);
});

test('turnout dashboard records increment, decrement and correction workflows', async () => {
  await render(
    <Wrapper>
      <Turnout onClose={() => {}} />
    </Wrapper>,
  );
  await fireEvent.press(screen.getByLabelText('Добавить человека в окне явки'));
  expect(countFor(getState())).toBe(1);
  await fireEvent.press(screen.getByLabelText('Убрать человека в окне явки'));
  expect(countFor(getState())).toBe(0);
  await fireEvent.press(screen.getByLabelText('Исправить'));
  await fireEvent.changeText(screen.getByLabelText('Правильное значение'), '7');
  await fireEvent.changeText(
    screen.getByLabelText('Причина исправления'),
    'Пропущены семь человек',
  );
  await fireEvent.press(screen.getByText('Сохранить'));
  expect(countFor(getState())).toBe(7);
  expect(screen.queryByText('Пропущены семь человек')).toBeNull();
  await fireEvent.press(screen.getByLabelText('Развернуть историю действий'));
  expect(screen.getByText('Пропущены семь человек')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Свернуть историю действий'));
  expect(screen.queryByText('Пропущены семь человек')).toBeNull();
  expect(
    getState()
      .counter.slice(-3)
      .map((e) => e.delta),
  ).toEqual([1, -1, 7]);
});

test('turnout checkpoints preserve cumulative totals across days and saved comparisons', async () => {
  jest.useFakeTimers();
  try {
    jest.setSystemTime(new Date('2027-09-27T09:59:00'));
    await act(() => actions.correct(98, 'Первый день'));
    const { result, unmount } = await renderHook(() => useTurnout(), { wrapper: Wrapper });
    await act(() => result.current.setDate(localDate()));
    expect(result.current.points[0].reached).toBe(false);
    await act(() => {
      jest.setSystemTime(new Date('2027-09-28T10:00:00'));
      actions.increment();
      result.current.setDate(localDate());
      jest.advanceTimersByTime(15000);
    });
    expect(result.current.count).toBe(99);
    expect(result.current.points[0].value).toBe(99);
    await act(() => actions.reconcile('10:00', 101, 99, localDate()));
    await act(() => actions.increment());
    expect(result.current.points[0].value).toBe(99);
    expect(result.current.points[0].row?.commission).toBe(101);
    await act(() => result.current.setDate('2027-09-27'));
    expect(result.current.points[0].value).toBe(98);
    expect(result.current.count).toBe(100);
    expect(countFor(readState(serializeState(getState())))).toBe(100);
    unmount();
  } finally {
    jest.useRealTimers();
  }
});
