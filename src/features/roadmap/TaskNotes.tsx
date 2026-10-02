import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { recordKey } from '../../data/model';
import { actions, useStore } from '../../data/store';
import { Button } from '../../ui/components';
import { useFeedback } from '../../ui/feedback';
import { s } from '../../ui/theme';
export function TaskNotes({ target, title }: { target: string; title: string }) {
  const state = useStore();
  const { run } = useFeedback();
  const key = recordKey(state, target);
  const saved = state.notes[key] || '';
  const [draft, setDraft] = useState(saved);
  useEffect(() => setDraft(saved), [key, saved]);
  return (
    <View style={localStyles.noteSection}>
      <Text style={s.label}>{title}</Text>
      <View style={localStyles.noteRow}>
        <TextInput
          accessibilityLabel={title}
          style={[s.input, localStyles.noteInput]}
          placeholderTextColor="#9A9EA5"
          multiline
          value={draft}
          onChangeText={setDraft}
          placeholder="Ваши наблюдения"
        />
        <Button
          title="Сохранить"
          disabled={draft === saved}
          onPress={() => run(() => actions.note(target, draft), 'Заметка сохранена')}
        />
      </View>
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
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  noteInput: { flex: 1, minWidth: 0, minHeight: 100, textAlignVertical: 'top' },
});
