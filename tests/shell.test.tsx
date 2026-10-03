import React from 'react';
import { expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import App from '../src/app/Application';
import { getState } from '../src/data/store';
import { catalog } from '../src/content/catalog';
import { precinctCatalog, countFor, hasSelectedContext } from '../src/data/model';
import { exportText } from '../src/data/export';

jest.mock('expo-crypto', () => ({ randomUUID: () => String(Math.random()) }));
jest.mock('../src/data/storage', () => ({ load: () => null, persist: jest.fn() }));
jest.mock('../src/data/export', () => ({
  exportText: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));
jest.mock('expo-video', () => ({ useVideoPlayer: () => ({}), VideoView: () => null }));
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

test('first startup, backup export, station selection, navigation and turnout work together', async () => {
  await render(<App />);
  expect(hasSelectedContext(getState())).toBe(false);
  expect(screen.getByText('1. Выберите выборы')).toBeTruthy();
  await fireEvent.press(screen.getByText('Экспортировать мои данные'));
  expect(exportText).toHaveBeenCalledWith(
    'red-control-backup.json',
    expect.any(String),
    'application/json',
  );
  const station = precinctCatalog.find((p) => p.electionId === 'municipal-2026')!;
  await fireEvent.press(screen.getByText(catalog.campaigns[station.electionId].election.title));
  await fireEvent.changeText(screen.getByLabelText('Найти УИК'), station.number);
  const node = catalog.campaigns[station.electionId].commissions[station.id];
  await fireEvent.press(screen.getByText('УИК · ' + node.title));
  await fireEvent.changeText(
    screen.getByLabelText('Ваши фамилия, имя, отчество'),
    'Тестовый наблюдатель',
  );
  await fireEvent.press(screen.getByText('Сохранить выбор'));
  expect(getState().precinctId).toBe(station.id);
  expect(getState().profile.name).toBe('Тестовый наблюдатель');
  await fireEvent.press(screen.getByLabelText('Закрыть окно'));
  await fireEvent.press(screen.getByText('Этапы'));
  await fireEvent.press(screen.getByText('Жалобы'));
  await fireEvent.press(screen.getByText('Штаб'));
  const before = countFor(getState());
  await fireEvent.press(screen.getByLabelText('Добавить одного человека'));
  expect(countFor(getState())).toBe(before + 1);
  await fireEvent.press(screen.getByLabelText(`Явка ${before + 1}. Открыть подробности`));
  expect(screen.getByLabelText('Закрыть окно')).toBeTruthy();
});
