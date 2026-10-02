import { useEffect, useState } from 'react';
import type { Law } from '../../content';
import { campaignContent } from '../../content/catalog';
import {
  activeElection,
  electionStages,
  inContext,
  recordKey,
  type RoadmapStage,
  selectedDate,
  taskRecordId,
} from '../../data/model';
import { useStore } from '../../data/store';
import { useFeedback } from '../../ui/feedback';

export function useRoadmap() {
  const state = useStore();
  const { run } = useFeedback();
  const election = activeElection(state);
  const laws = campaignContent(election.id).laws;
  const visible = electionStages(election, state.day);
  const [active, setActive] = useState<RoadmapStage>();
  const [trip, setTrip] = useState('');
  const [home, setHome] = useState('');
  const [law, setLaw] = useState<Law>();
  const [lawIds, setLawIds] = useState<string[]>();
  const [openNotes, setOpenNotes] = useState<Record<string, boolean>>({});
  useEffect(() => {
    setActive(undefined);
    setLaw(undefined);
    setHome('');
    setTrip('');
  }, [state.electionId, state.precinctId, state.day]);
  const trips = state.trips.filter(
    (t) => inContext(state, t) && t.date === selectedDate(state) && (t.stageId ?? 'home') === home,
  );
  const open = (stage: RoadmapStage, runId = '') => {
    setTrip(runId);
    setActive(stage);
  };
  const sequential = visible.filter((s) => !s.anytime);
  const progressStages = sequential.filter((stage) => !stage.repeatable);
  const total = progressStages.reduce((sum, stage) => sum + stage.items.length, 0);
  const done = progressStages.reduce(
    (sum, stage) =>
      sum +
      stage.items.filter((item) => state.checks[recordKey(state, taskRecordId(stage, item.id))])
        .length,
    0,
  );
  return {
    state,
    run,
    election,
    laws,
    visible,
    active,
    setActive,
    trip,
    setTrip,
    home,
    setHome,
    law,
    setLaw,
    lawIds,
    setLawIds,
    openNotes,
    setOpenNotes,
    trips,
    open,
    sequential,
    total,
    done,
  };
}
