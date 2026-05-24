import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Platform, StatusBar as RNStatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { AgeRange } from '../../types/user';

const TOP = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 44;

interface Props {
  initialAgeRange: AgeRange | null;
  onNext: (ageRange: AgeRange) => void;
  onBack: () => void;
}

export default function TriageAge({ initialAgeRange, onNext, onBack }: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<AgeRange | null>(initialAgeRange);

  const AGE_OPTIONS: { value: AgeRange; label: string }[] = [
    { value: '<25',   label: t('triage.age.options.lt25') },
    { value: '25-40', label: t('triage.age.options.r25_40') },
    { value: '40-55', label: t('triage.age.options.r40_55') },
    { value: '55-70', label: t('triage.age.options.r55_70') },
    { value: '70+',   label: t('triage.age.options.r70plus') },
  ];

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: TOP + 12 }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
        <View style={styles.dotsRow}>
          {[1, 2, 3, 4, 5].map(n => (
            <View key={n} style={[styles.dot, n === 4 && styles.dotActive]} />
          ))}
        </View>
        <View style={{ width: 60 }} />
      </View>

      {/* Content */}
      <View style={styles.body}>
        <Text style={styles.title}>{t('triage.age.title')}</Text>
        <Text style={styles.subtitle}>{t('triage.age.subtitle')}</Text>

        <View style={styles.pillsGrid}>
          {AGE_OPTIONS.map(opt => {
            const isSelected = selected === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.pill, isSelected && styles.pillSelected]}
                onPress={() => setSelected(opt.value)}
                activeOpacity={0.75}
              >
                <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btnPrimary, !selected && styles.btnDisabled]}
          onPress={() => selected && onNext(selected)}
          activeOpacity={selected ? 0.8 : 1}
        >
          <Text style={[styles.btnPrimaryText, !selected && styles.btnDisabledText]}>
            {t('common.continue')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b1220' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 8,
  },
  backBtn: { paddingVertical: 8, width: 60 },
  backText: { color: '#4a5a7b', fontSize: 15, fontWeight: '600' },
  dotsRow: { flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1a2540' },
  dotActive: { backgroundColor: '#3b82f6', width: 20 },

  body: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  title: {
    fontSize: 26, fontWeight: '900', color: '#fff',
    marginBottom: 10, letterSpacing: -0.5,
  },
  subtitle: { fontSize: 14, color: '#4a5a7b', lineHeight: 21, marginBottom: 36 },

  pillsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  pill: {
    paddingHorizontal: 24, paddingVertical: 18,
    borderRadius: 14, borderWidth: 1.5, borderColor: '#1a2540',
    backgroundColor: '#111a2e', minWidth: 140,
    alignItems: 'center',
  },
  pillSelected: { borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.12)' },
  pillText: { fontSize: 16, fontWeight: '700', color: '#4a5a7b' },
  pillTextSelected: { color: '#3b82f6' },

  footer: { paddingHorizontal: 24, paddingBottom: 40 },
  btnPrimary: {
    backgroundColor: '#3b82f6', borderRadius: 14,
    paddingVertical: 18, alignItems: 'center',
  },
  btnDisabled: { backgroundColor: '#1a2540' },
  btnPrimaryText: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 2 },
  btnDisabledText: { color: '#2d3a55' },
});
