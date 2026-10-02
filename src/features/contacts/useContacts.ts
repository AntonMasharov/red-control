import { normalizePhone } from '../../data/phone';
import { useState } from 'react';
import { contactsFor } from '../../data/model';
import { actions, useStore } from '../../data/store';
import { useFeedback } from '../../ui/feedback';

export function useContacts() {
  const state = useStore();
  const { run, notify } = useFeedback();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string>();
  const [deletingId, setDeletingId] = useState<string>();
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState('');
  const contacts = contactsFor(state);
  const save = () => {
    if (!/^\+?[\d\s().-]+$/.test(phone.trim()) || phone.replace(/\D/g, '').length < 3) {
      notify('Введите корректный номер телефона.');
      return;
    }
    if (
      run(
        () =>
          editingId
            ? actions.editContact(editingId, name, role, normalizePhone(phone))
            : actions.addContact(name, role, normalizePhone(phone)),
        'Контакт сохранён',
      )
    ) {
      setAdding(false);
      setName('');
      setRole('');
      setPhone('');
    }
  };
  const remove = () => {
    if (deletingId && run(() => actions.deleteContact(deletingId), 'Контакт удалён'))
      setDeletingId(undefined);
  };
  return {
    save,
    remove,
    state,
    run,
    notify,
    adding,
    setAdding,
    editingId,
    setEditingId,
    deletingId,
    setDeletingId,
    name,
    setName,
    role,
    setRole,
    phone,
    setPhone,
    contacts,
  };
}
