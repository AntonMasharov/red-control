import { randomUUID } from 'expo-crypto';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { exportText } from '../data/export';
import {
  activeElection,
  electionCatalog,
  formatDate,
  hasSelectedContext,
  precinctCatalog,
  requiredMembers,
  serializeState,
} from '../data/model';
import { actions, useStore } from '../data/store';
import { useCommissions } from '../features/commissions/useCommissions';
import { useElections } from '../features/elections/useElections';
import { CommissionTree } from '../ui/CommissionTree';
import { Button, Field, Icon, IconButton, Notice, RowLink, Sheet } from '../ui/components';
import { colors, s } from '../ui/theme';
import { CampaignPreview } from './CampaignPreview';

export function Profile({ onClose }: { onClose: () => void }) {
  const state = useStore();
  const [selecting, setSelecting] = useState(!hasSelectedContext(state));
  if (selecting || !hasSelectedContext(state))
    return (
      <Selection
        onSaved={() => setSelecting(false)}
        onClose={() => (hasSelectedContext(state) ? setSelecting(false) : onClose())}
      />
    );
  return (
    <StationSummary
      key={state.electionId + ':' + state.precinctId}
      onClose={onClose}
      onChange={() => setSelecting(true)}
    />
  );
}

function StationSummary({ onClose, onChange }: { onClose: () => void; onChange: () => void }) {
  const { state, run, precinct, editing, setEditing, initialMembers, members, setMembers, update } =
    useCommissions();
  const [editingId, setEditingId] = useState<string>();
  const [removing, setRemoving] = useState(false);
  return (
    <Sheet title="Мой участок" onClose={onClose}>
      <View style={localStyles.stationDetails}>
        <Text style={s.sectionTitle}>{activeElection(state).title}</Text>
        <Text style={s.label}>УИК № {precinct.number}</Text>
        <Text style={s.text}>{precinct.address || 'Адрес пока не указан'}</Text>
      </View>
      <Button title="Изменить / сменить участок" secondary onPress={onChange} />
      <Text style={s.sectionTitle}>Члены комиссии</Text>
      {(editing ? members : initialMembers()).map((member) => (
        <View
          key={member.id}
          style={[
            s.card,
            localStyles.memberCard,
            editing && editingId === member.id && localStyles.editingMemberCard,
          ]}
        >
          {editing && editingId === member.id ? (
            <>
              {member.id.startsWith('officer-') ? (
                <Text style={s.label}>{member.role}</Text>
              ) : (
                <Field
                  label="Роль"
                  value={member.role}
                  onChangeText={(value) => update(member.id, 'role', value)}
                />
              )}
              <Field
                label="Фамилия, имя, отчество"
                value={member.name}
                onChangeText={(value) => update(member.id, 'name', value)}
              />
              <Field
                label="Партия / организация"
                value={member.party}
                onChangeText={(value) => update(member.id, 'party', value)}
              />
              {!requiredMembers().some((required) => required.id === member.id) && (
                <Button
                  title={removing ? 'Отменить удаление' : 'Удалить члена комиссии'}
                  secondary
                  onPress={() => setRemoving(!removing)}
                />
              )}
              <View style={localStyles.editActions}>
                <View style={{ flex: 1 }}>
                  <Button title="Отмена" secondary onPress={() => setEditing(false)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    title="Сохранить"
                    onPress={() => {
                      if (
                        run(
                          () =>
                            actions.saveMembers(
                              removing ? members.filter((row) => row.id !== editingId) : members,
                            ),
                          'Состав комиссии сохранён',
                        )
                      )
                        setEditing(false);
                    }}
                  />
                </View>
              </View>
            </>
          ) : (
            <>
              <View style={localStyles.memberHeading}>
                <Text style={[s.label, localStyles.memberRole]}>{member.role}</Text>
                {!editing && (
                  <View style={localStyles.memberEdit}>
                    <IconButton
                      name="edit-2"
                      label={`Изменить: ${member.role}`}
                      color={colors.red}
                      onPress={() => {
                        setMembers(initialMembers());
                        setRemoving(false);
                        setEditingId(member.id);
                        setEditing(true);
                      }}
                    />
                  </View>
                )}
              </View>
              <Text style={s.text}>{member.name || 'ФИО не указано'}</Text>
              <Text style={s.small}>{member.party || 'Партия / организация не указана'}</Text>
            </>
          )}
        </View>
      ))}
      {!editing && (
        <Pressable
          style={({ pressed }) => [
            localStyles.addMember,
            { backgroundColor: pressed ? colors.rose : colors.white },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Добавить члена комиссии"
          onPress={() => {
            const member = { id: randomUUID(), role: 'Член комиссии', name: '', party: '' };
            setMembers([...initialMembers(), member]);
            setRemoving(false);
            setEditingId(member.id);
            setEditing(true);
          }}
        >
          <Icon name="plus" color={colors.red} />
        </Pressable>
      )}
    </Sheet>
  );
}

function Selection({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const {
    state,
    run,
    notify,
    electionId,
    setElectionId,
    precinctId,
    setPrecinctId,
    name,
    setName,
    query,
    setQuery,
    preview,
    setPreview,
    election,
    precinct,
    changed,
    save,
  } = useElections(onSaved);
  if (preview && election)
    return <CampaignPreview election={election} onClose={() => setPreview(false)} />;
  return (
    <Sheet
      title={election ? '2. Выберите УИК' : '1. Выберите выборы'}
      onClose={onClose}
      backAction={
        election
          ? {
              label: 'Назад к выбору выборов',
              onPress: () => {
                setElectionId(undefined);
                setPrecinctId(undefined);
              },
            }
          : undefined
      }
      footer={
        election ? (
          <Button title="Сохранить выбор" disabled={!precinct || !changed} onPress={save} />
        ) : undefined
      }
    >
      {!election ? (
        <>
          <Text style={s.small}>
            {electionCatalog.length
              ? 'Выборы и участки подготовлены администратором. Выберите выборы, на которых будете работать.'
              : 'Выборы пока не добавлены. Они появятся после публикации новых материалов администратором.'}
          </Text>
          {electionCatalog.map((e) => (
            <RowLink
              key={e.id}
              title={e.title}
              subtitle={e.dates.map(formatDate).join(' · ')}
              icon="check-circle"
              onPress={() => {
                setElectionId(e.id);
                setPrecinctId(undefined);
                setQuery('');
              }}
            />
          ))}
          {!electionCatalog.length && (
            <Notice>Список выборов пока не опубликован администратором.</Notice>
          )}
        </>
      ) : (
        <View style={localStyles.selectionContent}>
          <View style={localStyles.electionDetails}>
            <Text style={s.sectionTitle}>{election.title}</Text>
            <Text style={s.small}>{election.dates.map(formatDate).join(' · ')}</Text>
          </View>
          <Button
            title="Посмотреть дорожную карту и законы"
            secondary
            onPress={() => setPreview(true)}
          />
          <View style={localStyles.searchContent}>
            <Field
              label="Найти УИК"
              value={query}
              onChangeText={setQuery}
              placeholder="Номер, регион или адрес"
            />
            <CommissionTree
              electionId={election.id}
              query={query}
              selectedId={precinctId}
              onSelect={setPrecinctId}
            />
            {!precinctCatalog.some((p) => p.electionId === electionId) && (
              <Notice>Для этих выборов участки ещё не опубликованы.</Notice>
            )}
          </View>
          {precinct && (
            <View style={s.card}>
              <Text style={s.sectionTitle}>УИК № {precinct.number}</Text>
              <Text style={s.text}>{precinct.address}</Text>
              <Text style={s.small}>
                Штаб: {state.headquarters[precinct.hqId]?.title || 'Не указан'}
              </Text>
              {precinct.members.map((m) => (
                <Text key={m.id} style={s.small}>
                  {m.role}: {m.name || 'Не указано'}
                  {m.party ? ' · ' + m.party : ''}
                </Text>
              ))}
            </View>
          )}
          <View style={localStyles.observerField}>
            <Field label="Ваши фамилия, имя, отчество" value={name} onChangeText={setName} />
          </View>
        </View>
      )}
      {!election && (
        <View style={localStyles.exportSection}>
          <Text style={s.small}>Резервные копии данных</Text>
          <Button
            title="Экспортировать мои данные"
            secondary
            onPress={() => {
              void exportText(
                'red-control-backup.json',
                serializeState(state),
                'application/json',
              ).catch(() => notify('Не удалось экспортировать данные.'));
            }}
          />
          {state.legacyBackup && (
            <Button
              title="Экспортировать прежние данные"
              secondary
              onPress={() => {
                void exportText(
                  'red-control-legacy.json',
                  state.legacyBackup!,
                  'application/json',
                ).catch(() => notify('Не удалось экспортировать архив.'));
              }}
            />
          )}
        </View>
      )}
    </Sheet>
  );
}

const localStyles = StyleSheet.create({
  stationDetails: { gap: 8 },
  memberCard: { gap: 6, padding: 20 },
  editingMemberCard: { gap: 12 },
  memberHeading: { position: 'relative', minHeight: 20, paddingRight: 36 },
  memberRole: { marginBottom: 0 },
  memberEdit: { position: 'absolute', right: -10, top: -12 },
  addMember: {
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 8,
  },
  editActions: { flexDirection: 'row', gap: 12 },
  selectionContent: { gap: 24 },
  electionDetails: { gap: 6 },
  searchContent: { gap: 8 },
  observerField: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 20 },
  exportSection: {
    marginTop: 16,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
});
