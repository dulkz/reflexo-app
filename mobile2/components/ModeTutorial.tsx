import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Pressable, Animated, AccessibilityInfo, StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { ModeKey, MODE_COLORS } from '../utils/levels';

// ── Palette (aligned with the app's design system) ───────────────────────────
const BG2   = '#111a2e';
const BG3   = '#1e2d45';
const GREEN = '#10b981';
const RED   = '#ef4444';
const TEXT0 = '#e2e8f0';
const TEXT1 = '#7a8aa0';
const TEXT2 = '#4a5a7b';

// 6-digit hex + opacity (0-1) → 8-digit hex (RN supports #rrggbbaa).
function hexA(color: string, opacity: number): string {
  const h = color.replace('#', '');
  const a = Math.round(opacity * 255).toString(16).padStart(2, '0');
  return `#${h}${a}`;
}

// ── AsyncStorage keys — one per mode ──────────────────────────────────────────
const STORAGE_KEY: Record<ModeKey, string> = {
  partida:   'mode_tutorial_seen_partida',
  alvo:      'mode_tutorial_seen_alvo',
  sequencia: 'mode_tutorial_seen_sequencia',
  radar:     'mode_tutorial_seen_radar',
};

interface Props {
  modeKey: ModeKey;
}

// Shell: first-open gating + "não mostrar novamente" + fade animations.
export default function ModeTutorial({ modeKey }: Props) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [seen, rm] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY[modeKey]),
        AccessibilityInfo.isReduceMotionEnabled().catch(() => false),
      ]);
      if (!mounted) return;
      setReduceMotion(rm);
      if (!seen) {
        setVisible(true);
        Animated.timing(fade, { toValue: 1, duration: rm ? 0 : 250, useNativeDriver: true }).start();
      }
    })();
    return () => { mounted = false; };
  }, [modeKey, fade]);

  const dismiss = async () => {
    await AsyncStorage.setItem(STORAGE_KEY[modeKey], 'true');
    Animated.timing(fade, { toValue: 0, duration: reduceMotion ? 0 : 200, useNativeDriver: true })
      .start(() => setVisible(false));
  };

  if (!visible) return null;
  const color = MODE_COLORS[modeKey].accent;

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fade, backgroundColor: hexA(color, 0.10), borderColor: hexA(color, 0.22) },
      ]}
    >
      <Pressable
        style={styles.dismissBtn}
        onPress={dismiss}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t('tutorial.dontShowAgain')}
      >
        <Text style={styles.dismissText}>{t('tutorial.dontShowAgain')}</Text>
      </Pressable>

      <View style={styles.visualArea}>
        {modeKey === 'partida'   && <PartidaTutorial color={color} reduceMotion={reduceMotion} />}
        {modeKey === 'alvo'      && <AlvoTutorial reduceMotion={reduceMotion} />}
        {modeKey === 'sequencia' && <SequenciaTutorial reduceMotion={reduceMotion} />}
        {modeKey === 'radar'     && <RadarTutorial color={color} reduceMotion={reduceMotion} />}
      </View>
    </Animated.View>
  );
}

interface SubProps {
  reduceMotion: boolean;
  color?: string;
}

// ── Partida — círculo grande acende + dedo toca ───────────────────────────────
function PartidaTutorial({ color = '#3b82f6', reduceMotion }: SubProps) {
  const { t } = useTranslation();
  const lit   = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const dotOpacity = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const dotY = useRef(new Animated.Value(reduceMotion ? 0 : -12)).current;

  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.06, duration: 300, useNativeDriver: false }),
        Animated.timing(scale, { toValue: 1,    duration: 300, useNativeDriver: false }),
      ]),
      Animated.parallel([
        Animated.timing(lit, { toValue: 1, duration: 180, useNativeDriver: false }),
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.12, duration: 100, useNativeDriver: false }),
          Animated.timing(scale, { toValue: 1,    duration: 180, useNativeDriver: false }),
        ]),
      ]),
      Animated.parallel([
        Animated.timing(dotOpacity, { toValue: 1, duration: 180, useNativeDriver: false }),
        Animated.timing(dotY,       { toValue: 0, duration: 360, useNativeDriver: false }),
      ]),
      Animated.delay(650),
      Animated.parallel([
        Animated.timing(lit,        { toValue: 0,   duration: 180, useNativeDriver: false }),
        Animated.timing(dotOpacity, { toValue: 0,   duration: 150, useNativeDriver: false }),
        Animated.timing(dotY,       { toValue: -12, duration: 0,   useNativeDriver: false }),
      ]),
      Animated.delay(120),
    ]));
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, lit, scale, dotOpacity, dotY]);

  const bg     = lit.interpolate({ inputRange: [0, 1], outputRange: [BG2, color] });
  const border = lit.interpolate({ inputRange: [0, 1], outputRange: [BG3, color] });

  // Column layout — mirrors AlvoTutorial: visual on top, single centered
  // explanation below (no duplicated mode title; that's the screen's job).
  return (
    <View style={styles.col}>
      <View style={styles.stage}>
        <Animated.View style={[styles.circle, { backgroundColor: bg, borderColor: border, transform: [{ scale }] }]} />
        <Animated.View style={[styles.touchDot, { opacity: dotOpacity, transform: [{ translateY: dotY }] }]} />
      </View>
      <Text style={styles.legendCenter}>
        {t('tutorial.partida.line1')} {t('tutorial.partida.line2')}
      </Text>
    </View>
  );
}

// ── Alvo — grid 2x2 de posições FIXAS, dedo na cor correta, prompt "TOQUE O [COR]" ──
// Posições permanentes: TL azul · TR laranja · BL roxo · BR verde
const ALVO_COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981'];
const ALVO_KEYS = ['AZUL', 'LARANJA', 'ROXO', 'VERDE'];
const ALVO_TARGET = 3; // verde (bottom-right)

function AlvoTutorial({ reduceMotion }: SubProps) {
  const { t } = useTranslation();
  const glow      = useRef(new Animated.Value(reduceMotion ? 0.4 : 0)).current;
  const glowScale = useRef(new Animated.Value(reduceMotion ? 1.15 : 1)).current;
  const dotOpacity = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const dotX = useRef(new Animated.Value(reduceMotion ? 30 : 0)).current;
  const dotY = useRef(new Animated.Value(reduceMotion ? 30 : 0)).current;

  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.parallel([
        Animated.timing(glow, { toValue: 0.45, duration: 300, useNativeDriver: false }),
        Animated.sequence([
          Animated.timing(glowScale, { toValue: 1.2,  duration: 250, useNativeDriver: false }),
          Animated.timing(glowScale, { toValue: 1.08, duration: 250, useNativeDriver: false }),
        ]),
      ]),
      Animated.parallel([
        Animated.timing(dotOpacity, { toValue: 1,  duration: 200, useNativeDriver: false }),
        Animated.timing(dotX,       { toValue: 30, duration: 600, useNativeDriver: false }),
        Animated.timing(dotY,       { toValue: 30, duration: 600, useNativeDriver: false }),
      ]),
      Animated.delay(800),
      Animated.parallel([
        Animated.timing(dotOpacity, { toValue: 0, duration: 150, useNativeDriver: false }),
        Animated.timing(glow,       { toValue: 0, duration: 200, useNativeDriver: false }),
        Animated.timing(dotX,       { toValue: 0, duration: 0,   useNativeDriver: false }),
        Animated.timing(dotY,       { toValue: 0, duration: 0,   useNativeDriver: false }),
        Animated.timing(glowScale,  { toValue: 1, duration: 0,   useNativeDriver: false }),
      ]),
      Animated.delay(150),
    ]));
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, glow, glowScale, dotOpacity, dotX, dotY]);

  return (
    <View style={styles.col}>
      <View style={styles.alvoPrompt}>
        <View style={[styles.promptDot, { backgroundColor: GREEN }]} />
        <Text style={styles.promptText}>{t('tutorial.alvo.prompt')}</Text>
      </View>
      <View style={styles.grid}>
        {ALVO_COLORS.map((c, i) => {
          const isTarget = i === ALVO_TARGET;
          return (
            <View key={i} style={styles.gridCell}>
              {isTarget && (
                <Animated.View style={[styles.gridGlow, { opacity: glow, transform: [{ scale: glowScale }], backgroundColor: GREEN }]} />
              )}
              <View style={[styles.gridCircle, { backgroundColor: c, opacity: isTarget ? 1 : 0.35 }]} />
            </View>
          );
        })}
        <Animated.View style={[styles.gridDot, { opacity: dotOpacity, transform: [{ translateX: dotX }, { translateY: dotY }] }]} />
      </View>
      {/* Legenda das 4 posições fixas */}
      <View style={styles.alvoLegend}>
        {ALVO_COLORS.map((col, i) => (
          <View key={i} style={styles.alvoLegendChip}>
            <View style={[styles.alvoLegendDot, { backgroundColor: col }]} />
            <Text style={styles.alvoLegendText}>{t(`target.colors.${ALVO_KEYS[i]}`)}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.legendCenter}>{t('tutorial.alvo.text')}</Text>
    </View>
  );
}

// ── Sequência — círculo Go (verde) / NoGo (vermelho) alternando ───────────────
function SequenciaTutorial({ reduceMotion }: SubProps) {
  const { t } = useTranslation();
  const go    = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const nogo  = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const dotOpacity = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(Animated.sequence([
      // GO phase
      Animated.timing(go, { toValue: 1, duration: 180, useNativeDriver: false }),
      Animated.parallel([
        Animated.timing(scale,      { toValue: 1.1, duration: 150, useNativeDriver: false }),
        Animated.timing(dotOpacity, { toValue: 1,   duration: 200, useNativeDriver: false }),
      ]),
      Animated.delay(450),
      Animated.parallel([
        Animated.timing(go,         { toValue: 0, duration: 180, useNativeDriver: false }),
        Animated.timing(dotOpacity, { toValue: 0, duration: 150, useNativeDriver: false }),
        Animated.timing(scale,      { toValue: 1, duration: 180, useNativeDriver: false }),
      ]),
      Animated.delay(400),
      // NoGo phase
      Animated.timing(nogo, { toValue: 1, duration: 180, useNativeDriver: false }),
      Animated.timing(scale, { toValue: 0.94, duration: 150, useNativeDriver: false }),
      Animated.delay(600),
      Animated.parallel([
        Animated.timing(nogo,  { toValue: 0, duration: 180, useNativeDriver: false }),
        Animated.timing(scale, { toValue: 1, duration: 180, useNativeDriver: false }),
      ]),
      Animated.delay(800),
    ]));
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, go, nogo, scale, dotOpacity]);

  return (
    <View style={styles.col}>
      <View style={styles.stage}>
        <View style={[styles.circle, { backgroundColor: BG2, borderColor: BG3 }]} />
        <Animated.View style={[styles.circle, styles.circleAbs, { backgroundColor: GREEN, opacity: go, transform: [{ scale }] }]}>
          <Text style={styles.signalLabel}>GO</Text>
        </Animated.View>
        <Animated.View style={[styles.circle, styles.circleAbs, { backgroundColor: RED, opacity: nogo, transform: [{ scale }] }]}>
          <Text style={styles.signalLabel}>NO-GO</Text>
        </Animated.View>
        <Animated.View style={[styles.touchDot, { opacity: dotOpacity }]} />
      </View>
      <View style={styles.seqLegend}>
        <View style={styles.seqRow}>
          <View style={[styles.seqDot, { backgroundColor: GREEN }]} />
          <Text style={styles.legendLine}>{t('tutorial.sequencia.go')}</Text>
        </View>
        <View style={styles.seqRow}>
          <View style={[styles.seqDot, { backgroundColor: RED }]} />
          <Text style={styles.legendLine}>{t('tutorial.sequencia.nogo')}</Text>
        </View>
      </View>
      <Text style={styles.legendCenter}>{t('tutorial.sequencia.text')}</Text>
    </View>
  );
}

// ── Radar — 5 círculos em cruz, dedo no que acender ───────────────────────────
const RADAR_POSITIONS = [
  { x: 0,   y: 0   }, // centro
  { x: 0,   y: -46 }, // topo
  { x: 46,  y: 0   }, // direita
  { x: 0,   y: 46  }, // baixo
  { x: -46, y: 0   }, // esquerda
];
const RADAR_CYCLE = [2, 4]; // direita → esquerda

function RadarTutorial({ color = '#f59e0b', reduceMotion }: SubProps) {
  const { t } = useTranslation();
  const [activeIdx, setActiveIdx] = useState(RADAR_CYCLE[0]);
  const glow       = useRef(new Animated.Value(reduceMotion ? 0.5 : 0)).current;
  const glowScale  = useRef(new Animated.Value(reduceMotion ? 1.1 : 1)).current;
  const dotOpacity = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const dotX = useRef(new Animated.Value(reduceMotion ? RADAR_POSITIONS[RADAR_CYCLE[0]].x : 0)).current;
  const dotY = useRef(new Animated.Value(reduceMotion ? RADAR_POSITIONS[RADAR_CYCLE[0]].y : 0)).current;
  const cycleCount = useRef(0);
  const running = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (reduceMotion) { setActiveIdx(RADAR_CYCLE[0]); return; }
    let stopped = false;

    function runCycle() {
      if (stopped) return;
      const idx = RADAR_CYCLE[cycleCount.current % RADAR_CYCLE.length];
      const pos = RADAR_POSITIONS[idx];
      setActiveIdx(idx);
      dotX.setValue(0);
      dotY.setValue(0);

      const cycle = Animated.sequence([
        Animated.parallel([
          Animated.timing(glow,      { toValue: 0.5,  duration: 250, useNativeDriver: false }),
          Animated.timing(glowScale, { toValue: 1.15, duration: 250, useNativeDriver: false }),
        ]),
        Animated.parallel([
          Animated.timing(dotOpacity, { toValue: 1,     duration: 200, useNativeDriver: false }),
          Animated.timing(dotX,       { toValue: pos.x, duration: 500, useNativeDriver: false }),
          Animated.timing(dotY,       { toValue: pos.y, duration: 500, useNativeDriver: false }),
        ]),
        Animated.delay(500),
        Animated.parallel([
          Animated.timing(glow,       { toValue: 0, duration: 200, useNativeDriver: false }),
          Animated.timing(dotOpacity, { toValue: 0, duration: 150, useNativeDriver: false }),
          Animated.timing(glowScale,  { toValue: 1, duration: 0,   useNativeDriver: false }),
        ]),
        Animated.delay(300),
      ]);
      running.current = cycle;
      cycle.start(({ finished }) => {
        if (finished && !stopped) {
          cycleCount.current += 1;
          runCycle();
        }
      });
    }

    runCycle();
    return () => { stopped = true; running.current?.stop(); };
  }, [reduceMotion, glow, glowScale, dotOpacity, dotX, dotY]);

  return (
    <View style={styles.col}>
      <View style={styles.radarStage}>
        {RADAR_POSITIONS.map((pos, i) => {
          const isActive = i === activeIdx;
          return (
            <View key={i} style={[styles.radarCell, { left: 70 + pos.x - 21, top: 70 + pos.y - 21 }]}>
              {isActive && (
                <Animated.View style={[styles.radarGlow, { opacity: glow, transform: [{ scale: glowScale }], backgroundColor: color }]} />
              )}
              <View style={[
                styles.radarCircle,
                isActive
                  ? { backgroundColor: color, borderColor: color }
                  : { backgroundColor: BG2, borderColor: BG3 },
              ]} />
            </View>
          );
        })}
        <Animated.View style={[styles.radarDot, { opacity: dotOpacity, transform: [{ translateX: dotX }, { translateY: dotY }] }]} />
      </View>
      <Text style={styles.legendCenter}>{t('tutorial.radar.text')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Shell
  container: {
    width: '100%', alignItems: 'center',
    marginBottom: 16, borderRadius: 14,
    borderWidth: 1, padding: 14,
  },
  dismissBtn: { alignSelf: 'flex-end', marginBottom: 10 },
  dismissText: { fontSize: 11, fontWeight: '500', letterSpacing: 0.2, color: TEXT2 },
  visualArea: { width: '100%', alignItems: 'center' },

  // Layout
  row: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  col: { alignItems: 'center', gap: 12 },
  stage: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center' },

  // Circles
  circle: {
    width: 68, height: 68, borderRadius: 34, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  circleAbs: { position: 'absolute' },
  signalLabel: { color: '#06120c', fontSize: 12, fontWeight: '800', letterSpacing: 1 },

  // Touch dot (fingertip)
  touchDot: {
    position: 'absolute', bottom: 6,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },

  // Legend
  legend: { flex: 1, gap: 4 },
  legendTitle: { color: TEXT0, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 2 },
  legendLine: { color: TEXT1, fontSize: 12, lineHeight: 17 },
  legendCenter: { color: TEXT1, fontSize: 12, lineHeight: 17, textAlign: 'center', paddingHorizontal: 4 },

  // Alvo prompt + grid
  alvoPrompt: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: BG2, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10,
  },
  promptDot: { width: 10, height: 10, borderRadius: 5 },
  promptText: { color: TEXT0, fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  grid: { width: 124, height: 124, flexDirection: 'row', flexWrap: 'wrap', position: 'relative' },
  gridCell: { width: 62, height: 62, alignItems: 'center', justifyContent: 'center' },
  gridCircle: { width: 48, height: 48, borderRadius: 24 },
  gridGlow: { position: 'absolute', width: 56, height: 56, borderRadius: 28 },
  gridDot: {
    position: 'absolute', left: 53, top: 53,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },

  // Alvo — legenda das 4 posições fixas
  alvoLegend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  alvoLegendChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  alvoLegendDot: { width: 9, height: 9, borderRadius: 5 },
  alvoLegendText: { color: TEXT1, fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },

  // Sequência legend
  seqLegend: { gap: 6 },
  seqRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  seqDot: { width: 10, height: 10, borderRadius: 5 },

  // Radar
  radarStage: { width: 140, height: 140, position: 'relative' },
  radarCell: { position: 'absolute', width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  radarCircle: { width: 38, height: 38, borderRadius: 19, borderWidth: 2 },
  radarGlow: { position: 'absolute', width: 48, height: 48, borderRadius: 24 },
  radarDot: {
    position: 'absolute', left: 61, top: 61,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },
});
