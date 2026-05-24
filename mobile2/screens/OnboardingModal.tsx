import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Animated, Easing, Dimensions, Platform,
  StatusBar as RNStatusBar,
  NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Circle, Path, Rect,
  Defs, LinearGradient as SvgLinearGradient, Stop,
} from 'react-native-svg';
import { SvgXml } from 'react-native-svg';
import { ARCHETYPES } from '../config/archetypes';

const SCREEN_W = Dimensions.get('window').width;
const TOP = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 44;

// Vertical space reserved at the bottom for the fixed navigation chrome.
const NAV_RESERVE = 150;

const COLORS = {
  cyan:   '#00f5ff',
  blue:   '#3b82f6',
  cyan2:  '#06b6d4',
  purple: '#8b5cf6',
  amber:  '#f59e0b',
  green:  '#10b981',
};

// New narrative order: brand → science → goal → modes → archetype.
// Anchor colour is green; T3 (goal) is the single intentional amber deviation.
const SCREEN_ACCENTS = [COLORS.cyan, COLORS.green, COLORS.amber, COLORS.blue, COLORS.purple];
const NAV_COLORS     = [COLORS.green, COLORS.green, COLORS.amber, COLORS.green, COLORS.green];

// Subtle accent-tinted top color for each screen's gradient (fades to #0b1220)
const GRADIENT_TOP = ['#062028', '#0a1f18', '#251410', '#0b1830', '#160f30'];

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

// ─────────────────────────────────────────────────────────────────────────────
// T1 — Marca / brand (cyan)
// ─────────────────────────────────────────────────────────────────────────────

function ScreenBrand() {
  const { t } = useTranslation();
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
        <View style={styles.visualArea}>
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

        <View style={styles.textBlock}>
          <Text style={[styles.bigTitle, { color: COLORS.cyan, fontSize: 52, letterSpacing: -2 }]}>
            {t('onboarding.t1.title')}
          </Text>
          <Text style={styles.subtitle}>{t('onboarding.t1.tagline')}</Text>
          <Text style={styles.body}>{t('onboarding.t1.body')}</Text>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// T2 — Ciência / science (green)
// ─────────────────────────────────────────────────────────────────────────────

const WAVE_PATH = 'M0 30 Q50 -8 100 30 T200 30 T300 30 T400 30 T500 30 T600 30';

function ScreenScience() {
  const { t } = useTranslation();
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

  const ROWS: { label: string; val: string }[] = [
    { label: t('onboarding.t2.stat1Label'), val: t('onboarding.t2.stat1Val') },
    { label: t('onboarding.t2.stat2Label'), val: t('onboarding.t2.stat2Val') },
    { label: t('onboarding.t2.stat3Label'), val: t('onboarding.t2.stat3Val') },
  ];

  return (
    <View style={styles.screen}>
      <GradientBg id="g2" topColor={GRADIENT_TOP[1]} />
      <View style={styles.content}>
        <View style={[styles.visualArea, { maxHeight: 140 }]}>
          <View style={styles.waves}>
            <Animated.View style={{ position: 'absolute', top: 30, transform: [{ translateX: tx1 }] }}>
              <Svg width={620} height={60}>
                <Path d={WAVE_PATH} stroke={COLORS.green} strokeWidth={2.5} fill="none"
                  strokeOpacity={0.95} strokeLinecap="round" />
              </Svg>
            </Animated.View>
            <Animated.View style={{ position: 'absolute', top: 60, transform: [{ translateX: tx2 }] }}>
              <Svg width={620} height={60}>
                <Path d={WAVE_PATH} stroke={COLORS.green} strokeWidth={2} fill="none"
                  strokeOpacity={0.4} strokeLinecap="round" />
              </Svg>
            </Animated.View>
          </View>
        </View>

        <View style={styles.textBlock}>
          <Text style={[styles.bigTitle, { color: COLORS.green }]}>{t('onboarding.t2.title')}</Text>
          <View style={styles.statRowsCol}>
            {ROWS.map(r => (
              <View key={r.label} style={styles.statRow}>
                <Text style={styles.statKey}>{r.label}</Text>
                <Text style={[styles.statVal, { color: COLORS.green }]}>{r.val}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// T3 — Meta / goal (amber)
// ─────────────────────────────────────────────────────────────────────────────

function ScreenGoal() {
  const { t } = useTranslation();
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
    Animated.timing(lineFill, {
      toValue: 1, duration: 1500, easing: Easing.out(Easing.ease), useNativeDriver: false,
    }).start();
    return () => pulseAnim.stop();
  }, [pulse, lineFill]);

  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const fillH = lineFill.interpolate({ inputRange: [0, 1], outputRange: [0, 156] });

  return (
    <View style={styles.screen}>
      <GradientBg id="g3" topColor={GRADIENT_TOP[2]} />
      <View style={styles.content}>
        <View style={styles.visualArea}>
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

        <View style={styles.textBlock}>
          <Text style={[styles.bigTitle, { color: COLORS.amber }]}>{t('onboarding.t3.title')}</Text>
          <Text style={styles.body}>{t('onboarding.t3.body')}</Text>
          <View style={styles.goalBox}>
            <Text style={styles.goalBoxText}>{t('onboarding.t3.box')}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// T4 — Modos / modes (blue, compact)
// ─────────────────────────────────────────────────────────────────────────────

function ModeItem({ color, name, desc }: { color: string; name: string; desc: string }) {
  return (
    <View style={styles.modeItem}>
      <View style={[styles.modeDot, { backgroundColor: color }]} />
      <View style={styles.modeBody}>
        <Text style={[styles.modeName, { color }]}>{name}</Text>
        <Text style={styles.modeDesc}>{desc}</Text>
      </View>
    </View>
  );
}

function ScreenModes() {
  const { t } = useTranslation();
  return (
    <View style={styles.screen}>
      <GradientBg id="g4" topColor={GRADIENT_TOP[3]} />
      <View style={[styles.content, { justifyContent: 'center' }]}>
        <View style={{ width: '100%' }}>
          <Text style={[styles.bigTitle, styles.modesTitle]}>{t('onboarding.t4.title')}</Text>
          <Text style={styles.modesSubtitle}>{t('onboarding.t4.subtitle')}</Text>
          <View style={styles.modeCardsCol}>
            <ModeItem color={COLORS.blue}   name={t('onboarding.t4.partida')}   desc={t('onboarding.t4.partida_desc')} />
            <ModeItem color={COLORS.amber}  name={t('onboarding.t4.radar')}     desc={t('onboarding.t4.radar_desc')} />
            <ModeItem color={COLORS.purple} name={t('onboarding.t4.sequencia')} desc={t('onboarding.t4.sequencia_desc')} />
            <ModeItem color={COLORS.cyan2}  name={t('onboarding.t4.alvo')}      desc={t('onboarding.t4.alvo_desc')} />
          </View>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// T5 — Arquétipo reveal (purple)
// ─────────────────────────────────────────────────────────────────────────────

function ScreenArchetype() {
  const { t } = useTranslation();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.15] });

  return (
    <View style={styles.screen}>
      <GradientBg id="g5" topColor={GRADIENT_TOP[4]} />
      <View style={[styles.content, { justifyContent: 'center', gap: 16 }]}>
        <Text style={styles.arqKicker}>{t('onboarding.t5.kicker')}</Text>

        <View style={styles.arqCard}>
          <View style={styles.arqAvatarWrap}>
            <Animated.View style={[styles.arqAvatarRing, { transform: [{ scale: ringScale }], opacity: ringOpacity }]} />
            <View style={styles.arqAvatar}>
              <SvgXml xml={ARCHETYPES.EXPLORADOR.icon} width={48} height={48} />
            </View>
          </View>
          <Text style={styles.arqEyebrow}>{t('onboarding.t5.eyebrow')}</Text>
          <Text style={styles.arqName}>{t('onboarding.t5.name')}</Text>
          <Text style={styles.arqDesc}>{t('onboarding.t5.desc')}</Text>
        </View>

        <Text style={styles.arqFooter}>{t('onboarding.t5.footer')}</Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OnboardingModal — intro root (5 passive screens + bottom nav)
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  // Called by both "COMEÇAR →" (T5) and "pular introdução" — advances the
  // OnboardingFlow into the active onboarding (OB1). Persistence happens at the
  // end of the whole flow, not here.
  onComplete: () => void;
}

export default function OnboardingModal({ onComplete }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<number>>(null);

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (idx !== activeIndex) setActiveIndex(idx);
  };

  const isLast = activeIndex === 4;

  const goNext = () => {
    if (isLast) {
      onComplete();
      return;
    }
    const next = activeIndex + 1;
    listRef.current?.scrollToIndex({ index: next, animated: true });
    setActiveIndex(next); // optimistic; reconciled by onMomentumScrollEnd
  };

  const navColor = NAV_COLORS[activeIndex];
  const dotColor = SCREEN_ACCENTS[activeIndex];

  return (
    <View style={styles.root}>
      <FlatList
        ref={listRef}
        data={[0, 1, 2, 3, 4]}
        keyExtractor={n => String(n)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        getItemLayout={(_, index) => ({ length: SCREEN_W, offset: SCREEN_W * index, index })}
        renderItem={({ item }) => (
          <View style={{ width: SCREEN_W, height: '100%' }}>
            {item === 0 && <ScreenBrand />}
            {item === 1 && <ScreenScience />}
            {item === 2 && <ScreenGoal />}
            {item === 3 && <ScreenModes />}
            {item === 4 && <ScreenArchetype />}
          </View>
        )}
      />

      {/* Skip — top-right, low emphasis, hidden on the final commitment screen */}
      {!isLast && (
        <TouchableOpacity
          style={[styles.skipBtn, { top: TOP + 10 }]}
          onPress={onComplete}
          activeOpacity={0.6}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
        </TouchableOpacity>
      )}

      {/* Bottom navigation — dots above an explicit Próximo/COMEÇAR button */}
      <View style={[styles.navWrap, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.dotsRow}>
          {SCREEN_ACCENTS.map((_, i) => {
            const active = i === activeIndex;
            return (
              <View
                key={i}
                style={[styles.dot, active && { width: 22, backgroundColor: dotColor }]}
              />
            );
          })}
        </View>
        <TouchableOpacity
          style={[styles.navBtn, { backgroundColor: navColor }]}
          onPress={goNext}
          activeOpacity={0.85}
        >
          <Text style={styles.navBtnText}>
            {isLast ? t('onboarding.start') : t('onboarding.next')}
          </Text>
        </TouchableOpacity>
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
    paddingTop: TOP + 48,
    paddingBottom: NAV_RESERVE,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  visualArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  absCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
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

  // Bottom navigation
  navWrap: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    paddingHorizontal: 28,
    alignItems: 'center',
    gap: 14,
  },
  dotsRow: {
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
  navBtn: {
    width: '100%',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  navBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#06121f',
    letterSpacing: 1.5,
  },

  // Skip link
  skipBtn: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  skipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4a5a7b',
    letterSpacing: 0.5,
  },

  // T2 — waves + stat rows
  waves: {
    width: SCREEN_W,
    height: 120,
    overflow: 'hidden',
  },
  statRowsCol: {
    width: '100%',
    gap: 8,
    marginTop: 6,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111a2e',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  statKey: { fontSize: 13, color: '#7a8aa0', flex: 1 },
  statVal: { fontSize: 16, fontWeight: '900', letterSpacing: -0.5 },

  // T3 — journey + goal box
  journey: {
    width: 60,
    height: 200,
    alignItems: 'center',
  },
  journeyLineBg: {
    position: 'absolute',
    left: 29, top: 22,
    width: 2, height: 156,
    backgroundColor: '#1a2540',
    borderRadius: 1,
  },
  journeyLineFill: {
    position: 'absolute',
    left: 29, top: 22,
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
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#2d3a55',
  },
  goalBox: {
    backgroundColor: 'rgba(245,158,11,0.10)',
    borderColor: 'rgba(245,158,11,0.30)',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 4,
  },
  goalBoxText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.amber,
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  // T4 — compact mode list
  modesTitle: { fontSize: 26, textAlign: 'left', marginBottom: 4 },
  modesSubtitle: { fontSize: 13, color: '#7a8aa0', marginBottom: 16 },
  modeCardsCol: { width: '100%', gap: 10 },
  modeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#111a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  modeDot: { width: 4, height: 34, borderRadius: 2 },
  modeBody: { flex: 1, gap: 2 },
  modeName: { fontSize: 13, fontWeight: '900', letterSpacing: 1.5 },
  modeDesc: { fontSize: 12, color: '#7a8aa0' },

  // T5 — archetype reveal
  arqKicker: { fontSize: 13, color: '#7a8aa0', textAlign: 'center' },
  arqCard: {
    width: '100%',
    backgroundColor: 'rgba(139,92,246,0.12)',
    borderColor: 'rgba(139,92,246,0.30)',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 22,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  arqAvatarWrap: {
    width: 84, height: 84,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  arqAvatarRing: {
    position: 'absolute',
    width: 84, height: 84, borderRadius: 42,
    borderWidth: 2,
    borderColor: COLORS.purple,
  },
  arqAvatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#1e3a5f',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(139,92,246,0.45)',
  },
  arqEyebrow: {
    fontSize: 10, fontWeight: '700',
    color: '#4a5a7b', letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  arqName: {
    fontSize: 30, fontWeight: '900',
    color: COLORS.purple, letterSpacing: -0.5,
    marginBottom: 6,
  },
  arqDesc: {
    fontSize: 13, color: '#94a3b8',
    textAlign: 'center', lineHeight: 20,
  },
  arqFooter: {
    fontSize: 13, color: '#7a8aa0',
    textAlign: 'center', lineHeight: 20,
    paddingHorizontal: 8,
  },
});
