import { TurnoutSummary } from '../features/turnout/TurnoutSummary';
import { TurnoutForm } from '../features/turnout/TurnoutForm';
import { TurnoutHistory } from '../features/turnout/TurnoutHistory';
import { useTurnout } from '../features/turnout/useTurnout';
import { Sheet } from '../ui/components';

export function Turnout({ onClose }: { onClose: () => void }) {
  const controller = useTurnout();
  const { mode, setMode } = controller;
  return (
    <Sheet
      title={
        mode === 'record'
          ? 'Сверка с комиссией'
          : mode === 'correct'
            ? 'Исправить счётчик'
            : mode === 'history'
              ? 'История явки'
              : 'Явка на участке'
      }
      backAction={
        mode === 'history' ? { label: 'К сводке', onPress: () => setMode('summary') } : undefined
      }
      onClose={onClose}
      fullScreen
      hideCounter
    >
      {mode === 'summary' && <TurnoutSummary controller={controller} />}
      {(mode === 'record' || mode === 'correct') && <TurnoutForm controller={controller} />}
      {mode === 'history' && <TurnoutHistory controller={controller} />}
    </Sheet>
  );
}
