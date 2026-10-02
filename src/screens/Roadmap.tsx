import { StyleSheet, Text, View } from 'react-native';
import { manifest } from '../content';
import { activeElection, formatDate } from '../data/model';
import { actions, useStore } from '../data/store';
import { StageSheet } from '../features/roadmap/StageSheet';
import { TaskNotes } from '../features/roadmap/TaskNotes';
import { useRoadmap } from '../features/roadmap/useRoadmap';
import { Button, Notice, RowLink, Sheet } from '../ui/components';
import { useFeedback } from '../ui/feedback';
import { s } from '../ui/theme';
import { LawSheet } from '../features/laws/LegalReaders';

export function DayPicker() {
  const state = useStore();
  const { run } = useFeedback();
  return (
    <View style={localStyles.dayButtons}>
      {activeElection(state).dates.map((date, index) => (
        <Button
          key={date}
          title={formatDate(date)}
          secondary={state.day !== index + 1}
          onPress={() => run(() => actions.day(index + 1))}
        />
      ))}
    </View>
  );
}
export function Roadmap() {
  const controller = useRoadmap();
  const {
    state,
    run,
    election,
    laws,
    visible,
    active,
    setActive,
    trip,
    setTrip,
    home,
    setHome,
    law,
    setLaw,
    lawIds,
    setLawIds,
    openNotes,
    setOpenNotes,
    trips,
    open,
    sequential,
    total,
    done,
  } = controller;
  return (
    <View style={s.stack}>
      <Text style={s.title}>Дорожная карта</Text>
      <DayPicker />
      <Text style={s.label}>
        Основной маршрут: {done} из {total}
      </Text>
      {sequential.map((stage, index) => (
        <RowLink
          key={stage.id}
          title={String(index + 1) + '. ' + stage.title}
          subtitle={stage.time}
          icon="chevron-right"
          onPress={() => (stage.repeatable ? setHome(stage.id) : open(stage))}
        />
      ))}
      <Text style={s.sectionTitle}>В любое время</Text>
      {visible
        .filter((s) => s.anytime)
        .map((stage) => (
          <RowLink
            key={stage.id}
            title={stage.title}
            subtitle="Доступно независимо от основных этапов"
            icon={stage.id === 'home' ? 'home' : 'file-text'}
            onPress={() => (stage.repeatable ? setHome(stage.id) : open(stage))}
          />
        ))}
      <Notice>{manifest.notice}</Notice>
      {home && (
        <Sheet
          title={visible.find((stage) => stage.id === home)?.title ?? ''}
          onClose={() => setHome('')}
        >
          <Text style={s.small}>
            {home === 'home'
              ? 'Каждый выезд имеет отдельные отметки и заметки.'
              : 'Каждое повторение имеет отдельные отметки и заметки.'}
          </Text>
          {trips.map((t) => (
            <Button
              key={t.id}
              title={t.title}
              secondary
              onPress={() =>
                open(
                  visible.find((s) => s.id === home)!,
                  t.id,
                )
              }
            />
          ))}
          <Button
            title={home === 'home' ? 'Добавить выезд' : 'Повторить этап'}
            onPress={() =>
              run(() => {
                const t = actions.trip(home);
                open(
                  visible.find((s) => s.id === 'home')!,
                  t.id,
                );
              })
            }
          />
          <TaskNotes target={home} title="Общие заметки о выездах" />
        </Sheet>
      )}
      {active && <StageSheet controller={controller} />}
      {lawIds && (
        <Sheet title="Правовые основания" onClose={() => setLawIds(undefined)}>
          <View style={{ gap: 2 }}>
          {laws
            .filter((entry) => lawIds.includes(entry.id))
            .map((entry) => (
              <RowLink
                key={entry.id}
                compact
                title={entry.title}
                icon="book"
                onPress={() => setLaw(entry)}
              />
            ))}
          </View>
          {!laws.some((entry) => lawIds.includes(entry.id)) && (
            <Text style={s.small}>Правовые основания не добавлены.</Text>
          )}
        </Sheet>
      )}
      {law && <LawSheet law={law} onClose={() => setLaw(undefined)} />}
    </View>
  );
}

const localStyles = StyleSheet.create({
  dayButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
