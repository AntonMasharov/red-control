import { StyleSheet, Text } from 'react-native';
import { Button, Field, Sheet } from '../../ui/components';
import { s } from '../../ui/theme';
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
          <Field
            label="Текст обращения"
            multiline
            value={text}
            onChangeText={setText}
            style={localStyles.documentInput}
          />
          <Button title="Сохранить черновик" icon="save" onPress={() => save()} />
          <Text style={s.small}>
            Подготовьте два экземпляра жалобы: один для подачи, второй — для себя.
          </Text>
          <Button title="Подано" icon="check" onPress={() => save(true)} />
          <Button title="Изменить сведения" secondary onPress={() => setText('')} />
        </>
      )}
    </Sheet>
  );
}

const localStyles = StyleSheet.create({
  documentInput: { minHeight: 320 },
});
