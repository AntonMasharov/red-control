import type { ComplaintTemplate } from '../../features/complaints/engine';
/** Authoritative static catalog contracts. IDs stay stable across content revisions. */
export type Table<T> = Record<string, T>;
export interface SourceReference {
  sourceId: string;
  label: string;
  locator?: string;
}
export interface Media {
  kind: 'image' | 'video' | 'document';
  sourceId: string;
  alt: string;
  /** External provenance only; never fetched by the offline app. */
  url?: string;
  embedId?: string;
}
export interface SourceFile {
  id: string;
  title: string;
  name: string;
  mime: string;
  purpose:
    | 'raw-law'
    | 'template'
    | 'filled-example'
    | 'photo-example'
    | 'procedure-video'
    | 'unclassified';
  /** null means unpublished; no network fallback. */
  assetKey: string | null;
  file?: string;
}
export interface LawCitation {
  id: string;
  title: string;
  text: string;
  status: string;
  source: string;
  sourceIds: string[];
  references: SourceReference[];
}
export interface TheoryBlock {
  id: string;
  title: string;
  description: string;
  icon: string;
  minutes: number;
  markdown: string;
  videoId?: string;
  sourceIds: string[];
  lawIds: string[];
  references: SourceReference[];
  media: Media[];
}
export interface ProblemSolvingConfig {
  default: string[];
  stages: Table<{
    title: string;
    description: string;
    completedLabel: string;
    kind: 'oral' | 'complaint' | 'action';
  }>;
}
export interface ChecklistTask {
  problemSolving?: string[];
  complaintId?: string;
  id: string;
  text: string;
  lawIds: string[];
  sourceIds: string[];
  media: Media[];
}
export interface ChecklistBlock {
  headings?: { title: string; beforeTaskId: string }[];
  id: string;
  title: string;
  time: string;
  sourceHeading: string;
  taskIds: string[];
}
export type DaySelection =
  'each' | 'first' | 'middle' | 'last' | 'except-last' | 'last-after-first';
export interface RoadmapConfig {
  id: string;
  steps: { id: string; blockId: string; days: DaySelection; repeatable?: boolean }[];
  anytime: { id: string; blockId: string; repeatable: boolean }[];
}
export interface Election {
  id: string;
  title: string;
  dates: string[];
  roadmapConfigId: string;
  infoId: string;
  status: 'draft' | 'active' | 'archived' | 'training';
  topicIds: string[];
  lawIds: string[];
  sourceIds: string[];
  documentIds: string[];
}
export interface CommissionMember {
  id: string;
  role: string;
  name: string;
  party: string;
}
export interface Commission {
  id: string;
  kind: 'IKSRF' | 'OIK' | 'TIK' | 'UIK';
  title: string;
  parentId: string | null;
  number?: string;
  region?: string;
  address?: string;
  members?: CommissionMember[];
  electionId?: string;
  hqId?: string;
  demo?: boolean;
}
export interface UIK extends Commission {
  kind: 'UIK';
  number: string;
  region: string;
  address: string;
  members: CommissionMember[];
  electionId: string;
  hqId: string;
}
export interface Campaign {
  schemaVersion: 1;
  election: Election;
  info: { id: string; title: string; markdown: string };
  commissions: Table<Commission>;
  complaints?: ComplaintTemplate[];
}
/** Authored campaign file; the build resolves its relative commission-file reference. */
export interface CampaignFile extends Omit<Campaign, 'commissions'> {
  commissionsFile: string;
}
export interface Catalog {
  problemSolving: ProblemSolvingConfig;
  schemaVersion: 1;
  revision: string;
  campaigns: Table<Campaign>;
  sources: Table<SourceFile>;
  laws: Table<LawCitation>;
  topics: Table<TheoryBlock>;
  tasks: Table<ChecklistTask>;
  blocks: Table<ChecklistBlock>;
  roadmaps: Table<RoadmapConfig>;
  documents: Table<{ id: string; title: string; sourceId: string }>;
  headquarters: Table<{ id: string; title: string; contactIds: string[] }>;
  contacts: Table<{ id: string; role: string; name: string; phone: string }>;
}
