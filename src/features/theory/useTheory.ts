import { campaignContent } from '../../content/catalog';
import { useStoreSelector } from '../../data/store';

export function useTheory() {
  const electionId = useStoreSelector((state) => state.electionId);
  return campaignContent(electionId).topics;
}
