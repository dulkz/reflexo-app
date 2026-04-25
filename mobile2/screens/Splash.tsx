import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';

const LETTERS = 'REFLEXO'.split('');
const STAGGER_MS = 60;
const LETTER_MS  = 200;
const PAUSE_MS   = 200;
const PULSE_MS   = 400;
const SCAN_MS    = 700;  // scan traversal duration
const SCAN_FADE  = 60;   // opacity fade-in/out at leading/trailing edge
const HOLD_MS    = 2200; // static hold after scan before onAnimationComplete

// Approximate half-width of "REFLEXO" at fontSize 48 + letterSpacing 8
// 7 letters × ~28px + 6 gaps × 8px ≈ 280px total → half = 140px
const TEXT_HALF_W = 140;

const { width: W, height: H } = Dimensions.get('window');
const CX = W / 2;
// REFLEXO is the upper portion of the text block (REFLEXO + subtitle ~88px total)
// REFLEXO center ≈ CY - 16px; scan height 48px → top = CY - 16 - 24 = CY - 40
const SCAN_TOP = H / 2 - 40;

interface Props {
  onAnimationComplete: () => void;
}

export default function Splash({ onAnimationComplete }: Props) {
  const letterAnims = useRef(
    LETTERS.map(() => ({
      opacity:    new Animated.Value(0),
      translateX: new Animated.Value(-20),
    }))
  ).current;

  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const containerScale  = useRef(new Animated.Value(1)).current;
  const scanX           = useRef(new Animated.Value(-TEXT_HALF_W)).current;
  const scanOpacity     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const entryAnims = letterAnims.map(({ opacity, translateX }) =>
      Animated.parallel([
        Animated.timing(opacity,    { toValue: 1, duration: LETTER_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 0, duration: LETTER_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ])
    );

    // Scan traverses left edge → right edge at constant speed
    const scanAnim = Animated.parallel([
      Animated.timing(scanX, {
        toValue: TEXT_HALF_W, duration: SCAN_MS,
        easing: Easing.linear, useNativeDriver: true,
      }),
      // Opacity: quick fade-in → hold at 1 → quick fade-out
      Animated.sequence([
        Animated.timing(scanOpacity, { toValue: 1, duration: SCAN_FADE, useNativeDriver: true }),
        Animated.timing(scanOpacity, { toValue: 1, duration: SCAN_MS - SCAN_FADE * 2, useNativeDriver: true }),
        Animated.timing(scanOpacity, { toValue: 0, duration: SCAN_FADE, useNativeDriver: true }),
      ]),
    ]);

    Animated.sequence([
      Animated.stagger(STAGGER_MS, entryAnims),
      Animated.delay(PAUSE_MS),
      // Pulse + subtitle + scan all start simultaneously
      Animated.parallel([
        Animated.sequence([
          Animated.timing(containerScale, { toValue: 1.04, duration: PULSE_MS / 2, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(containerScale, { toValue: 1,    duration: PULSE_MS / 2, easing: Easing.in(Easing.quad),  useNativeDriver: true }),
        ]),
        Animated.timing(subtitleOpacity, { toValue: 1, duration: PULSE_MS, useNativeDriver: true }),
        scanAnim,
      ]),
      Animated.delay(HOLD_MS),
    ]).start(() => onAnimationComplete());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.root}>
      {/* Centered text block — scales on pulse */}
      <Animated.View style={{ alignItems: 'center', transform: [{ scale: containerScale }] }}>
        <View style={styles.row}>
          {LETTERS.map((letter, i) => (
            <Animated.Text
              key={i}
              style={[
                styles.letter,
                {
                  opacity: letterAnims[i].opacity,
                  transform: [{ translateX: letterAnims[i].translateX }],
                },
              ]}
            >
              {letter}
            </Animated.Text>
          ))}
        </View>
        <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
          velocidade de reação
        </Animated.Text>
      </Animated.View>

      {/* Scan glow — sits in an absoluteFill overlay, moves over the text */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Animated.View
          style={[
            styles.scanGroup,
            {
              opacity: scanOpacity,
              transform: [{ translateX: scanX }],
            },
          ]}
        >
          {/* Three stacked layers: outer glow / mid glow / bright core */}
          <View style={styles.glowOuter} />
          <View style={styles.glowMid} />
          <View style={styles.glowCore} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b1220', alignItems: 'center', justifyContent: 'center' },
  row:  { flexDirection: 'row', alignItems: 'center' },
  letter: { fontSize: 48, fontWeight: '700', color: '#fff', letterSpacing: 8 },
  subtitle: { fontSize: 14, color: '#4a5a7b', textAlign: 'center', marginTop: 14, letterSpacing: 1 },

  // Scan group: starts at CX - TEXT_HALF_W (left edge), moves to CX + TEXT_HALF_W
  // left: CX - 4  →  group center sits on CX at translateX = 0
  scanGroup: {
    position: 'absolute',
    width: 8, height: 48,
    left: CX - 4,
    top:  SCAN_TOP,
  },
  // Outer glow: widest, most transparent — creates soft halo
  glowOuter: {
    position: 'absolute', left: 0, top: 0,
    width: 8, height: 48,
    backgroundColor: '#3b82f6', opacity: 0.15,
  },
  // Mid glow: medium width and opacity
  glowMid: {
    position: 'absolute', left: 2, top: 0,
    width: 4, height: 48,
    backgroundColor: '#3b82f6', opacity: 0.4,
  },
  // Core: thin bright center line
  glowCore: {
    position: 'absolute', left: 3, top: 0,
    width: 2, height: 48,
    backgroundColor: '#3b82f6', opacity: 0.8,
  },
});
