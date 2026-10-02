import { test, expect, jest, beforeAll, beforeEach } from '@jest/globals';
import { generateComplaint } from '../src/features/complaints/engine';
import { catalog, campaignContent } from '../src/content/catalog';
import { resolveContent } from '../src/data/repositories/content';

test('all bundled complaint templates assemble offline', () => {
  for (const campaign of Object.values(catalog.campaigns)) {
    for (const template of campaign.complaints ?? []) {
      const result = generateComplaint(
        template,
        template.checkbox_items.map((item) => item.id),
        {
          time: '10:00',
          recipient: 'УИК № 12',
          observer_name: 'Иван Иванов',
          uik_number: '12',
          date: '01.10.2026',
          facts: 'Обстоятельства',
        },
        catalog.laws,
      );
      expect(result).toContain('ЖАЛОБА');
      expect(result).not.toMatch(/{{\w+}}/);
    }
  }
});

test('law and source scope changes with the selected election', () => {
  const municipal = resolveContent(catalog, 'municipal-2026');
  const federal = resolveContent(catalog, 'state-duma-2026');
  expect(municipal.laws.length).toBeLessThan(federal.laws.length);
  expect(campaignContent('missing').laws).toEqual([]);
  expect(
    municipal.sources.every((source) =>
      municipal.laws.some((law) => law.sourceIds.includes(source.id)),
    ),
  ).toBe(true);
});
