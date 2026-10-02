import { campaignContent } from '../../content/catalog';
import { useStoreSelector } from '../../data/store';

export function useSources() {
  const electionId = useStoreSelector((state) => state.electionId);
  return campaignContent(electionId).sources;
}
