import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavButton } from '../navigation/NavButton';
import { tabs } from '../navigation/tabs';
import { Icon } from '../ui/components';
import { colors as c } from '../ui/theme';
import { styles } from './styles';
import type { useApplication } from './useApplication';
export function BottomNavigation({
  controller,
}: {
  controller: ReturnType<typeof useApplication>;
}) {
  const { tab, navigate, count, setTurnout, due, increment } = controller;
  return (
    <View style={styles.bottom}>
      <SafeAreaView edges={['bottom']} style={localStyles.safeArea}>
        <View style={styles.bottomInner}>
          <NavButton item={tabs[0]} compact tab={tab} navigate={navigate} />
          <NavButton item={tabs[1]} compact tab={tab} navigate={navigate} />
          <View style={styles.counter}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Явка ${count}. Открыть подробности`}
              onPress={() => setTurnout(true)}
              style={styles.counterPill}
            >
              <Text accessibilityLiveRegion="polite" style={localStyles.countText}>
                {count}
              </Text>
              <Icon name="chevron-up" color={c.red} size={12} />
              {due && <View style={localStyles.dueDot} />}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Добавить одного человека"
              onPress={increment}
              style={({ pressed }) => [styles.plus, { transform: [{ scale: pressed ? 0.94 : 1 }] }]}
            >
              <Text style={localStyles.incrementText}>+1</Text>
            </Pressable>
          </View>
          <NavButton item={tabs[2]} compact tab={tab} navigate={navigate} />
          <NavButton item={tabs[3]} compact tab={tab} navigate={navigate} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const localStyles = StyleSheet.create({
  safeArea: { backgroundColor: c.white },
  countText: { fontSize: 12, color: c.red, fontWeight: '700' },
  dueDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: c.red },
  incrementText: { fontSize: 23, color: c.white, fontWeight: '600' },
});
