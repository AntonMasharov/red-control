import { catalog } from './catalog';
const entries = Object.values(catalog.sources);
import { openOriginal } from './originals';
import type { SourcePurpose } from '../data/model';
import { sourceAssets } from './source-assets.generated';
export { sourceAssets } from './source-assets.generated';

export type RepositorySource = {
  id: string;
  title: string;
  purpose: SourcePurpose;
  name: string;
  mime: string;
  assetKey: string | null;
};
export const sources = entries as RepositorySource[];
export function sourceAvailable(id: string): boolean {
  const source = sources.find((s) => s.id === id);
  return !!source?.assetKey && !!sourceAssets[source.assetKey];
}
export async function openSource(id: string) {
  const source = sources.find((s) => s.id === id);
  if (!source?.assetKey || !sourceAssets[source.assetKey])
    throw new Error('Исходный файл ещё не опубликован администратором.');
  return openOriginal({ ...source, asset: sourceAssets[source.assetKey] });
}
