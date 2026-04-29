import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Animated, Easing, Dimensions, Platform,
  StatusBar as RNStatusBar,
  NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import Svg, {
  Circle, Polygon, Path, Rect,
  Defs, LinearGradient as SvgLinearGradient, Stop,
} from 'react-native-svg';
import { saveOnboardingDone } from '../utils/storage';

const SCREEN_W = Dimensions.get('window').width;
const TOP = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 44;

const COLORS = {
  cyan:   '#00f5ff',
  blue:   '#3b82f6',
  cyan2:  '#06b6d4',
  purple: '#8b5cf6',
  amber:  '#f59e0b',
  green:  '#10b981',
};

const SCREEN_COLORS = [COLORS.cyan, COLORS.blue, COLORS.purple, COLORS.amber, COLORS.green];

// Subtle accent-tinted top color for each screen's gradient (fades to #0b1220)
const GRADIENT_TOP = ['#062028', '#0b1830', '#160f30', '#251410', '#0a1f18'];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function GradientBg({ id, topColor }: { id: string; topColor: string }) {
  return (
    <Svg style={StyleSheet.absoluteFillObject as any} pointerEvents="none">
      <Defs>
        <SvgLinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={topColor} stopOpacity={1} />
          <Stop offset="1" stopColor="#0b1220" stopOpacity={1} />
        </SvgLinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

function hexPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return pts.join(' ');
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen 1 — Bem-vindo (cyan)
// ─────────────────────────────────────────────────────────────────────────────

function Screen1() {
  const pulse = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    const rotAnim = Animated.loop(
      Animated.timing(rotate, { toValue: 1, duration: 8000, easing: Easing.linear, useNativeDriver: true })
    );
    pulseAnim.start();
    rotAnim.start();
    return () => { pulseAnim.stop(); rotAnim.stop(); };
  }, [pulse, rotate]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const rot = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.screen}>
      <GradientBg id="g1" topColor={GRADIENT_TOP[0]} />
      <View style={styles.content}>
        <View style={styles.visualBox}>
          <Animated.View style={[styles.absCenter, { transform: [{ rotate: rot }] }]}>
            <Svg width={220} height={220}>
              <Circle cx={110} cy={110} r={100} fill="none"
                stroke={COLORS.cyan} strokeWidth={1.5}
                strokeDasharray="6 8" strokeOpacity={0.55} />
            </Svg>
          </Animated.View>
          <Animated.View style={{ transform: [{ scale }] }}>
            <Svg width={140} height={140}>
              <Circle cx={70} cy={70} r={62} fill={COLORS.cyan} fillOpacity={0.12}
                stroke={COLORS.cyan} strokeWidth={2} />
              <Circle cx={70} cy={70} r={32} fill={COLORS.cyan} fillOpacity={0.35} />
            </Svg>
          </Animated.View>
        </View>

        <Text style={[styles.bigTitle, { color: COLORS.cyan, fontSize: 52, letterSpacing: -2 }]}>
          REFLEXO
        </Text>
        <Text style={styles.subtitle}>
          Velocidade de reação,{'\n'}medida com ciência.
        </Text>
        <Text style={styles.body}>
          Descubra onde você está. Evolua com dados reais.
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen 2 — 3 modos (blue)
// ─────────────────────────────────────────────────────────────────────────────

function Screen2() {
  const bar1 = useRef(new Animated.Value(0)).current;
  const bar2 = useRef(new Animated.Value(0)).current;
  const bar3 = useRef(new Animated.Value(0)).current;
  const bar4 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = (val: Animated.Value, dur: number, delay = 0) => Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(val, { toValue: 1, duration: dur, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        Animated.timing(val, { toValue: 0, duration: dur, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      ])
    );
    const a1 = loop(bar1, 700, 0);
    const a2 = loop(bar2, 1100, 150);
    const a3 = loop(bar3, 850, 300);
    const a4 = loop(bar4, 950, 450);
    a1.start(); a2.start(); a3.start(); a4.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); a4.stop(); };
  }, [bar1, bar2, bar3, bar4]);

  const h1 = bar1.interpolate({ inputRange: [0, 1], outputRange: [40, 80] });
  const h2 = bar2.interpolate({ inputRange: [0, 1], outputRange: [40, 80] });
  const h3 = bar3.interpolate({ inputRange: [0, 1], outputRange: [40, 80] });
  const h4 = bar4.interpolate({ inputRange: [0, 1], outputRange: [40, 80] });

  return (
    <View style={styles.screen}>
      <GradientBg id="g2" topColor={GRADIENT_TOP[1]} />
      <View style={styles.content}>
        <View style={styles.visualBox}>
          <View style={styles.equalizerRow}>
            <Animated.View style={[styles.eqBar, { height: h1, backgroundColor: COLORS.blue }]} />
            <Animated.View style={[styles.eqBar, { height: h2, backgroundColor: COLORS.cyan2 }]} />
            <Animated.View style={[styles.eqBar, { height: h3, backgroundColor: COLORS.purple }]} />
            <Animated.View style={[styles.eqBar, { height: h4, backgroundColor: COLORS.amber }]} />
          </View>
        </View>

        <Text style={[styles.bigTitle, { color: COLORS.blue }]}>4 modos de treino</Text>

        <View style={styles.modeCardsCol}>
          <ModeCard color={COLORS.blue}    name="PARTIDA"   desc="Reação simples · 7 tentativas" />
          <ModeCard color={COLORS.cyan2}   name="ALVO"      desc="Velocidade + precisão · 10 rodadas" />
          <ModeCard color={COLORS.purple}  name="SEQUÊNCIA" desc="Controle inibitório · Go/NoGo" />
          <ModeCard color={COLORS.amber}   name="RADAR"     desc="Localização visual · 7 rodadas" />
        </View>
      </View>
    </View>
  );
}

function ModeCard({ color, name, desc }: { color: string; name: string; desc: string }) {
  return (
    <View style={styles.modeCard}>
      <View style={[styles.modeAccent, { backgroundColor: color }]} />
      <View style={styles.modeBody}>
        <Text style={[styles.modeName, { color }]}>{name}</Text>
        <Text style={styles.modeDesc}>{desc}</Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen 3 — Progresso (purple)
// ─────────────────────────────────────────────────────────────────────────────

function Screen3() {
  const rot1 = useRef(new Animated.Value(0)).current;
  const rot2 = useRef(new Animated.Value(0)).current;
  const rot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = (val: Animated.Value, dur: number) => Animated.loop(
      Animated.timing(val, { toValue: 1, duration: dur, easing: Easing.linear, useNativeDriver: true })
    );
    const a1 = loop(rot1, 14000);
    const a2 = loop(rot2, 10000);
    const a3 = loop(rot3, 18000);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, [rot1, rot2, rot3]);

  const r1 = rot1.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const r2 = rot2.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] });
  const r3 = rot3.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.screen}>
      <GradientBg id="g3" topColor={GRADIENT_TOP[2]} />
      <View style={styles.content}>
        <View style={styles.visualBox}>
          <Animated.View style={[styles.absCenter, { transform: [{ rotate: r1 }] }]}>
            <Svg width={180} height={180}>
              <Polygon points={hexPoints(90, 90, 80)} fill="none"
                stroke={COLORS.purple} strokeWidth={2} strokeOpacity={1} />
            </Svg>
          </Animated.View>
          <Animated.View style={[styles.absCenter, { transform: [{ rotate: r2 }] }]}>
            <Svg width={180} height={180}>
              <Polygon points={hexPoints(90, 90, 56)} fill="none"
                stroke={COLORS.purple} strokeWidth={1.5} strokeOpacity={0.55} />
            </Svg>
          </Animated.View>
          <Animated.View style={[styles.absCenter, { transform: [{ rotate: r3 }] }]}>
            <Svg width={180} height={180}>
              <Polygon points={hexPoints(90, 90, 32)} fill="none"
                stroke={COLORS.purple} strokeWidth={1} strokeOpacity={0.3} />
            </Svg>
          </Animated.View>
        </View>

        <Text style={[styles.bigTitle, { color: COLORS.purple }]}>Tudo registrado.</Text>

        <View style={styles.statsRow}>
          <Stat color={COLORS.purple} value="17"  label="sessões" />
          <Stat color={COLORS.purple} value="#"   label="streak" />
          <Stat color={COLORS.purple} value="40+" label="conquistas" />
        </View>

        <Text style={styles.body}>
          Quanto mais você joga, mais rico fica seu histórico.
        </Text>
      </View>
    </View>
  );
}

function Stat({ color, value, label }: { color: string; value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen 4 — Jornada (amber)
// ─────────────────────────────────────────────────────────────────────────────

function Screen4({ visible }: { visible: boolean }) {
  const pulse = useRef(new Animated.Value(0)).current;
  const lineFill = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    pulseAnim.start();
    return () => pulseAnim.stop();
  }, [pulse]);

  useEffect(() => {
    if (visible) {
      lineFill.setValue(0);
      Animated.timing(lineFill, {
        toValue: 1,
        duration: 1500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();
    }
  }, [visible, lineFill]);

  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const fillH = lineFill.interpolate({ inputRange: [0, 1], outputRange: [0, 156] });

  return (
    <View style={styles.screen}>
      <GradientBg id="g4" topColor={GRADIENT_TOP[3]} />
      <View style={styles.content}>
        <View style={styles.visualBox}>
          <View style={styles.journey}>
            <View style={styles.journeyLineBg} />
            <Animated.View style={[styles.journeyLineFill, { height: fillH }]} />
            <View style={styles.journeyNodes}>
              <Animated.View style={{ transform: [{ scale: pulseScale }] }}>
                <Svg width={48} height={48}>
                  <Circle cx={24} cy={24} r={20} fill="#0b1220" stroke={COLORS.amber} strokeWidth={2.5} />
                </Svg>
              </Animated.View>
              <View style={styles.journeyMidDot} />
              <Svg width={48} height={48}>
                <Circle cx={24} cy={24} r={20} fill={COLORS.amber} />
                <Circle cx={24} cy={24} r={11} fill="#0b1220" />
                <Circle cx={24} cy={24} r={5}  fill={COLORS.amber} />
              </Svg>
            </View>
          </View>
        </View>

        <Text style={[styles.bigTitle, { color: COLORS.amber }]}>Uma meta só sua.</Text>
        <Text style={styles.body}>
          Após sua primeira sessão, fazemos uma triagem rápida.{' '}
          Você escolhe onde quer chegar.
        </Text>
        <Text style={[styles.subtitle, { color: COLORS.amber, marginTop: 6 }]}>
          A gente mostra o caminho.
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen 5 — Ciência + CTA (green)
// ─────────────────────────────────────────────────────────────────────────────

const WAVE_PATH = 'M0 30 Q50 -8 100 30 T200 30 T300 30 T400 30 T500 30 T600 30';

function Screen5({ onStart }: { onStart: () => void }) {
  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = (val: Animated.Value, dur: number) => Animated.loop(
      Animated.timing(val, { toValue: 1, duration: dur, easing: Easing.linear, useNativeDriver: true })
    );
    const a1 = loop(wave1, 4000);
    const a2 = loop(wave2, 6500);
    a1.start(); a2.start();
    return () => { a1.stop(); a2.stop(); };
  }, [wave1, wave2]);

  const tx1 = wave1.interpolate({ inputRange: [0, 1], outputRange: [0, -200] });
  const tx2 = wave2.interpolate({ inputRange: [0, 1], outputRange: [0, -200] });

  return (
    <View style={styles.screen}>
      <GradientBg id="g5" topColor={GRADIENT_TOP[4]} />
      <View style={styles.content}>
        <View style={[styles.visualBox, { height: 120 }]}>
          <View style={styles.waves}>
            <Animated.View style={{ position: 'absolute', top: 10, transform: [{ translateX: tx1 }] }}>
              <Svg width={620} height={60}>
                <Path d={WAVE_PATH} stroke={COLORS.green} strokeWidth={2.5} fill="none"
                  strokeOpacity={0.95} strokeLinecap="round" />
              </Svg>
            </Animated.View>
            <Animated.View style={{ position: 'absolute', top: 50, transform: [{ translateX: tx2 }] }}>
              <Svg width={620} height={60}>
                <Path d={WAVE_PATH} stroke={COLORS.green} strokeWidth={2} fill="none"
                  strokeOpacity={0.4} strokeLinecap="round" />
              </Svg>
            </Animated.View>
          </View>
        </View>

        <Text style={[styles.bigTitle, { color: COLORS.green }]}>Seu cérebro é treinável.</Text>

        <View style={styles.sciCardsCol}>
          <SciCard value="10–15%" label="melhora de RT em 4 semanas" />
          <SciCard value="∞"      label="neuroplasticidade por repetição" />
          <SciCard value="< 5min" label="por dia é o suficiente" />
        </View>

        <TouchableOpacity style={styles.startBtn} onPress={onStart} activeOpacity={0.85}>
          <Text style={styles.startBtnText}>COMEÇAR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SciCard({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.sciCard}>
      <Text style={styles.sciValue}>{value}</Text>
      <Text style={styles.sciLabel}>{label}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OnboardingModal — root
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  onComplete: () => void;
}

export default function OnboardingModal({ onComplete }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const swipeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(swipeAnim, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(swipeAnim, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [swipeAnim]);

  const handleStart = async () => {
    await saveOnboardingDone();
    onComplete();
  };

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (idx !== activeIndex) setActiveIndex(idx);
  };

  const showSwipeHint = activeIndex < 4;
  const swipeTranslate = swipeAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 6] });
  const swipeOpacity   = swipeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.85] });
  const hintColor = SCREEN_COLORS[activeIndex];

  return (
    <View style={styles.root}>
      <FlatList
        data={[0, 1, 2, 3, 4]}
        keyExtractor={n => String(n)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        renderItem={({ item }) => (
          <View style={{ width: SCREEN_W, height: '100%' }}>
            {item === 0 && <Screen1 />}
            {item === 1 && <Screen2 />}
            {item === 2 && <Screen3 />}
            {item === 3 && <Screen4 visible={activeIndex === 3} />}
            {item === 4 && <Screen5 onStart={handleStart} />}
          </View>
        )}
      />

      {/* Swipe hint — visible on screens 1–4, hidden on the final CTA screen */}
      {showSwipeHint && (
        <Animated.View
          style={[styles.swipeHint, { opacity: swipeOpacity, transform: [{ translateX: swipeTranslate }] }]}
          pointerEvents="none"
        >
          <Text style={[styles.swipeHintText, { color: hintColor }]}>
            ← Deslize para avançar
          </Text>
        </Animated.View>
      )}

      {/* Progress dots */}
      <View style={[styles.dotsRow, { top: TOP + 16 }]} pointerEvents="none">
        {SCREEN_COLORS.map((c, i) => {
          const active = i === activeIndex;
          return (
            <View
              key={i}
              style={[
                styles.dot,
                active && { width: 22, backgroundColor: c },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b1220' },

  // Per-screen
  screen: { flex: 1, backgroundColor: '#0b1220' },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: TOP + 60,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  visualBox: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  absCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Typography
  bigTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 26,
  },
  body: {
    fontSize: 14,
    color: '#7a8aa0',
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 8,
  },

  // Dots
  dotsRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1a2a4a',
  },

  // Swipe hint
  swipeHint: {
    position: 'absolute',
    left: 0, right: 0, bottom: 24,
    alignItems: 'center',
  },
  swipeHintText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  // Screen 2 — equalizer + cards
  equalizerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 14,
    height: 100,
  },
  eqBar: {
    width: 22,
    borderRadius: 4,
  },
  modeCardsCol: {
    width: '100%',
    gap: 10,
  },
  modeCard: {
    flexDirection: 'row',
    backgroundColor: '#111a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  modeAccent: { width: 4 },
  modeBody: { flex: 1, paddingHorizontal: 14, paddingVertical: 10, gap: 2 },
  modeName: { fontSize: 13, fontWeight: '900', letterSpacing: 1.5 },
  modeDesc: { fontSize: 12, color: '#7a8aa0' },

  // Screen 3 — stats
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-around',
    width: '100%',
  },
  stat: { alignItems: 'center', gap: 4 },
  statValue: { fontSize: 36, fontWeight: '900', letterSpacing: -1 },
  statLabel: { fontSize: 11, color: '#4a5a7b', letterSpacing: 1.5, fontWeight: '700' },

  // Screen 4 — journey
  journey: {
    width: 60,
    height: 200,
    alignItems: 'center',
  },
  journeyLineBg: {
    position: 'absolute',
    left: 29,
    top: 22,
    width: 2,
    height: 156,
    backgroundColor: '#1a2540',
    borderRadius: 1,
  },
  journeyLineFill: {
    position: 'absolute',
    left: 29,
    top: 22,
    width: 2,
    backgroundColor: COLORS.amber,
    borderRadius: 1,
  },
  journeyNodes: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  journeyMidDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#2d3a55',
  },

  // Screen 5 — waves + CTA
  waves: {
    width: SCREEN_W,
    height: 120,
    overflow: 'hidden',
  },
  sciCardsCol: {
    width: '100%',
    gap: 8,
  },
  sciCard: {
    flexDirection: 'row',
    backgroundColor: '#111a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 14,
  },
  sciValue: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.green,
    letterSpacing: -0.5,
    minWidth: 80,
  },
  sciLabel: { fontSize: 13, color: '#cbd5e1', flex: 1 },

  startBtn: {
    backgroundColor: COLORS.green,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    width: '100%',
  },
  startBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0b1220',
    letterSpacing: 2.5,
  },
});
