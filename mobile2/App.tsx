import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import Home from './screens/Home';
import ModoPartida from './screens/ModoPartida';
import ModoAlvo, { RoundResult } from './screens/ModoAlvo';
import ModoSequencia, { SeqSummary } from './screens/ModoSequencia';
import Resultado from './screens/Resultado';
import Ciencia from './screens/Ciencia';
import Perfil from './screens/Perfil';
import Historico from './screens/Historico';
import TriageModal from './screens/triage/TriageModal';
import { ModeKey } from './utils/levels';
import { SessionRecord, loadSessions, saveSession, getBestByMode } from './utils/storage';
import { UserProfile, defaultUserProfile } from './types/user';
import { loadUserProfile, saveUserProfile } from './utils/userProfile';

type Tab = 'jogar' | 'historico' | 'ciencia' | 'perfil';
type GameScreen =
  | 'home'
  | 'partida'
  | 'alvo'
  | 'sequencia'
  | 'resultado_partida'
  | 'resultado_alvo'
  | 'resultado_sequencia';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'jogar',    label: 'Jogar',    icon: '⚡' },
  { key: 'historico',label: 'Histórico',icon: '📈' },
  { key: 'ciencia',  label: 'Ciência',  icon: '🧠' },
  { key: 'perfil',   label: 'Perfil',   icon: '👤' },
];

export default function App() {
  return (
    <SafeAreaProvider>
      <AppInner />
    </SafeAreaProvider>
  );
}

function AppInner() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('jogar');
  const [gameScreen, setGameScreen] = useState<GameScreen>('home');
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(defaultUserProfile());
  const [triageVisible, setTriageVisible] = useState(false);

  // Partida state
  const [partidaTimes, setPartidaTimes] = useState<number[]>([]);
  // Alvo state
  const [alvoResults, setAlvoResults] = useState<RoundResult[]>([]);
  const [alvoScore, setAlvoScore] = useState(0);
  // Sequencia state
  const [seqSummary, setSeqSummary] = useState<SeqSummary | null>(null);

  // Set after first session so the next "go home" triggers triage
  const pendingTriage = useRef(false);
  // Prevent re-offering triage if dismissed in this app session
  const dismissedThisSession = useRef(false);

  useEffect(() => {
    loadSessions().then(setSessions);
    loadUserProfile().then(setUserProfile);
  }, []);

  const addSession = useCallback(async (session: SessionRecord) => {
    await saveSession(session);
    const updated = await loadSessions();
    setSessions(updated);

    // Trigger triage after the very first session (if not done / not skipped too many times)
    const profile = await loadUserProfile();
    if (
      updated.length === 1 &&
      !profile.triageCompleted &&
      !dismissedThisSession.current &&
      (profile.triageSkipCount ?? 0) < 3
    ) {
      pendingTriage.current = true;
    }
  }, []);

  // Navigate home — intercept to show triage if pending
  const goHome = useCallback(() => {
    setGameScreen('home');
    if (pendingTriage.current) {
      pendingTriage.current = false;
      setTriageVisible(true);
    }
  }, []);

  const bestByMode = getBestByMode(sessions);

  // ── Game handlers ───────────────────────────────────────────────────────────

  const handlePartidaComplete = useCallback(async (times: number[]) => {
    setPartidaTimes(times);
    const sorted = [...times].sort((a, b) => a - b);
    const score = Math.round(sorted.slice(0, 5).reduce((s, x) => s + x, 0) / 5);
    const bestTime = sorted[0];
    await addSession({
      id: Date.now().toString(),
      mode: 'partida',
      score,
      bestTime,
      rounds: times.length,
      times,
      date: Date.now(),
    });
    setGameScreen('resultado_partida');
  }, [addSession]);

  const handleAlvoComplete = useCallback(async (results: RoundResult[], score: number) => {
    setAlvoResults(results);
    setAlvoScore(score);
    const bestTime = Math.min(...results.map(r => r.rt));
    const accuracy = results.filter(r => r.correct).length / results.length;
    await addSession({
      id: Date.now().toString(),
      mode: 'alvo',
      score,
      bestTime,
      accuracy,
      rounds: results.length,
      times: results.map(r => r.penalizedRt),
      date: Date.now(),
    });
    setGameScreen('resultado_alvo');
  }, [addSession]);

  const handleSeqComplete = useCallback(async (summary: SeqSummary) => {
    setSeqSummary(summary);
    await addSession({
      id: Date.now().toString(),
      mode: 'sequencia',
      score: summary.score,
      bestTime: Math.min(...summary.trials.filter(t => t.rt !== null).map(t => t.rt!), 999),
      accuracy: summary.accuracy,
      fatigueIndex: summary.fatigueIndex,
      rounds: summary.trials.length,
      times: summary.trials.map(t => t.rt ?? 0),
      date: Date.now(),
    });
    setGameScreen('resultado_sequencia');
  }, [addSession]);

  // ── Tab switching ────────────────────────────────────────────────────────────

  const handleTabPress = useCallback((tab: Tab) => {
    setActiveTab(tab);
    if (tab === 'jogar') setGameScreen('home');
  }, []);

  // ── Triage handlers ─────────────────────────────────────────────────────────

  const handleTriageComplete = useCallback(async (updated: UserProfile) => {
    setUserProfile(updated);
    setTriageVisible(false);
  }, []);

  const handleTriageDismiss = useCallback(async () => {
    dismissedThisSession.current = true;
    const updated: UserProfile = {
      ...userProfile,
      triageSkipCount: (userProfile.triageSkipCount ?? 0) + 1,
    };
    await saveUserProfile(updated);
    setUserProfile(updated);
    setTriageVisible(false);
  }, [userProfile]);

  // ── Render game screen ──────────────────────────────────────────────────────

  const renderGame = () => {
    switch (gameScreen) {
      case 'home':
        return (
          <Home
            onStartPartida={() => setGameScreen('partida')}
            onStartAlvo={() => setGameScreen('alvo')}
            onStartSequencia={() => setGameScreen('sequencia')}
            sessions={sessions}
            bestByMode={bestByMode}
          />
        );
      case 'partida':
        return (
          <ModoPartida
            onComplete={handlePartidaComplete}
            onBack={() => setGameScreen('home')}
          />
        );
      case 'alvo':
        return (
          <ModoAlvo
            onComplete={handleAlvoComplete}
            onBack={() => setGameScreen('home')}
          />
        );
      case 'sequencia':
        return (
          <ModoSequencia
            onComplete={handleSeqComplete}
            onBack={() => setGameScreen('home')}
          />
        );
      case 'resultado_partida':
        return (
          <Resultado
            mode="partida"
            times={partidaTimes}
            onPlayAgain={() => setGameScreen('partida')}
            onHome={goHome}
          />
        );
      case 'resultado_alvo':
        return (
          <Resultado
            mode="alvo"
            alvoResults={alvoResults}
            alvoScore={alvoScore}
            onPlayAgain={() => setGameScreen('alvo')}
            onHome={goHome}
          />
        );
      case 'resultado_sequencia':
        return seqSummary ? (
          <Resultado
            mode="sequencia"
            seqSummary={seqSummary}
            onPlayAgain={() => setGameScreen('sequencia')}
            onHome={goHome}
          />
        ) : null;
    }
  };

  const inGame = gameScreen !== 'home' && gameScreen !== 'resultado_partida'
    && gameScreen !== 'resultado_alvo' && gameScreen !== 'resultado_sequencia';

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Screen content */}
      <View style={[styles.content, inGame && styles.contentFullscreen]}>
        {activeTab === 'jogar'    && renderGame()}
        {activeTab === 'historico'&& <Historico sessions={sessions} />}
        {activeTab === 'ciencia'  && <Ciencia />}
        {activeTab === 'perfil'   && <Perfil sessions={sessions} />}
      </View>

      {/* Tab bar — hidden during active game */}
      {!inGame && (
        <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 4) }]}>
          {TABS.map(t => {
            const active = activeTab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={styles.tabBtn}
                onPress={() => handleTabPress(t.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabIcon, active && styles.tabIconActive]}>{t.icon}</Text>
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t.label}</Text>
                {active && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Triage modal — fullscreen, covers tab bar */}
      <Modal
        visible={triageVisible}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={handleTriageDismiss}
      >
        <TriageModal
          userProfile={userProfile}
          onComplete={handleTriageComplete}
          onDismiss={handleTriageDismiss}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b1220' },
  content: { flex: 1 },
  contentFullscreen: { flex: 1 },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0d1525',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 4,
  },
  tabBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, paddingVertical: 8 },
  tabIcon: { fontSize: 20 },
  tabIconActive: {},
  tabLabel: { fontSize: 10, fontWeight: '600', color: '#3a4a6b', letterSpacing: 0.5 },
  tabLabelActive: { color: '#fff' },
  tabIndicator: {
    position: 'absolute', top: 0,
    width: 24, height: 2,
    backgroundColor: '#3b82f6', borderRadius: 1,
  },
});
