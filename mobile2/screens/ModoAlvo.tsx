import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Pressable, Alert,
  Animated, Platform, StatusBar as RNStatusBar,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { getLevelInfo } from '../utils/levels';
import { playSfx } from '../utils/sfx';
import { RARITY_ICONS_SVG, UI_ICONS } from '../assets/icons';

const TOTAL_ROUNDS = 10;
const ERROR_PENALTY = 150;
const READY_DELAY = 700;
const INITIAL_WAIT_MIN = 1000;
const INITIAL_WAIT_MAX = 3000;
const CHALLENGE_TIMEOUT = 2000;

const TOP = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 44;

const CIRCLE_COLORS = [
  { key: 'AZUL',    color: '#3b82f6', bg: 'rgba(59,130,246,0.15)'  },
  { key: 'VERDE',   color: '#10b981', bg: 'rgba(16,185,129,0.15)'  },
  { key: 'LARANJA', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)'  },
  { key: 'ROXO',    color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)'  },
];

type AlvoState = 'intro' | 'initial_wait' | 'ready' | 'challenge' | 'correct' | 'wrong' | 'done';

interface RoundResult { rt: number; correct: boolean; penalizedRt: number; targetIdx: number }

interface Props {
  onComplete: (results: RoundResult[], score: number, timeoutCount: number) => void;
  onBack: () => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ModoAlvo({ onComplete, onBack }: Props) {
  const [gameState, setGameState] = useState<AlvoState>('intro');
  const confirmAbort = useCallback(() => {
    Alert.alert(
      'Deseja desistir?',
      'O progresso desta sessão não será salvo.',
      [
        { text: 'Continuar jogando', style: 'cancel' },
        { text: 'Desistir', style: 'destructive', onPress: onBack },
      ],
    );
  }, [onBack]);
  const [round, setRound] = useState(1);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [targetIdx, setTargetIdx] = useState(0);
  const [colorOrder, setColorOrder] = useState([0, 1, 2, 3]);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);

  const signalTime = useRef(0);
  const responded = useRef(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialWaitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const challengeTimeoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeoutCount = useRef(0);
  // Holds latest handler so the timeout closure always sees fresh state
  const handleTimeoutRef = useRef<() => void>(() => {});

  const flashOpacity = useRef(new Animated.Value(0)).current;
  const flashIsRed = useRef(false);

  useEffect(() => () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    if (readyTimer.current) clearTimeout(readyTimer.current);
    if (initialWaitTimer.current) clearTimeout(initialWaitTimer.current);
    if (challengeTimeoutTimer.current) clearTimeout(challengeTimeoutTimer.current);
  }, []);

  // Always up-to-date timeout handler — refs avoid stale closure on results/round.
  handleTimeoutRef.current = () => {
    if (responded.current) return;
    responded.current = true;
    if (challengeTimeoutTimer.current) clearTimeout(challengeTimeoutTimer.current);
    timeoutCount.current += 1;
    const result: RoundResult = { rt: CHALLENGE_TIMEOUT, correct: false, penalizedRt: CHALLENGE_TIMEOUT, targetIdx };
    setLastResult(result);
    const newResults = [...results, result];
    setResults(newResults);
    setGameState('wrong');
    const next = round + 1;
    advanceTimer.current = setTimeout(() => {
      if (next > TOTAL_ROUNDS) {
        const score = Math.round(newResults.reduce((s, r) => s + r.penalizedRt, 0) / newResults.length);
        onComplete(newResults, score, timeoutCount.current);
      } else {
        setRound(next);
        startRound();
      }
    }, 800);
  };

  // Timer starts after 'challenge' render commit — circles are on screen before counting begins.
  useEffect(() => {
    if (gameState === 'challenge') {
      signalTime.current = Date.now();
      challengeTimeoutTimer.current = setTimeout(() => {
        handleTimeoutRef.current();
      }, CHALLENGE_TIMEOUT);
      return () => {
        if (challengeTimeoutTimer.current) clearTimeout(challengeTimeoutTimer.current);
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  const flash = useCallback((red: boolean) => {
    flashIsRed.current = red;
    flashOpacity.setValue(0.45);
    Animated.timing(flashOpacity, { toValue: 0, duration: 600, useNativeDriver: true }).start();
  }, [flashOpacity]);

  const startChallenge = useCallback(() => {
    const newTarget = Math.floor(Math.random() * 4);
    const newOrder = shuffle([0, 1, 2, 3]);
    setTargetIdx(newTarget);
    setColorOrder(newOrder);
    responded.current = false;
    setGameState('challenge'); // signalTime captured in useEffect after this render
  }, []);

  const startRound = useCallback(() => {
    setGameState('ready');
    readyTimer.current = setTimeout(startChallenge, READY_DELAY);
  }, [startChallenge]);

  const startInitialWait = useCallback(() => {
    setGameState('initial_wait');
    const delay = INITIAL_WAIT_MIN + Math.random() * (INITIAL_WAIT_MAX - INITIAL_WAIT_MIN);
    initialWaitTimer.current = setTimeout(startRound, delay);
  }, [startRound]);

  const handleCirclePress = useCallback((pressedColorIdx: number) => {
    if (responded.current || gameState !== 'challenge') return;
    responded.current = true;
    if (challengeTimeoutTimer.current) clearTimeout(challengeTimeoutTimer.current);
    const rt = Date.now() - signalTime.current;
    const correct = pressedColorIdx === targetIdx;
    const penalizedRt = correct ? rt : rt + ERROR_PENALTY;
    const result: RoundResult = { rt, correct, penalizedRt, targetIdx };
    setLastResult(result);
    const newResults = [...results, result];
    setResults(newResults);
    if (correct) playSfx('hit');
    flash(!correct);
    setGameState(correct ? 'correct' : 'wrong');

    const delay = 800;
    advanceTimer.current = setTimeout(() => {
      const next = round + 1;
      if (next > TOTAL_ROUNDS) {
        const score = Math.round(newResults.reduce((s, r) => s + r.penalizedRt, 0) / newResults.length);
        onComplete(newResults, score, timeoutCount.current);
      } else {
        setRound(next);
        startRound();
      }
    }, delay);
  }, [gameState, targetIdx, results, round, flash, onComplete, startRound]);

  // ── Render ──────────────────────────────────────────────────────────────────

  const renderDots = () => (
    <View style={styles.dotsRow}>
      {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => {
        const done = i < results.length;
        const cur = i === round - 1;
        const failed = done && !results[i].correct;
        return (
          <View key={i} style={[
            styles.dot,
            cur && styles.dotCurrent,
            done && (failed ? styles.dotFalse : styles.dotDone),
          ]} />
        );
      })}
    </View>
  );

  if (gameState === 'intro') {
    return (
      <View style={styles.screen}>
        <View style={[styles.topBar, { paddingTop: TOP + 8 }]}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.introContainer}>
          <Text style={styles.introTitle}>MODO ALVO</Text>
          <Text style={styles.introSub}>4 círculos · 10 rodadas</Text>
          <View style={styles.howToCard}>
            <Text style={styles.howToTitle}>Como jogar</Text>
            <Text style={styles.howToText}>
              Observe a cor indicada no topo. Toque no círculo dessa cor assim que aparecer. Erro = +150ms de penalidade.
            </Text>
          </View>
          <TouchableOpacity style={styles.startBtn} onPress={startInitialWait} activeOpacity={0.8}>
            <Text style={styles.startBtnText}>INICIAR</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const targetColor = CIRCLE_COLORS[targetIdx];
  const correctIconXml = RARITY_ICONS_SVG.desbloqueadas.replace('#f59e0b', '#10b981');
  const wrongIconXml   = UI_ICONS.lock.replace('#6b7280', '#ef4444');

  return (
    <View style={styles.screen}>
      {/* Top bar */}
      <View style={[styles.topBar, styles.topBarRow, { paddingTop: TOP + 8 }]}>
        <TouchableOpacity onPress={confirmAbort} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.progressInfo}>
          <Text style={styles.roundText}>
            RODADA <Text style={styles.roundNum}>{round}</Text>
            <Text style={styles.roundTotal}> / {TOTAL_ROUNDS}</Text>
          </Text>
        </View>
        <View style={styles.backBtnSpacer} />
      </View>

      {renderDots()}

      {/* Waiting indicator — shown before first round and between rounds */}
      {(gameState === 'initial_wait' || gameState === 'ready') && (
        <View style={styles.hintArea}>
          <Text style={styles.waitingHint}>aguarde o estímulo</Text>
        </View>
      )}

      {/* Waiting dots overlay — initial_wait and ready share the same visual */}
      {(gameState === 'initial_wait' || gameState === 'ready') && (
        <View style={styles.centeredFull}>
          <Text style={styles.waitingDots}>· · ·</Text>
        </View>
      )}

      {/* Circle grid + badge/feedback — visible during challenge, correct, wrong */}
      {(gameState === 'challenge' || gameState === 'correct' || gameState === 'wrong') && (
        <View style={styles.gridContainer}>
          <View style={styles.gridInner}>
            {/* Badge during challenge; feedback icon+text during result states */}
            {gameState === 'challenge' ? (
              <View style={styles.badgeArea}>
                <Text style={styles.hintLabel}>TOQUE NO CÍRCULO</Text>
                <View style={[styles.hintBadge, { backgroundColor: targetColor.bg, borderColor: targetColor.color + '66' }]}>
                  <View style={[styles.hintDot, { backgroundColor: targetColor.color }]} />
                  <Text style={[styles.hintColor, { color: targetColor.color }]}>{targetColor.key}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.feedbackBlock}>
                <SvgXml
                  xml={gameState === 'correct' ? correctIconXml : wrongIconXml}
                  width={64}
                  height={64}
                />
                <Text style={[styles.feedbackWord, { color: gameState === 'correct' ? '#10b981' : '#ef4444' }]}>
                  {gameState === 'correct' ? 'CORRETO!' : 'ERROU!'}
                </Text>
                {gameState === 'correct' && lastResult && (
                  <Text style={[styles.feedbackRt, { color: getLevelInfo(lastResult.rt).color }]}>
                    {lastResult.rt} ms
                  </Text>
                )}
              </View>
            )}
            {/* Grid — dimmed during feedback states */}
            <View style={[styles.grid, (gameState === 'correct' || gameState === 'wrong') && styles.gridDimmed]}>
              {colorOrder.map((colorIdx) => {
                const c = CIRCLE_COLORS[colorIdx];
                return (
                  <Pressable
                    key={colorIdx}
                    style={({ pressed }) => [
                      styles.circle,
                      { backgroundColor: c.color, opacity: pressed ? 0.7 : 1 },
                    ]}
                    onPressIn={() => handleCirclePress(colorIdx)}
                    disabled={gameState !== 'challenge'}
                  />
                );
              })}
            </View>
          </View>
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

  topBar: { paddingHorizontal: 20, paddingBottom: 8 },
  topBarRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtnSpacer: { width: 32 },
  backBtn: {
    width: 32, height: 28, borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1, borderColor: '#f59e0b',
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  backText: { color: '#f59e0b', fontSize: 16, fontWeight: '700', lineHeight: 16, marginTop: -1 },
  progressInfo: { flexDirection: 'row', justifyContent: 'center' },
  roundText: { textAlign: 'center', fontSize: 13, color: '#4a5a7b', fontWeight: '600' },
  roundNum: { fontSize: 20, fontWeight: '900', color: '#fff' },
  roundTotal: { fontSize: 13, color: '#2d3a55' },

  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1a2540', borderWidth: 1, borderColor: '#2d3a55' },
  dotCurrent: { borderColor: '#fff' },
  dotDone: { backgroundColor: '#10b981', borderColor: '#10b981' },
  dotFalse: { backgroundColor: '#ef4444', borderColor: '#ef4444' },

  hintArea: { alignItems: 'center', paddingVertical: 16, minHeight: 80, justifyContent: 'center' },
  hintLabel: { fontSize: 11, fontWeight: '700', color: '#4a5a7b', letterSpacing: 2, marginBottom: 10 },
  hintBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 20, borderWidth: 1,
    paddingHorizontal: 20, paddingVertical: 10,
  },
  hintDot: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 3, borderColor: '#ffffff',
  },
  hintColor: { fontSize: 16, fontWeight: '800', letterSpacing: 2 },
  feedbackBlock: { alignItems: 'center', gap: 10 },
  feedbackWord: { fontSize: 22, fontWeight: '900', letterSpacing: 3 },
  feedbackRt: { fontSize: 42, fontWeight: '900', letterSpacing: -1 },

  centeredFull: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  waitingDots: { fontSize: 48, color: '#2d3a55', letterSpacing: 12 },
  waitingHint: { fontSize: 13, fontWeight: '700', color: '#4a5a7b', letterSpacing: 1.5 },

  gridContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 40 },
  gridInner: { flexDirection: 'column', alignItems: 'center', gap: 24 },
  badgeArea: { alignItems: 'center' },
  grid: { width: 280, height: 280, flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  gridDimmed: { opacity: 0.3 },
  circle: {
    width: 124, height: 124, borderRadius: 62,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },

  introContainer: { flex: 1, paddingHorizontal: 24, justifyContent: 'center', paddingBottom: 40 },
  introTitle: { fontSize: 34, fontWeight: '900', color: '#06b6d4', letterSpacing: 3, textAlign: 'center', marginBottom: 6 },
  introSub: { fontSize: 14, color: '#4a5a7b', textAlign: 'center', marginBottom: 32 },
  howToCard: {
    backgroundColor: '#0f1f2a',
    borderLeftWidth: 4, borderLeftColor: '#06b6d4',
    borderRadius: 12, padding: 16, marginBottom: 28,
  },
  howToTitle: { fontSize: 13, fontWeight: '700', color: '#06b6d4', letterSpacing: 0.5, marginBottom: 8 },
  howToText: { fontSize: 14, color: '#cbd5e1', lineHeight: 20 },
  startBtn: { backgroundColor: '#06b6d4', borderRadius: 14, paddingVertical: 18, alignItems: 'center' },
  startBtnText: { fontSize: 16, fontWeight: '800', color: '#000', letterSpacing: 2 },
});

export type { RoundResult };
