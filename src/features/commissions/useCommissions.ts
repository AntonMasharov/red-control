import { useState } from 'react';
import { activePrecinct, membersFor, requiredMembers, type Member } from '../../data/model';
import { useStore } from '../../data/store';
import { useFeedback } from '../../ui/feedback';
export function useCommissions() {
  const state = useStore();
  const { run } = useFeedback();
  const precinct = activePrecinct(state);
  const [editing, setEditing] = useState(false);
  const initialMembers = () => {
    const saved = membersFor(state);
    return [
      ...requiredMembers().filter((required) => !saved.some((m) => m.id === required.id)),
      ...saved,
    ];
  };
  const [members, setMembers] = useState(initialMembers);
  const update = (id: string, field: keyof Member, value: string) =>
    setMembers((rows) => rows.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  const remove = (id: string) => setMembers((rows) => rows.filter((member) => member.id !== id));
  return {
    state,
    run,
    precinct,
    editing,
    setEditing,
    initialMembers,
    members,
    setMembers,
    update,
    remove,
  };
}
