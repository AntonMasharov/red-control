import React from 'react';
import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Roadmap } from '../src/screens/Roadmap';
import { SheetHost } from '../src/ui/components';
import { FeedbackContext } from '../src/ui/feedback';
import { actions, boot, getState } from '../src/data/store';
import {
  activeElection,
  electionStages,
  precinctCatalog,
  recordKey,
  taskRecordId,
  readState,
  serializeState,
} from '../src/data/model';

jest.mock('../src/content/catalog.generated.json', () => ({
  ...jest.requireActual<any>('./fixtures/catalog.json'),
  problemSolving: JSON.parse(
    require('fs').readFileSync(
      require('path').resolve(__dirname, '../src/content/catalog.generated.json'),
      'utf8',
    ),
  ).problemSolving,
}));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'problem-test' }));
jest.mock('../src/data/storage', () => ({ load: () => null, persist: jest.fn() }));
jest.mock('expo-video', () => ({ useVideoPlayer: () => ({}), VideoView: () => null }));

test('problem menu is inert until started; actions, waiting and checkbox resolution persist', async () => {
  boot();
  const station = precinctCatalog.find((p) => p.electionId === 'municipal-2026')!;
  actions.selectContext(station.electionId, station.id, 'Наблюдатель');
  const stage = electionStages(activeElection(getState()), 1).find(
    (s) => !s.anytime && !s.repeatable,
  )!;
  const item = stage.items[0];
  const key = recordKey(getState(), taskRecordId(stage, item.id));
  await render(
    <FeedbackContext.Provider
      value={{
        run: (fn) => {
          fn();
          return true;
        },
        notify: jest.fn(),
        message: '',
      }}
    >
      <Roadmap />
      <SheetHost openTurnout={() => {}} />
    </FeedbackContext.Provider>,
  );
  await fireEvent.press(screen.getByText('1. ' + stage.title));
  await fireEvent.press(screen.getByLabelText('Решение проблемы: ' + item.text));
  expect(getState().problems?.[key]).toBeUndefined();
  expect(screen.getByText('Попросить устно, сославшись на статью')).toBeTruthy();
  await fireEvent.press(screen.getByText('Я попросил устно'));
  expect(screen.getByText('Проблема устранена?')).toBeTruthy();
  expect(getState().problems?.[key].reviewing).toBe(true);
  await fireEvent.press(screen.getByText('Назад'));
  expect(getState().problems?.[key].completed).toEqual([]);
  expect(screen.getByText('Я попросил устно')).toBeTruthy();
  await fireEvent.press(screen.getByText('Я попросил устно'));
  await fireEvent.press(screen.getByText('Нет'));
  expect(screen.getByText('Написать жалобу')).toBeTruthy();
  await fireEvent.press(screen.getByText('Выбрать жалобу'));
  expect(screen.getByText('Выберите пример жалобы')).toBeTruthy();
  await fireEvent.press(screen.getByText('Не дают ознакомиться с реестром'));
  expect(screen.getByLabelText('Текст обращения').props.value).toContain('ЖАЛОБА');
  expect(getState().problems?.[key].completed).toEqual(['oral']);
  await fireEvent.press(screen.getByLabelText('Закрыть окно'));
  await fireEvent.press(screen.getByText('Я подал жалобу'));
  await fireEvent.press(screen.getByText('Пока жду ответа'));
  expect(getState().problems?.[key].waiting).toBe(true);
  await fireEvent.press(screen.getByLabelText('Закрыть окно'));
  expect(screen.getByText('Ожидается ответ ›')).toBeTruthy();
  await fireEvent.press(screen.getAllByRole('checkbox')[0]);
  expect(getState().problems?.[key].resolved).toBe(true);
  expect(screen.getByText('Решено · История ›')).toBeTruthy();
  expect(readState(serializeState(getState())).problems?.[key].completed).toEqual([
    'oral',
    'complaint',
  ]);
});
