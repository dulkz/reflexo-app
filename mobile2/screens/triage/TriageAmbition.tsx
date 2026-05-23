import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform, StatusBar as RNStatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SvgXml } from 'react-native-svg';
import { AMBITIONS, GROUP_COLOR, AmbitionGroup } from '../../config/ambitions';

const TOP = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 44;

const GROUPS: AmbitionGroup[] = ['elite_sport', 'populational', 'brain_health'];

interface Props {
  initialAmbitionId: string | null;
  onNext: (ambitionId: string) => void;
  onBack: () => void;
  // Optional CTA override (defaults to common.continue). Used by the onboarding
  // flow to show "Entrar no Reflexo →".
  ctaLabel?: string;
  // Step indicator. Defaults to the triage flow's 5 dots (active #2). Pass null
  // to hide it (e.g. inside the 4-step onboarding flow).
  stepDots?: { count: number; active: number } | null;
}

export default function TriageAmbition({
  initialAmbitionId, onNext, onBack, ctaLabel, stepDots,
}: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(initialAmbitionId);
  const dots = stepDots === undefined ? { count: 5, active: 2 } : stepDots;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: TOP + 12 }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
        <View style={styles.dotsRow}>
          {dots && Array.from({ length: dots.count }, (_, i) => i + 1).map(n => (
            <View key={n} style={[styles.dot, n === dots.active && styles.dotActive]} />
          ))}
        </View>
        <View style={{ width: 60 }} />
      </View>

      {/* Title */}
      <View style={styles.titleArea}>
        <Text style={styles.title}>{t('triage.ambition.title')}</Text>
        <Text style={styles.subtitle}>{t('triage.ambition.subtitle')}</Text>
        <Text style={styles.chooseOne}>{t('triage.ambition.chooseOne')}</Text>
      </View>

      {/* List */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {GROUPS.map(group => {
          const items = AMBITIONS.filter(a => a.group === group);
          const color = GROUP_COLOR[group];
          return (
            <View key={group} style={styles.section}>
              <Text style={[styles.groupLabel, { color }]}>{t(`triage.ambition.groups.${group}`)}</Text>
              <Text style={styles.groupSubtitle}>{t(`triage.ambition.groupSubtitles.${group}`)}</Text>
              {items.map(a => {
                const isSelected = selected === a.id;
                return (
                  <TouchableOpacity
                    key={a.id}
                    style={[
                      styles.card,
                      isSelected && { borderColor: color, borderWidth: 2, backgroundColor: color + '20' },
                      selected !== null && !isSelected && styles.cardDimmed,
                    ]}
                    onPress={() => setSelected(a.id)}
                    activeOpacity={0.75}
                  >
                    <SvgXml xml={a.icon} width={40} height={40} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardName, isSelected && { color }]}>{a.name}</Text>
                    </View>
                    <Text style={styles.cardMs}>
                      {a.finalMetaMs !== null ? `~${a.finalMetaMs} ms` : t('triage.ambition.noMsTarget')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
        <View style={{ height: 16 }} />
      </ScrollView>

      {/* CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btnPrimary, !selected && styles.btnDisabled]}
          onPress={() => selected && onNext(selected)}
          activeOpacity={selected ? 0.8 : 1}
        >
          <Text style={[styles.btnPrimaryText, !selected && styles.btnDisabledText]}>
            {ctaLabel ?? t('common.continue')}
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

  titleArea: { paddingHorizontal: 24, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: '900', color: '#fff', marginBottom: 6, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#4a5a7b', marginBottom: 4 },
  chooseOne: { fontSize: 13, color: '#6b7280', marginTop: 2 },

  scroll: { paddingHorizontal: 20 },
  section: { marginBottom: 20 },
  groupLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 2.5, marginBottom: 4,
  },
  groupSubtitle: {
    fontSize: 12, color: '#4a5a7b', lineHeight: 18, marginBottom: 10,
  },

  card: {
    backgroundColor: '#111a2e', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 14, marginBottom: 8,
  },
  cardDimmed: { opacity: 0.4 },
  cardIcon: { fontSize: 26 },
  cardName: { fontSize: 14, fontWeight: '700', color: '#fff' },
  cardMs: { fontSize: 12, color: '#3a4a6b', fontWeight: '600' },

  footer: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 8 },
  btnPrimary: {
    backgroundColor: '#3b82f6', borderRadius: 14,
    paddingVertical: 18, alignItems: 'center',
  },
  btnDisabled: { backgroundColor: '#1a2540' },
  btnPrimaryText: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 2 },
  btnDisabledText: { color: '#2d3a55' },
});
