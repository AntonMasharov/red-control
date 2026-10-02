import { Text } from 'react-native';
import type { Law } from '../../content';
import { sources, openSource, sourceAvailable } from '../../content/repository';
import { RowLink, Sheet } from '../../ui/components';
import { Markdown } from '../../ui/Markdown';
import { useFeedback } from '../../ui/feedback';
import { s } from '../../ui/theme';
export function SourceLink({ id, compact = false }: { id: string; compact?: boolean }) {
  const { notify } = useFeedback();
  const source = sources.find((s) => s.id === id);
  return (
    <RowLink
      compact={compact}
      title={source?.title || 'Материал'}
      subtitle={sourceAvailable(id) ? 'Открыть исходный файл' : 'Файл ещё не добавлен'}
      icon="file"
      onPress={() => {
        void openSource(id).catch((e) => notify(e.message));
      }}
    />
  );
}
export function LawSheet({ law, onClose }: { law: Law; onClose: () => void }) {
  return (
    <Sheet title="Правовое основание" onClose={onClose}>
      <Text style={s.sectionTitle}>{law.title}</Text>
      <Markdown>{law.text}</Markdown>
      {law.sourceIds.map((id) => (
        <SourceLink key={id} id={id} />
      ))}
    </Sheet>
  );
}
