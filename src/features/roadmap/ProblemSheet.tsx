import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ChecklistTask } from '../../data/architecture/entities';
import { recordKey, taskRecordId, type ProblemProgress } from '../../data/model';
import { actions } from '../../data/store';
import { Button, Icon, RowLink, Sheet } from '../../ui/components';
import { colors as c, s } from '../../ui/theme';
import { ComplaintForm } from '../complaints/ComplaintForm';
import { useComplaintGenerator } from '../complaints/useComplaintGenerator';
import { TaskNotes } from './TaskNotes';
import { problemRoute, previousProblemProgress } from './problem-solving';
import type { useRoadmap } from './useRoadmap';

export function ProblemSheet({
  item,
  controller,
  onClose,
}: {
  item: ChecklistTask;
  controller: ReturnType<typeof useRoadmap>;
  onClose: () => void;
}) {
  const { state, active, trip, run, setLawIds } = controller;
  const complaints = useComplaintGenerator();
  const [chooseComplaint, setChooseComplaint] = useState(false);
  const [details, setDetails] = useState(false);
  if (!active) return null;
  const target = taskRecordId(active, item.id, trip);
  const saved = state.problems?.[recordKey(state, target)];
  const progress: ProblemProgress = saved ?? { completed: [], waiting: false, resolved: false };
  const route = problemRoute(item);
  const next = route.find((step) => !progress.completed.includes(step.id));
  const last = route.filter((step) => progress.completed.includes(step.id)).at(-1);
  const current = progress.reviewing ? last : next;
  const update = (patch: Partial<typeof progress>) =>
    run(() => actions.problem(active.id, item.id, trip, { ...progress, ...patch }));
  return (
    <>
      <Sheet title="Проблема с пунктом" onClose={onClose}>
        <View style={styles.context}>
          <Text style={s.small}>ПУНКТ ДОРОЖНОЙ КАРТЫ</Text>
          <Text style={s.text}>{item.text}</Text>
        </View>
        {progress.resolved ? (
          <View style={styles.card}>
            <Icon name="check-circle" color={c.green} size={28} />
            <Text style={s.sectionTitle}>Проблема решена</Text>
            <Text style={s.small}>Пункт отмечен выполненным. История действий сохранена.</Text>
            <Button title="Вернуться к дорожной карте" secondary onPress={onClose} />
          </View>
        ) : (
          <>
            <View style={styles.route}>
              {route.map((step, index) => (
                <View
                  key={step.id}
                  style={[
                    styles.segment,
                    {
                      backgroundColor: progress.completed.includes(step.id)
                        ? c.green
                        : step.id === current?.id
                          ? c.red
                          : c.border,
                    },
                  ]}
                />
              ))}
            </View>
            <View style={styles.card}>
              {progress.waiting ? (
                <>
                  <Icon name="clock" size={28} />
                  <Text style={s.sectionTitle}>Ожидаем ответ</Text>
                  {last && <Text style={s.text}>{last.completedLabel}</Text>}
                  <Text style={s.small}>Когда появится результат, вернитесь к этому пункту.</Text>
                  <Button
                    title="Ответ получен"
                    onPress={() => update({ waiting: false, reviewing: true })}
                  />
                  <Button
                    title="Проблема уже решена"
                    secondary
                    onPress={() => update({ resolved: true, waiting: false })}
                  />
                </>
              ) : progress.reviewing || !current ? (
                <>
                  {last && <Text style={styles.completed}>✓ {last.completedLabel}</Text>}
                  <Text style={s.sectionTitle}>Проблема устранена?</Text>
                  <Text style={s.small}>Если всё в порядке, отметим пункт выполненным.</Text>
                  <View style={styles.answers}>
                    <View style={styles.answer}>
                      <Button
                        title="Да, решена"
                        onPress={() => update({ resolved: true, waiting: false })}
                      />
                    </View>
                    {next && (
                      <View style={styles.answer}>
                        <Button
                          title="Нет"
                          secondary
                          onPress={() => update({ reviewing: false })}
                        />
                      </View>
                    )}
                  </View>
                  {next && (
                    <Text style={s.small}>
                      Если нет, следующее действие: {next.title.toLowerCase()}.
                    </Text>
                  )}
                  {!next && (
                    <Text style={s.small}>
                      Все действия маршрута выполнены. Можно сохранить ожидание ответа.
                    </Text>
                  )}
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => update({ waiting: true })}
                    style={styles.textLink}
                  >
                    <Text style={styles.link}>Пока жду ответа</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Text style={styles.step}>
                    ДЕЙСТВИЕ {route.indexOf(current) + 1} ИЗ {route.length}
                  </Text>
                  <Text style={s.sectionTitle}>{current.title}</Text>
                  <Text style={s.text}>{current.description}</Text>
                  {current.kind === 'oral' && !!item.lawIds.length && (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setLawIds(item.lawIds)}
                      style={styles.textLink}
                    >
                      <Text style={styles.link}>Посмотреть статью закона ›</Text>
                    </Pressable>
                  )}
                  {current.kind === 'complaint' && (
                    <Button
                      title={
                        item.complaintId ? 'Открыть жалобу для этого пункта' : 'Выбрать жалобу'
                      }
                      icon="file-text"
                      onPress={() => {
                        if (item.complaintId) complaints.openViolation(item.complaintId);
                        else setChooseComplaint(true);
                      }}
                    />
                  )}
                  <Button
                    title={
                      current.kind === 'complaint'
                        ? 'Я подал жалобу'
                        : current.kind === 'oral'
                          ? 'Я попросил устно'
                          : current.completedLabel
                    }
                    secondary={current.kind === 'complaint'}
                    icon="check"
                    onPress={() =>
                      update({
                        completed: [...progress.completed, current.id],
                        waiting: false,
                        reviewing: true,
                      })
                    }
                  />
                  {current.kind === 'complaint' && (
                    <Text style={s.small}>
                      Отметьте после подачи. Подготовка текста сама по себе не означает подачу.
                    </Text>
                  )}
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => update({ resolved: true, waiting: false })}
                    style={styles.textLink}
                  >
                    <Text style={styles.link}>Проблема уже решена</Text>
                  </Pressable>
                </>
              )}
            </View>
          </>
        )}
        {saved && (progress.resolved || progress.waiting || progress.completed.length > 0) && (
          <Button
            title="Назад"
            icon="arrow-left"
            secondary
            onPress={() => update(previousProblemProgress(progress))}
          />
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: details }}
          onPress={() => setDetails(!details)}
          style={styles.detailsToggle}
        >
          <Text style={s.small}>История, заметки и правовые основания</Text>
          <Icon name={details ? 'chevron-up' : 'chevron-down'} size={16} />
        </Pressable>
        {details && (
          <View style={s.stack}>
            {route
              .filter((step) => progress.completed.includes(step.id))
              .map((step) => (
                <Text key={step.id} style={styles.completed}>
                  ✓ {step.completedLabel}
                </Text>
              ))}
            {!progress.completed.length && (
              <Text style={s.small}>Выполненных действий пока нет.</Text>
            )}
            {!!item.lawIds.length && (
              <Button title="Правовые основания" secondary onPress={() => setLawIds(item.lawIds)} />
            )}
            <TaskNotes target={'item:' + target} title="Обстоятельства и результаты действий" />
          </View>
        )}
      </Sheet>
      {chooseComplaint && (
        <Sheet title="Выберите пример жалобы" onClose={() => setChooseComplaint(false)}>
          {complaints.options.map((option) => (
            <RowLink
              key={option.id}
              title={option.title}
              icon="file-text"
              compact
              onPress={() => {
                setChooseComplaint(false);
                complaints.openViolation(option.id);
              }}
            />
          ))}
          {!complaints.options.length && (
            <Text style={s.small}>Примеры жалоб пока не добавлены.</Text>
          )}
        </Sheet>
      )}
      {complaints.form && <ComplaintForm controller={complaints} />}
      {complaints.draft && (
        <Sheet title="Черновик сохранён" onClose={() => complaints.setDraft(null)}>
          <Text style={s.small}>
            Сохранение черновика не означает подачу жалобы. После подачи отметьте действие в ветке
            решения.
          </Text>
          <Text selectable style={s.text}>
            {complaints.draft.text}
          </Text>
          <Button
            title="Экспортировать текст"
            onPress={() => complaints.share(complaints.draft!)}
          />
        </Sheet>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  context: { borderLeftWidth: 3, borderLeftColor: c.border, paddingLeft: 12, gap: 6 },
  route: { flexDirection: 'row', gap: 6, marginTop: 4 },
  segment: { flex: 1, height: 4, borderRadius: 2 },
  card: { backgroundColor: c.wash, borderRadius: 16, padding: 18, gap: 16 },
  step: { fontSize: 11, fontWeight: '600', color: c.muted, letterSpacing: 0.6 },
  completed: { color: c.green, fontSize: 14, lineHeight: 21 },
  answers: { flexDirection: 'row', gap: 10 },
  answer: { flex: 1 },
  textLink: { minHeight: 40, justifyContent: 'center', alignItems: 'center' },
  link: { color: c.red, fontSize: 14 },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    gap: 12,
  },
});
