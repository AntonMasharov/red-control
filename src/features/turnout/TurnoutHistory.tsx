import { View, Text, Pressable, ScrollView } from 'react-native';
import { useState } from 'react';
import { Icon } from '../../ui/components';
import { formatDate } from '../../data/model';
import { colors as c, s } from '../../ui/theme';
import type { useTurnout } from './useTurnout';
export function TurnoutHistory({ controller }: { controller: ReturnType<typeof useTurnout> }) {
  const [expanded, setExpanded] = useState(false);
  const { history, historyDate, setHistoryDate, dates } = controller;
  const filtered = history.filter((e) => !historyDate || e.date === historyDate);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={expanded ? 'Свернуть историю действий' : 'Развернуть историю действий'}
        accessibilityState={{ expanded }}
        onPress={() => setExpanded(!expanded)}
        style={[s.between, { minHeight: 44 }]}
      >
        <Text style={s.sectionTitle}>История действий</Text>
        <Icon name={expanded ? 'chevron-up' : 'chevron-down'} color={c.muted} />
      </Pressable>
      {expanded && (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {['', ...dates].map((day) => (
              <Pressable
                key={day}
                accessibilityRole="button"
                accessibilityState={{ selected: historyDate === day }}
                onPress={() => setHistoryDate(day)}
                style={{
                  padding: 10,
                  borderRadius: 10,
                  backgroundColor: historyDate === day ? c.red : c.wash,
                }}
              >
                <Text style={{ fontSize: 12, color: historyDate === day ? c.white : c.ink }}>
                  {day ? formatDate(day) : 'Все дни'}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          {!filtered.length && <Text style={s.small}>За выбранный день действий пока нет.</Text>}
          <ScrollView
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 300 }}
            contentContainerStyle={{ paddingRight: 4 }}
          >
            {filtered
              .slice(-100)
              .reverse()
              .map((e) => (
                <View
                  key={e.id}
                  style={[
                    s.between,
                    { paddingVertical: 10, borderBottomWidth: 1, borderColor: c.border },
                  ]}
                >
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={[s.text, { fontSize: 13 }]}>{e.note}</Text>
                    <Text style={s.small}>
                      {formatDate(e.date)} · {new Date(e.at).toLocaleTimeString('ru-RU')}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text style={{ color: e.delta > 0 ? c.green : c.muted, fontWeight: '600' }}>
                      {e.delta > 0 ? '+' : ''}
                      {e.delta}
                    </Text>
                    <Text style={s.small}>
                      {e.before} → {e.total}
                    </Text>
                  </View>
                </View>
              ))}
          </ScrollView>
          {filtered.length > 100 && (
            <Text style={s.small}>Последние 100 действий. Полный журнал доступен в экспорте.</Text>
          )}
        </>
      )}
    </>
  );
}
