import { Pressable, StyleSheet, Text, View } from 'react-native';
import { openSource } from '../content/repository';
import { time } from '../data/model';
import { ComplaintForm } from '../features/complaints/ComplaintForm';
import { useComplaintGenerator } from '../features/complaints/useComplaintGenerator';
import { Button, Empty, Notice, RowLink, Sheet, Tag } from '../ui/components';
import { s } from '../ui/theme';

export function Complaints() {
  const controller = useComplaintGenerator();
  const {
    options,
    notify,
    openViolation,
    form,
    setForm,
    draft,
    setDraft,
    complaints,
    share,
  } = controller;
  return (
    <View style={s.stack}>
      <View>
        <Text style={s.eyebrow}>ЗАФИКСИРУЙТЕ ОБСТОЯТЕЛЬСТВА</Text>
        <Text style={[s.title, localStyles.headingSpacing]}>Подготовить жалобу</Text>
        <Text style={s.subtitle}>
          Нажмите на нарушение, чтобы открыть{'\n'}отдельный пример жалобы.
        </Text>
      </View>
      <View style={{ gap: 2 }}>
        {options.map((item) => (
          <RowLink
            key={item.id}
            compact
            title={item.title}
            subtitle={item.description}
            icon="file-text"
            onPress={() => openViolation(item.id)}
          />
        ))}
        {!options.length && <Text style={s.small}>Примеры жалоб пока не добавлены.</Text>}
      </View>
      <Notice>
        Это подготовка черновика. Отправка в комиссию не выполняется. Правовые основания и
        окончательный текст нужно проверить перед подачей.
      </Notice>
      <Button
        title="Открыть исходный шаблон жалобы"
        secondary
        icon="external-link"
        onPress={() => {
          void openSource('complaint-source').catch(() => notify('Не удалось открыть шаблон.'));
        }}
      />
      <View style={[s.between, localStyles.draftHeading]}>
        <Text style={s.sectionTitle}>Мои черновики</Text>
        <Text style={s.small}>{complaints.length}</Text>
      </View>
      {!complaints.length ? (
        <Empty
          icon="file-text"
          title="Здесь будут ваши обращения"
          text="Сохранённые черновики доступны без интернета."
        />
      ) : (
        complaints.map((entry) => (
          <Pressable
            accessibilityRole="button"
            key={entry.id}
            onPress={() => setDraft(entry)}
            style={s.card}
          >
            <Tag text="Черновик · не подано" />
            <Text style={[s.sectionTitle, localStyles.draftTitle]}>{entry.category}</Text>
            <Text style={[s.small, localStyles.draftDate]}>
              {new Date(entry.at).toLocaleDateString('ru-RU')} · {time(entry.at)}
            </Text>
          </Pressable>
        ))
      )}
      {form && <ComplaintForm controller={controller} />}
      {draft && (
        <Sheet title="Черновик обращения" onClose={() => setDraft(null)}>
          <Tag text="Не подано в комиссию" />
          <Text selectable style={s.text}>
            {draft.text}
          </Text>
          <Button title="Экспортировать текст" icon="share" onPress={() => share(draft)} />
        </Sheet>
      )}
    </View>
  );
}

const localStyles = StyleSheet.create({
  headingSpacing: { marginTop: 8 },
  draftHeading: { marginTop: 12 },
  draftTitle: { fontSize: 16, marginTop: 10 },
  draftDate: { marginTop: 8 },
});

