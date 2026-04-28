import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Pressable,
  Animated, Platform, StatusBar as RNStatusBar, Dimensions,
} from 'react-native';
import { getLevelInfo } from '../utils/levels';
import { playSfx } from '../utils/sfx';

const TOTAL_ROUNDS = 15;
const SIGNAL_TIMEOUT = 1500;
const READY_MIN = 1000;
const READY_MAX = 3000;
const INITIAL_WAIT_MIN = 1000;
const INITIAL_WAIT_MAX = 3000;
const FEEDBACK_DELAY_HIT = 700;
const FEEDBACK_DELAY_MISS = 1200;

const CIRCLE_SIZE = 110;
// Adaptive offset: tighter on narrow screens so outer circles fit edge-to-edge.
// Threshold 420 ensures the 420 px container (155*2 + 110) never overflows.
const SCREEN_W = Dimensions.get('window').width;
const OFFSET = SCREEN_W < 420 ? 130 : 155;  // distance from center for outer circles
const CONTAINER = OFFSET * 2 + CIRCLE_SIZE; // 370 or 420
const RADAR_COLOR = '#f59e0b';
const INACTIVE_BORDER = '#1a2a4a';
const MISS_PENALTY = 200;

const TOP = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 44;

const CIRCLES: { dx: number; dy: number }[] = [
  { dx: 0,        dy: 0       }, // 0 center
  { dx: 0,        dy: -OFFSET }, // 1 top
  { dx: 0,        dy: OFFSET  }, // 2 bottom
  { dx: -OFFSET,  dy: 0       }, // 3 left
  { dx: OFFSET,   dy: 0       }, // 4 right
];

type RadarState = 'intro' | 'initial_wait' | 'ready' | 'signal' | 'hit' | 'miss' | 'timeout';

interface RoundResult {
  rt: number;
  hit: boolean;
  timeout: boolean;
  circleIdx: number;
}

interface Props {
  onComplete: (results: RoundResult[], score: number, timeoutCount: number, missCount: number) => void;
  onBack: () => void;
}

export default function ModoRadar({ onComplete, onBack }: Props) {
  const [gameState, setGameState] = useState<RadarState>('intro');
  const [round, setRound] = useState(1);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [pressedIdx, setPressedIdx] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);

  const signalTime = useRef(0);
  const responded = useRef(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialWaitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const signalTimeoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeoutCount = useRef(0);
  const missCount = useRef(0);
  // Latest handler — refs avoid stale closure on results/round in setTimeout.
  const handleTimeoutRef = useRef<() => void>(() => {});

  const flashOpacity = useRef(new Animated.Value(0)).current;
  const flashIsRed = useRef(false);
  const missPenaltyOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    if (readyTimer.current) clearTimeout(readyTimer.current);
    if (initialWaitTimer.current) clearTimeout(initialWaitTimer.current);
    if (signalTimeoutTimer.current) clearTimeout(signalTimeoutTimer.current);
  }, []);

  const flash = useCallback((red: boolean) => {
    flashIsRed.current = red;
    flashOpacity.setValue(0.4);
    Animated.timing(flashOpacity, { toValue: 0, duration: 600, useNativeDriver: true }).start();
  }, [flashOpacity]);

  const advance = useCallback((newResults: RoundResult[], delay: number) => {
    advanceTimer.current = setTimeout(() => {
      const next = round + 1;
      if (next > TOTAL_ROUNDS) {
        // Score = mean of hits (rt real) + misses (rt + MISS_PENALTY).
        // Timeouts excluded — rt=1500 ms would distort the mean.
        const scored = newResults.filter(r => !r.timeout);
        const score = scored.length > 0
          ? Math.round(
              scored.reduce((s, r) => s + (r.hit ? r.rt : r.rt + MISS_PENALTY), 0) / scored.length,
            )
          : Math.round(newResults.reduce((s, r) => s + r.rt, 0) / newResults.length);
        onComplete(newResults, score, timeoutCount.current, missCount.current);
      } else {
        setRound(next);
        startRound();
      }
    }, delay);
  // startRound is hoisted via closure; round is the dep that matters here.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, onComplete]);

  // Always-fresh timeout handler
  handleTimeoutRef.current = () => {
    if (responded.current) return;
    responded.current = true;
    if (signalTimeoutTimer.current) clearTimeout(signalTimeoutTimer.current);
    timeoutCount.current += 1;
    const result: RoundResult = { rt: SIGNAL_TIMEOUT, hit: false, timeout: true, circleIdx: activeIdx };
    setLastResult(result);
    const newResults = [...results, result];
    setResults(newResults);
    setGameState('timeout');
    flash(true);
    playSfx('miss');
    advance(newResults, FEEDBACK_DELAY_MISS);
  };

  // Timer starts after 'signal' render commits — circle is on screen before counting.
  useEffect(() => {
    if (gameState === 'signal') {
      signalTime.current = Date.now();
      signalTimeoutTimer.current = setTimeout(() => handleTimeoutRef.current(), SIGNAL_TIMEOUT);
      return () => {
        if (signalTimeoutTimer.current) clearTimeout(signalTimeoutTimer.current);
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  const startSignal = useCallback(() => {
    const idx = Math.floor(Math.random() * CIRCLES.length);
    setActiveIdx(idx);
    setPressedIdx(null);
    responded.current = false;
    setGameState('signal');
  }, []);

  const startRound = useCallback(() => {
    setGameState('ready');
    const delay = READY_MIN + Math.random() * (READY_MAX - READY_MIN);
    readyTimer.current = setTimeout(startSignal, delay);
  }, [startSignal]);

  const startInitialWait = useCallback(() => {
    timeoutCount.current = 0;
    missCount.current = 0;
    setGameState('initial_wait');
    const delay = INITIAL_WAIT_MIN + Math.random() * (INITIAL_WAIT_MAX - INITIAL_WAIT_MIN);
    initialWaitTimer.current = setTimeout(startRound, delay);
  }, [startRound]);

  const handleCirclePress = useCallback((idx: number) => {
    if (responded.current || gameState !== 'signal') return;
    responded.current = true;
    if (signalTimeoutTimer.current) clearTimeout(signalTimeoutTimer.current);
    const rt = Date.now() - signalTime.current;
    const isHit = idx === activeIdx;
    const result: RoundResult = { rt, hit: isHit, timeout: false, circleIdx: activeIdx };
    setPressedIdx(idx);
    setLastResult(result);
    const newResults = [...results, result];
    setResults(newResults);
    if (isHit) {
      playSfx('hit');
      setGameState('hit');
      flash(false);
      advance(newResults, FEEDBACK_DELAY_HIT);
    } else {
      missCount.current += 1;
      playSfx('miss');
      setGameState('miss');
      flash(true);
      missPenaltyOpacity.setValue(0);
      Animated.timing(missPenaltyOpacity, {
        toValue: 1, duration: 100, useNativeDriver: true,
      }).start();
      advance(newResults, FEEDBACK_DELAY_MISS);
    }
  }, [gameState, activeIdx, results, flash, advance, missPenaltyOpacity]);

  // ── Render ──────────────────────────────────────────────────────────────────

  if (gameState === 'intro') {
    return (
      <View style={styles.screen}>
        <View style={[styles.topBar, { paddingTop: TOP + 8 }]}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.introContainer}>
          <Text style={styles.introTitle}>MODO RADAR</Text>
          <Text style={styles.introSub}>5 círculos em cruz · 15 rodadas</Text>
          <View style={styles.instrBox}>
            <Text style={styles.instrLine}>① Os 5 círculos ficam visíveis o tempo todo</Text>
            <Text style={styles.instrLine}>② Um deles vai acender — toque nele rápido</Text>
            <Text style={[styles.instrLine, { color: '#ef4444' }]}>③ Toque no errado: +{MISS_PENALTY} ms de penalidade</Text>
          </View>
          <TouchableOpacity style={styles.startBtn} onPress={startInitialWait} activeOpacity={0.8}>
            <Text style={styles.startBtnText}>INICIAR</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.topBar, { paddingTop: TOP + 8 }]}>
        <Text style={styles.roundText}>
          RODADA <Text style={styles.roundNum}>{round}</Text>
          <Text style={styles.roundTotal}> / {TOTAL_ROUNDS}</Text>
        </Text>
        <TouchableOpacity onPress={onBack} style={styles.quitBtn} activeOpacity={0.7}>
          <Text style={styles.quitText}>DESISTIR</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dotsRow}>
        {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => {
          const done = i < results.length;
          const cur = i === round - 1;
          const isHit = done && results[i].hit;
          return (
            <View
              key={i}
              style={[
                styles.dot,
                cur && styles.dotCurrent,
                done && (isHit ? styles.dotDone : styles.dotFalse),
              ]}
            />
          );
        })}
      </View>

      <View style={styles.hintArea}>
        {(gameState === 'initial_wait' || gameState === 'ready') && (
          <Text style={styles.hintText}>aguarde...</Text>
        )}
        {gameState === 'signal' && (
          <Text style={[styles.hintText, { color: RADAR_COLOR }]}>toque no círculo aceso</Text>
        )}
        {gameState === 'hit' && lastResult && (
          <View style={styles.feedbackRow}>
            <Text style={[styles.feedbackRt, { color: getLevelInfo(lastResult.rt).color }]}>
              {lastResult.rt} ms
            </Text>
            <Text style={[styles.feedbackLabel, { color: '#10b981' }]}>✓ ACERTOU</Text>
          </View>
        )}
        {gameState === 'miss' && (
          <Text style={[styles.feedbackLabel, { color: '#ef4444' }]}>✗ ERROU</Text>
        )}
        {gameState === 'timeout' && (
          <Text style={[styles.feedbackLabel, { color: '#ef4444' }]}>⏱ TIMEOUT</Text>
        )}
      </View>

      {/* Cross of 5 circles */}
      <View style={styles.crossContainer}>
        <View style={styles.crossInner}>
          {CIRCLES.map((c, i) => {
            const isActive = gameState === 'signal' && i === activeIdx;
            const isCorrectFlash = gameState === 'hit' && i === activeIdx;
            const isWrongPress = gameState === 'miss' && pressedIdx === i;
            const isMissedTarget = gameState === 'timeout' && i === activeIdx;
            const left = OFFSET + c.dx;
            const top = OFFSET + c.dy;

            let visualStyle;
            if (isActive || isCorrectFlash) {
              visualStyle = {
                backgroundColor: isCorrectFlash ? '#10b981' : RADAR_COLOR,
                borderColor: isCorrectFlash ? '#10b981' : RADAR_COLOR,
              };
            } else if (isWrongPress || isMissedTarget) {
              visualStyle = {
                backgroundColor: 'transparent',
                borderColor: '#ef4444',
              };
            } else {
              visualStyle = {
                backgroundColor: 'transparent',
                borderColor: INACTIVE_BORDER,
              };
            }

            return (
              <Pressable
                key={i}
                style={({ pressed }) => [
                  styles.circleBase,
                  { left, top },
                  visualStyle,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                onPressIn={() => handleCirclePress(i)}
                disabled={gameState !== 'signal'}
              />
            );
          })}
        </View>
      </View>

      {/* Flash overlay */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: flashIsRed.current ? '#ef4444' : '#10b981', opacity: flashOpacity },
        ]}
      />

      {/* Miss penalty overlay — only on wrong-circle taps, not on timeouts */}
      {gameState === 'miss' && (
        <Animated.View
          pointerEvents="none"
          style={[styles.penaltyOverlay, { opacity: missPenaltyOpacity }]}
        >
          <Text style={styles.penaltyText}>+{MISS_PENALTY}ms</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0b1220' },

  topBar: {
    paddingHorizontal: 20, paddingBottom: 8,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  backBtn: {
    width: 32, height: 28, borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1, borderColor: '#f59e0b',
    alignItems: 'center', justifyContent: 'center',
  },
  backText: { color: '#f59e0b', fontSize: 16, fontWeight: '700', lineHeight: 16, marginTop: -1 },
  quitBtn: {
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
  },
  quitText: { color: '#ef4444', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  roundText: { fontSize: 13, color: '#4a5a7b', fontWeight: '600' },
  roundNum: { fontSize: 20, fontWeight: '900', color: '#fff' },
  roundTotal: { fontSize: 13, color: '#2d3a55' },

  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 4, marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1a2540', borderWidth: 1, borderColor: '#2d3a55' },
  dotCurrent: { borderColor: '#fff' },
  dotDone: { backgroundColor: '#10b981', borderColor: '#10b981' },
  dotFalse: { backgroundColor: '#ef4444', borderColor: '#ef4444' },

  hintArea: { alignItems: 'center', minHeight: 60, justifyContent: 'center' },
  hintText: {
    fontSize: 12, fontWeight: '700', color: '#4a5a7b',
    textAlign: 'center', letterSpacing: 1.5,
  },
  feedbackRow: { alignItems: 'center', gap: 4 },
  feedbackRt: { fontSize: 36, fontWeight: '900', letterSpacing: -1 },
  feedbackLabel: { fontSize: 13, fontWeight: '800', letterSpacing: 2 },

  crossContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  crossInner: { width: CONTAINER, height: CONTAINER, position: 'relative' },

  penaltyOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  penaltyText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ef4444',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  circleBase: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 2,
  },

  introContainer: { flex: 1, paddingHorizontal: 24, justifyContent: 'center', paddingBottom: 40 },
  introTitle: { fontSize: 34, fontWeight: '900', color: RADAR_COLOR, letterSpacing: 3, textAlign: 'center', marginBottom: 6 },
  introSub: { fontSize: 14, color: '#4a5a7b', textAlign: 'center', marginBottom: 32 },
  instrBox: {
    backgroundColor: '#111a2e', borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)', padding: 18, gap: 10, marginBottom: 28,
  },
  instrLine: { fontSize: 14, color: '#7a8aa0', lineHeight: 20 },
  startBtn: { backgroundColor: RADAR_COLOR, borderRadius: 14, paddingVertical: 18, alignItems: 'center' },
  startBtnText: { fontSize: 16, fontWeight: '800', color: '#0b1220', letterSpacing: 2 },
});

export type { RoundResult };
