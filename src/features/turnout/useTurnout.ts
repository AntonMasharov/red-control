import { useEffect, useState } from 'react';
import { manifest } from '../../content';
import { activeElection, countFor, inContext, localDate, parseCount } from '../../data/model';
import { actions, useStore } from '../../data/store';
import { useFeedback } from '../../ui/feedback';

export function useTurnout() {
  const state = useStore();
  const [clock, setClock] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 15000);
    return () => clearInterval(timer);
  }, []);
  const today = localDate(clock);
  const [date, setDate] = useState(today);
  const [historyDate, setHistoryDate] = useState(today);
  const count = countFor(state);
  const { run, notify } = useFeedback();
  const [mode, setMode] = useState<'summary' | 'record' | 'correct' | 'history'>('summary');
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');
  const [observer, setObserver] = useState(String(count));
  const [slot, setSlot] = useState(manifest.reconciliationTimes[0]);
  const rows = state.reconciliations.filter((r) => inContext(state, r));
  const events = state.counter.filter((e) => inContext(state, e));
  const dates = [
    ...new Set([
      ...activeElection(state).dates,
      today,
      ...events.map((e) => e.date),
      ...rows.map((r) => r.date),
    ]),
  ].sort();
  let total = 0;
  const history = events.map((event) => {
    const before = total;
    total += event.delta;
    return { ...event, before, total };
  });
  const points = manifest.reconciliationTimes.map((label) => {
    const cutoff = new Date(date + 'T' + label + ':00').getTime();
    const reached = cutoff <= clock.getTime();
    const row = rows.filter((r) => r.date === date && r.slot === label).at(-1);
    const recorded = events
      .filter((e) => new Date(e.at).getTime() <= cutoff)
      .reduce((sum, e) => sum + e.delta, 0);
    return { label, reached, row, value: row?.observer ?? recorded };
  });
  const openRecord = (label: string) => {
    const point = points.find((p) => p.label === label)!;
    setSlot(label);
    setObserver(String(point.value));
    setValue(point.row ? String(point.row.commission) : '');
    setMode('record');
  };
  const submit = () => {
    if (mode === 'record' && !points.find((p) => p.label === slot)?.reached) {
      notify('Время этой сверки ещё не наступило.');
      return;
    }
    const n = parseCount(value);
    const observed = parseCount(observer);
    if (n === null || observed === null) {
      notify('Введите целое число от 0 до 1 000 000.');
      return;
    }
    if (mode === 'correct' && !reason.trim()) {
      notify('Укажите причину исправления.');
      return;
    }
    if (
      run(
        () =>
          mode === 'correct'
            ? actions.correct(n, reason)
            : actions.reconcile(slot, n, observed, date),
        'Сохранено на устройстве',
      )
    ) {
      setMode('summary');
      setValue('');
      setReason('');
    }
  };
  const next = activeElection(state)
    .dates.flatMap((day) =>
      manifest.reconciliationTimes.map((time) => ({
        day,
        time,
        at: new Date(day + 'T' + time + ':00').getTime(),
      })),
    )
    .find((p) => p.at > clock.getTime());
  return {
    state,
    date,
    setDate,
    historyDate,
    setHistoryDate,
    dates,
    today,
    count,
    run,
    notify,
    mode,
    setMode,
    value,
    setValue,
    reason,
    setReason,
    observer,
    setObserver,
    slot,
    setSlot,
    rows,
    events,
    history,
    submit,
    points,
    openRecord,
    next,
  };
}
