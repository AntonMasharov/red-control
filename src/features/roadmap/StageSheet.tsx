import { useState } from 'react';
import type { ChecklistTask } from '../../data/architecture/entities';
import { ProblemSheet } from './ProblemSheet';
import { problemRoute, problemStatus } from './problem-solving';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { canCheck, formatDate, recordKey, selectedDate, taskRecordId } from '../../data/model';
import { actions } from '../../data/store';
import { SourceLink } from '../laws/LegalReaders';
import { Icon, IconButton, Sheet, Tag } from '../../ui/components';
import { ContentMedia } from '../../ui/ContentMedia';
import { colors as c, s } from '../../ui/theme';
import { TaskNotes } from './TaskNotes';
import type { useRoadmap } from './useRoadmap';
export function StageSheet({ controller }: { controller: ReturnType<typeof useRoadmap> }) {
  const { active, setActive, state, trip, run, setLawIds, openNotes, setOpenNotes } = controller;
  const [problemItem, setProblemItem] = useState<ChecklistTask>();
  if (!active) return null;
  return (
    <>
      <Sheet title={active.title} onClose={() => setActive(undefined)} fullScreen>
        <Tag text={formatDate(selectedDate(state))} />
        {active.items.map((item) => {
          const target = taskRecordId(active, item.id, trip);
          const checked = !!state.checks[recordKey(state, target)];
          const enabled = canCheck(state, active.id, item.id, trip);
          return (
            <View key={target} style={localStyles.taskRow}>
              <View style={localStyles.taskHeader}>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityLabel={item.text}
                  accessibilityState={{ checked, disabled: !enabled }}
                  aria-checked={checked}
                  aria-disabled={!enabled}
                  disabled={!enabled}
                  onPress={() => run(() => actions.check(active.id, item.id, trip))}
                  style={localStyles.checkbox}
                >
                  <Icon
                    name={checked ? 'check-square' : 'square'}
                    size={22}
                    color={checked ? c.green : c.muted}
                  />
                </Pressable>
                <View style={localStyles.taskContent}>
                  <Text style={[s.text, { color: enabled ? c.ink : c.muted }]}>{item.text}</Text>
                  {problemRoute(item).length > 0 &&
                    (!checked || state.problems?.[recordKey(state, target)]) && (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={'Решение проблемы: ' + item.text}
                        disabled={!enabled}
                        onPress={() => setProblemItem(item)}
                        style={{ minHeight: 32, justifyContent: 'center' }}
                      >
                        <Text
                          style={[
                            s.small,
                            {
                              color: state.problems?.[recordKey(state, target)]?.resolved
                                ? c.green
                                : c.red,
                            },
                          ]}
                        >
                          {problemStatus(item, state.problems?.[recordKey(state, target)])} ›
                        </Text>
                      </Pressable>
                    )}
                  <ContentMedia media={item.media} />
                  {item.sourceIds.map((id) => (
                    <SourceLink key={id} id={id} />
                  ))}
                </View>
                <View style={localStyles.taskActions}>
                  {!!item.lawIds.length && (
                    <IconButton
                      name="info"
                      label="Правовые основания"
                      onPress={() => setLawIds(item.lawIds)}
                    />
                  )}
                  <IconButton
                    name={openNotes[target] ? 'chevron-down' : 'chevron-up'}
                    label={openNotes[target] ? 'Скрыть заметку' : 'Открыть заметку'}
                    onPress={() =>
                      setOpenNotes((previous) => ({ ...previous, [target]: !previous[target] }))
                    }
                  />
                </View>
              </View>
              <View style={{ display: openNotes[target] ? 'flex' : 'none' }}>
                <TaskNotes target={'item:' + target} title="Заметка к пункту" />
              </View>
            </View>
          );
        })}
        <TaskNotes target={(trip ? trip + ':' : '') + active.id} title="Заметки к этапу" />
      </Sheet>
      {problemItem && (
        <ProblemSheet
          item={problemItem}
          controller={controller}
          onClose={() => setProblemItem(undefined)}
        />
      )}
    </>
  );
}

const localStyles = StyleSheet.create({
  taskRow: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
    gap: 12,
  },
  taskHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  checkbox: { paddingVertical: 6, paddingRight: 4 },
  taskContent: { flex: 1, minWidth: 0, gap: 8, paddingTop: 5 },
  taskActions: { flexDirection: 'row' },
});
