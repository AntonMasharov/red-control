import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { formatPhone, normalizePhone } from '../data/phone';
import { actions } from '../data/store';
import { useContacts } from '../features/contacts/useContacts';
import { Button, Empty, Field, Sheet } from '../ui/components';
import { colors, s } from '../ui/theme';
export function Contacts() {
  const {
    save,
    remove,
    state,
    run,
    notify,
    adding,
    setAdding,
    editingId,
    setEditingId,
    deletingId,
    setDeletingId,
    name,
    setName,
    role,
    setRole,
    phone,
    setPhone,
    contacts,
  } = useContacts();
  return (
    <View style={s.stack}>
      <Text style={s.title}>Связь со штабом</Text>
      {contacts.map((contact) => (
        <View style={[s.card, localStyles.contactCard]} key={contact.id}>
          <View style={localStyles.contactDetails}>
            {!!contact.role && <Text style={s.small}>{contact.role}</Text>}
            <Text style={s.sectionTitle}>{contact.name}</Text>
            <Text style={s.text}>{formatPhone(contact.phone)}</Text>
          </View>
          <Button
            title="Позвонить"
            onPress={() => {
              void Linking.openURL(
                'tel:' + normalizePhone(contact.phone).replace(/[^+\d]/g, ''),
              ).catch(() => notify('Не удалось открыть приложение телефона.'));
            }}
          />
          {state.personalContacts?.some((entry) => entry.id === contact.id) && (
            <View style={localStyles.contactActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Изменить"
                style={({ pressed }) => [
                  localStyles.minorAction,
                  pressed && { backgroundColor: colors.wash },
                ]}
                onPress={() => {
                  setEditingId(contact.id);
                  setName(contact.name);
                  setRole(contact.role);
                  setPhone(formatPhone(contact.phone));
                  setAdding(true);
                }}
              >
                <Text style={localStyles.minorActionText}>Изменить</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Удалить"
                style={({ pressed }) => [
                  localStyles.minorAction,
                  pressed && { backgroundColor: colors.wash },
                ]}
                onPress={() => setDeletingId(contact.id)}
              >
                <Text style={localStyles.minorActionText}>Удалить</Text>
              </Pressable>
            </View>
          )}
        </View>
      ))}
      {!contacts.length && (
        <Empty icon="phone" title="Контактов пока нет" text="Добавьте свой контакт для связи." />
      )}
      <Button
        title="Добавить контакт"
        icon="plus"
        secondary
        onPress={() => {
          setEditingId(undefined);
          setName('');
          setRole('');
          setPhone('');
          setAdding(true);
        }}
      />
      {adding && (
        <Sheet
          title={editingId ? 'Изменить контакт' : 'Добавить контакт'}
          onClose={() => setAdding(false)}
          footer={
            <Button
              title="Сохранить контакт"
              disabled={!name.trim() || !phone.trim()}
              onPress={save}
            />
          }
        >
          <Field label="Имя" value={name} onChangeText={setName} />
          <Field label="Роль или должность (необязательно)" value={role} onChangeText={setRole} />
          <Field
            label="Телефон"
            value={phone}
            onChangeText={setPhone}
            onBlur={() => setPhone(formatPhone(phone))}
            placeholder="+7 (999) 123-45-67"
            keyboardType="phone-pad"
          />
          <Text style={s.small}>
            Контакт сохранится на этом устройстве для выбранных выборов и участка.
          </Text>
        </Sheet>
      )}
      {deletingId && (
        <Sheet
          title="Удалить контакт?"
          compact
          hideCounter
          onClose={() => setDeletingId(undefined)}
        >
          <Text style={s.text}>{contacts.find((contact) => contact.id === deletingId)?.name}</Text>
          <Button title="Удалить контакт" onPress={remove} />
          <Button title="Отмена" secondary onPress={() => setDeletingId(undefined)} />
        </Sheet>
      )}
    </View>
  );
}

const localStyles = StyleSheet.create({
  contactCard: { gap: 18 },
  contactDetails: { gap: 8 },
  contactActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: -10 },
  minorAction: { paddingHorizontal: 10, minHeight: 36, justifyContent: 'center', borderRadius: 8 },
  minorActionText: { fontSize: 12, color: colors.muted },
});
