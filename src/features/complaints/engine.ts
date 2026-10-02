export interface ComplaintTemplate {
  id: string;
  title: string;
  category: string;
  header_template: string;
  footer_template: string;
  checkbox_items: {
    id: string;
    label: string;
    description: string;
    inserted_text: string;
    law_references: string[];
  }[];
}

export function complaintVariables(
  template: ComplaintTemplate,
  selected: readonly string[],
): string[] {
  const text = [
    template.header_template,
    template.footer_template,
    ...template.checkbox_items
      .filter((item) => selected.includes(item.id))
      .map((item) => item.inserted_text),
  ].join('\n');
  return [...new Set([...text.matchAll(/{{\s*([\w]+)\s*}}/g)].map((match) => match[1]))];
}

export function generateComplaint(
  template: ComplaintTemplate,
  selected: readonly string[],
  variables: Readonly<Record<string, string>>,
  laws: Readonly<Record<string, { title: string; text: string }>>,
): string {
  const items = template.checkbox_items.filter((item) => selected.includes(item.id));
  if (!items.length) throw new Error('Выберите хотя бы одно нарушение.');
  if (selected.some((id) => !template.checkbox_items.some((item) => item.id === id)))
    throw new Error('Неизвестное нарушение.');
  const references = [...new Set(items.flatMap((item) => item.law_references))];
  const substitute = (text: string) =>
    text.replace(/{{\s*([\w]+)\s*}}/g, (_, key: string) => {
      const value = variables[key]?.trim();
      if (!value) throw new Error(`Заполните поле: ${key}`);
      return value;
    });
  return [
    substitute(template.header_template),
    ...items.map((item) => substitute(item.inserted_text)),
    ...(variables.facts?.trim()
      ? ['Дополнительные обстоятельства:\n' + variables.facts.trim()]
      : []),
    ...references.map((id) => {
      if (!laws[id]) throw new Error(`Неизвестная норма: ${id}`);
      return `${laws[id].title}\n${laws[id].text}`;
    }),
    substitute(template.footer_template),
  ].join('\n\n');
}
