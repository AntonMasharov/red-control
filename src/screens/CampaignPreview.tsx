import { useState } from 'react';
import { Text,View } from 'react-native';
import type { Law } from '../content';
import { campaignContent } from '../content/catalog';
import { electionStages,formatDate,type Election } from '../data/model';
import { Button,Field,RowLink,Sheet } from '../ui/components';
import { Markdown } from '../ui/Markdown';
import { s } from '../ui/theme';
import { LawSheet } from '../features/laws/LegalReaders';

/** Reading does not select an observation context or create observer records. */
export function CampaignPreview({
  election,
  onClose,
}: {
  election: Election;
  onClose: () => void;
}) {
  const [day, setDay] = useState(1);
  const [section, setSection] = useState<'roadmap' | 'laws'>('roadmap');
  const [stageId, setStageId] = useState<string>();
  const [law, setLaw] = useState<Law>();
  const [query, setQuery] = useState('');
  const content = campaignContent(election.id);
  const stages = electionStages(election, day);
  const stage = stages.find((item) => item.id === stageId);

  if (law) return <LawSheet law={law} onClose={() => setLaw(undefined)} />;
  return (
    <Sheet
      title={stage ? stage.title : 'Дорожная карта и законы'}
      onClose={onClose}
      backAction={stage ? { label: 'К этапам', onPress: () => setStageId(undefined) } : undefined}
    >
      <Text style={s.sectionTitle}>{election.title}</Text>
      <Text style={s.small}>
        Просмотр материалов. Отметки наблюдения доступны после выбора УИК.
      </Text>
      {stage ? (
        <>
          <Text style={s.label}>
            {formatDate(election.dates[day - 1])} · {stage.time}
          </Text>
          {stage.items.map((task, index) => (
            <View key={task.id} style={[s.card, { gap: 12 }]}>
              <Text style={s.text}>
                {index + 1}. {task.text}
              </Text>
              {task.lawIds.map((id) => {
                const citation = content.laws.find((item) => item.id === id);
                return citation ? (
                  <RowLink
                    key={id}
                    title={citation.title}
                    icon="book"
                    onPress={() => setLaw(citation)}
                  />
                ) : null;
              })}
            </View>
          ))}
        </>
      ) : (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Button
              title="Дорожная карта"
              secondary={section !== 'roadmap'}
              onPress={() => setSection('roadmap')}
            />
            <Button
              title="Законы"
              secondary={section !== 'laws'}
              onPress={() => setSection('laws')}
            />
          </View>
          {section === 'roadmap' ? (
            <>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {election.dates.map((date, index) => (
                  <Button
                    key={date}
                    title={formatDate(date)}
                    secondary={day !== index + 1}
                    onPress={() => setDay(index + 1)}
                  />
                ))}
              </View>
              {stages.map((item) => (
                <RowLink
                  key={item.id}
                  title={item.title}
                  subtitle={item.anytime ? 'В любое время' : item.time}
                  icon="chevron-right"
                  onPress={() => setStageId(item.id)}
                />
              ))}
              {content.info && <Markdown>{content.info.markdown}</Markdown>}
            </>
          ) : (
            <>
              <Field label="Поиск нормы" value={query} onChangeText={setQuery} />
              {content.laws
                .filter((item) =>
                  item.title.toLocaleLowerCase('ru').includes(query.trim().toLocaleLowerCase('ru')),
                )
                .map((item) => (
                  <RowLink
                    key={item.id}
                    title={item.title}
                    icon="book"
                    onPress={() => setLaw(item)}
                  />
                ))}
            </>
          )}
        </>
      )}
    </Sheet>
  );
}
