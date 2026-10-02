import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { openSource } from '../content/repository';
import { time } from '../data/model';
import { ComplaintForm } from '../features/complaints/ComplaintForm';
import { useComplaintGenerator } from '../features/complaints/useComplaintGenerator';
import { Button, Empty, RowLink, Sheet, Tag } from '../ui/components';
import { colors, s } from '../ui/theme';

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
    markSubmitted,
  } = controller;
  const [tab, setTab] = useState<'draft' | 'submitted'>('draft');
  const visible = complaints.filter((entry) =>
    tab === 'submitted' ? !!entry.submittedAt : !entry.submittedAt,
  );
  return (
    <View style={s.stack}>
      <Text style={s.title}>Подготовить жалобу</Text>
      <View style={{ gap: 2 }}>
        {options.map((item) => (
          <RowLink
            key={item.id}
            compact
            title={item.title}
            icon="file-text"
            onPress={() => openViolation(item.id)}
          />
        ))}
        {!options.length && <Text style={s.small}>Примеры жалоб пока не добавлены.</Text>}
      </View>
      <Button
        title="Открыть исходный шаблон жалобы"
        secondary
        icon="external-link"
        onPress={() => {
          void openSource('complaint-source').catch(() => notify('Не удалось открыть шаблон.'));
        }}
      />
      <View style={localStyles.draftDivider} />
      <View style={[s.between, localStyles.draftHeading]}>
        <Text style={s.sectionTitle}>Мои жалобы</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <View>
          <Button
            title={`Черновики (${complaints.filter((entry) => !entry.submittedAt).length})`}
            secondary={tab !== 'draft'}
            onPress={() => setTab('draft')}
          />
        </View>
        <View>
          <Button
            title={`Поданные (${complaints.filter((entry) => !!entry.submittedAt).length})`}
            secondary={tab !== 'submitted'}
            onPress={() => setTab('submitted')}
          />
        </View>
      </View>
      {!visible.length ? (
        <Empty
          icon="file-text"
          title={tab === 'submitted' ? 'Поданных жалоб пока нет' : 'Черновиков пока нет'}
          text=""
        />
      ) : (
        visible.map((entry) => (
          <Pressable
            accessibilityRole="button"
            key={entry.id}
            onPress={() => setDraft(entry)}
            style={s.card}
          >
            <Tag text={entry.submittedAt ? 'Подано' : 'Черновик'} green={!!entry.submittedAt} />
            <Text style={[s.sectionTitle, localStyles.draftTitle]}>{entry.category}</Text>
            <Text style={[s.small, localStyles.draftDate]}>
              {new Date(entry.at).toLocaleDateString('ru-RU')} · {time(entry.at)}
            </Text>
          </Pressable>
        ))
      )}
      {form && <ComplaintForm controller={controller} />}
      {draft && (
        <Sheet
          title={draft.submittedAt ? 'Поданная жалоба' : 'Черновик обращения'}
          onClose={() => setDraft(null)}
        >
          <Tag text={draft.submittedAt ? 'Подано' : 'Черновик'} green={!!draft.submittedAt} />
          <Text selectable style={s.text}>
            {draft.text}
          </Text>
          <Button
            title={draft.submittedAt ? 'Вернуть в черновики' : 'Подано'}
            onPress={() => {
              if (markSubmitted(draft, !draft.submittedAt)) {
                setTab(draft.submittedAt ? 'draft' : 'submitted');
                setDraft(null);
              }
            }}
          />
        </Sheet>
      )}
    </View>
  );
}

const localStyles = StyleSheet.create({
  draftDivider: { height: 1, backgroundColor: colors.border, marginTop: 16 },
  draftHeading: { marginTop: 12 },
  draftTitle: { fontSize: 16, marginTop: 10 },
  draftDate: { marginTop: 8 },
});
