import { Pressable, Text } from 'react-native';
import { TurnoutSummary } from '../features/turnout/TurnoutSummary';
import { TurnoutForm } from '../features/turnout/TurnoutForm';
import { TurnoutHistory } from '../features/turnout/TurnoutHistory';
import { useTurnout } from '../features/turnout/useTurnout';
import { Sheet, Icon } from '../ui/components';
import { colors as c, s } from '../ui/theme';

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
      onClose={onClose}
      fullScreen
      hideCounter
    >
      {mode !== 'summary' && (
        <Pressable accessibilityRole="button" onPress={() => setMode('summary')} style={s.row}>
          <Icon name="arrow-left" color={c.red} size={16} />
          <Text style={{ color: c.red, fontSize: 13 }}>К сводке</Text>
        </Pressable>
      )}
      {mode === 'summary' && <TurnoutSummary controller={controller} />}
      {(mode === 'record' || mode === 'correct') && <TurnoutForm controller={controller} />}
      {mode === 'history' && <TurnoutHistory controller={controller} />}
    </Sheet>
  );
}
