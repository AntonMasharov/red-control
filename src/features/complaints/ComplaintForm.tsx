import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Button, Field, IconButton, Sheet } from '../../ui/components';
import { colors, s } from '../../ui/theme';
import type { useComplaintGenerator } from './useComplaintGenerator';
export function ComplaintForm({
  controller,
}: {
  controller: ReturnType<typeof useComplaintGenerator>;
}) {
  const {
    variableFields,
    variables,
    setVariable,
    text,
    setForm,
    recipient,
    setRecipient,
    name,
    setName,
    facts,
    setFacts,
    prepare,
    setText,
    save,
    options,
    selected,
  } = controller;
  return (
    <Sheet
      title={options.find((item) => item.id === selected[0])?.title ?? 'Текст жалобы'}
      onClose={() => setForm(false)}
    >
      <Text style={[s.small, { color: colors.red }]}>
        Подготовьте два экземпляра жалобы: один для подачи, второй — для себя.
      </Text>
      <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 4 }} />
      {!text ? (
        <>
          <Field
            label="Адресат"
            value={recipient}
            onChangeText={setRecipient}
            placeholder="УИК № … или название ТИК"
          />
          <Field label="Ваши фамилия, имя, отчество" value={name} onChangeText={setName} />
          <Field
            label="Дополнительные обстоятельства · необязательно"
            multiline
            value={facts}
            onChangeText={setFacts}
            placeholder="Укажите время, действия комиссии и другие обстоятельства"
          />
          {variableFields.map((key) => (
            <Field
              key={key}
              label={key === 'time' ? 'Время события' : key}
              value={variables[key] ?? ''}
              onChangeText={(value) => setVariable(key, value)}
            />
          ))}
          <Button title="Составить текст" onPress={prepare} />
        </>
      ) : (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <View style={{ flex: 1, gap: 6 }}>
              <Text accessibilityRole="header" style={[s.sectionTitle, { marginBottom: 8 }]}>
                Сведения
              </Text>
              <Text style={s.text}>Адресат: {recipient || 'Не указан'}</Text>
              <Text style={s.text}>Наблюдатель: {name || 'Не указан'}</Text>
              {variableFields.map((key) => (
                <Text key={key} style={s.text}>
                  {key === 'time' ? 'Время события' : key}: {variables[key] || 'Не указано'}
                </Text>
              ))}
              {!!facts && <Text style={s.text}>{facts}</Text>}
            </View>
            <IconButton
              name="edit-2"
              label="Изменить сведения"
              color={colors.red}
              onPress={() => setText('')}
            />
          </View>
          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 4 }} />
          <View style={{ gap: 12 }}>
            <Text accessibilityRole="header" style={s.sectionTitle}>
              Текст обращения
            </Text>
            <TextInput
              accessibilityLabel="Текст обращения"
              multiline
              value={text}
              onChangeText={setText}
              style={[s.input, localStyles.documentInput]}
            />
          </View>
          <Button title="Сохранить черновик" icon="save" onPress={() => save()} />
          <Button title="Подано" icon="check" onPress={() => save(true)} />
        </>
      )}
    </Sheet>
  );
}

const localStyles = StyleSheet.create({
  documentInput: { minHeight: 320 },
});
