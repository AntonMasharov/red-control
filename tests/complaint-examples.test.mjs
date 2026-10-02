import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { generateComplaint } from '../src/features/complaints/engine.ts';

test('each authored violation generates its own complete example without other violation text', () => {
  const frames = parse(
    readFileSync(
      new URL('../src/content/global/complaint-templates.yaml', import.meta.url),
      'utf8',
    ),
  );
  const complaints = parse(
    readFileSync(new URL('../src/content/global/complaints.yaml', import.meta.url), 'utf8'),
  );
  const template = {
    ...frames['observer-complaint'],
    checkbox_items: Object.values(complaints).map((row) => ({
      id: row.id,
      label: row.title,
      inserted_text: row.text,
      law_references: row.lawIds,
    })),
  };
  const laws = parse(
    readFileSync(new URL('../src/content/global/laws/laws.yaml', import.meta.url), 'utf8'),
  );
  assert.deepEqual(
    template.checkbox_items.map((item) => item.label),
    [
      'Не дают ознакомиться с книгой избирателей',
      'Не дают копию акта вскрытия ящиков надомного голосования',
      'Не вносят отметки о надомном голосовании в книгу избирателей до выезда',
      'Не озвучивают по требованию цифры явки',
    ],
  );
  const variables = {
    time: '12:00',
    recipient: 'УИК №2909',
    observer_name: 'Иван Иванов',
    uik_number: '2909',
    date: '18.09.2026',
  };
  const render = (text) => text.replace(/{{\s*(\w+)\s*}}/g, (_, key) => variables[key]);
  for (const item of template.checkbox_items) {
    const text = generateComplaint(template, [item.id], variables, laws);
    assert.ok(text.includes('ЖАЛОБА'));
    assert.ok(text.includes(render(item.inserted_text)));
    assert.ok(!text.includes('{{'));
    for (const other of template.checkbox_items)
      if (other !== item) assert.ok(!text.includes(render(other.inserted_text)));
  }
});
