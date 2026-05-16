import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Platform, StatusBar as RNStatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SvgXml } from 'react-native-svg';
import { ARCHETYPE_ICONS, ACHIEVEMENT_ICONS, MISSION_ICONS } from '../../assets/icons';

const TOP = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 44;

interface Props {
  onNext: () => void;
  onDismiss: () => void;
}

export default function TriageIntro({ onNext, onDismiss }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.root}>
      {/* Progress dots (step 1 of 5) */}
      <View style={[styles.header, { paddingTop: TOP + 12 }]}>
        <View style={styles.dotsRow}>
          {[1, 2, 3, 4, 5].map(n => (
            <View key={n} style={[styles.dot, n === 1 && styles.dotActive]} />
          ))}
        </View>
      </View>

      {/* Content */}
      <View style={styles.body}>
        <View style={styles.iconCircle}>
          <SvgXml xml={ARCHETYPE_ICONS.VELOCISTA} width={56} height={56} />
        </View>

        <View style={styles.chipsRow}>
          <View style={styles.chipSport}>
            <SvgXml xml={ARCHETYPE_ICONS.VELOCISTA} width={16} height={16} />
            <Text style={styles.chipTextSport}>{t('triage.intro.chip1')}</Text>
          </View>
          <View style={styles.chipBrain}>
            <SvgXml xml={ACHIEVEMENT_ICONS.semfadiga} width={16} height={16} />
            <Text style={styles.chipTextBrain}>{t('triage.intro.chip2')}</Text>
          </View>
          <View style={styles.chipFit}>
            <SvgXml xml={MISSION_ICONS.muscle} width={16} height={16} />
            <Text style={styles.chipTextFit}>{t('triage.intro.chip3')}</Text>
          </View>
        </View>

        <Text style={styles.title}>{t('triage.intro.title')}</Text>
        <Text style={styles.subtitle}>{t('triage.intro.subtitle')}</Text>
      </View>

      {/* Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.btnPrimary} onPress={onNext} activeOpacity={0.8}>
          <Text style={styles.btnPrimaryText}>{t('triage.intro.btnPrimary')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSecondary} onPress={onDismiss} activeOpacity={0.8}>
          <Text style={styles.btnSecondaryText}>{t('triage.intro.btnSecondary')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b1220' },

  header: { alignItems: 'center', paddingBottom: 16 },
  dotsRow: { flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1a2540' },
  dotActive: { backgroundColor: '#3b82f6', width: 20 },

  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 20 },

  iconCircle: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(91,79,207,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },

  chipsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  chipSport: {
    backgroundColor: 'rgba(91,79,207,0.15)', borderWidth: 1,
    borderColor: 'rgba(91,79,207,0.5)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  chipTextSport: { fontSize: 11, fontWeight: '700', color: '#8b5cf6' },
  chipBrain: {
    backgroundColor: 'rgba(16,185,129,0.15)', borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.5)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  chipTextBrain: { fontSize: 11, fontWeight: '700', color: '#10b981' },
  chipFit: {
    backgroundColor: 'rgba(59,130,246,0.15)', borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.5)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  chipTextFit: { fontSize: 11, fontWeight: '700', color: '#3b82f6' },

  title: {
    fontSize: 32, fontWeight: '900', color: '#fff',
    textAlign: 'center', letterSpacing: -1, lineHeight: 38,
  },
  subtitle: {
    fontSize: 16, color: '#4a5a7b', textAlign: 'center', lineHeight: 24,
  },

  footer: { paddingHorizontal: 24, paddingBottom: 40, gap: 12 },
  btnPrimary: {
    backgroundColor: '#5b4fcf', borderRadius: 14,
    paddingVertical: 18, alignItems: 'center',
  },
  btnPrimaryText: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 2 },
  btnSecondary: { alignItems: 'center', paddingVertical: 12 },
  btnSecondaryText: { fontSize: 14, color: '#3a4a6b', fontWeight: '600' },
});
