import {
  catalog,
  configuredElections,
  configuredPrecincts as bundledPrecincts,
  blocks,
} from '../content/catalog.ts';
const configuredHeadquarters = Object.values(catalog.headquarters);
const configuredContacts = Object.values(catalog.contacts);
const roadmapConfigs = catalog.roadmaps;

export type CounterEvent = {
  electionId?: string;
  precinctId?: string;
  id: string;
  date: string;
  at: string;
  delta: number;
  kind: 'increment' | 'correction' | 'undo';
  note: string;
  undoOf?: string;
};
export type Reconciliation = {
  electionId?: string;
  precinctId?: string;
  id: string;
  date: string;
  at: string;
  slot: string;
  observer: number;
  commission: number;
};
export type Contact = { id: string; role: string; name: string; phone: string };
export type Complaint = {
  submittedAt?: string;
  electionId?: string;
  precinctId?: string;
  id: string;
  at: string;
  category: string;
  circumstances: string;
  text: string;
};
export type Profile = {
  name: string;
  members: string;
};
export type Member = { id: string; role: string; name: string; party: string };
export type Precinct = {
  parentId?: string | null;
  demo?: boolean;
  id: string;
  number: string;
  region: string;
  address: string;
  members: Member[];
  electionId: string;
  hqId: string;
};
export function requiredMembers(): Member[] {
  return ['Председатель', 'Заместитель председателя', 'Секретарь'].map((role, i) => ({
    id: `officer-${i}`,
    role,
    name: '',
    party: '',
  }));
}
export function withBundledPrecincts(existing: Precinct[], electionId = 'initial'): Precinct[] {
  const ids = new Set(existing.map((p) => p.id));
  return [
    ...existing,
    ...bundledPrecincts
      .filter((p) => !ids.has(p.id))
      .map((p) => ({ ...p, electionId, members: requiredMembers() })),
  ];
}
export type Trip = {
  stageId?: string;
  id: string;
  date: string;
  title: string;
  precinctId: string;
  electionId: string;
};
export type Election = {
  readonly id: string;
  readonly title: string;
  readonly dates: readonly string[];
  readonly roadmapConfigId: string;
  readonly status?: string;
  readonly infoId?: string;
};
export type Headquarters = { id: string; title: string; contactIds: string[] };
export type NoteCopy = {
  id: string;
  targetKey: string;
  text: string;
  copiedFrom?: string;
  at: string;
};
export type SourcePurpose =
  'raw-law' | 'template' | 'filled-example' | 'photo-example' | 'procedure-video' | 'unclassified';
export type Material = {
  id: string;
  title: string;
  name: string;
  mime: string;
  uri: string;
  purpose?: SourcePurpose;
};
export type OutboxItem = { id: string; at: string; type: string; payload: unknown };
export type ComplaintComposer = {
  selected: string[];
  facts: string;
  name: string;
  recipient: string;
  text: string;
  variables?: Record<string, string>;
};
export type ProblemProgress = {
  reviewing?: boolean;
  completed: string[];
  waiting: boolean;
  resolved: boolean;
};
export type AppState = {
  problems?: Record<string, ProblemProgress>;
  complaintComposers?: Record<string, ComplaintComposer>;
  version: 3;
  contextSelected?: boolean;
  adminCatalogVersion?: 1;
  previousCatalogSnapshot?: string;
  elections: Record<string, Election>;
  electionId: string;
  headquarters: Record<string, Headquarters>;
  contactById: Record<string, Contact>;
  stationMembers?: Record<string, Member[]>;
  personalContacts?: (Contact & { electionId: string; precinctId: string })[];
  noteCopies: NoteCopy[];
  noteTemplates: { id: string; title: string; text: string }[];
  legacyBackup?: string;
  precincts: Precinct[];
  precinctId: string;
  trips: Trip[];
  lawTexts: Record<string, string>;
  materials: Material[];
  profile: Profile;
  day: number;
  counter: CounterEvent[];
  reconciliations: Reconciliation[];
  checks: Record<string, boolean>;
  notes: Record<string, string>;
  complaints: Complaint[];
  outbox: OutboxItem[];
};
export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function freshState(): AppState {
  return withAdminCatalog({
    version: 3,
    elections: { initial: createElection('initial', 'Выборы не выбраны', [localDate()]) },
    electionId: 'initial',
    headquarters: { shared: { id: 'shared', title: 'Общий штаб', contactIds: [] } },
    contactById: {},
    noteCopies: [],
    noteTemplates: [],
    precincts: withBundledPrecincts([
      {
        id: 'initial',
        number: '',
        region: '',
        address: '',
        members: requiredMembers(),
        electionId: 'initial',
        hqId: 'shared',
      },
    ]),
    precinctId: 'initial',
    trips: [],
    lawTexts: {},
    materials: [],
    profile: { name: '', members: '' },
    day: 1,
    counter: [],
    reconciliations: [],
    checks: {},
    notes: {},
    complaints: [],
    outbox: [],
  });
}
export function activeElection(state: AppState): Election {
  return state.elections[state.electionId];
}
export function activePrecinct(state: AppState): Precinct {
  return state.precincts.find((p) => p.id === state.precinctId)!;
}
export function membersFor(state: AppState): Member[] {
  return (
    state.stationMembers?.[JSON.stringify([state.electionId, state.precinctId])] ||
    activePrecinct(state).members
  );
}
export function contactsFor(state: AppState): Contact[] {
  return [
    ...(state.headquarters[activePrecinct(state).hqId]?.contactIds || []).map(
      (id) => state.contactById[id],
    ),
    ...(state.personalContacts || []).filter((contact) => inContext(state, contact)),
  ];
}
export function stationDraftDirty(state: AppState, entry: Precinct, name: string): boolean {
  const normalize = (p: Precinct | undefined) =>
    p && {
      ...p,
      number: p.number.trim(),
      region: p.region.trim(),
      address: p.address.trim(),
      members: p.members.map((m) => ({ ...m, name: m.name.trim(), party: m.party.trim() })),
    };
  return (
    entry.id !== state.precinctId ||
    name.trim() !== state.profile.name.trim() ||
    JSON.stringify(normalize(entry)) !==
      JSON.stringify(normalize(state.precincts.find((p) => p.id === entry.id)))
  );
}
export function inContext(
  state: AppState,
  row: { precinctId?: string; electionId?: string },
): boolean {
  return (
    (row.precinctId || 'initial') === state.precinctId &&
    (row.electionId || 'initial') === state.electionId
  );
}
export function selectedDate(state: AppState): string {
  return activeElection(state).dates[state.day - 1];
}
export function currentRoadmapDay(state: AppState, today = localDate()): number {
  const dates = activeElection(state).dates;
  const next = dates.findIndex((date) => date >= today);
  return next < 0 ? dates.length : next + 1;
}
export function createElection(
  id: string,
  title: string,
  dates: readonly string[],
  roadmapConfigId: Election['roadmapConfigId'] = 'standard',
): Election {
  if (
    !id ||
    !title.trim() ||
    !dates.length ||
    dates.length > 31 ||
    dates.some((d) => !validDate(d)) ||
    new Set(dates).size !== dates.length ||
    (!roadmapConfigs[roadmapConfigId] && roadmapConfigId !== 'standard')
  )
    throw new Error('Укажите название и неповторяющиеся даты голосования.');
  return Object.freeze({
    id,
    title: title.trim(),
    dates: Object.freeze([...dates].sort()),
    roadmapConfigId,
  });
}
export type RoadmapStage = (typeof blocks)[number] & {
  blockId: string;
  anytime: boolean;
  repeatable: boolean;
};
export function electionStages(election: Election, day: number): RoadmapStage[] {
  if (day < 1 || day > election.dates.length) return [];
  const config = roadmapConfigs[election.roadmapConfigId];
  if (!config) return [];
  const matches = (kind: string) =>
    kind === 'each' ||
    (kind === 'first' && day === 1) ||
    (kind === 'last' && day === election.dates.length) ||
    (kind === 'except-last' && day < election.dates.length) ||
    (kind === 'middle' && day > 1 && day < election.dates.length) ||
    (kind === 'last-after-first' && day > 1 && day === election.dates.length);
  return [
    ...config.steps
      .filter((step) => matches(step.days))
      .map((step) => ({ ...step, anytime: false })),
    ...config.anytime.map((step) => ({ ...step, anytime: true })),
  ].map((step) => ({
    ...blocks.find((b) => b.id === step.blockId)!,
    id: step.id,
    blockId: step.blockId,
    anytime: step.anytime,
    repeatable: 'repeatable' in step && step.repeatable === true,
  }));
}
export function taskRecordId(stage: RoadmapStage, itemId: string, trip = ''): string {
  return JSON.stringify([stage.id, itemId, trip]);
}
export function validNoteTarget(state: AppState, target: string): boolean {
  const stages = electionStages(activeElection(state), state.day);
  if (target.startsWith('item:')) {
    try {
      const [stepId, itemId, trip] = JSON.parse(target.slice(5));
      const stage = stages.find((s) => s.id === stepId);
      return (
        !!stage?.items.some((i) => i.id === itemId) &&
        (!trip ||
          state.trips.some(
            (t) =>
              t.id === trip &&
              (t.stageId ?? 'home') === stepId &&
              inContext(state, t) &&
              t.date === selectedDate(state),
          ))
      );
    } catch {
      return false;
    }
  }
  return (
    stages.some((s) => s.id === target) ||
    state.trips.some(
      (t) =>
        target === `${t.id}:${t.stageId ?? 'home'}` &&
        inContext(state, t) &&
        t.date === selectedDate(state),
    )
  );
}
export function canCheck(state: AppState, stageId: string, itemId: string, trip = ''): boolean {
  const election = activeElection(state);
  const stage = electionStages(election, state.day).find((s) => s.id === stageId);
  if (!stage || !stage.items.some((i) => i.id === itemId)) return false;
  if (stage.repeatable)
    return state.trips.some(
      (t) =>
        t.id === trip &&
        (t.stageId ?? 'home') === stageId &&
        t.date === selectedDate(state) &&
        inContext(state, t),
    );
  return true;
}
export function validDate(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !isNaN(new Date(value + 'T12:00:00').getTime()) &&
    localDate(new Date(value + 'T12:00:00')) === value
  );
}
export function countFor(state: AppState) {
  return state.counter.filter((e) => inContext(state, e)).reduce((sum, e) => sum + e.delta, 0);
}
export function recordKey(state: AppState, id: string) {
  return JSON.stringify([state.electionId, state.precinctId, selectedDate(state), id]);
}
export function parseCount(text: string): number | null {
  if (!/^\d+$/.test(text.trim())) return null;
  const number = Number(text);
  return Number.isSafeInteger(number) && number <= 1000000 ? number : null;
}
export function formatDate(value: string) {
  return new Date(value + 'T12:00:00').toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
  });
}
export function time(at: string) {
  return new Date(at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

/** Original serialized data is retained once; migration never reads source documents. */
export function readState(raw: string): AppState {
  let data = JSON.parse(raw);
  if (data?.version === 4 && data.observer?.complaintComposers !== undefined)
    validateComposers(data.observer.complaintComposers);
  if (data?.version !== 4 && data?.complaintComposers !== undefined)
    validateComposers(data.complaintComposers);
  const problems = data?.version === 4 ? data.observer?.problems : data?.problems;
  if (problems !== undefined) validateProblems(problems);
  if (data?.version === 4) {
    if (!data.observer || !data.contexts || typeof data.catalogRevision !== 'string')
      throw new Error('Повреждены локальные данные.');
    // Historical context is retained even if an update removes a campaign or UIK.
    data = { ...data.observer, ...data.contexts, version: 3 };
  }
  if (
    !data ||
    ![1, 2, 3].includes(data.version) ||
    !data.profile ||
    !['counter', 'reconciliations', 'complaints', 'outbox'].every((key) =>
      Array.isArray(data[key]),
    ) ||
    !data.checks ||
    !data.notes
  )
    throw new Error('Неподдерживаемый формат сохранённых данных.');
  if (data.version !== 3) {
    if (!validDate(data.profile.startDate) || ![1, 2, 3].includes(data.day))
      throw new Error('Повреждены даты прежней кампании.');
    const dates = [0, 1, 2].map((offset) => {
      const date = new Date(data.profile.startDate + 'T12:00:00');
      date.setDate(date.getDate() + offset);
      return localDate(date);
    });
    data.elections = { initial: createElection('initial', 'Перенесённая кампания', dates) };
    data.electionId = 'initial';
    data.precinctId ??= 'initial';
    data.precincts ??= [
      {
        id: 'initial',
        number: data.profile.precinct || '',
        region: '',
        address: data.profile.address || '',
        members: requiredMembers(),
        contacts: data.contacts || [],
      },
    ];
    data.contactById = {};
    data.headquarters = { shared: { id: 'shared', title: 'Общий штаб', contactIds: [] } };
    // Preserve distinct contact identities; never merge people by name or phone.
    for (const p of data.precincts) {
      const contacts: Contact[] = p.contacts?.length
        ? p.contacts
        : p.id === data.precinctId
          ? data.contacts || []
          : [];
      const hqId = contacts.length ? `legacy-hq:${p.id}` : 'shared';
      if (contacts.length) {
        const ids = contacts.map((contact, index) => {
          const canonicalId = `legacy-contact:${contact.id}`;
          const previous = data.contactById[canonicalId] as Contact | undefined;
          const conflict =
            previous &&
            (previous.name !== contact.name ||
              previous.phone !== contact.phone ||
              previous.role !== contact.role);
          // An existing identical ID is an explicit identity reference, not a fuzzy match.
          const id = contact.id && !conflict ? canonicalId : `legacy-contact:${p.id}:${index}`;
          data.contactById[id] = { ...contact, id };
          return id;
        });
        data.headquarters[hqId] = {
          id: hqId,
          title: `Штаб УИК № ${p.number || '—'}`,
          contactIds: [...new Set(ids)],
        };
      }
      p.hqId = hqId;
      p.electionId = 'initial';
      delete p.contacts;
    }
    // Attach bundled precincts with their elections and headquarters after legacy validation.
    data.trips ??= [];
    for (const rows of [data.counter, data.reconciliations, data.complaints, data.trips])
      for (const row of rows) {
        row.electionId = 'initial';
        row.precinctId ??= 'initial';
      }
    const remap = (records: Record<string, unknown>, check: boolean) => {
      const result: Record<string, unknown> = {};
      for (const [oldKey, value] of Object.entries(records)) {
        // Match exact known precinct prefixes; retain all unmatched records in backup.
        for (const p of data.precincts) {
          const prefix = p.id === 'initial' ? '' : p.id + ':';
          if (!oldKey.startsWith(prefix)) continue;
          const tail = oldKey.slice(prefix.length);
          const date = tail.slice(0, 10);
          if (!validDate(date) || tail[10] !== ':') continue;
          let id = tail.slice(11);
          if (check) {
            let trip = '';
            const visit = data.trips.find((t: Trip) => id.startsWith(t.id + ':'));
            if (visit) {
              trip = visit.id;
              id = id.slice(trip.length + 1);
            }
            const block = blocks.find((b) => b.items.some((i) => i.id === id));
            if (block) id = JSON.stringify([block.id, id, trip]);
          } else if (id.startsWith('item:')) {
            let itemId = id.slice(5);
            let trip = '';
            const visit = data.trips.find((t: Trip) => itemId.startsWith(t.id + ':'));
            if (visit) {
              trip = visit.id;
              itemId = itemId.slice(trip.length + 1);
            }
            const block = blocks.find((b) => b.items.some((i) => i.id === itemId));
            if (block) id = 'item:' + JSON.stringify([block.id, itemId, trip]);
          }
          result[JSON.stringify(['initial', p.id, date, id])] = value;
          break;
        }
      }
      return result;
    };
    data.checks = remap(data.checks, true);
    data.notes = remap(data.notes, false);
    data.profile = { name: data.profile.name || '', members: data.profile.members || '' };
    delete data.contacts;
    data.noteCopies = [];
    data.noteTemplates = [];
    data.legacyBackup = raw;
    data.version = 3;
  }
  data.materials ??= [];
  data.lawTexts ??= {};
  if (
    !data.elections ||
    !data.elections[data.electionId] ||
    !Array.isArray(data.precincts) ||
    !data.headquarters ||
    !data.contactById ||
    !Array.isArray(data.trips) ||
    !Array.isArray(data.noteCopies) ||
    !Array.isArray(data.noteTemplates) ||
    !Array.isArray(data.materials)
  )
    throw new Error('Повреждён каталог приложения.');
  for (const [id, value] of Object.entries(data.elections) as [string, Election][]) {
    if (id !== value.id) throw new Error('Повреждён идентификатор кампании.');
    const election = {
      ...createElection(
        value.id,
        value.title,
        value.dates,
        roadmapConfigs[value.roadmapConfigId] ? value.roadmapConfigId : 'standard',
      ),
      roadmapConfigId: value.roadmapConfigId,
    };
    if (JSON.stringify(election.dates) !== JSON.stringify(value.dates))
      throw new Error('Нарушен порядок дат.');
    data.elections[id] = election;
  }
  if (
    !Number.isInteger(data.day) ||
    data.day < 1 ||
    data.day > data.elections[data.electionId].dates.length ||
    !data.precincts.some(
      (p: Precinct) => p.id === data.precinctId && p.electionId === data.electionId,
    ) ||
    !data.precincts.every(
      (p: Precinct) =>
        data.elections[p.electionId] && data.headquarters[p.hqId] && Array.isArray(p.members),
    ) ||
    !Object.values(data.headquarters).every((value) => {
      if (!value || typeof value !== 'object' || !('contactIds' in value)) return false;
      const hq = value;
      return (
        Array.isArray(hq.contactIds) &&
        hq.contactIds.every((id: unknown) => typeof id === 'string' && data.contactById[id])
      );
    }) ||
    !data.counter.every(
      (e: CounterEvent) =>
        typeof e.id === 'string' && validDate(e.date) && Number.isSafeInteger(e.delta),
    )
  )
    throw new Error('Повреждены связи сохранённых данных.');
  if (!data.adminCatalogVersion) data.previousCatalogSnapshot = raw;
  return withAdminCatalog(data as AppState);
}

/** Administrator-owned configuration is authoritative; saved snapshots never override it. */
export const electionCatalog: readonly Election[] = configuredElections.map((e) =>
  Object.freeze({ ...e, ...createElection(e.id, e.title, e.dates, e.roadmapConfigId) }),
);
export const precinctCatalog: readonly Precinct[] = bundledPrecincts;
export function hasSelectedContext(state: AppState): boolean {
  return (
    state.contextSelected === true &&
    electionCatalog.some((e) => e.id === state.electionId) &&
    precinctCatalog.some((p) => p.id === state.precinctId && p.electionId === state.electionId)
  );
}
export function withAdminCatalog(state: AppState): AppState {
  const elections = { ...state.elections };
  for (const e of electionCatalog) {
    const previous = elections[e.id];
    if (previous && JSON.stringify(previous.dates) !== JSON.stringify(e.dates))
      throw new Error('Даты существующих выборов изменены в конфигурации. Используйте новый ID.');
    elections[e.id] = e;
  }
  const next = {
    ...state,
    elections,
    precincts: [
      ...state.precincts.filter((p) => !precinctCatalog.some((c) => c.id === p.id)),
      ...precinctCatalog,
    ],
    headquarters: {
      ...state.headquarters,
      ...Object.fromEntries(configuredHeadquarters.map((h) => [h.id, h])),
    },
    contactById: {
      ...state.contactById,
      ...Object.fromEntries((configuredContacts as Contact[]).map((c) => [c.id, c])),
    },
  };
  next.adminCatalogVersion = 1;
  if (!hasSelectedContext(next)) next.contextSelected = false;
  return next;
}

/** Durable v4 contains observer-owned records and small historical context snapshots only.
 * Catalog content (laws, tasks, theory, sources, contacts) is always read from the bundle.
 * Legacy non-catalog entries remain recoverable during the transition.
 */
export interface ObservationSnapshot {
  version: 4;
  catalogRevision: string;
  observer: Omit<AppState, 'version' | 'elections' | 'precincts' | 'headquarters' | 'contactById'>;
  contexts: Pick<AppState, 'elections' | 'precincts' | 'headquarters' | 'contactById'>;
}
export function serializeState(state: AppState): string {
  const { version, elections, precincts, headquarters, contactById, ...observer } = state;
  const used = new Set([state.electionId]);
  for (const row of [
    ...state.counter,
    ...state.reconciliations,
    ...state.complaints,
    ...state.trips,
  ])
    if (row.electionId) used.add(row.electionId);
  for (const key of [
    ...Object.keys(state.problems || {}),
    ...Object.keys(state.checks),
    ...Object.keys(state.notes),
    ...state.noteCopies.map((n) => n.targetKey),
  ]) {
    try {
      const parts = JSON.parse(key);
      if (Array.isArray(parts)) used.add(parts[0]);
    } catch {
      /* Legacy backup retains unrecognized keys. */
    }
  }
  const retainedElections = Object.fromEntries(
    Object.entries(elections)
      .filter(([id]) => used.has(id) || !catalog.campaigns[id])
      .map(([id, e]) => [
        id,
        {
          id: e.id,
          title: e.title,
          dates: e.dates,
          roadmapConfigId: e.roadmapConfigId,
        },
      ]),
  );
  const retainedPrecincts = precincts
    .filter((p) => retainedElections[p.electionId])
    .map((p) =>
      precinctCatalog.some((c) => c.id === p.id)
        ? {
            id: p.id,
            electionId: p.electionId,
            number: p.number,
            address: p.address,
            region: p.region,
            members: [],
            hqId: 'shared',
          }
        : p,
    );
  const hqIds = new Set(retainedPrecincts.map((p) => p.hqId));
  const retainedHQ = Object.fromEntries(
    Object.entries(headquarters)
      .filter(([id]) => hqIds.has(id))
      .map(([id, h]) => [id, catalog.headquarters[id] ? { ...h, contactIds: [] } : h]),
  );
  const contactIds = new Set(Object.values(retainedHQ).flatMap((h) => h.contactIds));
  const snapshot: ObservationSnapshot = {
    version: 4,
    catalogRevision: catalog.revision,
    observer,
    contexts: {
      elections: retainedElections,
      precincts: retainedPrecincts,
      headquarters: retainedHQ,
      contactById: Object.fromEntries(
        Object.entries(contactById).filter(([id]) => contactIds.has(id)),
      ),
    },
  };
  return JSON.stringify(snapshot);
}

function validateComposers(value: unknown): void {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Повреждены черновики жалоб.');
  for (const draft of Object.values(value)) {
    if (!draft || typeof draft !== 'object') throw new Error('Повреждён черновик жалобы.');
    const row = draft as Record<string, unknown>;
    if (
      !Array.isArray(row.selected) ||
      !row.selected.every((id) => typeof id === 'string') ||
      new Set(row.selected).size !== row.selected.length ||
      !['facts', 'name', 'recipient', 'text'].every((key) => typeof row[key] === 'string') ||
      (row.variables !== undefined &&
        (!row.variables ||
          typeof row.variables !== 'object' ||
          Array.isArray(row.variables) ||
          !Object.values(row.variables).every((value) => typeof value === 'string')))
    )
      throw new Error('Повреждён черновик жалобы.');
  }
}

function validateProblems(value: unknown): void {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Повреждены данные решения проблем.');
  for (const row of Object.values(value) as ProblemProgress[]) {
    if (
      !row ||
      !Array.isArray(row.completed) ||
      !row.completed.every((id) => typeof id === 'string') ||
      new Set(row.completed).size !== row.completed.length ||
      typeof row.waiting !== 'boolean' ||
      typeof row.resolved !== 'boolean' ||
      (row.reviewing !== undefined && typeof row.reviewing !== 'boolean')
    )
      throw new Error('Повреждены данные решения проблем.');
  }
}
