import React from 'react';
import { beforeAll, beforeEach, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Information } from '../src/screens/Information';
import { CommissionTree } from '../src/ui/CommissionTree';
import { catalog, campaignContent } from '../src/content/catalog';
import { actions, boot } from '../src/data/store';
import { precinctCatalog } from '../src/data/model';
import { FeedbackContext } from '../src/ui/feedback';
import { SheetHost } from '../src/ui/components';

jest.mock('expo-crypto', () => ({ randomUUID: () => String(Math.random()) }));
jest.mock('../src/data/storage', () => ({ load: () => null, persist: jest.fn() }));
jest.mock('expo-video', () => ({ useVideoPlayer: () => ({}), VideoView: () => null }));
const station = precinctCatalog.find((p) => p.electionId === 'municipal-2026')!;
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
beforeEach(() => actions.selectContext(station.electionId, station.id, 'Наблюдатель'));
test('library searches theory, opens lessons, shows documents and opens legal grounds', async () => {
  const content = campaignContent(station.electionId);
  await render(
    <Wrapper>
      <Information />
    </Wrapper>,
  );
  const lesson = content.topics[0];
  await fireEvent.changeText(
    screen.getByLabelText('Поиск по материалам'),
    'несуществующийматериал',
  );
  expect(screen.queryByText(lesson.title)).toBeNull();
  await fireEvent.changeText(screen.getByLabelText('Поиск по материалам'), '');
  await fireEvent.press(screen.getByText(lesson.title));
  expect(screen.getByText('Связанные материалы')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Закрыть окно'));
  await fireEvent.press(screen.getByText('Документы'));
  expect(
    screen.getByText('Полные тексты законов, шаблоны, заполненные документы и фотообразцы.'),
  ).toBeTruthy();
  await fireEvent.press(screen.getByText('Законы'));
  const law = content.laws[0];
  await fireEvent.press(screen.getByText(law.title));
  expect(screen.getByLabelText('Закрыть окно')).toBeTruthy();
  await act(() =>
    actions.selectContext(
      'state-duma-2026',
      precinctCatalog.find((p) => p.electionId === 'state-duma-2026')!.id,
      '',
    ),
  );
  expect(screen.queryByLabelText('Закрыть окно')).toBeNull();
});
test('commission search preserves ancestors, selects only stations and handles no results', async () => {
  const selected = jest.fn();
  const campaign = catalog.campaigns[station.electionId];
  const node = Object.values(campaign.commissions).find((n) => n.id === station.id)!;
  const { rerender } = await render(
    <CommissionTree electionId={station.electionId} query={node.number!} onSelect={selected} />,
  );
  await fireEvent.press(screen.getByText('УИК · ' + node.title));
  expect(selected).toHaveBeenCalledWith(station.id);
  if (node.parentId) {
    const parent = campaign.commissions[node.parentId];
    expect(
      screen.getByText(
        (parent.kind === 'IKSRF' ? 'ИКСРФ' : parent.kind === 'TIK' ? 'ТИК' : 'ОИК') +
          ' · ' +
          parent.title,
      ),
    ).toBeTruthy();
  }
  await rerender(
    <CommissionTree
      electionId={station.electionId}
      query="несуществующаякомиссия"
      onSelect={selected}
    />,
  );
  expect(screen.getByText('Комиссии не найдены.')).toBeTruthy();
});
