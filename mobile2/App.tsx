import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated } from 'react-native';
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
import Conquistas from './screens/Conquistas';
import TriageModal from './screens/triage/TriageModal';
import { ModeKey } from './utils/levels';
import { SessionRecord, loadSessions, saveSession, getBestByMode } from './utils/storage';
import { UserProfile, defaultUserProfile } from './types/user';
import { loadUserProfile, saveUserProfile } from './utils/userProfile';
import { getAmbition } from './utils/ambition';
import { ACHIEVEMENTS, Achievement, RARITY_CONFIG, RarityKey } from './config/achievements';
import { buildUserStats } from './config/archetypes';

const RARITY_PRIORITY: Record<RarityKey, number> = {
  lendario: 6, epico: 5, raro: 4, dificil: 3, medio: 2, comum: 1,
};

function computeStreakFromSessions(sessions: SessionRecord[]): number {
  if (sessions.length === 0) return 0;
  const DAY = 86_400_000;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let s = 0;
  for (let i = 0; i < sessions.length; i++) {
    const d = new Date(sessions[i].date); d.setHours(0, 0, 0, 0);
    const diff = Math.round((today.getTime() - d.getTime()) / DAY);
    if (diff === s) s++;
    else if (diff > s) break;
  }
  return s;
}

type Tab = 'jogar' | 'historico' | 'ciencia' | 'perfil' | 'conquistas';
type GameScreen =
  | 'home'
  | 'partida'
  | 'alvo'
  | 'sequencia'
  | 'resultado_partida'
  | 'resultado_alvo'
  | 'resultado_sequencia';

const FAB_SIZE      = 70;
const TAB_BAR_HEIGHT = 52;

const LEFT_TABS:  { key: Tab; label: string; icon: string }[] = [
  { key: 'conquistas', label: 'Conquistas', icon: '🏆' },
  { key: 'ciencia',    label: 'Ciência',    icon: '🧠' },
];
const RIGHT_TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'historico', label: 'Histórico', icon: '📈' },
  { key: 'perfil',    label: 'Perfil',    icon: '👤' },
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
  const [triageEditMode, setTriageEditMode] = useState(false);
  const [milestoneBeat, setMilestoneBeat] = useState<string | null>(null);
  const [achievementQueue, setAchievementQueue] = useState<Achievement[]>([]);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const achieveAnim = useRef(new Animated.Value(0)).current;
  const pendingMilestoneRef = useRef<string | null>(null);

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
    if (milestoneBeat !== null) {
      toastAnim.setValue(0);
      Animated.spring(toastAnim, { toValue: 1, tension: 65, friction: 7, useNativeDriver: true }).start();
    }
  }, [milestoneBeat]);

  useEffect(() => {
    if (achievementQueue.length > 0) {
      achieveAnim.setValue(0);
      Animated.spring(achieveAnim, { toValue: 1, tension: 65, friction: 7, useNativeDriver: true }).start();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [achievementQueue[0]?.id]);

  useEffect(() => {
    if (achievementQueue.length === 0 && pendingMilestoneRef.current !== null) {
      const label = pendingMilestoneRef.current;
      pendingMilestoneRef.current = null;
      setMilestoneBeat(label);
    }
  }, [achievementQueue.length]);

  useEffect(() => {
    loadSessions().then(setSessions);
    loadUserProfile().then(setUserProfile);
  }, []);

  const addSession = useCallback(async (session: SessionRecord) => {
    const prevBest = sessions.length > 0 ? Math.min(...sessions.map(s => s.score)) : null;

    // ── Pre-session achievement snapshot ──────────────────────────────────────
    const prevStreak = computeStreakFromSessions(sessions);
    const prevStats = buildUserStats(sessions, prevStreak);
    const prevUnlocked = new Set(ACHIEVEMENTS.filter(a => a.unlocked(prevStats)).map(a => a.id));

    await saveSession(session);
    const updated = await loadSessions();
    setSessions(updated);

    // ── Achievement detection ─────────────────────────────────────────────────
    const updatedStreak = computeStreakFromSessions(updated);
    const updatedStats = buildUserStats(updated, updatedStreak);
    const newlyUnlocked = ACHIEVEMENTS.filter(
      a => !prevUnlocked.has(a.id) && a.unlocked(updatedStats),
    );
    const sortedAchievements = [...newlyUnlocked].sort(
      (a, b) => RARITY_PRIORITY[b.rarity] - RARITY_PRIORITY[a.rarity],
    );

    // ── Milestone beat detection ──────────────────────────────────────────────
    let beatenLabel: string | null = null;
    if (userProfile.triageCompleted && userProfile.ambitionId) {
      const newBest = updated.length > 0 ? Math.min(...updated.map(s => s.score)) : null;
      if (prevBest !== null && newBest !== null && newBest < prevBest) {
        const ambitionData = getAmbition(userProfile.ambitionId);
        if (ambitionData) {
          const beaten = ambitionData.milestones.find(m =>
            m.type !== 'qualitative' &&
            m.ms !== undefined &&
            prevBest > m.ms &&
            newBest <= m.ms,
          );
          if (beaten) beatenLabel = beaten.label;
        }
      }
    }

    // ── Show toasts — achievements first, milestone after ────────────────────
    if (sortedAchievements.length > 0) {
      if (beatenLabel) pendingMilestoneRef.current = beatenLabel;
      setAchievementQueue(sortedAchievements);
    } else if (beatenLabel) {
      setMilestoneBeat(beatenLabel);
    }

    // ── Triage trigger after first session ────────────────────────────────────
    const profile = await loadUserProfile();
    if (
      updated.length === 1 &&
      !profile.triageCompleted &&
      !dismissedThisSession.current &&
      (profile.triageSkipCount ?? 0) < 3
    ) {
      pendingTriage.current = true;
    }
  }, [sessions, userProfile]);

  // Navigate home — intercept to show triage if pending
  const goHome = useCallback(() => {
    setGameScreen('home');
    if (pendingTriage.current) {
      pendingTriage.current = false;
      setTriageVisible(true);
    }
  }, []);

  // Open triage — editMode=true for "trocar meta", false for first-time "Definir Minha Meta"
  const openTriageForEdit = useCallback((editMode: boolean) => {
    setTriageEditMode(editMode);
    setTriageVisible(true);
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
      noGoErrors: summary.noGoErrors,
      noGoAccuracy: summary.noGoAccuracy,
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
    setTriageEditMode(false);
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
    setTriageEditMode(false);
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
            userProfile={userProfile}
            onGoToPerfil={() => handleTabPress('perfil')}
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
        {activeTab === 'jogar'      && renderGame()}
        {activeTab === 'historico'  && <Historico sessions={sessions} userProfile={userProfile} />}
        {activeTab === 'ciencia'    && <Ciencia userProfile={userProfile} sessions={sessions} />}
        {activeTab === 'perfil'     && (
          <Perfil
            sessions={sessions}
            userProfile={userProfile}
            onOpenTriage={openTriageForEdit}
            onGoToConquistas={() => handleTabPress('conquistas')}
            onUpdateProfile={setUserProfile}
          />
        )}
        {activeTab === 'conquistas' && (
          <Conquistas sessions={sessions} userProfile={userProfile} />
        )}
      </View>

      {/* Tab bar — hidden during active game */}
      {!inGame && (
        <>
          <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 4) }]}>
            {LEFT_TABS.map(t => {
              const active = activeTab === t.key;
              return (
                <TouchableOpacity
                  key={t.key}
                  style={styles.tabBtn}
                  onPress={() => handleTabPress(t.key)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.tabItemCard, active && styles.tabItemCardActive]}>
                    <Text style={styles.tabIcon}>{t.icon}</Text>
                    <Text style={[styles.tabLabel, active && styles.tabLabelActive]} numberOfLines={1}>{t.label}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Spacer — keeps 5-column layout while FAB floats above */}
            <View style={styles.fabSpacer} />

            {RIGHT_TABS.map(t => {
              const active = activeTab === t.key;
              return (
                <TouchableOpacity
                  key={t.key}
                  style={styles.tabBtn}
                  onPress={() => handleTabPress(t.key)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.tabItemCard, active && styles.tabItemCardActive]}>
                    <Text style={styles.tabIcon}>{t.icon}</Text>
                    <Text style={[styles.tabLabel, active && styles.tabLabelActive]} numberOfLines={1}>{t.label}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* FAB — position absolute sibling of tabBar, no overflow dependency */}
          <View
            style={[styles.fabContainer, { bottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 4) - FAB_SIZE / 2 }]}
            pointerEvents="box-none"
          >
            <TouchableOpacity
              style={styles.fab}
              onPress={() => handleTabPress('jogar')}
              activeOpacity={0.85}
            >
              <Text style={styles.fabIcon}>⚡</Text>
            </TouchableOpacity>
          </View>
        </>
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
          editMode={triageEditMode}
        />
      </Modal>

      {/* Achievement unlocked toast */}
      <Modal
        visible={achievementQueue.length > 0}
        transparent
        animationType="fade"
        onRequestClose={() => setAchievementQueue(prev => prev.slice(1))}
      >
        <TouchableOpacity
          style={styles.toastOverlay}
          onPress={() => setAchievementQueue(prev => prev.slice(1))}
          activeOpacity={1}
        >
          {achievementQueue[0] && (() => {
            const a = achievementQueue[0];
            const rcfg = RARITY_CONFIG[a.rarity];
            return (
              <Animated.View style={[styles.toastCard, { borderColor: rcfg.cor + '66', transform: [{ scale: achieveAnim }], opacity: achieveAnim }]}>
                <Text style={[styles.achieveToastKicker, { color: rcfg.cor }]}>CONQUISTA DESBLOQUEADA!</Text>
                <View style={[styles.achieveToastBadge, { backgroundColor: rcfg.cor + '22', borderColor: rcfg.cor }]}>
                  <Text style={[styles.achieveToastBadgeText, { color: rcfg.cor }]}>{rcfg.label}</Text>
                </View>
                <Text style={styles.toastEmoji}>{a.icon}</Text>
                <Text style={[styles.toastTitle, { color: '#fff' }]}>{a.name}</Text>
                <Text style={styles.achieveToastDesc}>{a.description}</Text>
                <Text style={styles.toastSub}>Toque para continuar</Text>
              </Animated.View>
            );
          })()}
        </TouchableOpacity>
      </Modal>

      {/* Milestone beat toast */}
      <Modal
        visible={milestoneBeat !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setMilestoneBeat(null)}
      >
        <TouchableOpacity
          style={styles.toastOverlay}
          onPress={() => setMilestoneBeat(null)}
          activeOpacity={1}
        >
          <Animated.View style={[styles.toastCard, { transform: [{ scale: toastAnim }], opacity: toastAnim }]}>
            <Text style={styles.toastEmoji}>🏆</Text>
            <Text style={styles.toastTitle}>MARCO BATIDO!</Text>
            <Text style={styles.toastLabel}>{milestoneBeat}</Text>
            <Text style={styles.toastSub}>Toque para continuar</Text>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b1220' },
  content: { flex: 1 },
  contentFullscreen: { flex: 1 },

  // ── FAB tab bar ──────────────────────────────────────────────────────────────
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d1525',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 6,
  },
  fabSpacer: { flex: 1 },
  tabBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 2 },
  tabItemCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    width: 72,
    height: 54,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tabItemCardActive: {
    backgroundColor: 'rgba(59,130,246,0.15)',
    borderColor: 'rgba(59,130,246,0.3)',
  },
  tabIcon: { fontSize: 26 },
  tabLabel: { fontSize: 10, fontWeight: '600', color: '#4a5a7b', letterSpacing: 0.5 },
  tabLabelActive: { color: '#3b82f6' },
  fabContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5b4fcf',
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.3)',
    elevation: 0,
    shadowColor: 'transparent',
  },
  fabIcon: {
    fontSize: 32,
    color: '#fff',
  },

  // ── Milestone toast ──────────────────────────────────────────────────────────
  toastOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center', justifyContent: 'center',
    padding: 32,
  },
  toastCard: {
    backgroundColor: '#111a2e', borderRadius: 20, borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.4)',
    padding: 32, alignItems: 'center', gap: 8, width: '100%',
  },
  toastEmoji: { fontSize: 52 },
  toastTitle: {
    fontSize: 18, fontWeight: '900', color: '#f59e0b',
    letterSpacing: 2, marginTop: 4,
  },
  toastLabel: {
    fontSize: 15, fontWeight: '600', color: '#fff',
    textAlign: 'center', lineHeight: 22,
  },
  toastSub: { fontSize: 11, color: '#3a4a6b', marginTop: 8, letterSpacing: 1 },

  // ── Achievement toast ────────────────────────────────────────────────────────
  achieveToastKicker: {
    fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 4,
  },
  achieveToastBadge: {
    borderWidth: 1, borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 4, marginBottom: 4,
  },
  achieveToastBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  achieveToastDesc: {
    fontSize: 13, color: '#7a8aa0', textAlign: 'center', lineHeight: 19,
  },
});
