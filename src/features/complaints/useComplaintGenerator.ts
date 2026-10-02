import { useState } from 'react';
import { campaignContent, catalog } from '../../content/catalog';
import { exportText } from '../../data/export';
import { activePrecinct, inContext, type Complaint } from '../../data/model';
import { actions, useStore } from '../../data/store';
import { useFeedback } from '../../ui/feedback';
import { complaintVariables, generateComplaint } from './engine';

export function useComplaintGenerator() {
  const state = useStore();
  const { run, notify } = useFeedback();
  const key = JSON.stringify([state.electionId, state.precinctId]);
  const composer: import('../../data/model').ComplaintComposer = state.complaintComposers?.[
    key
  ] ?? {
    selected: [],
    facts: '',
    name: state.profile.name,
    text: '',
    recipient: activePrecinct(state).number ? 'УИК № ' + activePrecinct(state).number : '',
  };
  const { selected, facts, name, recipient, text } = composer;
  const update = (patch: Partial<typeof composer>) =>
    run(() => actions.saveComplaintComposer({ ...composer, ...patch }));
  const setFacts = (facts: string) => update({ facts });
  const setName = (name: string) => update({ name });
  const setRecipient = (recipient: string) => update({ recipient });
  const setText = (text: string) => update({ text });
  const [form, setForm] = useState(false);
  const [draft, setDraft] = useState<Complaint | null>(null);
  const complaints = state.complaints.filter((c) => inContext(state, c));
  const template = campaignContent(state.electionId).complaints[0];
  const options =
    template?.checkbox_items.map((item) => ({
      id: item.id,
      title: item.label,
      description: item.description,
    })) ?? [];
  const variableFields = template
    ? complaintVariables(template, selected).filter(
        (key) => !['recipient', 'observer_name', 'uik_number', 'date'].includes(key),
      )
    : [];
  const variables: Record<string, string> = {
    time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    ...composer.variables,
  };
  const setVariable = (key: string, value: string) =>
    update({ variables: { ...variables, [key]: value } });
  const compose = (ids: string[], complaintFacts = facts) => {
    if (!template) throw new Error('Шаблон жалобы недоступен.');
    if (ids.length !== 1) throw new Error('Откройте одно нарушение из списка.');
    return generateComplaint(template, ids, {
      ...variables,
      recipient: recipient.trim() || 'УИК № ' + (activePrecinct(state).number || '_____'),
      observer_name: name.trim() || '____________________ (ФИО наблюдателя)',
      uik_number: activePrecinct(state).number || '_____',
      date: new Date().toLocaleDateString('ru-RU'),
      facts: complaintFacts,
    }, catalog.laws);
  };
  const openViolation = (id: string) => {
    try {
      const resume = selected.length === 1 && selected[0] === id;
      update({ selected: [id], facts: resume ? facts : '', text: resume && text ? text : compose([id], resume ? facts : '') });
      setForm(true);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Не удалось составить текст.');
    }
  };
  const prepare = () => {
    try {
      setText(compose(selected));
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Не удалось составить текст.');
    }
  };
  const save = () => {
    let saved: Complaint | undefined;
    if (
      run(() => {
        saved = actions.complaint({
          category: selected.map((id) => options.find((c) => c.id === id)?.title).join('; '),
          circumstances: facts,
          text,
        });
      }, 'Черновик сохранён')
    ) {
      setForm(false);
      setDraft(saved!);
    }
  };
  const share = (entry: Complaint) => {
    void exportText(`zayavlenie-${entry.id.slice(0, 8)}.txt`, entry.text).catch(() =>
      notify('Не удалось экспортировать документ.'),
    );
  };
  return {
    variableFields,
    variables,
    setVariable,
    options,
    openViolation,
    state,
    run,
    notify,
    selected,
    form,
    setForm,
    draft,
    setDraft,
    facts,
    setFacts,
    name,
    setName,
    recipient,
    setRecipient,
    text,
    setText,
    complaints,
    prepare,
    save,
    share,
  };
}
