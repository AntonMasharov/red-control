import { catalog } from './catalog';
// Document links use authored source IDs; no document-specific registrations.
export const acts = Object.values(catalog.sources)
  .filter((source) => source.purpose === 'raw-law')
  .map((source) => ({
    id: source.id,
    sourceId: source.id,
    title: source.title,
  }));
export type Act = (typeof acts)[number];
