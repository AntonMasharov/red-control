import { campaignContent } from '../../content/catalog';
import { useStoreSelector } from '../../data/store';

export function useLaws() {
  const electionId = useStoreSelector((state) => state.electionId);
  return campaignContent(electionId).laws;
}
