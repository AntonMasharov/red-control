import { Pressable, Text } from 'react-native';
import { styles } from '../app/styles';
import { Icon } from '../ui/components';
import { colors as c } from '../ui/theme';
import { tabs, type TabId } from './tabs';
export function NavButton({
  item,
  compact,
  tab,
  navigate,
}: {
  item: (typeof tabs)[number];
  compact: boolean;
  tab: TabId;
  navigate: (id: TabId) => void;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: tab === item.id }}
      accessibilityLabel={item.title}
      key={item.id}
      onPress={() => navigate(item.id)}
      style={
        compact ? styles.navItem : [styles.sideItem, tab === item.id && { backgroundColor: c.rose }]
      }
    >
      <Icon name={item.icon} size={compact ? 21 : 19} color={tab === item.id ? c.red : c.muted} />
      <Text
        style={{
          fontSize: compact ? 10 : 13,
          fontWeight: tab === item.id ? '600' : '400',
          color: tab === item.id ? c.red : c.muted,
        }}
      >
        {compact ? item.short : item.title}
      </Text>
    </Pressable>
  );
}
