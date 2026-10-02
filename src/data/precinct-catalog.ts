export type CatalogEntry = {
  number: string;
  region: string;
  address: string;
  contacts: { role: string; name: string; phone: string }[];
};
export function parsePrecinctCatalog(text: string): CatalogEntry[] {
  const data = JSON.parse(text.replace(/^\uFEFF/, ''));
  if (!Array.isArray(data) || !data.length || data.length > 10000)
    throw new Error('Ожидается JSON-массив от 1 до 10 000 участков.');
  const seen = new Set<string>();
  return data.map((row, index) => {
    if (
      !row ||
      !['number', 'region', 'address'].every((k) => typeof row[k] === 'string' && row[k].trim())
    )
      throw new Error(`Участок ${index + 1}: нужны number, region и address.`);
    const key = `${row.region.trim().toLocaleLowerCase('ru')}|${row.number.trim()}`;
    if (seen.has(key))
      throw new Error(`Дублируется участок ${row.number} в регионе ${row.region}.`);
    seen.add(key);
    if (row.contacts !== undefined && !Array.isArray(row.contacts))
      throw new Error('Контакты должны быть массивом.');
    const contacts = (row.contacts || []).map((c: Record<string, unknown>) => {
      if (!c || typeof c.role !== 'string' || !c.role.trim() || typeof c.phone !== 'string')
        throw new Error('В контакте нужны role и phone.');
      const phone = c.phone.replace(/[\s()\-]/g, '');
      if (!/^\+?\d{5,15}$/.test(phone))
        throw new Error(`Неверный телефон у участка ${row.number}.`);
      return { role: c.role.trim(), phone, name: typeof c.name === 'string' ? c.name.trim() : '' };
    });
    return {
      number: row.number.trim(),
      region: row.region.trim(),
      address: row.address.trim(),
      contacts,
    };
  });
}
