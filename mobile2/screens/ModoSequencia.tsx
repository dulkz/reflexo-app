import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Pressable,
  Animated, Platform, StatusBar as RNStatusBar,
} from 'react-native';

const TOTAL_SIGNALS = 20;
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
}

interface Props {
  onComplete: (summary: SeqSummary) => void;
  onBack: () => void;
}

function buildSequence(): SignalType[] {
  // First signal is always Go to give the user an immediate feedback anchor.
  // Each subsequent signal has 25% independent probability of being No-Go —
  // no fixed total, so the user cannot count signals to predict upcoming No-Go.
  const seq: SignalType[] = ['go'];
  for (let i = 1; i < TOTAL_SIGNALS; i++) {
    seq.push(Math.random() < 0.25 ? 'nogo' : 'go');
  }
  return seq;
}

export default function ModoSequencia({ onComplete, onBack }: Props) {
  const [gameState, setGameState] = useState<SeqState>('intro');
  const [signalIdx, setSignalIdx] = useState(0);
  const [trials, setTrials] = useState<TrialResult[]>([]);
  const [lastResponse, setLastResponse] = useState<ResponseType | null>(null);
  const [countdown, setCountdown] = useState(3);

  const sequence = useRef<SignalType[]>([]);
  const signalStart = useRef(0);
  const responded = useRef(false);
  const signalTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const flashOpacity = useRef(new Animated.Value(0)).current;
  const flashIsRed = useRef(false);
  const circleScale = useRef(new Animated.Value(0)).current;

  useEffect(() => () => {
    if (signalTimer.current) clearTimeout(signalTimer.current);
    if (interTimer.current) clearTimeout(interTimer.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);
  }, []);

  const flash = useCallback((red: boolean) => {
    flashIsRed.current = red;
    flashOpacity.setValue(0.4);
    Animated.timing(flashOpacity, { toValue: 0, duration: 500, useNativeDriver: true }).start();
  }, [flashOpacity]);

  const computeSummary = useCallback((allTrials: TrialResult[]): SeqSummary => {
    const goTrials = allTrials.filter(t => t.signalType === 'go');
    const hits = allTrials.filter(t => t.responseType === 'hit').length;
    const misses = allTrials.filter(t => t.responseType === 'miss').length;
    const commissions = allTrials.filter(t => t.responseType === 'commission').length;
    const correctInhibits = allTrials.filter(t => t.responseType === 'correct_inhibit').length;
    const hitRts = allTrials.filter(t => t.responseType === 'hit' && t.rt !== null).map(t => t.rt!);
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

    // Score: avg RT penalized for errors — miss = +200ms, commission = +150ms per error
    const penaltyMs = misses * 200 + commissions * 150;
    const score = Math.round(avgRt + penaltyMs / allTrials.length);

    return { trials: allTrials, hits, misses, commissions, correctInhibits, avgRt, accuracy, fatigueIndex, score };
  }, []);

  const scheduleNext = useCallback((currentIdx: number, currentTrials: TrialResult[]) => {
    if (currentIdx >= TOTAL_SIGNALS) {
      const summary = computeSummary(currentTrials);
      onComplete(summary);
      return;
    }
    const interval = MIN_INTERVAL + Math.random() * (MAX_INTERVAL - MIN_INTERVAL);
    setLastResponse(null);
    setGameState('inter');
    interTimer.current = setTimeout(() => {
      responded.current = false;
      circleScale.setValue(0);
      Animated.spring(circleScale, { toValue: 1, tension: 200, friction: 8, useNativeDriver: true }).start();
      signalStart.current = Date.now();
      setSignalIdx(currentIdx);
      setGameState('signal');

      signalTimer.current = setTimeout(() => {
        if (!responded.current) {
          const signalType = sequence.current[currentIdx];
          const responseType = signalType === 'go' ? 'miss' : 'correct_inhibit';
          const result: TrialResult = { signalType, responseType, rt: null };
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
    if (responded.current || gameState !== 'signal') return;
    responded.current = true;
    if (signalTimer.current) clearTimeout(signalTimer.current);

    const rt = Date.now() - signalStart.current;
    const currentSignal = sequence.current[signalIdx];
    const responseType: ResponseType = currentSignal === 'go' ? 'hit' : 'commission';
    const result: TrialResult = { signalType: currentSignal, responseType, rt };
    const newTrials = [...trials, result];
    setTrials(newTrials);
    setLastResponse(responseType);
    flash(responseType === 'commission');
    setGameState('feedback');
    setTimeout(() => scheduleNext(signalIdx + 1, newTrials), 400);
  }, [gameState, signalIdx, trials, flash, scheduleNext]);

  const startGame = useCallback(() => {
    sequence.current = buildSequence();
    setTrials([]);
    setSignalIdx(0);
    setCountdown(3);
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
  const currentSignalType = gameState === 'signal' ? sequence.current[signalIdx] : null;

  if (gameState === 'intro') {
    return (
      <View style={styles.screen}>
        <View style={[styles.topBar, { paddingTop: TOP + 8 }]}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>← Voltar</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.introContainer}>
          <Text style={styles.introTitle}>MODO SEQUÊNCIA</Text>
          <Text style={styles.introSub}>20 sinais · Go / NoGo</Text>
          <View style={styles.instrBox}>
            <Text style={styles.instrLine}>① <Text style={{ color: '#10b981', fontWeight: '700' }}>CÍRCULO VERDE</Text> → toque imediatamente (Go)</Text>
            <Text style={styles.instrLine}>② <Text style={{ color: '#ef4444', fontWeight: '700' }}>CÍRCULO VERMELHO</Text> → não toque! (NoGo)</Text>
            <Text style={[styles.instrLine, { color: '#f59e0b' }]}>③ ~25% dos sinais são NoGo — não se precipite</Text>
          </View>
          <View style={styles.signalDemo}>
            <View style={styles.demoItem}>
              <View style={[styles.demoCircle, { backgroundColor: '#10b981' }]} />
              <Text style={styles.demoLabel}>GO</Text>
            </View>
            <View style={styles.demoItem}>
              <View style={[styles.demoCircle, { backgroundColor: '#ef4444' }]} />
              <Text style={styles.demoLabel}>NO-GO</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.startBtn} onPress={startGame} activeOpacity={0.8}>
            <Text style={styles.startBtnText}>INICIAR</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (gameState === 'countdown') {
    return (
      <View style={[styles.screen, styles.centeredFull]}>
        <Text style={styles.countdownNum}>{countdown}</Text>
        <Text style={styles.countdownLabel}>PREPARE-SE</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Progress bar */}
      <View style={[styles.progressBarBg, { marginTop: TOP + 8 }]}>
        <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.progressText}>{trials.length} / {TOTAL_SIGNALS}</Text>

      {/* Main area */}
      <View style={styles.centeredFull}>
        {gameState === 'inter' && (
          <Text style={styles.interDots}>· · ·</Text>
        )}

        {gameState === 'signal' && (
          <Pressable onPressIn={handleTap} style={styles.touchableArea}>
            <Animated.View style={[
              styles.signalCircle,
              {
                backgroundColor: currentSignalType === 'go' ? '#10b981' : '#ef4444',
                transform: [{ scale: circleScale }],
              },
            ]} />
          </Pressable>
        )}

        {gameState === 'feedback' && lastResponse && (
          <View style={styles.feedbackContainer}>
            {lastResponse === 'hit' && <Text style={[styles.feedbackBig, { color: '#10b981' }]}>✓</Text>}
            {lastResponse === 'miss' && <Text style={[styles.feedbackBig, { color: '#ef4444' }]}>PERDEU</Text>}
            {lastResponse === 'commission' && <Text style={[styles.feedbackBig, { color: '#ef4444' }]}>ERRO!</Text>}
            {lastResponse === 'correct_inhibit' && <Text style={[styles.feedbackBig, { color: '#8b5cf6' }]}>✓ INIBIU</Text>}
          </View>
        )}
      </View>

      {/* Instruction reminder */}
      {gameState === 'inter' && (
        <View style={styles.bottomHint}>
          <Text style={[styles.hintLine, { color: '#10b981' }]}>VERDE → toque</Text>
          <Text style={[styles.hintLine, { color: '#ef4444' }]}>VERMELHO → não toque</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0b1220' },
  centeredFull: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  topBar: { paddingHorizontal: 20 },
  backBtn: { paddingVertical: 8, alignSelf: 'flex-start' },
  backText: { color: '#4a5a7b', fontSize: 15, fontWeight: '600' },

  progressBarBg: {
    height: 3, backgroundColor: '#1a2540',
    marginHorizontal: 20, borderRadius: 2, marginBottom: 6,
  },
  progressBarFill: { height: 3, backgroundColor: '#8b5cf6', borderRadius: 2 },
  progressText: { fontSize: 11, color: '#2d3a55', textAlign: 'center', marginBottom: 8 },

  interDots: { fontSize: 36, color: '#1a2540', letterSpacing: 16 },

  touchableArea: { padding: 20 },
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
  introTitle: { fontSize: 30, fontWeight: '900', color: '#8b5cf6', letterSpacing: 3, textAlign: 'center', marginBottom: 6 },
  introSub: { fontSize: 14, color: '#4a5a7b', textAlign: 'center', marginBottom: 32 },
  instrBox: {
    backgroundColor: '#111a2e', borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)', padding: 18, gap: 12, marginBottom: 28,
  },
  instrLine: { fontSize: 14, color: '#7a8aa0', lineHeight: 20 },
  signalDemo: { flexDirection: 'row', justifyContent: 'center', gap: 40, marginBottom: 36 },
  demoItem: { alignItems: 'center', gap: 10 },
  demoCircle: { width: 70, height: 70, borderRadius: 35 },
  demoLabel: { fontSize: 12, fontWeight: '800', color: '#fff', letterSpacing: 2 },
  startBtn: { backgroundColor: '#8b5cf6', borderRadius: 14, paddingVertical: 18, alignItems: 'center' },
  startBtnText: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 2 },

  countdownNum: { fontSize: 120, fontWeight: '900', color: '#8b5cf6', lineHeight: 120 },
  countdownLabel: { fontSize: 14, fontWeight: '700', color: '#4a5a7b', letterSpacing: 3 },
});
