import { Text } from 'react-native';
import { Act } from '../content/acts';
import { Notice,Sheet } from '../ui/components';
import { s } from '../ui/theme';
import { SourceLink } from '../features/laws/LegalReaders';
export function ActSheet({
  act,
  onClose,
  initialNormId,
}: {
  act: Act;
  onClose: () => void;
  initialNormId?: string;
}) {
  return (
    <Sheet title={act.title} onClose={onClose}>
      {!!initialNormId && (
        <Notice>
          Ссылка относится к прежней версии. Откройте оригинал документа; статьи автоматически не
          извлекаются.
        </Notice>
      )}
      <SourceLink id={act.sourceId} />
      <Text style={s.small}>Связи с нормами задаются вручную в разделе «Законы».</Text>
    </Sheet>
  );
}
