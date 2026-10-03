import { useSyncExternalStore } from 'react';
import { randomUUID } from 'expo-crypto';
import { load, persist } from './storage';
import { validPhone } from './phone';
import {
  AppState,
  ComplaintComposer,
  ProblemProgress,
  Member,
  CounterEvent,
  Complaint,
  countFor,
  freshState,
  selectedDate,
  localDate,
  recordKey,
  activeElection,
  inContext,
  canCheck,
  electionStages,
  taskRecordId,
  validNoteTarget,
  electionCatalog,
  precinctCatalog,
  hasSelectedContext,
  validDate,
} from './model';
import manifest from '../core/constants/app-settings.generated.json';

let current = freshState();
let booted = false;
let failure = '';
const listeners = new Set<() => void>();
export function boot() {
  if (booted) return;
  try {
    const saved = load();
    if (saved) current = saved;
    else persist(current);
    booted = true;
    failure = '';
  } catch {
    failure =
      'Не удалось открыть локальное хранилище. Существующие данные не перезаписаны. Проверьте доступ к хранилищу и перезапустите приложение.';
  }
}
export function storageFailure() {
  return failure;
}
export const getState = () => current;
export function useStore() {
  return useStoreSelector((state) => state);
}
/** Select primitives or stable stored references; derive arrays outside this hook. */
export function useStoreSelector<T>(selector: (state: AppState) => T): T {
  // Fast Refresh can replace this module while preserving the mounted UI.
  // Restore durable state before exposing a snapshot, not only on app mount.
  boot();
  return useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      return () => {
        listeners.delete(callback);
      };
    },
    () => selector(current),
    () => selector(current),
  );
}
function commit(type: string, payload: unknown, update: (state: AppState) => AppState) {
  if (!booted) throw new Error('Хранилище недоступно.');
  if (type !== 'context.select' && !hasSelectedContext(current))
    throw new Error('Сначала выберите выборы и УИК.');
  const next = update(current);
  next.outbox = [...next.outbox, { id: randomUUID(), at: new Date().toISOString(), type, payload }];
  // Publish only after durable storage succeeds. Failed writes never appear saved.
  persist(next);
  current = next;
  listeners.forEach((fn) => fn());
}
function addEvent(delta: number, kind: CounterEvent['kind'], note: string, undoOf?: string) {
  const event: CounterEvent = {
    electionId: current.electionId,
    precinctId: current.precinctId,
    id: randomUUID(),
    date: localDate(),
    at: new Date().toISOString(),
    delta,
    kind,
    note,
    undoOf,
  };
  if (countFor(current) + delta < 0) throw new Error('Явка не может быть отрицательной.');
  commit('turnout.event', event, (s) => ({ ...s, counter: [...s.counter, event] }));
}
export const actions = {
  problem: (stageId: string, item: string, trip: string, progress: ProblemProgress) => {
    if (!canCheck(current, stageId, item, trip)) throw new Error('Действие недоступно.');
    const stage = electionStages(activeElection(current), current.day).find(
      (s) => s.id === stageId,
    )!;
    const key = recordKey(current, taskRecordId(stage, item, trip));
    commit('roadmap.problem', { key, progress }, (s) => ({
      ...s,
      problems: { ...s.problems, [key]: { ...progress, completed: [...progress.completed] } },
      checks: { ...s.checks, [key]: progress.resolved },
    }));
  },
  saveComplaintComposer: (draft: ComplaintComposer) => {
    const key = JSON.stringify([current.electionId, current.precinctId]);
    commit('complaint.composer', { key, draft }, (state) => ({
      ...state,
      complaintComposers: {
        ...state.complaintComposers,
        [key]: { ...draft, selected: [...draft.selected], variables: { ...draft.variables } },
      },
    }));
  },
  saveMembers: (members: Member[]) => {
    const key = JSON.stringify([current.electionId, current.precinctId]);
    commit('station.members', { key, members }, (s) => ({
      ...s,
      stationMembers: {
        ...s.stationMembers,
        [key]: members.map((m) => ({
          ...m,
          name: m.name.trim(),
          party: m.party.trim(),
          role: m.role.trim(),
        })),
      },
    }));
  },
  editContact: (id: string, name: string, role: string, phone: string) => {
    if (
      !current.personalContacts?.some((contact) => contact.id === id && inContext(current, contact))
    )
      throw new Error('Контакт не найден.');
    if (!name.trim() || !validPhone(phone))
      throw new Error('Укажите имя и корректный номер телефона.');
    const fields = { name: name.trim(), role: role.trim(), phone: phone.trim() };
    commit('contact.edit', { id, ...fields }, (s) => ({
      ...s,
      personalContacts: (s.personalContacts || []).map((contact) =>
        contact.id === id ? { ...contact, ...fields } : contact,
      ),
    }));
  },
  deleteContact: (id: string) => {
    if (
      !current.personalContacts?.some((contact) => contact.id === id && inContext(current, contact))
    )
      throw new Error('Контакт не найден.');
    commit('contact.delete', { id }, (s) => ({
      ...s,
      personalContacts: (s.personalContacts || []).filter((contact) => contact.id !== id),
    }));
  },
  addContact: (name: string, role: string, phone: string) => {
    if (!name.trim() || !validPhone(phone))
      throw new Error('Укажите имя и корректный номер телефона.');
    const contact = {
      id: randomUUID(),
      name: name.trim(),
      role: role.trim(),
      phone: phone.trim(),
      electionId: current.electionId,
      precinctId: current.precinctId,
    };
    commit('contact.add', contact, (s) => ({
      ...s,
      personalContacts: [...(s.personalContacts || []), contact],
    }));
  },
  selectContext: (electionId: string, precinctId: string, name: string) => {
    if (
      !electionCatalog.some((e) => e.id === electionId) ||
      !precinctCatalog.some((p) => p.id === precinctId && p.electionId === electionId)
    )
      throw new Error('Выберите выборы и относящийся к ним участок.');
    commit('context.select', { electionId, precinctId }, (s) => ({
      ...s,
      electionId,
      precinctId,
      contextSelected: true,
      day: electionId === s.electionId ? s.day : 1,
      profile: { ...s.profile, name: name.trim() },
    }));
  },
  trip: (stageId = 'home') => {
    const stage = electionStages(activeElection(current), current.day).find(
      (stage) => stage.id === stageId,
    );
    if (!stage?.repeatable) throw new Error('Этап нельзя повторить.');
    const trip = {
      id: randomUUID(),
      electionId: current.electionId,
      precinctId: current.precinctId,
      date: selectedDate(current),
      stageId,
      title: `${stageId === 'home' ? 'Выезд' : stage.title} ${current.trips.filter((t) => t.date === selectedDate(current) && inContext(current, t) && (t.stageId ?? 'home') === stageId).length + 1}`,
    };
    commit('roadmap.trip', trip, (s) => ({ ...s, trips: [...s.trips, trip] }));
    return trip;
  },
  increment: () => addEvent(1, 'increment', 'Добавлен один человек'),
  decrement: () => addEvent(-1, 'correction', 'Убран один человек'),
  undo: () => {
    const events = current.counter.filter((e) => inContext(current, e));
    const last = events.at(-1);
    if (last?.kind !== 'increment') throw new Error('Нет последнего нажатия для отмены.');
    addEvent(-1, 'undo', 'Отмена последнего нажатия', last.id);
  },
  correct: (target: number, note: string) => {
    if (!Number.isSafeInteger(target) || target < 0 || target > 1000000 || !note.trim())
      throw new Error('Укажите корректное число и причину исправления.');
    addEvent(target - countFor(current), 'correction', note.trim());
  },
  reconcile: (
    slot: string,
    commission: number,
    observer = countFor(current),
    date = localDate(),
  ) => {
    if (
      !validDate(date) ||
      date > localDate() ||
      !manifest.reconciliationTimes.includes(slot) ||
      ![commission, observer].every((n) => Number.isSafeInteger(n) && n >= 0 && n <= 1000000)
    )
      throw new Error('Некорректные данные сверки.');
    const row = {
      electionId: current.electionId,
      precinctId: current.precinctId,
      id: randomUUID(),
      date,
      at: new Date().toISOString(),
      slot,
      observer,
      commission,
    };
    commit('turnout.reconciliation', row, (s) => ({
      ...s,
      reconciliations: [...s.reconciliations, row],
    }));
  },
  day: (day: number) => {
    if (!Number.isInteger(day) || day < 1 || day > activeElection(current).dates.length)
      throw new Error('Некорректный день.');
    commit('settings.day', { day }, (s) => ({ ...s, day }));
  },
  check: (stageId: string, item: string, trip = '') => {
    if (!canCheck(current, stageId, item, trip)) throw new Error('Действие недоступно.');
    const stage = electionStages(activeElection(current), current.day).find(
      (s) => s.id === stageId,
    )!;
    const key = recordKey(current, taskRecordId(stage, item, trip));
    const value = !current.checks[key];
    commit('roadmap.check', { key, value }, (s) => ({
      ...s,
      checks: { ...s.checks, [key]: value },
      problems: s.problems?.[key]
        ? {
            ...s.problems,
            [key]: {
              ...s.problems[key],
              resolved: value,
              waiting: value ? false : s.problems[key].waiting,
            },
          }
        : s.problems,
    }));
  },
  note: (stage: string, note: string) => {
    if (!validNoteTarget(current, stage)) throw new Error('Пункт для заметки не найден.');
    const key = recordKey(current, stage);
    commit('roadmap.note', { key, note }, (s) => ({ ...s, notes: { ...s.notes, [key]: note } }));
  },
  copyNote: (target: string, text: string, copiedFrom?: string) => {
    if (!validNoteTarget(current, target)) throw new Error('Пункт для копии не найден.');
    if (!text.trim()) throw new Error('Заметка пуста.');
    const entry = {
      id: randomUUID(),
      targetKey: recordKey(current, target),
      text,
      copiedFrom,
      at: new Date().toISOString(),
    };
    commit('note.copy', entry, (s) => ({ ...s, noteCopies: [...s.noteCopies, entry] }));
  },
  updateNoteCopy: (id: string, text: string) => {
    const note = current.noteCopies.find((entry) => entry.id === id);
    const context = note ? JSON.parse(note.targetKey) : [];
    if (context[0] !== current.electionId || context[1] !== current.precinctId)
      throw new Error('Заметка не найдена.');
    commit('note.update', { id, text }, (s) => ({
      ...s,
      noteCopies: s.noteCopies.map((n) => (n.id === id ? { ...n, text } : n)),
    }));
  },
  noteTemplate: (title: string, text: string) => {
    if (!title.trim() || !text.trim()) throw new Error('Заполните шаблон.');
    const entry = { id: randomUUID(), title: title.trim(), text };
    commit('note.template', entry, (s) => ({ ...s, noteTemplates: [...s.noteTemplates, entry] }));
  },
  setComplaintSubmitted: (id: string, submitted: boolean) => {
    if (!current.complaints.some((c) => c.id === id && inContext(current, c)))
      throw new Error('Жалоба не найдена.');
    const submittedAt = submitted ? new Date().toISOString() : undefined;
    commit('complaint.status', { id, submittedAt }, (s) => ({
      ...s,
      complaints: s.complaints.map((c) => (c.id === id ? { ...c, submittedAt } : c)),
    }));
  },
  complaint: (draft: Omit<Complaint, 'id' | 'at'>) => {
    if (!draft.text.trim()) throw new Error('Текст жалобы не может быть пустым.');
    const entry = {
      ...draft,
      electionId: current.electionId,
      precinctId: current.precinctId,
      id: randomUUID(),
      at: new Date().toISOString(),
    };
    const key = JSON.stringify([current.electionId, current.precinctId]);
    commit('complaint.draft', entry, (state) => ({
      ...state,
      complaints: [entry, ...state.complaints],
      complaintComposers: state.complaintComposers?.[key]
        ? {
            ...state.complaintComposers,
            [key]: { ...state.complaintComposers[key], selected: [], facts: '', text: '' },
          }
        : state.complaintComposers,
    }));
    return entry;
  },
};
