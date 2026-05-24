import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Easing,
  Platform, StatusBar as RNStatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';

const TOP = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 44;

interface Props {
  rt: number;
  onNext: () => void;
}

// Context tier for the user's first reaction time, relative to the human
// average of 250–300 ms (Wikipedia, Mental Chronometry).
function contextLabel(rt: number, t: (k: string) => string): string {
  if (rt < 200) return t('onboarding.ob.ob2.ctxElite');
  if (rt < 250) return t('onboarding.ob.ob2.ctxFast');
  if (rt < 300) return t('onboarding.ob.ob2.ctxAvg');
  if (rt < 350) return t('onboarding.ob.ob2.ctxNear');
  return t('onboarding.ob.ob2.ctxSlow');
}

export default function OB2Result({ rt, onNext }: Props) {
  const { t } = useTranslation();
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();
  }, [enter]);

  const numScale = enter.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });

  return (
    <View style={styles.root}>
      <View style={styles.body}>
        <Text style={styles.kicker}>{t('onboarding.ob.ob2.kicker')}</Text>

        <Animated.Text style={[styles.number, { opacity: enter, transform: [{ scale: numScale }] }]}>
          {rt}
        </Animated.Text>
        <Text style={styles.unit}>{t('onboarding.ob.ob2.unit')}</Text>

        <View style={styles.ctxPill}>
          <Text style={styles.ctxLabel}>{contextLabel(rt, t)}</Text>
          <Text style={styles.ctxSub}>{t('onboarding.ob.ob2.ctxSub')}</Text>
        </View>

        <View style={styles.loreBox}>
          <Text style={styles.loreTitle}>{t('onboarding.ob.ob2.loreTitle')}</Text>
          <Text style={styles.loreText}>{t('onboarding.ob.ob2.lore', { rt })}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.btnPrimary} onPress={onNext} activeOpacity={0.85}>
          <Text style={styles.btnPrimaryText}>{t('onboarding.ob.ob2.cta')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080c10' },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: TOP,
    paddingHorizontal: 28,
    gap: 8,
  },
  kicker: {
    fontSize: 11, fontWeight: '700', color: '#3a4a6b',
    letterSpacing: 2.5, marginBottom: 4,
  },
  number: {
    fontSize: 96, fontWeight: '900', color: '#10b981',
    letterSpacing: -4, lineHeight: 100,
  },
  unit: {
    fontSize: 13, color: '#7a8aa0',
    letterSpacing: 1, marginBottom: 16,
  },
  ctxPill: {
    backgroundColor: 'rgba(16,185,129,0.10)',
    borderColor: 'rgba(16,185,129,0.30)',
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 18, paddingVertical: 10,
    alignItems: 'center',
  },
  ctxLabel: { fontSize: 14, fontWeight: '800', color: '#10b981' },
  ctxSub: { fontSize: 11, color: '#7a8aa0', marginTop: 2 },
  loreBox: {
    width: '100%',
    backgroundColor: 'rgba(139,92,246,0.10)',
    borderColor: 'rgba(139,92,246,0.28)',
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    marginTop: 14,
  },
  loreTitle: {
    fontSize: 10, fontWeight: '700', color: '#8b5cf6',
    letterSpacing: 1.5, marginBottom: 4,
  },
  loreText: { fontSize: 13, color: '#94a3b8', lineHeight: 20 },

  footer: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 8 },
  btnPrimary: {
    backgroundColor: '#10b981', borderRadius: 14,
    paddingVertical: 18, alignItems: 'center',
  },
  btnPrimaryText: { fontSize: 15, fontWeight: '900', color: '#06121f', letterSpacing: 1 },
});
