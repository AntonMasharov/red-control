import React, { ReactNode, useEffect, useId, useLayoutEffect, useSyncExternalStore } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TextInputProps,
  BackHandler,
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors as c, s } from './theme';
import { useFeedback } from './feedback';
import { actions, useStore } from '../data/store';
import { countFor, hasSelectedContext } from '../data/model';

type SheetSpec = {
  id: string;
  title: string;
  children: ReactNode;
  onClose: () => void;
  backAction?: { label: string; onPress: () => void };
  compact?: boolean;
  fullScreen?: boolean;
  hideCounter?: boolean;
  footer?: ReactNode;
};
let sheetStack: SheetSpec[] = [];
const sheetListeners = new Set<() => void>();
const emitSheets = () => sheetListeners.forEach((fn) => fn());
const subscribeSheets = (fn: () => void) => {
  sheetListeners.add(fn);
  return () => {
    sheetListeners.delete(fn);
  };
};
const getSheets = () => sheetStack;

export type IconName = React.ComponentProps<typeof Feather>['name'];
export function Icon({
  name,
  color = c.muted,
  size = 20,
}: {
  name: IconName;
  color?: string;
  size?: number;
}) {
  return <Feather name={name} color={color} size={size} />;
}
export function Button({
  title,
  onPress,
  icon,
  secondary = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  icon?: IconName;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      disabled={disabled}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: secondary ? c.wash : c.red,
          opacity: disabled ? 0.4 : pressed ? 0.75 : 1,
        },
      ]}
    >
      {icon && <Icon name={icon} color={secondary ? c.ink : c.white} size={18} />}
      <Text
        style={{
          color: secondary ? c.ink : c.white,
          fontWeight: '600',
          fontSize: 14,
          flexShrink: 1,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function IconButton({
  name,
  label,
  onPress,
  color = c.muted,
}: {
  name: IconName;
  label: string;
  onPress: () => void;
  color?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.iconButton}
    >
      <Icon name={name} color={color} />
    </Pressable>
  );
}
export function Tag({ text, green = false }: { text: string; green?: boolean }) {
  return (
    <View
      style={{
        backgroundColor: green ? '#F0F7F3' : c.wash,
        borderRadius: 6,
        paddingVertical: 4,
        paddingHorizontal: 8,
        alignSelf: 'flex-start',
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: '500', color: green ? c.green : c.muted }}>
        {text}
      </Text>
    </View>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#9A9EA5"
        {...props}
        style={[
          s.input,
          props.multiline && { minHeight: 100, textAlignVertical: 'top' },
          props.style,
        ]}
      />
    </View>
  );
}
export function RowLink({
  title,
  subtitle,
  icon,
  onPress,
  compact = false,
}: {
  title: string;
  subtitle?: string;
  icon: IconName;
  onPress: () => void;
  compact?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.link, compact && { minHeight: 44, paddingVertical: 6, gap: 10 }, pressed && { backgroundColor: c.wash }]}
    >
      <View style={[styles.iconBox, compact && { width: 30, height: 30, borderRadius: 8 }]}>
        <Icon name={icon} color={c.red} size={compact ? 16 : 20} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.text, { fontWeight: '600' }, compact && { fontSize: 14, lineHeight: 20 }]}>{title}</Text>
        {subtitle && <Text style={s.small}>{subtitle}</Text>}
      </View>
      <Icon name="chevron-right" size={17} />
    </Pressable>
  );
}
export function Empty({ icon, title, text }: { icon: IconName; title: string; text: string }) {
  return (
    <View style={{ paddingVertical: 28, alignItems: 'center', gap: 10 }}>
      <Icon name={icon} size={30} color="#A6ABB2" />
      <Text style={s.sectionTitle}>{title}</Text>
      <Text style={[s.small, { textAlign: 'center', maxWidth: 300 }]}>{text}</Text>
    </View>
  );
}
export function Sheet(props: Omit<SheetSpec, 'id'>) {
  const id = useId();
  useLayoutEffect(() => {
    const spec = { ...props, id };
    sheetStack = sheetStack.some((s) => s.id === id)
      ? sheetStack.map((s) => (s.id === id ? spec : s))
      : [...sheetStack, spec];
    emitSheets();
  });
  useLayoutEffect(
    () => () => {
      sheetStack = sheetStack.filter((s) => s.id !== id);
      emitSheets();
    },
    [id],
  );
  return null;
}
// A single native Modal supports drill-downs and the global counter on iOS too.
// Hidden panels stay mounted so reading position is preserved after viewing turnout.
export function SheetHost({ openTurnout }: { openTurnout: () => void }) {
  const entries = useSyncExternalStore(subscribeSheets, getSheets, getSheets);
  const top = entries.at(-1);
  const { message, run } = useFeedback();
  const state = useStore();
  useEffect(() => {
    if (Platform.OS !== 'web' || !top) return;
    const listener = (e: KeyboardEvent) => {
      if (e.key === 'Escape') top.onClose();
    };
    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, [top]);
  return (
    <Modal transparent animationType="slide" visible={!!top} onRequestClose={() => top?.onClose()}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modal}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Закрыть окно по фону"
          onPress={() => top?.onClose()}
          style={StyleSheet.absoluteFill}
        />
        {entries.map((entry) => (
          <SafeAreaView
            key={entry.id}
            edges={entry.fullScreen ? ['top', 'bottom'] : ['bottom']}
            style={[
              styles.sheet,
              {
                display: entry === top ? 'flex' : 'none',
                maxHeight: entry.fullScreen ? '100%' : entry.compact ? '78%' : '92%',
              },
              entry.fullScreen && styles.fullScreenSheet,
            ]}
          >
            {!entry.fullScreen && <View style={styles.handle} />}
            {entry.backAction && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={entry.backAction.label}
                onPress={entry.backAction.onPress}
                hitSlop={6}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  alignSelf: 'flex-start',
                  gap: 4,
                  marginHorizontal: 22,
                  minHeight: 32,
                  marginBottom: 0,
                }}
              >
                <Icon name="chevron-left" size={14} />
                <Text style={s.small}>{entry.backAction.label}</Text>
              </Pressable>
            )}
            <View style={[s.between, { paddingHorizontal: 22, paddingBottom: 8 }, entry.fullScreen && { paddingTop: 12 }]}>
              <Text accessibilityRole="header" style={[s.sectionTitle, { flex: 1 }]}>
                {entry.title}
              </Text>
              <IconButton name="x" label="Закрыть окно" onPress={entry.onClose} />
            </View>
            {!!message && (
              <View style={{ paddingHorizontal: 22, paddingBottom: 8 }}>
                <Text accessibilityLiveRegion="polite" style={[s.small, { color: c.red }]}>
                  {message}
                </Text>
              </View>
            )}
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ padding: 22, paddingTop: 8, gap: 18 }}
            >
              {entry.children}
            </ScrollView>
            {entry.footer && (
              <View
                style={{
                  paddingHorizontal: 22,
                  paddingVertical: 16,
                  borderTopWidth: 1,
                  borderColor: c.border,
                }}
              >
                {entry.footer}
              </View>
            )}
            {!entry.hideCounter && hasSelectedContext(state) && (
              <View
                style={[
                  s.between,
                  {
                    paddingVertical: 8,
                    paddingHorizontal: 22,
                    borderTopWidth: 1,
                    borderColor: c.border,
                  },
                ]}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Открыть явку поверх материала"
                  onPress={openTurnout}
                  style={[s.row, { minHeight: 44 }]}
                >
                  <Text style={{ fontSize: 13, color: c.red, fontWeight: '600' }}>
                    Явка: {countFor(state)}
                  </Text>
                  <Icon name="chevron-up" color={c.red} size={14} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Добавить человека, не закрывая материал"
                  onPress={() => run(actions.increment)}
                  style={{
                    backgroundColor: c.red,
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 20, fontWeight: '600', color: c.white }}>+1</Text>
                </Pressable>
              </View>
            )}
          </SafeAreaView>
        ))}
      </KeyboardAvoidingView>
    </Modal>
  );
}
export function Notice({ children }: { children: ReactNode }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 10,
        padding: 14,
        backgroundColor: c.wash,
        borderRadius: 12,
      }}
    >
      <Icon name="info" size={17} />
      <Text style={[s.small, { flex: 1 }]}>{children}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 9,
  },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  iconBox: {
    width: 44,
    height: 44,
    backgroundColor: c.rose,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  link: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16 },
  modal: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: '#17202B65',
  },
  sheet: {
    width: '100%',
    maxWidth: 640,
    backgroundColor: c.white,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
  },
  handle: {
    width: 32,
    height: 4,
    backgroundColor: '#DADDE2',
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 12,
  },
  fullScreenSheet: {
    flex: 1,
    maxWidth: '100%',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
});
