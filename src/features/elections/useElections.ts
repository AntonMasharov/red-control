import { useState } from 'react';
import { electionCatalog, hasSelectedContext, precinctCatalog } from '../../data/model';
import { actions, useStore } from '../../data/store';
import { useFeedback } from '../../ui/feedback';
export function useElections(onSaved: () => void) {
  const state = useStore();
  const { run, notify } = useFeedback();
  const [electionId, setElectionId] = useState<string>();
  const [precinctId, setPrecinctId] = useState<string>();
  const [name, setName] = useState(state.profile.name);
  const [query, setQuery] = useState('');
  const [preview, setPreview] = useState(false);
  const election = electionCatalog.find((e) => e.id === electionId);
  const precinct = precinctCatalog.find((p) => p.id === precinctId && p.electionId === electionId);
  const changed =
    !hasSelectedContext(state) ||
    state.electionId !== electionId ||
    state.precinctId !== precinctId ||
    state.profile.name !== name.trim();
  const save = () => {
    if (
      election &&
      precinct &&
      run(() => actions.selectContext(election.id, precinct.id, name), 'Выбор сохранён')
    )
      onSaved();
  };
  return {
    state,
    run,
    notify,
    electionId,
    setElectionId,
    precinctId,
    setPrecinctId,
    name,
    setName,
    query,
    setQuery,
    preview,
    setPreview,
    election,
    precinct,
    changed,
    save,
  };
}
