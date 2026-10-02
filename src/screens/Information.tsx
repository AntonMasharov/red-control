import { SourceLink, LawSheet } from '../features/laws/LegalReaders';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Law } from '../content';
import { campaignContent } from '../content/catalog';
import { openSource, sourceAvailable, sources } from '../content/repository';
import { useStore } from '../data/store';
import { useLaws } from '../features/laws/useLaws';
import { useSources } from '../features/laws/useSources';
import { useTheory } from '../features/theory/useTheory';
import type { IconName } from '../ui/components';
import { Button, Field, RowLink, Sheet } from '../ui/components';
import { ContentMedia } from '../ui/ContentMedia';
import { useFeedback } from '../ui/feedback';
import { LessonVideo } from '../ui/LessonVideo';
import { Markdown } from '../ui/Markdown';
import { s } from '../ui/theme';

export function Information() {
  const state = useStore();
  const content = campaignContent(state.electionId);
  const lessons = useTheory();
  const laws = useLaws();
  const sourcesForElection = useSources();
  const documentEntries = content.documents.filter((entry) =>
    sourcesForElection.some((source) => source.id === entry.sourceId),
  );
  const [category, setCategory] = useState('Теория');
  const [search, setSearch] = useState('');
  const [lesson, setLesson] = useState<(typeof lessons)[number]>();
  const [law, setLaw] = useState<Law>();
  useEffect(() => {
    setLesson(undefined);
    setLaw(undefined);
  }, [state.electionId]);
  const matches = (text: string) =>
    text.toLocaleLowerCase('ru').includes(search.trim().toLocaleLowerCase('ru'));
  return (
    <View style={s.stack}>
      <Text style={s.title}>Библиотека наблюдателя</Text>
      {content.info && <Markdown>{content.info.markdown}</Markdown>}
      <Field label="Поиск по материалам" value={search} onChangeText={setSearch} />
      <View style={localStyles.categoryTabs}>
        {['Теория', 'Документы', 'Законы'].map((tab) => (
          <Button
            key={tab}
            title={tab}
            secondary={tab !== category}
            onPress={() => setCategory(tab)}
          />
        ))}
      </View>
      {category === 'Теория' && (
        <View>
          {lessons
            .filter((l) => matches(l.title + l.description + l.markdown))
            .map((l) => (
              <RowLink
                key={l.id}
                title={l.title}
                subtitle={l.description}
                icon={l.icon as IconName}
                onPress={() => setLesson(l)}
              />
            ))}
        </View>
      )}
      {category === 'Документы' && (
        <View>
          <Text style={s.small}>
            Полные тексты законов, шаблоны, заполненные документы и фотообразцы.
          </Text>
          {documentEntries
            .filter((d) => matches(d.title))
            .map((d) => (
              <SourceLink key={d.id} id={d.sourceId} />
            ))}
          {sourcesForElection
            .filter(
              (s) =>
                s.purpose === 'raw-law' &&
                !documentEntries.some((d) => d.sourceId === s.id) &&
                matches(s.title),
            )
            .map((s) => (
              <SourceLink key={s.id} id={s.id} />
            ))}
        </View>
      )}
      {category === 'Законы' && (
        <View>
          {laws
            .filter((l) => matches(l.title))
            .map((l) => (
              <RowLink
                key={l.id}
                title={l.title}
                subtitle="Правовое основание"
                icon="book"
                onPress={() => setLaw(l)}
              />
            ))}
        </View>
      )}
      {lesson && (
        <Sheet title={lesson.title} fullScreen onClose={() => setLesson(undefined)}>
          {lesson.videoId && <LessonVideo videoId={lesson.videoId} />}
          <Markdown>{lesson.markdown}</Markdown>
          <ContentMedia media={lesson.media} />
          <Text style={[s.sectionTitle, { fontSize: 17, lineHeight: 22 }]}>Связанные материалы</Text>
          <View style={{ gap: 2 }}>
          {lesson.lawIds.map((id) => (
            <RowLink
              key={id}
              compact
              title={laws.find((l) => l.id === id)?.title || 'Правовое основание'}
              icon="book"
              onPress={() => setLaw(laws.find((l) => l.id === id))}
            />
          ))}
          {lesson.references
            .filter((r) => r.locator)
            .map((r, i) => (
              <Text key={i} style={s.small}>
                {r.label}: {r.locator}
              </Text>
            ))}
          {lesson.sourceIds.map((id) => (
            <SourceLink key={id} id={id} compact />
          ))}
          </View>
        </Sheet>
      )}
      {law && <LawSheet law={law} onClose={() => setLaw(undefined)} />}
    </View>
  );
}

const localStyles = StyleSheet.create({
  categoryTabs: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
});
