import './i18n';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SvgXml } from 'react-native-svg';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import Home from './screens/Home';
import Splash from './screens/Splash';
import ModoPartida from './screens/ModoPartida';
import ModoAlvo, { RoundResult } from './screens/ModoAlvo';
import ModoRadar, { RoundResult as RadarRound } from './screens/ModoRadar';
import ModoSequencia, { SeqSummary } from './screens/ModoSequencia';
import Resultado from './screens/Resultado';
import Perfil from './screens/Perfil';
import Missoes from './screens/Missoes';
import GlobalScreen from './screens/GlobalScreen';
import ArchetypeEvolution from './screens/ArchetypeEvolution';
import TriageModal from './screens/triage/TriageModal';
import OnboardingFlow from './screens/onboarding/OnboardingFlow';
import AuthScreen from './screens/Auth';
import { supabase } from './lib/supabase';
import { syncSessionToSupabase } from './utils/syncSession';
import { migrateLocalSessions } from './utils/migrateLocalSessions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { useFonts } from 'expo-font';
import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans';
import { SpaceMono_400Regular } from '@expo-google-fonts/space-mono';
import { ModeKey, MODE_COLORS } from './utils/levels';
import {
  SessionRecord, loadSessions, saveSession, getBestByMode, loadOnboardingDone,
  loadHasPlayedFirstGame, saveHasPlayedFirstGame,
  loadHasSeenTriagePrompt, saveHasSeenTriagePrompt,
  clearUserData,
  computeModeUnlocks, loadModeUnlocks, persistModeUnlocks, previousModeInChain,
} from './utils/storage';
import { hapticSuccess } from './utils/haptics';
import {
  EnergyData, loadEnergy, consumeEnergy, addEnergy,
  ensureInstallDate, isInGracePeriod, hasInfiniteEnergy,
} from './utils/energy';
import SemEnergia from './screens/SemEnergia';
import { UserProfile, defaultUserProfile } from './types/user';
import { loadUserProfile, saveUserProfile } from './utils/userProfile';
import { getAmbition } from './utils/ambition';
import { preloadSounds, playSfx } from './utils/sfx';
import { calculateStreak } from './utils/streak';
import { ACHIEVEMENTS, Achievement, RARITY_CONFIG, RarityKey } from './config/achievements';
import { buildUserStats } from './config/archetypes';
import { ICONS, ARCHETYPE_ICONS, RARITY_ICONS_SVG } from './assets/icons';

const RARITY_PRIORITY: Record<RarityKey, number> = {
  lendario: 6, epico: 5, raro: 4, dificil: 3, medio: 2, comum: 1,
};

// Archetype progression order — used to detect a forward evolution (advancement only).
const ARCHETYPE_ORDER = ['EXPLORADOR', 'EM_EVOLUCAO', 'RESISTENTE', 'ATIRADOR', 'VELOCISTA', 'PILOTO'];

type Tab = 'jogar' | 'global' | 'missoes' | 'perfil';
type GameScreen =
  | 'home'
  | 'partida'
  | 'alvo'
  | 'sequencia'
  | 'radar'
  | 'resultado_partida'
  | 'resultado_alvo'
  | 'resultado_sequencia'
  | 'resultado_radar';

// 4-tab navigation — Início (jogar) · Global · Missões · Perfil. FAB removed.
const TABS: { key: Tab; labelKey: string; icon: string }[] = [
  { key: 'jogar',   labelKey: 'nav.home',    icon: ICONS.nav.home },
  { key: 'global',  labelKey: 'nav.global',  icon: ICONS.nav.global },
  { key: 'missoes', labelKey: 'nav.missoes', icon: ICONS.nav.missoes },
  { key: 'perfil',  labelKey: 'nav.perfil',  icon: ICONS.nav.perfil },
];

export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <SafeAreaProvider>
        <RootGate />
      </SafeAreaProvider>
    </I18nextProvider>
  );
}

// Auth gate — plays the splash first, then checks the Supabase session and the
// persisted guest flag. Splash always shows first (new or returning users).
// After splash: no session and not guest → AuthScreen; otherwise → the app.
function RootGate() {
  const [session, setSession] = useState<Session | null>(null);
  const [guest, setGuest] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    BebasNeue_400Regular,
    DMSans_400Regular,
    DMSans_500Medium,
    SpaceMono_400Regular,
  });

  useEffect(() => {
    // Restore persisted session + guest flag on startup, in parallel.
    Promise.all([
      supabase.auth.getSession(),
      AsyncStorage.getItem('reflexo_guest'),
    ]).then(([{ data }, guestFlag]) => {
      setSession(data.session);
      setGuest(guestFlag === 'true');
      setAuthChecked(true);
    }).catch(() => {
      setAuthChecked(true);
    });
    // React to login/logout (and token refresh) for the rest of the app's lifetime.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      // Migração one-shot: envia sessões locais ao Supabase no primeiro login
      if (event === 'SIGNED_IN' && newSession?.user?.id) {
        migrateLocalSessions(newSession.user.id); // sem await — fire-and-forget
      }
      // Logout: zera o estado guest em memória → RootGate volta ao AuthScreen
      if (event === 'SIGNED_OUT') {
        setGuest(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Captura deep links de auth (confirmação de email, reset de senha)
  useEffect(() => {
    const handleUrl = async ({ url }: { url: string }) => {
      if (url.includes('auth-callback')) {
        // Supabase JS v2 com PKCE: troca o code por sessão automaticamente
        // via onAuthStateChange — não é necessário chamar exchangeCodeForSession
        // manualmente quando o cliente Supabase está configurado corretamente.
        // O onAuthStateChange já vai disparar SIGNED_IN quando o token for processado.
        console.log('[DeepLink] auth-callback recebido:', url);
      }
    };

    // Link recebido com app aberto
    const subscription = Linking.addEventListener('url', handleUrl);

    // Link que abriu o app (cold start)
    Linking.getInitialURL().then(url => {
      if (url) handleUrl({ url });
    });

    return () => subscription.remove();
  }, []);

  // Timeout de segurança: libera o splash após 8s mesmo se algo falhar
  useEffect(() => {
    const timer = setTimeout(() => {
      setAuthChecked(true);
      setSplashDone(true);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  // Called by AuthScreen's "Continuar sem conta" (which also persists the flag).
  const handleContinueAsGuest = useCallback(() => setGuest(true), []);

  // 1. Splash always first — stays until its animation ends, the auth/guest check
  //    resolves, AND the custom fonts finish loading, so everything is ready first.
  if (!splashDone || !authChecked || (!fontsLoaded && !fontError)) {
    return (
      <View style={styles.root}>
        <Splash onAnimationComplete={() => setSplashDone(true)} />
      </View>
    );
  }

  // 2/3/4. Splash done and auth known → decide what to show.
  if (session || guest) {
    return <AppInner isGuest={!session} />;
  }
  return <AuthScreen onContinueAsGuest={handleContinueAsGuest} />;
}

function AppInner({ isGuest }: { isGuest: boolean }) {
  // isGuest — true para convidado (sem sessão). Usado pela aba Global para mostrar
  // "Faça login para ver o ranking". Passado pelo RootGate.
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('jogar');
  const [gameScreen, setGameScreen] = useState<GameScreen>('home');
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(defaultUserProfile());
  const [triageVisible, setTriageVisible] = useState(false);
  const [triageEditMode, setTriageEditMode] = useState(false);
  const [milestoneBeat, setMilestoneBeat] = useState<string | null>(null);
  const [achievementQueue, setAchievementQueue] = useState<Achievement[]>([]);
  // Archetype evolution takeover — set to the new archetype id when the user advances
  const [evolutionTo, setEvolutionTo] = useState<string | null>(null);
  // Progressive mode unlock — partida sempre liberado; demais via cadeia
  const [modeUnlocks, setModeUnlocks] = useState<Record<ModeKey, boolean>>({
    partida: true, radar: false, sequencia: false, alvo: false,
  });
  // Fila de modos recém-desbloqueados aguardando toast de feedback
  const [modeUnlockQueue, setModeUnlockQueue] = useState<ModeKey[]>([]);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const achieveAnim = useRef(new Animated.Value(0)).current;
  const unlockAnim = useRef(new Animated.Value(0)).current;
  const pendingMilestoneRef = useRef<string | null>(null);

  // Partida state
  const [partidaTimes, setPartidaTimes] = useState<number[]>([]);
  // Alvo state
  const [alvoResults, setAlvoResults] = useState<RoundResult[]>([]);
  const [alvoScore, setAlvoScore] = useState(0);
  // Sequencia state
  const [seqSummary, setSeqSummary] = useState<SeqSummary | null>(null);
  // Radar state
  const [radarResults, setRadarResults] = useState<RadarRound[]>([]);
  const [radarScore, setRadarScore] = useState(0);

  // ── Sistema de energia ───────────────────────────────────────────────────────
  const [energyData, setEnergyData] = useState<EnergyData | null>(null);
  const [installDate, setInstallDate] = useState<number | null>(null);
  // Qual modo está bloqueado por falta de energia (null = nenhum)
  const [semEnergiaMode, setSemEnergiaMode] = useState<ModeKey | null>(null);

  // Set after first session so the next "go home" triggers triage
  const pendingTriage = useRef(false);
  // Prevent re-offering triage if dismissed in this app session
  const dismissedThisSession = useRef(false);

  // Onboarding — shown once on first app open ever (persisted flag)
  const [onboardingVisible, setOnboardingVisible] = useState(false);
  const onboardingNeededRef = useRef(false);

  // First-game / triage-prompt flow — directs untriaged users to triage after their first game
  const [showTriagePrompt, setShowTriagePrompt] = useState(false);
  const hasPlayedFirstGameRef = useRef(false);
  const hasSeenTriagePromptRef = useRef(false);
  const pendingNavRef = useRef<(() => void) | null>(null);
  const triagePromptAnim = useRef(new Animated.Value(0)).current;

  // Scroll-to-top ref passed to Home so handleTriageComplete can reset scroll
  const homeScrollRef = useRef<ScrollView>(null);

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

  // Mode-unlock toast — deferred behind evolution / achievement / milestone toasts.
  const firstModeUnlock = modeUnlockQueue[0] ?? null;
  const showModeUnlock = firstModeUnlock !== null
    && evolutionTo === null && achievementQueue.length === 0 && milestoneBeat === null;
  useEffect(() => {
    if (showModeUnlock) {
      unlockAnim.setValue(0);
      hapticSuccess();
      Animated.spring(unlockAnim, { toValue: 1, tension: 65, friction: 7, useNativeDriver: true }).start();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModeUnlock, firstModeUnlock]);

  useEffect(() => {
    Promise.all([
      loadSessions().then(async (s) => {
        setSessions(s);
        // Estado de desbloqueio: derivado das sessões (fonte da verdade) ∪ flags persistidos.
        const persisted = await loadModeUnlocks();
        const derived = computeModeUnlocks(s);
        const merged: Record<ModeKey, boolean> = {
          partida: true,
          radar: derived.radar || persisted.radar,
          sequencia: derived.sequencia || persisted.sequencia,
          alvo: derived.alvo || persisted.alvo,
        };
        setModeUnlocks(merged);
        await persistModeUnlocks(merged);
      }),
      loadUserProfile().then(setUserProfile),
      loadOnboardingDone().then(done => { onboardingNeededRef.current = !done; }),
      loadHasPlayedFirstGame().then(v => { hasPlayedFirstGameRef.current = v; }),
      loadHasSeenTriagePrompt().then(v => { hasSeenTriagePromptRef.current = v; }),
      loadEnergy().then(setEnergyData),
      ensureInstallDate().then(setInstallDate),
      preloadSounds(),
    ]).then(() => {
      // If the user already played their first game in a previous session but never
      // saw the triage prompt, offer it now (no pending continuation — pure init case).
      if (hasPlayedFirstGameRef.current && !hasSeenTriagePromptRef.current) {
        pendingNavRef.current = null;
        setShowTriagePrompt(true);
      }
      // Splash now lives in RootGate (shown before AppInner mounts). Trigger the
      // first-open onboarding here, once startup data has finished loading.
      if (onboardingNeededRef.current) setOnboardingVisible(true);
    });
  }, []);

  // Fade+scale entrance animation for the triage prompt card.
  useEffect(() => {
    if (showTriagePrompt) {
      triagePromptAnim.setValue(0);
      Animated.spring(triagePromptAnim, { toValue: 1, tension: 65, friction: 7, useNativeDriver: true }).start();
    }
  }, [showTriagePrompt, triagePromptAnim]);

  const addSession = useCallback(async (session: SessionRecord) => {
    const prevBest = sessions.length > 0 ? Math.min(...sessions.map(s => s.score)) : null;

    // ── Pre-session achievement snapshot ──────────────────────────────────────
    const prevValid = sessions.filter(s => !s.invalidForAchievements);
    const prevStreak = calculateStreak(prevValid).current;
    const prevStats = buildUserStats(prevValid, prevStreak);
    const prevUnlocked = new Set(ACHIEVEMENTS.filter(a => a.unlocked(prevStats)).map(a => a.id));

    await saveSession(session);

    // Sync oportunista com Supabase (só se logado, nunca bloqueia)
    const { data: { session: authSession } } = await supabase.auth.getSession();
    if (authSession?.user?.id) {
      syncSessionToSupabase(session, authSession.user.id);
      // sem await intencional — fire-and-forget
    }

    const updated = await loadSessions();
    setSessions(updated);

    // ── Achievement detection ─────────────────────────────────────────────────
    const updatedValid = updated.filter(s => !s.invalidForAchievements);
    const updatedStreak = calculateStreak(updatedValid).current;
    const updatedStats = buildUserStats(updatedValid, updatedStreak);
    const newlyUnlocked = ACHIEVEMENTS.filter(
      a => !prevUnlocked.has(a.id) && a.unlocked(updatedStats),
    );
    const sortedAchievements = [...newlyUnlocked].sort(
      (a, b) => RARITY_PRIORITY[b.rarity] - RARITY_PRIORITY[a.rarity],
    );

    // ── Archetype evolution detection (advancement only) ──────────────────────
    // prevStats/updatedStats already exclude invalidForAchievements sessions, so a
    // discarded session can't trigger a phantom evolution.
    const prevArchIdx = ARCHETYPE_ORDER.indexOf(prevStats.archetypeId);
    const newArchIdx = ARCHETYPE_ORDER.indexOf(updatedStats.archetypeId);
    const evolved = newArchIdx > prevArchIdx && newArchIdx > 0;
    if (evolved) setEvolutionTo(updatedStats.archetypeId);

    // ── Progressive mode unlock detection ─────────────────────────────────────
    // A mode unlocks when the previous mode in the chain gets its first session.
    const prevUnlocks = computeModeUnlocks(sessions);
    const newUnlocks = computeModeUnlocks(updated);
    const newlyUnlockedModes = (['radar', 'sequencia', 'alvo'] as ModeKey[])
      .filter(m => newUnlocks[m] && !prevUnlocks[m]);
    setModeUnlocks(newUnlocks);
    if (newlyUnlockedModes.length > 0) {
      await persistModeUnlocks(newUnlocks);
      setModeUnlockQueue(q => [...q, ...newlyUnlockedModes]);
    }

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
      playSfx('milestone');
      setAchievementQueue(sortedAchievements);
    } else if (beatenLabel) {
      playSfx('milestone');
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

  // Mark first-game flag once after the user's very first session ever.
  const markFirstGamePlayed = useCallback(async () => {
    if (!hasPlayedFirstGameRef.current) {
      hasPlayedFirstGameRef.current = true;
      await saveHasPlayedFirstGame(true);
    }
  }, []);

  // Returns true and arms the prompt if the user finished their first game and hasn't
  // seen the triage prompt yet. The provided continuation runs when the user picks "Fazer
  // depois". Returns false when no interception is needed and the caller should proceed.
  const checkTriageIntercept = useCallback((continuation: () => void): boolean => {
    if (hasPlayedFirstGameRef.current && !hasSeenTriagePromptRef.current) {
      pendingNavRef.current = continuation;
      setShowTriagePrompt(true);
      return true;
    }
    return false;
  }, []);

  // Navigate home — intercept to show triage if pending
  const goHome = useCallback(() => {
    const doNav = () => {
      setGameScreen('home');
      if (pendingTriage.current) {
        pendingTriage.current = false;
        setTriageVisible(true);
      }
    };
    if (checkTriageIntercept(doNav)) return;
    doNav();
  }, [checkTriageIntercept]);

  // ── Navegar para um modo com verificação de energia ─────────────────────────
  //
  // • Se em período de graça → pode jogar (sem consumir)
  // • Se tem energia → consome 1 e navega
  // • Se sem energia → exibe SemEnergia
  // • Se dados de energia ainda não carregaram → navega direto (fallback seguro)
  //
  const tryStartMode = useCallback(async (mode: ModeKey) => {
    // Modo bloqueado — ignora (a Home já impede o toque, isto é só salvaguarda)
    if (!modeUnlocks[mode]) return;
    // Dados ainda carregando — não acontece em interações normais do usuário
    if (!energyData || installDate === null) {
      setActiveTab('jogar');
      setGameScreen(mode as GameScreen);
      return;
    }

    // Premium → energia infinita; período de graça → grátis. Em ambos não consome.
    const unlimited = hasInfiniteEnergy() || isInGracePeriod(installDate);

    if (unlimited || energyData.counts[mode] > 0) {
      if (!unlimited) {
        const updated = await consumeEnergy(mode, energyData);
        setEnergyData(updated);
      }
      setActiveTab('jogar');
      setGameScreen(mode as GameScreen);
    } else {
      // Sem energia — abre tela de paywall
      setSemEnergiaMode(mode);
    }
  }, [energyData, installDate, modeUnlocks]);

  // Callback da SemEnergia quando o usuário compra energia:
  // 1. energia já foi adicionada dentro de SemEnergia via addEnergy()
  // 2. consome 1 energia para a sessão que vai começar
  // 3. navega para o modo
  const handleEnergyAdded = useCallback(async (updated: EnergyData) => {
    const targetMode = semEnergiaMode;
    if (!targetMode) return;

    const afterConsume = await consumeEnergy(targetMode, updated);
    setEnergyData(afterConsume);
    setSemEnergiaMode(null);
    setActiveTab('jogar');
    setGameScreen(targetMode as GameScreen);
  }, [semEnergiaMode]);

  // Open triage — editMode=true for "trocar meta", false for first-time "Definir Minha Meta"
  const openTriageForEdit = useCallback((editMode: boolean) => {
    setTriageEditMode(editMode);
    setTriageVisible(true);
  }, []);

  const bestByMode = getBestByMode(sessions);

  // ── Game handlers ───────────────────────────────────────────────────────────

  const handlePartidaComplete = useCallback(async (times: number[], falseStartCount: number) => {
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
      falseStartCount,
      ...(falseStartCount >= 3 ? { invalidForAchievements: true } : {}),
    });
    await markFirstGamePlayed();
    setGameScreen('resultado_partida');
  }, [addSession, markFirstGamePlayed]);

  const handleAlvoComplete = useCallback(async (results: RoundResult[], score: number, alvoTimeouts: number) => {
    setAlvoResults(results);
    setAlvoScore(score);
    const hits = results.filter(r => r.correct);
    const bestTime = hits.length > 0 ? Math.min(...hits.map(r => r.rt)) : score;
    const accuracy = hits.length / results.length;
    await addSession({
      id: Date.now().toString(),
      mode: 'alvo',
      score,
      bestTime,
      accuracy,
      rounds: results.length,
      times: results.map(r => r.penalizedRt),
      date: Date.now(),
      ...(alvoTimeouts > 0 ? { timeouts: alvoTimeouts } : {}),
    });
    await markFirstGamePlayed();
    setGameScreen('resultado_alvo');
  }, [addSession, markFirstGamePlayed]);

  const handleSeqComplete = useCallback(async (summary: SeqSummary) => {
    setSeqSummary(summary);
    const earlyTapCount = summary.earlyTapCount ?? 0;
    await addSession({
      id: Date.now().toString(),
      mode: 'sequencia',
      score: summary.score,
      bestTime: Math.min(...summary.trials.filter(t => t.rt !== null).map(t => t.rt!), 999),
      accuracy: summary.accuracy,
      fatigueIndex: summary.fatigueIndex,
      noGoErrors: summary.noGoErrors,
      noGoAccuracy: summary.noGoAccuracy,
      earlyTapCount: earlyTapCount > 0 ? earlyTapCount : undefined,
      rounds: summary.trials.length,
      times: summary.trials.map(t => t.rt ?? 0),
      date: Date.now(),
    });
    await markFirstGamePlayed();
    setGameScreen('resultado_sequencia');
  }, [addSession, markFirstGamePlayed]);

  const handleRadarComplete = useCallback(async (results: RadarRound[], score: number, timeoutCount: number, missCount: number) => {
    // Score chega já com a penalidade relativa (rt + 200 ms para misses) embutida na média.
    setRadarResults(results);
    setRadarScore(score);
    const hits = results.filter(r => r.hit);
    const bestTime = hits.length > 0 ? Math.min(...hits.map(r => r.rt)) : score;
    const accuracy = hits.length / results.length;
    await addSession({
      id: Date.now().toString(),
      mode: 'radar',
      score,
      bestTime,
      accuracy,
      rounds: results.length,
      times: results.map(r => r.rt),
      date: Date.now(),
      ...(timeoutCount > 0 ? { timeouts: timeoutCount } : {}),
      ...(missCount > 0 ? { missCount } : {}),
    });
    await markFirstGamePlayed();
    setGameScreen('resultado_radar');
  }, [addSession, markFirstGamePlayed]);

  // ── Tab switching ────────────────────────────────────────────────────────────

  const handleTabPress = useCallback((tab: Tab) => {
    const isOnResult = gameScreen === 'resultado_partida'
      || gameScreen === 'resultado_alvo'
      || gameScreen === 'resultado_sequencia'
      || gameScreen === 'resultado_radar';
    const doNav = () => {
      setActiveTab(tab);
      if (tab === 'jogar') setGameScreen('home');
    };
    if (isOnResult && checkTriageIntercept(doNav)) return;
    doNav();
  }, [gameScreen, checkTriageIntercept]);

  // ── Triage prompt handlers (shown after first game for untriaged users) ────

  const handleTriagePromptAccept = useCallback(async () => {
    hasSeenTriagePromptRef.current = true;
    await saveHasSeenTriagePrompt(true);
    setShowTriagePrompt(false);
    pendingNavRef.current = null;
    setTriageEditMode(false);
    setTriageVisible(true);
  }, []);

  const handleTriagePromptDefer = useCallback(async () => {
    hasSeenTriagePromptRef.current = true;
    await saveHasSeenTriagePrompt(true);
    setShowTriagePrompt(false);
    const cont = pendingNavRef.current;
    pendingNavRef.current = null;
    if (cont) cont();
  }, []);

  // ── Triage handlers ─────────────────────────────────────────────────────────

  const handleTriageComplete = useCallback(async (updated: UserProfile) => {
    setUserProfile(updated);
    setTriageVisible(false);
    setTriageEditMode(false);
    hasSeenTriagePromptRef.current = true;
    await saveHasSeenTriagePrompt(true);
    setActiveTab('jogar');
    setGameScreen('home');
    homeScrollRef.current?.scrollTo({ y: 0, animated: false });
  }, []);

  const handleClearData = useCallback(async () => {
    // Usa clearUserData (não AsyncStorage.clear) para preservar
    // reflexo_energy_v1 e reflexo_install_date_v1
    await clearUserData();
    setSessions([]);
    setUserProfile(defaultUserProfile());
    setActiveTab('jogar');
    setGameScreen('home');
    setSemEnergiaMode(null);
    setOnboardingVisible(true);
  }, []);

  // Onboarding complete — OnboardingFlow already persisted baseline + goal +
  // triageCompleted and the onboarding-done flag. Adopt the profile and
  // suppress the post-first-game triage prompt (the user just did triage).
  const handleOnboardingComplete = useCallback(async (profile: UserProfile) => {
    setUserProfile(profile);
    hasSeenTriagePromptRef.current = true;
    await saveHasSeenTriagePrompt(true);
    setOnboardingVisible(false);
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

  // Energia disponível por modo (para badges na Home e no mode picker)
  const inGrace = installDate !== null && isInGracePeriod(installDate);
  const energyCounts: Record<ModeKey, number> | null = energyData
    ? energyData.counts
    : null;

  const renderGame = () => {
    // SemEnergia sobrepõe qualquer gameScreen — tem prioridade de render
    if (semEnergiaMode !== null && energyData) {
      return (
        <SemEnergia
          mode={semEnergiaMode}
          energyData={energyData}
          onBack={() => setSemEnergiaMode(null)}
          onEnergyAdded={handleEnergyAdded}
        />
      );
    }

    switch (gameScreen) {
      case 'home':
        return (
          <Home
            onStartPartida={() => tryStartMode('partida')}
            onStartAlvo={() => tryStartMode('alvo')}
            onStartSequencia={() => tryStartMode('sequencia')}
            onStartRadar={() => tryStartMode('radar')}
            sessions={sessions}
            bestByMode={bestByMode}
            userProfile={userProfile}
            onGoToPerfil={() => handleTabPress('perfil')}
            scrollRef={homeScrollRef}
            energyCounts={energyCounts}
            inGrace={inGrace}
            graceExpiryMs={installDate !== null ? installDate + 3 * 24 * 60 * 60 * 1000 : null}
            modeUnlocks={modeUnlocks}
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
      case 'radar':
        return (
          <ModoRadar
            onComplete={handleRadarComplete}
            onBack={() => setGameScreen('home')}
          />
        );
      case 'resultado_partida':
        return (
          <Resultado
            mode="partida"
            times={partidaTimes}
            onPlayAgain={() => tryStartMode('partida')}
            onHome={goHome}
            sessions={sessions}
            userProfile={userProfile}
          />
        );
      case 'resultado_alvo':
        return (
          <Resultado
            mode="alvo"
            alvoResults={alvoResults}
            alvoScore={alvoScore}
            onPlayAgain={() => tryStartMode('alvo')}
            onHome={goHome}
            sessions={sessions}
            userProfile={userProfile}
          />
        );
      case 'resultado_sequencia':
        return seqSummary ? (
          <Resultado
            mode="sequencia"
            seqSummary={seqSummary}
            onPlayAgain={() => tryStartMode('sequencia')}
            onHome={goHome}
            sessions={sessions}
            userProfile={userProfile}
          />
        ) : null;
      case 'resultado_radar':
        return (
          <Resultado
            mode="radar"
            radarResults={radarResults}
            radarScore={radarScore}
            onPlayAgain={() => tryStartMode('radar')}
            onHome={goHome}
            sessions={sessions}
            userProfile={userProfile}
          />
        );
    }
  };

  const inGame = (
    gameScreen !== 'home'
    && gameScreen !== 'resultado_partida'
    && gameScreen !== 'resultado_alvo'
    && gameScreen !== 'resultado_sequencia'
    && gameScreen !== 'resultado_radar'
  ) || semEnergiaMode !== null;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Screen content */}
      <View style={[styles.content, inGame && styles.contentFullscreen]}>
        {activeTab === 'jogar'   && renderGame()}
        {activeTab === 'global'  && <GlobalScreen isGuest={isGuest} />}
        {activeTab === 'missoes' && (
          <Missoes
            sessions={sessions}
            userProfile={userProfile}
            onOpenTriage={openTriageForEdit}
          />
        )}
        {activeTab === 'perfil'  && (
          <Perfil
            sessions={sessions}
            userProfile={userProfile}
            onOpenTriage={openTriageForEdit}
            onUpdateProfile={setUserProfile}
            onClearData={handleClearData}
          />
        )}
      </View>

      {/* Tab bar — 4 tabs, hidden during active game */}
      {!inGame && (
        <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 4) }]}>
          {TABS.map(tab => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tabBtn}
                onPress={() => handleTabPress(tab.key)}
                activeOpacity={0.7}
              >
                <View style={[styles.tabItemCard, active && styles.tabItemCardActive]}>
                  {/* Mesmo tamanho/posição em ambos os estados — apenas a cor muda */}
                  <SvgXml xml={tab.icon.replace(/#FFFFFF/g, active ? '#00E5CC' : '#7a8aa0')} width={24} height={24} />
                  <Text style={[styles.tabLabel, active && styles.tabLabelActive]} numberOfLines={1}>{t(tab.labelKey)}</Text>
                </View>
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
          editMode={triageEditMode}
        />
      </Modal>

      {/* Achievement unlocked toast — deferred while an evolution takeover is showing */}
      <Modal
        visible={achievementQueue.length > 0 && evolutionTo === null}
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
                <View style={styles.achieveToastKickerRow}>
                  {a.secret && <SvgXml xml={RARITY_ICONS_SVG.secretas} width={12} height={12} />}
                  <Text style={[styles.achieveToastKicker, { color: a.secret ? '#f59e0b' : rcfg.cor }]}>
                    {a.secret ? t('achievements.secretRevealed') : t('achievements.achievementUnlocked')}
                  </Text>
                </View>
                <View style={[styles.achieveToastBadge, { backgroundColor: rcfg.cor + '22', borderColor: rcfg.cor }]}>
                  <Text style={[styles.achieveToastBadgeText, { color: rcfg.cor }]}>{t(`achievements.rarity.${a.rarity}` as any)}</Text>
                </View>
                <SvgXml xml={a.icon} width={28} height={28} />
                <Text style={[styles.toastTitle, { color: '#fff' }]}>{a.name}</Text>
                <Text style={styles.achieveToastDesc}>{a.description}</Text>
                <Text style={styles.toastSub}>{t('achievements.tapToContinue')}</Text>
              </Animated.View>
            );
          })()}
        </TouchableOpacity>
      </Modal>

      {/* Onboarding modal — first-open only, persisted via reflexo_onboarding_done_v1 */}
      <Modal
        visible={onboardingVisible}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => { /* must complete via "COMEÇAR" — no back-dismiss */ }}
      >
        <OnboardingFlow onComplete={handleOnboardingComplete} />
      </Modal>

      {/* Triage prompt — first-game intercept, persisted via reflexo_has_seen_triage_prompt_v1 */}
      <Modal
        visible={showTriagePrompt}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleTriagePromptDefer}
      >
        <View style={styles.triagePromptOverlay}>
          <Animated.View
            style={[
              styles.triagePromptCard,
              { opacity: triagePromptAnim, transform: [{ scale: triagePromptAnim }] },
            ]}
          >
            <SvgXml xml={ARCHETYPE_ICONS.VELOCISTA} width={48} height={48} style={{ marginBottom: 12 }} />
            <Text style={styles.triagePromptTitle}>Calibrar seu perfil</Text>
            <Text style={styles.triagePromptSubtitle}>
              A triagem ajusta os benchmarks para o seu nível real. Leva menos de 2 minutos.
            </Text>
            <TouchableOpacity
              style={styles.triagePromptPrimary}
              onPress={handleTriagePromptAccept}
              activeOpacity={0.85}
            >
              <Text style={styles.triagePromptPrimaryText}>Fazer triagem agora</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.triagePromptSecondary}
              onPress={handleTriagePromptDefer}
              activeOpacity={0.7}
            >
              <Text style={styles.triagePromptSecondaryText}>Fazer depois</Text>
            </TouchableOpacity>
            <Text style={styles.triagePromptHint}>
              Você pode acessar a triagem depois em Perfil
            </Text>
          </Animated.View>
        </View>
      </Modal>

      {/* Milestone beat toast — deferred while an evolution takeover is showing */}
      <Modal
        visible={milestoneBeat !== null && evolutionTo === null}
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
            <SvgXml xml={RARITY_ICONS_SVG.desbloqueadas} width={52} height={52} />
            <Text style={styles.toastTitle}>MARCO BATIDO!</Text>
            <Text style={styles.toastLabel}>{milestoneBeat}</Text>
            <Text style={styles.toastSub}>Toque para continuar</Text>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* Mode unlocked toast — fires haptic + brief celebratory card */}
      <Modal
        visible={showModeUnlock}
        transparent
        animationType="fade"
        onRequestClose={() => setModeUnlockQueue(q => q.slice(1))}
      >
        <TouchableOpacity
          style={styles.toastOverlay}
          onPress={() => setModeUnlockQueue(q => q.slice(1))}
          activeOpacity={1}
        >
          {firstModeUnlock && (() => {
            const accent = MODE_COLORS[firstModeUnlock].accent;
            return (
              <Animated.View style={[styles.toastCard, { borderColor: accent + '66', transform: [{ scale: unlockAnim }], opacity: unlockAnim }]}>
                <SvgXml xml={ICONS.modes[firstModeUnlock]} width={48} height={48} />
                <Text style={[styles.toastTitle, { color: accent }]}>{t('home.modeUnlockedTitle')}</Text>
                <Text style={styles.toastLabel}>{t(`modes.${firstModeUnlock}.name`)}</Text>
                <Text style={styles.toastSub}>{t('home.tapToContinue')}</Text>
              </Animated.View>
            );
          })()}
        </TouchableOpacity>
      </Modal>

      {/* Archetype evolution takeover — the most important moment; covers everything */}
      <Modal
        visible={evolutionTo !== null}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setEvolutionTo(null)}
      >
        {evolutionTo !== null && (
          <ArchetypeEvolution toId={evolutionTo} onContinue={() => setEvolutionTo(null)} />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b1220' },
  content: { flex: 1 },
  contentFullscreen: { flex: 1 },

  // ── Tab bar (3 tabs) ─────────────────────────────────────────────────────────
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#0d1525',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 10,
    paddingHorizontal: 8,
  },
  // flex:1 → cada item ocupa fatia igual; minHeight 44 garante área de toque ≥ 44x44pt.
  tabBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 44, paddingVertical: 4, paddingHorizontal: 4 },
  // Container interno com dimensões/padding IDÊNTICOS em todos os estados.
  // Estado inativo = totalmente transparente; só a cor do ícone/label distingue.
  tabItemCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    minWidth: 64,
    height: 60,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: 'transparent',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  // Estado ativo: APENAS cor de fundo/borda mudam — mesmas dimensões e padding.
  tabItemCardActive: {
    backgroundColor: '#00E5CC18',
    borderColor: '#00E5CC55',
  },
  tabLabel: { fontSize: 12, fontWeight: '700', color: '#7a8aa0', letterSpacing: 0.3 },
  tabLabelActive: { color: '#00E5CC' },

  // ── Triage prompt (first-game intercept) ─────────────────────────────────────
  triagePromptOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center', justifyContent: 'center',
    padding: 24,
  },
  triagePromptCard: {
    width: '100%', maxWidth: 380,
    backgroundColor: '#0f172a', borderRadius: 24, padding: 28,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 18,
    elevation: 12,
  },
  triagePromptIcon: { fontSize: 48, lineHeight: 54, marginBottom: 12 },
  triagePromptTitle: {
    fontSize: 22, fontWeight: '800', color: '#ffffff',
    textAlign: 'center', marginBottom: 10,
  },
  triagePromptSubtitle: {
    fontSize: 15, color: '#cbd5e1', textAlign: 'center',
    lineHeight: 22, marginBottom: 24,
  },
  triagePromptPrimary: {
    width: '100%', backgroundColor: '#3b82f6',
    borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', marginBottom: 8,
  },
  triagePromptPrimaryText: {
    fontSize: 15, fontWeight: '800', color: '#ffffff', letterSpacing: 0.5,
  },
  triagePromptSecondary: {
    width: '100%', paddingVertical: 12, alignItems: 'center',
  },
  triagePromptSecondaryText: {
    fontSize: 14, fontWeight: '600', color: '#94a3b8', letterSpacing: 0.3,
  },
  triagePromptHint: {
    fontSize: 11, color: '#475569', textAlign: 'center', marginTop: 4,
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
  achieveToastKickerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4,
  },
  achieveToastKicker: {
    fontSize: 10, fontWeight: '800', letterSpacing: 2,
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
