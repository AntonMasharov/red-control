import { useState } from 'react';
import { campaignContent, catalog } from '../../content/catalog';
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
  const [draftEntry, setDraft] = useState<Complaint | null>(null);
  const draft = draftEntry
    ? (state.complaints.find((c) => c.id === draftEntry.id) ?? draftEntry)
    : null;
  const markSubmitted = (entry: Complaint, submitted = true) =>
    run(() => actions.setComplaintSubmitted(entry.id, submitted));
  const complaints = state.complaints.filter((c) => inContext(state, c));
  const templates = campaignContent(state.electionId).complaints;
  const template = templates.find((t) => t.checkbox_items.some((i) => i.id === selected[0]));
  const options =
    templates
      .flatMap((t) => t.checkbox_items)
      .map((item) => ({
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
    const template = templates.find((t) => t.checkbox_items.some((i) => i.id === ids[0]));
    if (!template) throw new Error('Шаблон жалобы недоступен.');
    if (ids.length !== 1) throw new Error('Откройте одно нарушение из списка.');
    return generateComplaint(
      template,
      ids,
      {
        ...variables,
        recipient: recipient.trim() || 'УИК № ' + (activePrecinct(state).number || '_____'),
        observer_name: name.trim() || '____________________ (ФИО наблюдателя)',
        uik_number: activePrecinct(state).number || '_____',
        date: new Date().toLocaleDateString('ru-RU'),
        facts: complaintFacts,
      },
      catalog.laws,
    );
  };
  const openViolation = (id: string) => {
    try {
      const resume = selected.length === 1 && selected[0] === id;
      update({
        selected: [id],
        facts: resume ? facts : '',
        text: resume && text ? text : compose([id], resume ? facts : ''),
      });
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
  const save = (submitted = false) => {
    let saved: Complaint | undefined;
    if (
      run(
        () => {
          saved = actions.complaint({
            category: selected.map((id) => options.find((c) => c.id === id)?.title).join('; '),
            submittedAt: submitted ? new Date().toISOString() : undefined,
            circumstances: facts,
            text,
          });
        },
        submitted ? 'Отмечено как поданное' : 'Черновик сохранён',
      )
    ) {
      setForm(false);
      setDraft(saved!);
    }
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
    markSubmitted,
  };
}
