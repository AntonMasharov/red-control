import { StatusBar } from 'expo-status-bar';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import appConfig from '../../app.json';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { acts } from '../content/acts';
import { storageFailure } from '../data/store';
import { NavButton } from '../navigation/NavButton';
import { tabs } from '../navigation/tabs';
import { ActSheet } from '../screens/Acts';
import { Complaints } from '../screens/Complaints';
import { Contacts } from '../screens/Contacts';
import { Information } from '../screens/Information';
import { Profile } from '../screens/Profile';
import { Roadmap } from '../screens/Roadmap';
import { Turnout } from '../screens/Turnout';
import { ActiveContextHeader } from '../ui/ActiveContextHeader';
import { Button, Icon, Notice, SheetHost } from '../ui/components';
import { FeedbackContext } from '../ui/feedback';
import { colors as c, s } from '../ui/theme';
import { BottomNavigation } from './BottomNavigation';
import { styles } from './styles';
import { useApplication } from './useApplication';

function Brand() {
  return (
    <View style={styles.brand}>
      <View style={styles.brandMark}>
        <Icon name="check" color={c.white} size={19} />
      </View>
      <View>
        <Text style={styles.brandText}>КРАСНЫЙ</Text>
        <Text style={styles.brandText}>КОНТРОЛЬ</Text>
      </View>
    </View>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <Application />
    </SafeAreaProvider>
  );
}
function Application() {
  const controller = useApplication();
  const {
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
  } = controller;
  if (storageFailure())
    return (
      <SafeAreaView style={localStyles.storageError}>
        <Text style={s.title}>Хранилище недоступно</Text>
        <Text style={s.subtitle}>{storageFailure()}</Text>
      </SafeAreaView>
    );
  return (
    <FeedbackContext.Provider value={{ run, notify, message: toast }}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.root}>
        <StatusBar style="dark" />
        <View style={styles.shell}>
          {desktop && (
            <View style={styles.sidebar}>
              <Brand />
              <Text style={[s.eyebrow, localStyles.sidebarLabel]}>ПРИЛОЖЕНИЕ НАБЛЮДАТЕЛЯ</Text>
              {tabs.map((item) => (
                <NavButton
                  key={item.id}
                  item={item}
                  compact={false}
                  tab={tab}
                  navigate={navigate}
                />
              ))}
              <View style={localStyles.sidebarSpacer} />
              <View style={localStyles.offlineDetails}>
                <View style={s.row}>
                  <View style={styles.dot} />
                  <Text style={s.small}>
                    {Platform.OS === 'web' ? 'Записи на этом устройстве' : 'Автономный режим'}
                  </Text>
                </View>
                <Text style={[s.small, localStyles.offlineDescription]}>
                  {Platform.OS === 'web'
                    ? 'Для загрузки сайта требуется сеть.'
                    : 'Материалы и ваши записи\nвсегда под рукой.'}
                </Text>
                <Text style={[s.small, localStyles.versionLabel]}>
                  ВЕРСИЯ · {appConfig.expo.version}
                </Text>
              </View>
            </View>
          )}
          <View style={styles.main}>
            <View style={styles.header}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={contextReady ? 'Мой участок' : 'Выбрать выборы и УИК'}
                onPress={() => setProfile(true)}
                style={({ pressed }) => [styles.profile, pressed && { opacity: 0.65 }]}
              >
                <ActiveContextHeader />
                <View style={styles.contextChevron}>
                  <Icon name="chevron-down" size={18} color={c.muted} />
                </View>
              </Pressable>
            </View>
            <ScrollView
              ref={scroll}
              keyboardShouldPersistTaps="handled"
              style={localStyles.scrollArea}
              contentContainerStyle={[styles.scroll, { paddingHorizontal: width < 400 ? 20 : 30 }]}
            >
              <View style={styles.page}>
                <View style={{ display: tab === 'info' ? 'flex' : 'none' }}>
                  <Information />
                </View>
                {!contextReady && tab !== 'info' && (
                  <Button title="Выбрать выборы и УИК" onPress={() => setProfile(true)} />
                )}
                <View style={{ display: contextReady && tab === 'roadmap' ? 'flex' : 'none' }}>
                  {contextReady && <Roadmap key={state.electionId + state.precinctId} />}
                </View>
                <View style={{ display: contextReady && tab === 'complaints' ? 'flex' : 'none' }}>
                  {contextReady && <Complaints key={state.electionId + state.precinctId} />}
                </View>
                <View style={{ display: contextReady && tab === 'contacts' ? 'flex' : 'none' }}>
                  {contextReady && <Contacts />}
                </View>
                {due && (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => (contextReady ? setTurnout(true) : setProfile(true))}
                    style={localStyles.reconciliationNotice}
                  >
                    <Notice>
                      Пора сверить явку за {due}. Нажмите, чтобы внести данные комиссии.
                    </Notice>
                  </Pressable>
                )}
                <Text style={[s.small, localStyles.appSignature]}>
                  КРАСНЫЙ КОНТРОЛЬ / ПРИЛОЖЕНИЕ НАБЛЮДАТЕЛЯ
                </Text>
              </View>
            </ScrollView>
            <BottomNavigation controller={controller} />
          </View>
        </View>
        {!!toast && (
          <View pointerEvents="none" style={styles.toast}>
            <Text accessibilityLiveRegion="polite" style={localStyles.toastText}>
              {toast}
            </Text>
          </View>
        )}
        {turnout && <Turnout onClose={() => setTurnout(false)} />}
        {profile && <Profile onClose={() => setProfile(false)} />}
        {linkedNorm && (
          <ActSheet
            act={acts.find((a) => linkedNorm.startsWith(a.id + '/'))!}
            initialNormId={linkedNorm}
            onClose={() => setLinkedNorm(undefined)}
          />
        )}
        <SheetHost openTurnout={() => (contextReady ? setTurnout(true) : setProfile(true))} />
      </SafeAreaView>
    </FeedbackContext.Provider>
  );
}

const localStyles = StyleSheet.create({
  storageError: { flex: 1, backgroundColor: c.white, justifyContent: 'center', padding: 30 },
  sidebarLabel: { color: '#A1A6AD', marginTop: 42, marginBottom: 16 },
  sidebarSpacer: { flex: 1 },
  offlineDetails: { gap: 12, paddingBottom: 18 },
  offlineDescription: { fontSize: 11 },
  versionLabel: { marginTop: 14, fontSize: 10 },
  scrollArea: { flex: 1 },
  reconciliationNotice: { marginTop: 24 },
  appSignature: { marginTop: 32, fontSize: 11, color: '#A0A5AE' },
  toastText: { color: c.white, fontSize: 13, textAlign: 'center' },
});
