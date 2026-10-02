import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { recordKey } from '../../data/model';
import { actions, useStore } from '../../data/store';
import { useFeedback } from '../../ui/feedback';
import { colors, s } from '../../ui/theme';
export function TaskNotes({ target, title }: { target: string; title: string }) {
  const state = useStore();
  const { run } = useFeedback();
  const key = recordKey(state, target);
  const saved = state.notes[key] || '';
  const [draft, setDraft] = useState(saved);
  const [showSaved, setShowSaved] = useState(false);
  useEffect(() => {
    setShowSaved(false);
  }, [key]);
  useEffect(() => {
    if (!showSaved) return;
    const timer = setTimeout(() => setShowSaved(false), 2500);
    return () => clearTimeout(timer);
  }, [showSaved]);
  useEffect(() => setDraft(saved), [key, saved]);
  return (
    <View style={localStyles.noteSection}>
      <Text style={s.label}>{title}</Text>
      <TextInput
        accessibilityLabel={title}
        style={[s.input, localStyles.noteInput]}
        placeholderTextColor="#9A9EA5"
        multiline
        value={draft}
        onChangeText={(text) => {
          setDraft(text);
          setShowSaved(false);
        }}
        onBlur={() => {
          if (draft !== saved && run(() => actions.note(target, draft))) setShowSaved(true);
        }}
        placeholder="Ваши наблюдения"
      />
      {showSaved && (
        <Text accessibilityLiveRegion="polite" style={[s.small, { color: colors.green }]}>
          ✓ Сохранено
        </Text>
      )}
      {state.noteCopies
        .filter((note) => note.targetKey === key)
        .map((note) => (
          <Text key={note.id} style={s.text}>
            {note.text}
          </Text>
        ))}
    </View>
  );
}

const localStyles = StyleSheet.create({
  noteSection: { gap: 8 },
  noteInput: { minWidth: 0, minHeight: 100, textAlignVertical: 'top' },
});
