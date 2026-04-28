import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, Animated, Alert,
  TouchableOpacity, Platform, StatusBar as RNStatusBar,
} from 'react-native';
import { getLevelInfo } from '../utils/levels';
import { playSfx } from '../utils/sfx';

const TOTAL_ROUNDS = 7;
const FALSE_START = 500;
const MIN_DELAY = 1000;
const MAX_DELAY = 4000;

type GameState = 'ready' | 'waiting' | 'signal' | 'done';

interface LastResult { time: number; isFalseStart: boolean }

interface Props {
  onComplete: (times: number[], falseStartCount: number) => void;
  onBack: () => void;
}

const TOP = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 44;

export default function ModoPartida({ onComplete, onBack }: Props) {
  const [started, setStarted] = useState(false);
  const [showReady, setShowReady] = useState(false);
  const [gameState, setGameState] = useState<GameState>('ready');
  const [round, setRound] = useState(1);
  const [times, setTimes] = useState<number[]>([]);
  const [lastResult, setLastResult] = useState<LastResult | null>(null);

  const signalTime = useRef<number>(0);
  const delayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const responded = useRef(false);
  const falseStartCount = useRef(0);

  const circleScale = useRef(new Animated.Value(0)).current;
  const circleOpacity = useRef(new Animated.Value(0)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const flashIsRed = useRef(false);

  useEffect(() => () => {
    if (delayTimer.current) clearTimeout(delayTimer.current);
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
  }, []);

  const flash = useCallback((red: boolean) => {
    flashIsRed.current = red;
    flashOpacity.setValue(0.55);
    Animated.timing(flashOpacity, { toValue: 0, duration: 700, useNativeDriver: true }).start();
  }, [flashOpacity]);

  const recordResult = useCallback((time: number, isFalseStart: boolean) => {
    responded.current = true;
    if (delayTimer.current) clearTimeout(delayTimer.current);

    if (isFalseStart) falseStartCount.current += 1;

    const result: LastResult = { time, isFalseStart };
    setLastResult(result);
    const newTimes = [...times, time];
    setTimes(newTimes);
    flash(isFalseStart);
    setGameState('done');

    advanceTimer.current = setTimeout(() => {
      const next = round + 1;
      if (next > TOTAL_ROUNDS) {
        onComplete(newTimes, falseStartCount.current);
      } else {
        setRound(next);
        setGameState('ready');
      }
    }, 1800);
  }, [times, round, flash, onComplete]);

  const startRound = useCallback(() => {
    responded.current = false;
    circleScale.setValue(0);
    circleOpacity.setValue(0);
    setGameState('waiting');

    const delay = Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY)) + MIN_DELAY;
    delayTimer.current = setTimeout(() => {
      setGameState('signal'); // signalTime captured in useEffect after this render
      circleOpacity.setValue(1); // instant — fade-in adds untracked perceptual latency
      Animated.spring(circleScale, { toValue: 1, useNativeDriver: true, tension: 150, friction: 7 }).start();
    }, delay);
  }, [circleScale, circleOpacity]);

  // Timer starts after 'signal' render commit — matches ModoAlvo/ModoRadar pattern.
  useEffect(() => {
    if (gameState === 'signal') {
      signalTime.current = Date.now();
    }
  }, [gameState]);

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

  const handlePress = useCallback(() => {
    if (responded.current) return;
    if (gameState === 'waiting') {
      recordResult(FALSE_START, true);
    } else if (gameState === 'signal') {
      playSfx('hit');
      recordResult(Date.now() - signalTime.current, false);
    }
  }, [gameState, recordResult]);

  // ── Render helpers ──────────────────────────────────────────────────────────

  const renderDots = () => (
    <View style={styles.dotsRow}>
      {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => {
        const done = i < times.length;
        const cur = i === round - 1;
        const falseStart = done && times[i] === FALSE_START;
        return (
          <View key={i} style={[
            styles.dot,
            cur && styles.dotCurrent,
            done && (falseStart ? styles.dotFalse : styles.dotDone),
          ]} />
        );
      })}
    </View>
  );

  const renderReady = () => {
    const lvl = lastResult && !lastResult.isFalseStart ? getLevelInfo(lastResult.time) : null;
    return (
      <View style={styles.readyContainer}>
        {renderDots()}

        <Text style={styles.roundLabel}>
          RODADA <Text style={styles.roundNum}>{round}</Text>
          <Text style={styles.roundTotal}> / {TOTAL_ROUNDS}</Text>
        </Text>

        {lastResult ? (
          <View style={styles.lastBox}>
            {lastResult.isFalseStart ? (
              <>
                <Text style={styles.falseTag}>FALSA LARGADA</Text>
                <Text style={styles.penaltyNote}>500 ms fixo</Text>
              </>
            ) : (
              <>
                <Text style={[styles.lastTime, { color: lvl?.color }]}>
                  {lastResult.time} ms
                </Text>
                <Text style={[styles.lastLevel, { color: lvl?.color }]}>
                  {lvl?.label}
                </Text>
              </>
            )}
          </View>
        ) : (
          <View style={styles.instrBox}>
            <Text style={styles.instrHint}>
              Aguarde a tela escura — toque assim que o círculo verde aparecer
            </Text>
            <Text style={styles.instrWarn}>Tocar antes = falsa largada (500 ms fixo)</Text>
          </View>
        )}

        <TouchableOpacity style={styles.startBtn} onPress={startRound} activeOpacity={0.8}>
          <Text style={styles.startBtnText}>INICIAR RODADA {round}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderWaiting = () => (
    <View style={[styles.centeredFull, { pointerEvents: 'none' }]}>
      <Text style={styles.waitingDots}>· · ·</Text>
    </View>
  );

  const renderSignal = () => (
    <View style={[styles.centeredFull, { pointerEvents: 'none' }]}>
      <Animated.View style={[
        styles.circle,
        { opacity: circleOpacity, transform: [{ scale: circleScale }] },
      ]} />
    </View>
  );

  const renderDone = () => {
    if (!lastResult) return null;
    const { time, isFalseStart } = lastResult;
    const lvl = isFalseStart ? null : getLevelInfo(time);
    return (
      <View style={[styles.centeredFull, { pointerEvents: 'none' }]}>
        {isFalseStart ? (
          <>
            <Text style={styles.falseStartBig}>FALSA{'\n'}LARGADA</Text>
            <Text style={styles.penaltyBig}>500 ms fixo</Text>
          </>
        ) : (
          <>
            <Text style={[styles.resultNum, { color: lvl?.color }]}>{time}</Text>
            <Text style={styles.msUnit}>ms</Text>
            <View style={[styles.levelPill, { backgroundColor: lvl?.bg }]}>
              <Text style={[styles.levelPillText, { color: lvl?.color }]}>
                {lvl?.label}
              </Text>
            </View>
          </>
        )}
      </View>
    );
  };

  const touchActive = gameState === 'waiting' || gameState === 'signal';

  if (!started) {
    return (
      <View style={[styles.screen, { backgroundColor: '#0b1220' }]}>
        <View style={[styles.topBar, { paddingTop: TOP + 8 }]}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.introContainer}>
          <Text style={styles.introTitle}>MODO PARTIDA</Text>
          <Text style={styles.introSub}>7 tentativas · reação simples</Text>
          <View style={styles.howToCard}>
            <Text style={styles.howToTitle}>Como jogar</Text>
            <Text style={styles.howToText}>
              Aguarde a tela escurecer. Toque assim que o círculo verde aparecer. Quanto mais rápido, melhor.
            </Text>
          </View>
          <TouchableOpacity style={styles.introStartBtn} onPress={() => {
            setStarted(true);
            setShowReady(true);
            setTimeout(() => { setShowReady(false); startRound(); }, 1500);
          }} activeOpacity={0.8}>
            <Text style={styles.introStartBtnText}>INICIAR</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {!showReady && gameState === 'ready' && renderReady()}
      {!showReady && gameState === 'waiting' && renderWaiting()}
      {!showReady && gameState === 'signal' && renderSignal()}
      {!showReady && gameState === 'done' && renderDone()}

      {showReady && (
        <View style={[styles.centeredFull, { pointerEvents: 'none' }]}>
          <Text style={styles.readyBig}>READY</Text>
        </View>
      )}

      {!showReady && touchActive && (
        <Pressable style={StyleSheet.absoluteFill} onPressIn={handlePress} />
      )}

      <View style={[styles.topBar, styles.topBarOverlay, { paddingTop: TOP + 8 }]}>
        <TouchableOpacity onPress={confirmAbort} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { pointerEvents: 'none' },
          { backgroundColor: flashIsRed.current ? '#FF4444' : '#00FF44', opacity: flashOpacity },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  topBar: {
    paddingHorizontal: 20,
  },
  topBarOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
  },
  backBtn: {
    width: 32, height: 28, borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1, borderColor: '#f59e0b',
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  backText: { color: '#f59e0b', fontSize: 16, fontWeight: '700', lineHeight: 16, marginTop: -1 },

  readyContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 32,
  },
  dot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#1E1E1E',
    borderWidth: 1, borderColor: '#2A2A2A',
  },
  dotCurrent: { borderColor: '#FFFFFF' },
  dotDone:    { backgroundColor: '#00C840', borderColor: '#00C840' },
  dotFalse:   { backgroundColor: '#FF4444', borderColor: '#FF4444' },

  roundLabel: { textAlign: 'center', marginBottom: 28 },
  roundNum:   { fontSize: 44, fontWeight: '900', color: '#FFFFFF' },
  roundTotal: { fontSize: 22, fontWeight: '600', color: '#3A3A3A' },

  lastBox: {
    alignItems: 'center', minHeight: 80,
    justifyContent: 'center', marginBottom: 36,
  },
  falseTag:    { fontSize: 18, fontWeight: '800', color: '#FF4444', letterSpacing: 2 },
  penaltyNote: { fontSize: 13, color: '#FF7777', marginTop: 6 },
  lastTime:    { fontSize: 54, fontWeight: '900', letterSpacing: -1 },
  lastLevel:   { fontSize: 13, fontWeight: '700', letterSpacing: 2, marginTop: 4 },

  instrBox: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 18,
    marginBottom: 36,
    borderWidth: 1, borderColor: '#1E1E1E',
    gap: 8,
  },
  instrHint: { fontSize: 14, color: '#888', lineHeight: 20 },
  instrWarn: { fontSize: 13, color: '#FF7777' },

  startBtn: {
    backgroundColor: '#00C840',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  startBtnText: {
    fontSize: 16, fontWeight: '800',
    color: '#000', letterSpacing: 2,
  },

  centeredFull: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
  waitingDots: { fontSize: 32, color: '#1E1E1E', letterSpacing: 12 },
  readyBig: {
    fontSize: 64, fontWeight: '900', color: '#3b82f6',
    letterSpacing: 6, textAlign: 'center',
  },

  circle: {
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: '#00FF44',
    elevation: 20,
    shadowColor: '#00FF44',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 40,
  },

  resultNum:     { fontSize: 92, fontWeight: '900', letterSpacing: -3, lineHeight: 98 },
  msUnit:        { fontSize: 22, fontWeight: '600', color: '#555', letterSpacing: 2, marginTop: 4 },
  levelPill:     { borderRadius: 20, paddingHorizontal: 22, paddingVertical: 8, marginTop: 20 },
  levelPillText: { fontSize: 13, fontWeight: '800', letterSpacing: 2 },

  falseStartBig: {
    fontSize: 38, fontWeight: '900', color: '#FF4444',
    letterSpacing: 2, textAlign: 'center', lineHeight: 46,
  },
  penaltyBig: { fontSize: 28, fontWeight: '700', color: '#FF7777', marginTop: 16 },

  // ── Intro screen ─────────────────────────────────────────────────────────────
  introContainer: {
    flex: 1, paddingHorizontal: 24, paddingBottom: 40,
    justifyContent: 'center', gap: 20,
  },
  introTitle: {
    fontSize: 32, fontWeight: '900', color: '#3b82f6',
    letterSpacing: 2, textAlign: 'center',
  },
  introSub: {
    fontSize: 14, color: '#4a5a7b', textAlign: 'center', marginTop: -12,
  },
  howToCard: {
    backgroundColor: '#1a2a1a',
    borderLeftWidth: 4, borderLeftColor: '#22c55e',
    borderRadius: 12, padding: 16,
  },
  howToTitle: { fontSize: 13, fontWeight: '700', color: '#22c55e', letterSpacing: 0.5, marginBottom: 8 },
  howToText: { fontSize: 14, color: '#cbd5e1', lineHeight: 20 },
  introStartBtn: {
    backgroundColor: '#3b82f6', borderRadius: 16,
    paddingVertical: 18, alignItems: 'center',
  },
  introStartBtnText: {
    fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 2,
  },
});
