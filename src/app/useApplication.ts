import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Platform, ScrollView, useWindowDimensions } from 'react-native';
import { manifest } from '../content';
import { acts } from '../content/acts';
import { activeElection, countFor, hasSelectedContext, inContext, localDate } from '../data/model';
import { actions, useStore } from '../data/store';
import type { TabId } from '../navigation/tabs';
export function useApplication() {
  const state = useStore();
  const contextReady = hasSelectedContext(state);
  const [linkedNorm, setLinkedNorm] = useState<string>();
  useEffect(() => {
    const open = (value: string | null) => {
      if (!value) return;
      try {
        const url = new URL(value);
        const id =
          url.searchParams.get('norm') || (url.hostname === 'norm' ? url.pathname.slice(1) : '');
        if (acts.some((a) => id.startsWith(a.id + '/'))) setLinkedNorm(id);
      } catch {}
    };
    void Linking.getInitialURL().then(open);
    const listener = Linking.addEventListener('url', (event) => open(event.url));
    return () => listener.remove();
  }, []);
  const { width } = useWindowDimensions();
  const desktop = width >= 1000;
  const [tab, setTab] = useState<TabId>('info');
  const [turnout, setTurnout] = useState(false);
  const [profile, setProfile] = useState(!contextReady);
  const [toast, setToast] = useState('');
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [clock, setClock] = useState(new Date());
  const scroll = useRef<ScrollView>(null);
  const notify = useCallback((text: string) => {
    setToast(text);
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setToast(''), 4500);
  }, []);
  const run = useCallback(
    (fn: () => void, success?: string) => {
      try {
        fn();
        if (success) notify(success);
        return true;
      } catch (error) {
        console.error('Не удалось выполнить действие приложения:', error);
        notify('Не удалось сохранить действие. Проверьте свободное место и доступ к хранилищу.');
        return false;
      }
    },
    [notify],
  );
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 30000);
    return () => {
      clearInterval(timer);
      clearTimeout(timeout.current);
    };
  }, []);
  const navigate = (id: TabId) => {
    setTab(id);
    scroll.current?.scrollTo({ y: 0, animated: false });
  };
  const date = localDate(clock);
  const count = contextReady ? countFor(state) : 0;
  const due =
    contextReady && activeElection(state).dates.includes(date)
      ? manifest.reconciliationTimes
          .filter((t) => t <= clock.toTimeString().slice(0, 5))
          .find(
            (t) =>
              !state.reconciliations.some(
                (r) => r.date === date && r.slot === t && inContext(state, r),
              ),
          )
      : undefined;
  const increment = () => {
    if (!contextReady) {
      setProfile(true);
      return;
    }
    if (run(actions.increment) && Platform.OS !== 'web')
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };
  useEffect(() => {
    if (
      Platform.OS !== 'web' ||
      !contextReady ||
      typeof Notification === 'undefined' ||
      Notification.permission !== 'granted'
    )
      return;
    const slot = clock.toTimeString().slice(0, 5);
    if (!activeElection(state).dates.includes(date) || !manifest.reconciliationTimes.includes(slot))
      return;
    if (
      state.reconciliations.some((r) => inContext(state, r) && r.date === date && r.slot === slot)
    )
      return;
    const key = ['turnout-reminder', state.electionId, state.precinctId, date, slot].join(':');
    try {
      if (localStorage.getItem(key)) return;
      const reminder = new Notification('Сверка явки · ' + slot, {
        body: 'Запишите показания комиссии и сравните со своим подсчётом.',
        tag: key,
      });
      localStorage.setItem(key, 'sent');
      reminder.onclick = () => {
        window.focus();
        setTurnout(true);
        reminder.close();
      };
    } catch {
      /* In-app reminders remain available when browser notifications fail. */
    }
  }, [clock, contextReady, date, state]);
  return {
    state,
    contextReady,
    linkedNorm,
    setLinkedNorm,
    width,
    desktop,
    tab,
    turnout,
    setTurnout,
    profile,
    setProfile,
    toast,
    scroll,
    run,
    notify,
    navigate,
    count,
    due,
    increment,
  };
}
