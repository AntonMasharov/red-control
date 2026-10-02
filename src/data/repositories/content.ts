import type { Catalog } from '../architecture/entities';

export function resolveContent(catalog: Catalog, electionId: string) {
  const campaign = catalog.campaigns[electionId];
  const election = campaign?.election;
  const topics = (election?.topicIds ?? []).map((id) => catalog.topics[id]);
  const roadmap = election && catalog.roadmaps[election.roadmapConfigId];
  const blockIds = roadmap
    ? [...roadmap.steps, ...roadmap.anytime].map((step) => step.blockId)
    : [];
  const tasks = [...new Set(blockIds)].flatMap((id) =>
    catalog.blocks[id].taskIds.map((taskId) => catalog.tasks[taskId]),
  );
  const complaintLawIds = (campaign?.complaints ?? []).flatMap((template) =>
    template.checkbox_items.flatMap((item) => item.law_references),
  );
  const lawIds = new Set(
    [...topics, ...tasks].flatMap((entry) => entry.lawIds).concat(complaintLawIds),
  );
  const laws = [...lawIds].map((id) => catalog.laws[id]);
  const sourceIds = new Set(laws.flatMap((law) => law.sourceIds));
  return {
    info: campaign?.info,
    topics,
    complaints: campaign?.complaints ?? [],
    laws,
    sources: [...sourceIds].map((id) => catalog.sources[id]),
    documents: (election?.documentIds ?? []).map((id) => catalog.documents[id]),
  };
}

export interface IDataSource {
  loadCatalog(): Promise<Catalog>;
}

export class ContentRepository {
  private readonly source: IDataSource;
  private current: Catalog | undefined;
  constructor(source: IDataSource, initial?: Catalog) {
    this.source = source;
    this.current = initial;
  }
  select(electionId: string) {
    if (!this.current) throw new Error('Content has not been loaded.');
    return resolveContent(this.current, electionId);
  }
  async forElection(electionId: string) {
    this.current = await this.source.loadCatalog();
    return this.select(electionId);
  }
}
