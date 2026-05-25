import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Easing,
  Platform, StatusBar as RNStatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SvgXml } from 'react-native-svg';
import { ARCHETYPES } from '../config/archetypes';
import { hapticHeavy, hapticImpactMedium, hapticSuccess } from '../utils/haptics';

const TOP = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 44;

// Chain order used to scale the XP reward by tier.
const ORDER = ['EXPLORADOR', 'EM_EVOLUCAO', 'RESISTENTE', 'ATIRADOR', 'VELOCISTA', 'PILOTO'];

const PARTICLE_COUNT = 14;
const PARTICLE_COLORS = ['#10b981', '#8b5cf6', '#f59e0b', '#10b981'];

interface Props {
  /** Archetype id the user just evolved INTO. */
  toId: string;
  onContinue: () => void;
}

/**
 * Full-screen archetype-evolution takeover — "the most important moment".
 * Sequence (≈2.4s to CTA): flash + Heavy → avatar scale → name letter-by-letter
 * (+ Medium) → particles (+ Success) → animated XP counter → context + CTA fade in.
 * Mirrors reflexo-arquetipo-evolucao.html with React Native Animated.
 */
export default function ArchetypeEvolution({ toId, onContinue }: Props) {
  const { t } = useTranslation();

  const arch = ARCHETYPES[toId] ?? ARCHETYPES.EXPLORADOR;
  const nextDef = arch.nextId ? ARCHETYPES[arch.nextId] : null;
  const color = arch.color;

  const tierIdx = Math.max(0, ORDER.indexOf(toId));
  const xpReward = 250 + tierIdx * 150;

  // ── Animated values ──────────────────────────────────────────────────────────
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const avatarScale = useRef(new Animated.Value(0)).current;
  const avatarOpacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.6)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const xpPillAnim = useRef(new Animated.Value(0)).current;
  const ctxAnim = useRef(new Animated.Value(0)).current;
  const ctaAnim = useRef(new Animated.Value(0)).current;
  const xpCounter = useRef(new Animated.Value(0)).current;

  const particles = useRef(
    Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
      const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + (Math.random() - 0.5) * 0.4;
      const dist = 90 + Math.random() * 70;
      return {
        v: new Animated.Value(0),
        tx: Math.cos(angle) * dist,
        ty: Math.sin(angle) * dist,
        color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
        size: 4 + Math.round(Math.random() * 4),
      };
    }),
  ).current;

  // ── Letter-by-letter name + XP counter (JS-driven state) ──────────────────────
  const fullName = t('archetypes.' + arch.id);
  const [revealed, setRevealed] = useState(0);
  const [displayedXp, setDisplayedXp] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    let nameInterval: ReturnType<typeof setInterval> | null = null;

    // Frame 1 (0ms): flash + Heavy
    hapticHeavy();
    Animated.sequence([
      Animated.timing(flashOpacity, { toValue: 0.32, duration: 60, useNativeDriver: true }),
      Animated.timing(flashOpacity, { toValue: 0, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();

    // Frame 2 (300ms): glow + avatar scale 0→1.05→1 (spring)
    timers.push(setTimeout(() => {
      Animated.timing(glowOpacity, { toValue: 0.2, duration: 600, useNativeDriver: true }).start();
      Animated.parallel([
        Animated.timing(avatarOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(avatarScale, { toValue: 1.05, duration: 260, easing: Easing.out(Easing.back(2)), useNativeDriver: true }),
          Animated.spring(avatarScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        ]),
      ]).start();
    }, 300));

    // 700ms: ring ping expands out
    timers.push(setTimeout(() => {
      ringScale.setValue(0.7);
      ringOpacity.setValue(0.55);
      Animated.parallel([
        Animated.timing(ringScale, { toValue: 2.2, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(ringOpacity, { toValue: 0, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]).start();
    }, 700));

    // Frame 3 (850ms): name letter-by-letter + Medium
    timers.push(setTimeout(() => {
      hapticImpactMedium();
      let n = 0;
      nameInterval = setInterval(() => {
        n += 1;
        setRevealed(n);
        if (n >= fullName.length && nameInterval) { clearInterval(nameInterval); nameInterval = null; }
      }, 45);
    }, 850));

    // Frame 4 (1100ms): particles burst + Success
    timers.push(setTimeout(() => {
      hapticSuccess();
      Animated.parallel(
        particles.map(p =>
          Animated.timing(p.v, {
            toValue: 1,
            duration: 800 + Math.random() * 300,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ),
      ).start();
    }, 1100));

    // Frame 5 (1300ms): XP pill in + counter animates 0→reward
    timers.push(setTimeout(() => {
      Animated.timing(xpPillAnim, { toValue: 1, duration: 320, useNativeDriver: true }).start();
      Animated.timing(xpCounter, { toValue: xpReward, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    }, 1300));

    // 1900ms: context (desc + next preview) fade/slide in
    timers.push(setTimeout(() => {
      Animated.timing(ctxAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, 1900));

    // Frame 6 (2400ms): CTA fade in — no rush
    timers.push(setTimeout(() => {
      Animated.timing(ctaAnim, { toValue: 1, duration: 320, useNativeDriver: true }).start();
    }, 2400));

    const xpListener = xpCounter.addListener(({ value }) => setDisplayedXp(Math.round(value)));

    return () => {
      timers.forEach(clearTimeout);
      if (nameInterval) clearInterval(nameInterval);
      xpCounter.removeListener(xpListener);
    };
    // Run once on mount — the component remounts per evolution.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ctaTranslate = ctaAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });
  const ctxTranslate = ctxAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });
  const xpTranslate = xpPillAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });

  const displayName = useMemo(() => fullName.slice(0, revealed), [fullName, revealed]);

  return (
    <View style={styles.root}>
      {/* Glow behind avatar */}
      <Animated.View style={[styles.glow, { backgroundColor: color, opacity: glowOpacity }]} pointerEvents="none" />

      {/* Particles */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {particles.map((p, i) => (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                width: p.size, height: p.size, borderRadius: p.size / 2,
                backgroundColor: p.color,
                opacity: p.v.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.9, 0] }),
                transform: [
                  { translateX: p.v.interpolate({ inputRange: [0, 1], outputRange: [0, p.tx] }) },
                  { translateY: p.v.interpolate({ inputRange: [0, 1], outputRange: [0, p.ty] }) },
                  { scale: p.v.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) },
                ],
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.center}>
        <Text style={styles.eyebrow}>{t('evolution.eyebrow')}</Text>

        {/* Avatar with ring ping */}
        <View style={styles.avatarWrap}>
          <Animated.View
            style={[
              styles.ring,
              { borderColor: color, opacity: ringOpacity, transform: [{ scale: ringScale }] },
            ]}
            pointerEvents="none"
          />
          <Animated.View
            style={[
              styles.avatarCircle,
              { borderColor: color + '88', shadowColor: color, opacity: avatarOpacity, transform: [{ scale: avatarScale }] },
            ]}
          >
            <SvgXml xml={arch.icon} width={64} height={64} />
          </Animated.View>
        </View>

        {/* Name — letter by letter */}
        <Text style={[styles.name, { color }]} numberOfLines={1}>{displayName}</Text>

        {/* XP pill */}
        <Animated.View style={[styles.xpPill, { opacity: xpPillAnim, transform: [{ translateY: xpTranslate }] }]}>
          <Text style={styles.xpText}>{t('evolution.xp', { xp: displayedXp })}</Text>
        </Animated.View>

        {/* Context — description + next preview */}
        <Animated.View style={[styles.ctx, { opacity: ctxAnim, transform: [{ translateY: ctxTranslate }] }]}>
          <Text style={styles.desc}>{arch.description}</Text>

          {nextDef ? (
            <View style={styles.nextCard}>
              <SvgXml xml={nextDef.icon} width={26} height={26} />
              <View style={{ flex: 1 }}>
                <Text style={styles.nextLabel}>{t('evolution.next')}</Text>
                <Text style={[styles.nextName, { color: nextDef.color }]}>{t('archetypes.' + nextDef.id)} →</Text>
              </View>
            </View>
          ) : (
            <View style={[styles.nextCard, { justifyContent: 'center' }]}>
              <Text style={[styles.maxText, { color }]}>{t('evolution.maxReached')}</Text>
            </View>
          )}
        </Animated.View>
      </View>

      {/* CTA */}
      <Animated.View style={[styles.ctaWrap, { opacity: ctaAnim, transform: [{ translateY: ctaTranslate }] }]}>
        <TouchableOpacity style={styles.cta} onPress={onContinue} activeOpacity={0.9}>
          <Text style={styles.ctaText}>{t('evolution.continue')} →</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Flash overlay — on top of everything */}
      <Animated.View style={[styles.flash, { opacity: flashOpacity }]} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b1220', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, paddingTop: TOP },
  flash: { ...StyleSheet.absoluteFillObject, backgroundColor: '#ffffff' },
  glow: {
    position: 'absolute', width: 260, height: 260, borderRadius: 130,
    // blur isn't available in RN; a soft large translucent circle approximates the glow
  },
  particle: { position: 'absolute', left: '50%', top: '46%' },

  center: { alignItems: 'center', gap: 14 },
  eyebrow: { fontSize: 10, fontWeight: '800', color: '#4a5a7b', letterSpacing: 3 },

  avatarWrap: { alignItems: 'center', justifyContent: 'center', width: 120, height: 120 },
  ring: { position: 'absolute', width: 110, height: 110, borderRadius: 55, borderWidth: 1.5 },
  avatarCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: '#111a2e', borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 24, elevation: 8,
  },

  name: { fontSize: 36, fontWeight: '900', letterSpacing: 1, textAlign: 'center', minHeight: 42 },

  xpPill: {
    backgroundColor: 'rgba(245,158,11,0.12)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 5,
  },
  xpText: { fontSize: 13, fontWeight: '800', color: '#f59e0b', letterSpacing: 0.5 },

  ctx: { alignItems: 'center', gap: 12, marginTop: 4, width: '100%' },
  desc: { fontSize: 13, color: '#7a8aa0', textAlign: 'center', lineHeight: 19, paddingHorizontal: 8 },
  nextCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%',
    backgroundColor: '#111a2e', borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 14, paddingVertical: 11,
  },
  nextLabel: { fontSize: 9, fontWeight: '700', color: '#3a4a6b', letterSpacing: 1.5, textTransform: 'uppercase' },
  nextName: { fontSize: 13, fontWeight: '700', marginTop: 1 },
  maxText: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },

  ctaWrap: { position: 'absolute', left: 28, right: 28, bottom: 44 },
  cta: { backgroundColor: '#10b981', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  ctaText: { fontSize: 16, fontWeight: '900', color: '#06120c', letterSpacing: 0.5 },
});
