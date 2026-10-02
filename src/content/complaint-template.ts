import { catalog } from './catalog.ts';
import { generateComplaint } from '../features/complaints/engine.ts';

/** Compatibility for saved callers; authored text lives exclusively in YAML. */
export function composeComplaint(input: {
  recipient: string;
  name: string;
  precinct: string;
  selected: string[];
  facts: string;
  date: string;
}) {
  const template = Object.values(catalog.campaigns).flatMap((campaign) => campaign.complaints ?? [])[0];
  if (!template) throw new Error('Шаблон жалобы ещё не опубликован администратором.');
  return generateComplaint(
    template,
    input.selected,
    {
      recipient: input.recipient.trim() || 'участковую избирательную комиссию № _________',
      observer_name: input.name.trim() || '___________________________________________',
      uik_number: input.precinct || '_____',
      date: input.date,
      facts: input.facts,
    },
    catalog.laws,
  );
}
