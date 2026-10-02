import { View, Text, Pressable, ScrollView } from 'react-native';
import { formatDate } from '../../data/model';
import { actions } from '../../data/store';
import { IconButton } from '../../ui/components';
import { colors as c, s } from '../../ui/theme';
import { TurnoutHistory } from './TurnoutHistory';
import type { useTurnout } from './useTurnout';
export function TurnoutSummary({ controller }: { controller: ReturnType<typeof useTurnout> }) {
  const { count, run, setMode, setValue, setReason, dates, date, setDate, points, openRecord } =
    controller;
  return (
    <>
      <Text style={s.sectionTitle}>Динамика</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {dates.map((day) => (
          <Pressable
            key={day}
            accessibilityRole="button"
            accessibilityState={{ selected: date === day }}
            onPress={() => setDate(day)}
            style={{
              padding: 12,
              borderRadius: 10,
              backgroundColor: date === day ? c.red : c.wash,
            }}
          >
            <Text style={{ color: date === day ? c.white : c.ink }}>{formatDate(day)}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10 }}
      >
        {points.map((point) => {
          const diff = point.row ? point.row.commission - point.row.observer : undefined;
          const color = diff === undefined ? c.muted : diff === 0 ? c.green : c.red;
          return (
            <Pressable
              key={point.label}
              accessibilityRole="button"
              accessibilityLabel={'Сверка ' + point.label}
              disabled={!point.reached}
              onPress={() => openRecord(point.label)}
              style={[
                s.card,
                {
                  width: 146,
                  padding: 14,
                  gap: 8,
                  backgroundColor: diff ? c.rose : c.white,
                  opacity: point.reached ? 1 : 0.55,
                },
              ]}
            >
              <Text style={[s.label, { marginBottom: 0 }]}>{point.label}</Text>
              <Text style={s.small}>Комиссия</Text>
              <Text style={s.sectionTitle}>{point.row?.commission ?? '—'}</Text>
              <Text style={s.small}>Ваш подсчёт</Text>
              <Text style={s.text}>{point.reached ? point.value : '—'}</Text>
              <Text style={[s.small, { color }]}>
                {diff === undefined
                  ? point.reached
                    ? 'Внести данные'
                    : 'Ожидается'
                  : diff === 0
                    ? '✓ Совпадает'
                    : 'Разница: ' + (diff > 0 ? '+' : '') + diff}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={{ paddingVertical: 16 }}>
        <View style={[s.between, { gap: 8, width: '100%', maxWidth: 380, alignSelf: 'center' }]}>
          <View style={{ width: 92, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <IconButton
              name="edit-2"
              label="Исправить"
              onPress={() => {
                setValue(String(count));
                setReason('');
                setMode('correct');
              }}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Убрать человека в окне явки"
              accessibilityState={{ disabled: count === 0 }}
              disabled={count === 0}
              onPress={() => run(actions.decrement)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: c.border,
                opacity: count === 0 ? 0.4 : 1,
              }}
            >
              <Text style={{ fontSize: 18, color: c.ink }}>−1</Text>
            </Pressable>
          </View>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
            accessibilityLabel={'Всего за все дни: ' + count}
            accessibilityLiveRegion="polite"
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 80,
              fontWeight: '700',
              color: c.ink,
            }}
          >
            {count}
          </Text>
          <View style={{ width: 92, alignItems: 'flex-start' }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Добавить человека в окне явки"
              onPress={() => run(actions.increment)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: c.red,
              }}
            >
              <Text style={{ color: c.white, fontSize: 18, fontWeight: '600' }}>+1</Text>
            </Pressable>
          </View>
        </View>
      </View>
      <TurnoutHistory controller={controller} />
    </>
  );
}
