import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { playSfx } from '../utils/sfx';
import { hapticError, hapticLight } from '../utils/haptics';
import { shake } from '../utils/animations';
import { SvgXml } from 'react-native-svg';
import { ICONS } from '../assets/icons';
import {
  View, Text, StyleSheet, TouchableOpacity, Pressable, Alert,
  Animated, Platform, StatusBar as RNStatusBar,
} from 'react-native';

const TOTAL_SIGNALS = 10;
const MIN_INTERVAL = 1000;
const MAX_INTERVAL = 2200;
const SIGNAL_DURATION = 1400;

const TOP = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 44;

type SignalType = 'go' | 'nogo';
type ResponseType = 'hit' | 'miss' | 'commission' | 'correct_inhibit';
type SeqState = 'intro' | 'countdown' | 'inter' | 'signal' | 'feedback' | 'done';

interface TrialResult {
  signalType: SignalType;
  responseType: ResponseType;
  rt: number | null;
  earlyPenalty?: number; // accumulated early-tap penalty (multiples of 150ms) for this round
}

export interface SeqSummary {
  trials: TrialResult[];
  hits: number;
  misses: number;
  commissions: number;
  correctInhibits: number;
  avgRt: number;
  accuracy: number;
  fatigueIndex: number;
  score: number;
  noGoErrors: number;   // = commissions (taps during NoGo signals)
  noGoAccuracy: number; // % of NoGo correctly inhibited, 0-100 int
  suspiciousSpam?: boolean; // >3 raw taps in any 500ms window — session invalid
  earlyTapCount?: number;   // taps during inter state (anticipations)
}

interface Props {
  onComplete: (summary: SeqSummary) => void;
  onBack: () => void;
}

function buildSequence(): ('go' | 'nogo')[] {
  // First signal is always Go to give the user an immediate feedback anchor.
  // Each subsequent signal has 25% independent probability of being No-Go —
  // no fixed total, so the user cannot count signals to predict upcoming No-Go.
  const seq: ('go' | 'nogo')[] = ['go'];
  for (let i = 1; i < TOTAL_SIGNALS; i++) {
    seq.push(Math.random() < 0.25 ? 'nogo' : 'go');
  }
  return seq;
}

export default function ModoSequencia({ onComplete, onBack }: Props) {
  const { t } = useTranslation();
  const [gameState, setGameState] = useState<SeqState>('intro');
  const confirmAbort = useCallback(() => {
    Alert.alert(
      t('common.quitTitle'),
      t('common.quitMessage'),
      [
        { text: t('common.keepPlaying'), style: 'cancel' },
        { text: t('common.quit'), style: 'destructive', onPress: onBack },
      ],
    );
  }, [onBack, t]);
  const [signalIdx, setSignalIdx] = useState(0);
  const [trials, setTrials] = useState<TrialResult[]>([]);
  const [lastResponse, setLastResponse] = useState<ResponseType | null>(null);
  const [countdown, setCountdown] = useState(3);

  const sequence = useRef<('go' | 'nogo')[]>([]);
  const currentSignalRef = useRef<'go' | 'nogo'>('go');
  const signalStart = useRef(0);
  const responded = useRef(false);
  const signalTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Anti-spam: cooldown between taps + rolling window counter
  const lastTapRef = useRef<number>(0);
  const spamWindowStartRef = useRef<number>(0);
  const spamCountRef = useRef<number>(0);
  const suspiciousSpamRef = useRef(false);

  // Anticipation (early tap during inter)
  const earlyTapRef = useRef<number>(0);
  const pendingEarlyPenaltyRef = useRef<number>(0); // accumulated +150ms per early tap, attached to next trial
  const penaltyVisibleRef = useRef<boolean>(false);
  const pausedForPenaltyRef = useRef<boolean>(false);
  const pendingScheduleRef = useRef<{ idx: number; trials: TrialResult[] } | null>(null);
  const [showPenaltyOverlay, setShowPenaltyOverlay] = useState(false);

  const flashOpacity = useRef(new Animated.Value(0)).current;
  const flashIsRed = useRef(false);
  const circleScale = useRef(new Animated.Value(0)).current;
  const screenShakeX = useRef(new Animated.Value(0)).current; // full-screen shake on NoGo tap

  useEffect(() => () => {
    if (signalTimer.current) clearTimeout(signalTimer.current);
    if (interTimer.current) clearTimeout(interTimer.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);
  }, []);

  // Timer starts after 'signal' render commit — matches ModoAlvo/ModoRadar pattern.
  useEffect(() => {
    if (gameState === 'signal') {
      signalStart.current = Date.now();
    }
  }, [gameState]);

  const flash = useCallback((red: boolean) => {
    flashIsRed.current = red;
    // Sequência error flash is intense per spec: red opacity 0.20 / 250ms.
    flashOpacity.setValue(red ? 0.20 : 0.35);
    Animated.timing(flashOpacity, { toValue: 0, duration: 250, useNativeDriver: true }).start();
  }, [flashOpacity]);

  const computeSummary = useCallback((allTrials: TrialResult[]): SeqSummary => {
    const goTrials = allTrials.filter(t => t.signalType === 'go');
    const hits = allTrials.filter(t => t.responseType === 'hit').length;
    const misses = allTrials.filter(t => t.responseType === 'miss').length;
    const commissions = allTrials.filter(t => t.responseType === 'commission').length;
    const correctInhibits = allTrials.filter(t => t.responseType === 'correct_inhibit').length;
    const hitRts = allTrials.filter(t => t.responseType === 'hit' && t.rt !== null).map(t => t.rt!);
    // avgRt = clean reaction speed on Go signals (raw RT only, no early penalties)
    const avgRt = hitRts.length ? Math.round(hitRts.reduce((a, b) => a + b, 0) / hitRts.length) : 999;
    const accuracy = goTrials.length ? hits / goTrials.length : 0;

    // Fatigue: compare first half vs second half hit RTs
    const half = Math.floor(hitRts.length / 2);
    let fatigueIndex = 0;
    if (half >= 2) {
      const firstHalf = hitRts.slice(0, half);
      const secondHalf = hitRts.slice(half);
      const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const avgLast = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      fatigueIndex = Math.round(((avgLast - avgFirst) / avgFirst) * 100);
    }

    // Score: avg RT contribution per round (all TOTAL_SIGNALS signals participate):
    //
    //   Scenario A — Go + hit:             realRt + earlyPenalty (if any)
    //   Scenario B — NoGo + correct inhibit + earlyPenalty: earlyPenalty only enters avg
    //   Scenario C — NoGo + commission:     400ms + earlyPenalty (if any)
    //   miss (Go timeout):                  400ms + earlyPenalty (if any)
    //   correct_inhibit (no earlyPenalty): excluded — clean inhibition, no reaction event
    const scorableTrials = allTrials.filter(t =>
      t.responseType !== 'correct_inhibit' || (t.earlyPenalty ?? 0) > 0
    );
    const totalRt = scorableTrials.reduce((sum, t) => {
      const ep = t.earlyPenalty ?? 0;
      if (t.responseType === 'hit') return sum + (t.rt ?? 0) + ep;
      if (t.responseType === 'correct_inhibit') return sum + ep; // only early penalty
      return sum + 400 + ep; // miss or commission
    }, 0);
    const score = scorableTrials.length > 0
      ? Math.round(totalRt / scorableTrials.length)
      : 999;

    const totalNoGo = allTrials.filter(t => t.signalType === 'nogo').length;
    const noGoErrors = commissions;
    const noGoAccuracy = totalNoGo > 0
      ? Math.round(((totalNoGo - commissions) / totalNoGo) * 100)
      : 100;

    return { trials: allTrials, hits, misses, commissions, correctInhibits, avgRt, accuracy, fatigueIndex, score, noGoErrors, noGoAccuracy };
  }, []);

  const scheduleNext = useCallback((currentIdx: number, currentTrials: TrialResult[]) => {
    if (currentIdx >= TOTAL_SIGNALS) {
      const summary = computeSummary(currentTrials);
      onComplete({ ...summary, suspiciousSpam: suspiciousSpamRef.current, earlyTapCount: earlyTapRef.current });
      return;
    }
    pendingScheduleRef.current = { idx: currentIdx, trials: currentTrials };
    const interval = MIN_INTERVAL + Math.random() * (MAX_INTERVAL - MIN_INTERVAL);
    setLastResponse(null);
    setGameState('inter');
    interTimer.current = setTimeout(() => {
      responded.current = false;
      circleScale.setValue(0);
      Animated.spring(circleScale, { toValue: 1, tension: 200, friction: 8, useNativeDriver: true }).start();
      currentSignalRef.current = sequence.current[currentIdx]; // set before state to avoid render race
      setSignalIdx(currentIdx);
      setGameState('signal'); // signalStart captured in useEffect after this render

      signalTimer.current = setTimeout(() => {
        if (!responded.current) {
          const signalType = sequence.current[currentIdx];
          const responseType = signalType === 'go' ? 'miss' : 'correct_inhibit';
          const earlyPenalty = pendingEarlyPenaltyRef.current;
          pendingEarlyPenaltyRef.current = 0;
          const result: TrialResult = { signalType, responseType, rt: null, ...(earlyPenalty > 0 ? { earlyPenalty } : {}) };
          const newTrials = [...currentTrials, result];
          setTrials(newTrials);
          setLastResponse(responseType);
          if (responseType === 'miss') flash(true);
          setGameState('feedback');
          setTimeout(() => scheduleNext(currentIdx + 1, newTrials), 400);
        }
      }, SIGNAL_DURATION);
    }, interval);
  }, [computeSummary, onComplete, flash, circleScale]);

  const handleTap = useCallback(() => {
    const now = Date.now();

    // Rolling 500ms window spam detection — only during signal/feedback, not inter
    // (anticipations during inter are a separate penalized mechanic, not spam)
    if (gameState !== 'inter') {
      if (now - spamWindowStartRef.current > 500) {
        spamWindowStartRef.current = now;
        spamCountRef.current = 1;
      } else {
        spamCountRef.current += 1;
        if (spamCountRef.current > 3) suspiciousSpamRef.current = true;
      }
    }

    // 150ms cooldown — blocks mechanical spam while well below human RT floor (~160ms)
    if (now - lastTapRef.current < 150) return;
    lastTapRef.current = now;

    // User taps while penalty overlay is showing → dismiss and resume game.
    // This tap is confirmation only — it does NOT measure time. The +150ms
    // penalty is already stored in pendingEarlyPenaltyRef and will be attached
    // to the next trial result when the replayed signal resolves.
    if (penaltyVisibleRef.current) {
      setShowPenaltyOverlay(false);
      penaltyVisibleRef.current = false;
      pausedForPenaltyRef.current = false;
      const pending = pendingScheduleRef.current;
      if (pending) scheduleNext(pending.idx, pending.trials);
      return;
    }

    // Early tap during inter (anticipation): cancel scheduled signal, accumulate
    // +150ms penalty (stays pending until the replayed signal resolves), show overlay.
    if (gameState === 'inter' && !penaltyVisibleRef.current) {
      if (interTimer.current) { clearTimeout(interTimer.current); interTimer.current = null; }
      earlyTapRef.current += 1;
      pendingEarlyPenaltyRef.current += 150;
      penaltyVisibleRef.current = true;
      pausedForPenaltyRef.current = true;
      setShowPenaltyOverlay(true);
      return;
    }

    if (responded.current || gameState !== 'signal') return;
    responded.current = true;
    if (signalTimer.current) clearTimeout(signalTimer.current);

    const rt = Date.now() - signalStart.current;
    const currentSignal = currentSignalRef.current;
    const responseType: ResponseType = currentSignal === 'go' ? 'hit' : 'commission';
    const earlyPenalty = pendingEarlyPenaltyRef.current;
    pendingEarlyPenaltyRef.current = 0;
    const result: TrialResult = { signalType: currentSignal, responseType, rt, ...(earlyPenalty > 0 ? { earlyPenalty } : {}) };
    const newTrials = [...trials, result];
    setTrials(newTrials);
    setLastResponse(responseType);
    if (responseType === 'hit') {
      playSfx('hit');
    } else if (responseType === 'commission') {
      // NoGo tapped — biggest cognitive error: whole screen shakes (±8px/500ms),
      // Notification.Error + a light second pulse 200ms later.
      playSfx('miss');
      hapticError();
      shake(screenShakeX, 8, 500);
      setTimeout(() => hapticLight(), 200);
    }
    flash(responseType === 'commission');
    setGameState('feedback');
    setTimeout(() => scheduleNext(signalIdx + 1, newTrials), 400);
  }, [gameState, signalIdx, trials, flash, scheduleNext]);

  const startGame = useCallback(() => {
    sequence.current = buildSequence();
    setTrials([]);
    setSignalIdx(0);
    setCountdown(3);
    // Reset anti-spam and anticipation state for new game
    lastTapRef.current = 0;
    spamWindowStartRef.current = 0;
    spamCountRef.current = 0;
    suspiciousSpamRef.current = false;
    earlyTapRef.current = 0;
    pendingEarlyPenaltyRef.current = 0;
    penaltyVisibleRef.current = false;
    pausedForPenaltyRef.current = false;
    pendingScheduleRef.current = null;
    setShowPenaltyOverlay(false);
    setGameState('countdown');
    let count = 3;
    countdownTimer.current = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        if (countdownTimer.current) clearInterval(countdownTimer.current);
        scheduleNext(0, []);
      }
    }, 1000);
  }, [scheduleNext]);

  // ── Render ──────────────────────────────────────────────────────────────────

  const progress = trials.length / TOTAL_SIGNALS;
  const currentSignalType = gameState === 'signal' ? currentSignalRef.current : null;

  if (gameState === 'intro') {
    return (
      <View style={styles.screen}>
        <View style={[styles.topBar, { paddingTop: TOP + 8 }]}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.introContainer}>
          <View style={styles.introIcon}>
            <SvgXml xml={ICONS.modes.sequencia} width={48} height={48} />
          </View>
          <Text style={styles.introTitle}>{t('sequence.title')}</Text>
          <Text style={styles.introSub}>{t('sequence.subtitle')}</Text>
          <View style={styles.howToCard}>
            <Text style={styles.howToTitle}>{t('common.howToPlay')}</Text>
            <Text style={styles.howToText}>{t('sequence.howToText')}</Text>
          </View>
          <TouchableOpacity style={styles.startBtn} onPress={startGame} activeOpacity={0.8}>
            <Text style={styles.startBtnText}>{t('common.start')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (gameState === 'countdown') {
    return (
      <View style={[styles.screen, styles.centeredFull]}>
        <Text style={styles.countdownNum}>{countdown}</Text>
        <Text style={styles.countdownLabel}>{t('sequence.prepare')}</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.screen, { transform: [{ translateX: screenShakeX }] }]}>
      <View style={[styles.topBar, { paddingTop: TOP + 8 }]}>
        <TouchableOpacity onPress={confirmAbort} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
      </View>
      {/* Progress bar */}
      <View style={[styles.progressBarBg, { marginTop: 8 }]}>
        <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.progressText}>{trials.length} / {TOTAL_SIGNALS}</Text>

      {/* Main area — full area is tappable to detect anticipations during inter */}
      <Pressable style={styles.centeredFull} onPressIn={handleTap}>
        {gameState === 'inter' && (
          <Text style={styles.interDots}>· · ·</Text>
        )}

        {gameState === 'signal' && (
          <Animated.View style={[
            styles.signalCircle,
            {
              backgroundColor: currentSignalType === 'go' ? '#10b981' : '#ef4444',
              transform: [{ scale: circleScale }],
            },
          ]} />
        )}

        {gameState === 'feedback' && lastResponse && (
          <View style={styles.feedbackContainer}>
            {lastResponse === 'hit' && <Text style={[styles.feedbackBig, { color: '#10b981' }]}>✓</Text>}
            {lastResponse === 'miss' && <Text style={[styles.feedbackBig, { color: '#ef4444' }]}>{t('sequence.miss')}</Text>}
            {lastResponse === 'commission' && <Text style={[styles.feedbackBig, { color: '#ef4444' }]}>{t('sequence.error')}</Text>}
            {lastResponse === 'correct_inhibit' && <Text style={[styles.feedbackBig, { color: '#8b5cf6' }]}>{t('sequence.inhibited')}</Text>}
          </View>
        )}
      </Pressable>

      {/* Instruction reminder */}
      {gameState === 'inter' && (
        <View style={styles.bottomHint}>
          <Text style={[styles.hintLine, { color: '#10b981' }]}>{t('sequence.hintGo')}</Text>
          <Text style={[styles.hintLine, { color: '#ef4444' }]}>{t('sequence.hintNoGo')}</Text>
        </View>
      )}

      {/* Anticipation penalty overlay */}
      {showPenaltyOverlay && (
        <View style={[StyleSheet.absoluteFill, styles.penaltyOverlay]} pointerEvents="none">
          <Text style={styles.penaltyIcon}>❌</Text>
          <Text style={styles.penaltyTitle}>{t('sequence.penaltyTitle')}</Text>
          <Text style={styles.penaltyMs}>{t('sequence.penaltyMs')}</Text>
          <Text style={styles.penaltyContinue}>{t('sequence.penaltyContinue')}</Text>
        </View>
      )}

      {/* Flash overlay */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { pointerEvents: 'none' },
          { backgroundColor: flashIsRed.current ? '#ef4444' : '#10b981', opacity: flashOpacity },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0b1220' },
  centeredFull: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  topBar: { paddingHorizontal: 20, paddingBottom: 6 },
  backBtn: {
    width: 32, height: 28, borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1, borderColor: '#f59e0b',
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  backText: { color: '#f59e0b', fontSize: 16, fontWeight: '700', lineHeight: 16, marginTop: -1 },

  progressBarBg: {
    height: 3, backgroundColor: '#1a2540',
    marginHorizontal: 20, borderRadius: 2, marginBottom: 6,
  },
  progressBarFill: { height: 3, backgroundColor: '#8b5cf6', borderRadius: 2 },
  progressText: { fontSize: 11, color: '#2d3a55', textAlign: 'center', marginBottom: 8 },

  interDots: { fontSize: 36, color: '#1a2540', letterSpacing: 16 },

  signalCircle: {
    width: 180, height: 180, borderRadius: 90,
    elevation: 20,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
  },

  feedbackContainer: { alignItems: 'center' },
  feedbackBig: { fontSize: 52, fontWeight: '900', letterSpacing: 2 },

  bottomHint: { paddingBottom: 40, alignItems: 'center', gap: 4 },
  hintLine: { fontSize: 13, fontWeight: '700', letterSpacing: 1 },

  introContainer: { flex: 1, paddingHorizontal: 24, justifyContent: 'center', paddingBottom: 40 },
  introIcon: {
    width: 84, height: 84, borderRadius: 42, alignSelf: 'center',
    backgroundColor: 'rgba(139,92,246,0.10)',
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.25)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  introTitle: { fontSize: 30, fontWeight: '900', color: '#8b5cf6', letterSpacing: 3, textAlign: 'center', marginBottom: 6 },
  introSub: { fontSize: 14, color: '#4a5a7b', textAlign: 'center', marginBottom: 32 },
  howToCard: {
    backgroundColor: 'rgba(139,92,246,0.06)',
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.20)',
    borderRadius: 12, padding: 16, marginBottom: 28,
  },
  howToTitle: { fontSize: 13, fontWeight: '700', color: '#8b5cf6', letterSpacing: 0.5, marginBottom: 8 },
  howToText: { fontSize: 14, color: '#cbd5e1', lineHeight: 20 },
  startBtn: { backgroundColor: '#8b5cf6', borderRadius: 14, paddingVertical: 18, alignItems: 'center' },
  startBtnText: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 2 },

  countdownNum: { fontSize: 120, fontWeight: '900', color: '#8b5cf6', lineHeight: 120 },
  countdownLabel: { fontSize: 14, fontWeight: '700', color: '#4a5a7b', letterSpacing: 3 },

  penaltyOverlay: {
    backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center',
    zIndex: 100,
  },
  penaltyIcon: { fontSize: 48, marginBottom: 8 },
  penaltyTitle: { fontSize: 28, fontWeight: '900', color: '#ef4444', letterSpacing: 1 },
  penaltyMs: { fontSize: 20, fontWeight: '800', color: '#f59e0b', marginTop: 6 },
  penaltyContinue: { fontSize: 13, color: '#4a5a7b', marginTop: 14, letterSpacing: 0.5 },
});
