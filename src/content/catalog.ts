import bundled from './catalog.generated.json' with { type: 'json' };
import type { Catalog, UIK } from '../data/architecture/entities';
import { ContentRepository } from '../data/repositories/content.ts';

function freeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
/** Validated at build time; immutable and never written to observer storage. */
export const catalog = freeze(bundled as Catalog);
export const contentRepository = new ContentRepository(
  { loadCatalog: async () => catalog },
  catalog,
);
export const campaigns = Object.values(catalog.campaigns);
export const configuredElections = campaigns.map((c) => c.election);
export const configuredPrecincts = campaigns.flatMap((c) =>
  Object.values(c.commissions).filter((n): n is UIK => n.kind === 'UIK'),
);
export const blocks = Object.values(catalog.blocks).map((b) => ({
  ...b,
  items: b.taskIds.map((id) => catalog.tasks[id]),
}));
export function campaignContent(electionId: string) {
  return contentRepository.select(electionId);
}
