import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, TouchableOpacity,
  Platform, StatusBar as RNStatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';

const TOP = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 44;

// Mirrors ModoPartida / TriageBaseline partida jitter window.
const JITTER_MIN = 1000;
const JITTER_MAX = 4000;
const TOTAL_ROUNDS = 3;

type Phase = 'intro' | 'wait' | 'go' | 'tooearly';

interface Props {
  // Returns the user's best (fastest) reaction time across the 3 valid taps.
  onNext: (rt: number) => void;
}

export default function OB1FirstGame({ onNext }: Props) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>('intro');
  const [progress, setProgress] = useState(0); // completed valid taps

  const rtsRef = useRef<number[]>([]);
  const signalTime = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
  };

  useEffect(() => () => clearTimer(), []);

  // Schedule the green stimulus after a random jitter when waiting.
  useEffect(() => {
    clearTimer();
    if (phase === 'wait') {
      const delay = Math.floor(Math.random() * (JITTER_MAX - JITTER_MIN)) + JITTER_MIN;
      timer.current = setTimeout(() => {
        signalTime.current = Date.now();
        setPhase('go');
      }, delay);
    } else if (phase === 'tooearly') {
      timer.current = setTimeout(() => setPhase('wait'), 900);
    }
  }, [phase]);

  const start = useCallback(() => {
    rtsRef.current = [];
    setProgress(0);
    setPhase('wait');
  }, []);

  const handleFalseStart = useCallback(() => {
    if (phase !== 'wait') return;
    clearTimer();
    setPhase('tooearly');
  }, [phase]);

  const handleGoTap = useCallback(() => {
    if (phase !== 'go') return;
    const rt = Date.now() - signalTime.current;
    rtsRef.current.push(rt);
    const n = rtsRef.current.length;
    setProgress(n);
    if (n >= TOTAL_ROUNDS) {
      const best = Math.min(...rtsRef.current);
      onNext(best);
    } else {
      setPhase('wait');
    }
  }, [phase, onNext]);

  const currentRound = Math.min(progress + 1, TOTAL_ROUNDS);

  const renderProgress = () => (
    <View style={styles.progressRow}>
      {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
        <View key={i} style={[styles.progressSeg, i < progress && styles.progressSegDone]} />
      ))}
    </View>
  );

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <View style={styles.root}>
        <View style={styles.centerBody}>
          <Text style={styles.kicker}>{t('onboarding.ob.ob1.kicker')}</Text>
          <View style={styles.targetArea}>
            <View style={styles.ring} />
            <View style={[styles.circle, { backgroundColor: '#10b981' }]} />
          </View>
          <Text style={styles.prompt}>{t('onboarding.ob.ob1.tapWhenGreen')}</Text>
          <Text style={styles.sub}>{t('onboarding.ob.ob1.sub')}</Text>
        </View>
        <View style={[styles.footer, { paddingBottom: 40 }]}>
          <TouchableOpacity style={styles.btnPrimary} onPress={start} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>{t('onboarding.ob.ob1.startBtn')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── WAIT (jitter — dark; tap = too early) ────────────────────────────────────
  if (phase === 'wait') {
    return (
      <Pressable style={styles.root} onPressIn={handleFalseStart}>
        <View style={styles.centerBody}>
          <Text style={styles.kicker}>{t('onboarding.ob.ob1.kicker')}</Text>
          <View style={styles.targetArea}>
            <View style={styles.ring} />
            <View style={[styles.circle, styles.circleWaiting]} />
          </View>
          <Text style={styles.waitHint}>{t('onboarding.ob.ob1.wait')}</Text>
          {renderProgress()}
          <Text style={styles.roundLabel}>{t('onboarding.ob.progress', { cur: currentRound, total: TOTAL_ROUNDS })}</Text>
        </View>
      </Pressable>
    );
  }

  // ── TOO EARLY ────────────────────────────────────────────────────────────────
  if (phase === 'tooearly') {
    return (
      <View style={styles.root}>
        <View style={styles.centerBody}>
          <Text style={styles.kicker}>{t('onboarding.ob.ob1.kicker')}</Text>
          <View style={styles.targetArea}>
            <View style={styles.ring} />
            <View style={[styles.circle, { backgroundColor: '#ef4444' }]} />
          </View>
          <Text style={styles.tooEarly}>{t('onboarding.ob.tooEarly')}</Text>
          {renderProgress()}
          <Text style={styles.roundLabel}>{t('onboarding.ob.progress', { cur: currentRound, total: TOTAL_ROUNDS })}</Text>
        </View>
      </View>
    );
  }

  // ── GO (green) ───────────────────────────────────────────────────────────────
  return (
    <Pressable style={styles.root} onPressIn={handleGoTap}>
      <View style={styles.centerBody}>
        <Text style={styles.kicker}>{t('onboarding.ob.ob1.kicker')}</Text>
        <View style={styles.targetArea}>
          <View style={styles.ring} />
          <View style={[styles.circle, styles.circleGo]} />
        </View>
        <Text style={styles.goHint}>{t('onboarding.ob.ob1.tapNow')}</Text>
        {renderProgress()}
        <Text style={styles.roundLabel}>{t('onboarding.ob.progress', { cur: currentRound, total: TOTAL_ROUNDS })}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080c10' },
  centerBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: TOP,
    paddingHorizontal: 28,
    gap: 18,
  },
  kicker: {
    fontSize: 11, fontWeight: '700', color: '#3a4a6b',
    letterSpacing: 2.5, textAlign: 'center',
  },
  targetArea: {
    width: 180, height: 180,
    alignItems: 'center', justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 180, height: 180, borderRadius: 90,
    borderWidth: 1.5, borderColor: 'rgba(74,255,163,0.18)',
    borderStyle: 'dashed',
  },
  circle: { width: 120, height: 120, borderRadius: 60 },
  circleWaiting: { backgroundColor: '#1e2533' },
  circleGo: {
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 28, elevation: 22,
  },
  prompt: { fontSize: 16, fontWeight: '700', color: '#fff', textAlign: 'center' },
  sub: { fontSize: 13, color: '#7a8aa0', textAlign: 'center' },
  waitHint: { fontSize: 14, fontWeight: '700', color: '#4a5a7b', letterSpacing: 1 },
  goHint: { fontSize: 16, fontWeight: '900', color: '#10b981', letterSpacing: 3 },
  tooEarly: { fontSize: 16, fontWeight: '900', color: '#ef4444', letterSpacing: 1.5 },

  progressRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  progressSeg: {
    width: 28, height: 4, borderRadius: 2,
    backgroundColor: '#252d3e',
  },
  progressSegDone: { backgroundColor: '#10b981' },
  roundLabel: { fontSize: 11, color: '#3a4a6b', letterSpacing: 0.5 },

  footer: { paddingHorizontal: 24, paddingTop: 8 },
  btnPrimary: {
    backgroundColor: '#10b981', borderRadius: 14,
    paddingVertical: 18, alignItems: 'center',
  },
  btnPrimaryText: { fontSize: 15, fontWeight: '900', color: '#06121f', letterSpacing: 1.5 },
});
