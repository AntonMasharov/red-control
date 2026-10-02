import { View, Text, Pressable } from 'react-native';
import { manifest } from '../../content';
import { Button, Field } from '../../ui/components';
import { colors as c, s } from '../../ui/theme';
import type { useTurnout } from './useTurnout';

export function TurnoutForm({ controller }: { controller: ReturnType<typeof useTurnout> }) {
  const { mode, observer, setObserver, slot, value, setValue, reason, setReason, submit } =
    controller;
  return (
    <>
      {mode === 'record' && (
        <>
          <View style={{ gap: 7 }}>
            <Text style={[s.label, { marginBottom: 0 }]}>Время сверки</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {manifest.reconciliationTimes.map((t) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: slot === t }}
                  disabled={!controller.points.find((p) => p.label === t)?.reached}
                  key={t}
                  onPress={() => controller.openRecord(t)}
                  style={{
                    backgroundColor: slot === t ? c.red : c.wash,
                    padding: 12,
                    borderRadius: 9,
                  }}
                >
                  <Text style={{ color: slot === t ? c.white : c.ink }}>{t}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <Field
            label="Ваш подсчёт на момент сверки"
            value={observer}
            onChangeText={setObserver}
            keyboardType="number-pad"
          />
        </>
      )}
      <Field
        label={mode === 'record' ? 'По данным комиссии' : 'Правильное значение'}
        value={value}
        onChangeText={setValue}
        keyboardType="number-pad"
        placeholder="0"
      />
      {mode === 'correct' && (
        <Field
          label="Причина исправления"
          value={reason}
          onChangeText={setReason}
          placeholder="Например, пропустил двух человек"
          multiline
        />
      )}
      <Button title="Сохранить" onPress={submit} />
      <Button title="Отмена" secondary onPress={() => controller.setMode('summary')} />
    </>
  );
}
