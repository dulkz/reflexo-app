import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Platform, StatusBar as RNStatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SvgXml } from 'react-native-svg';
import { getAmbitionById, GROUP_COLOR, GROUP_LABELS } from '../../config/ambitions';

const TOP = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 44;

interface Props {
  ambitionId: string;
  onNext: () => void;
  onBack: () => void;
}

export default function TriageAmbitionConfirm({ ambitionId, onNext, onBack }: Props) {
  const { t } = useTranslation();
  const ambition = getAmbitionById(ambitionId);
  if (!ambition) return null;

  const groupColor = GROUP_COLOR[ambition.group];
  const groupLabel = GROUP_LABELS[ambition.group];
  const POP_IDS = ['f1', 'boxer', 'tennis', 'sprinter', 'top50', 'top10', 'top1'];
  const popContext = POP_IDS.includes(ambition.id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? t(`triage.confirm.population.${ambition.id}` as any)
    : null;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: TOP + 12 }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
        <View style={styles.dotsRow}>
          {[1, 2, 3, 4, 5].map(n => (
            <View key={n} style={[styles.dot, n === 3 && styles.dotActive]} />
          ))}
        </View>
        <View style={{ width: 60 }} />
      </View>

      {/* Body */}
      <View style={styles.body}>
        {/* ZONA 1 — identidade */}
        <View style={styles.identity}>
          <SvgXml xml={ambition.icon} width={64} height={64} />
          <Text style={styles.name}>{ambition.name}</Text>
          <Text style={[styles.groupTag, { color: groupColor }]}>{groupLabel}</Text>
        </View>

        {/* ZONA 2 — card de meta */}
        <View style={styles.metaCard}>
          <Text style={styles.metaLabel}>{t('triage.confirm.yourFinalGoal')}</Text>

          {ambition.finalMetaMs !== null ? (
            <>
              <Text style={[styles.metaBig, { color: groupColor }]}>
                {ambition.finalMetaMs}
                <Text style={styles.metaMs}>ms</Text>
              </Text>
              <Text style={styles.metaDescription}>{ambition.description}</Text>
              {popContext && <Text style={styles.metaContext}>{popContext}</Text>}
            </>
          ) : (
            <>
              <Text style={[styles.metaBigText, { color: groupColor }]}>
                {t('triage.confirm.consistencyGoal')}
              </Text>
              <Text style={styles.metaDescription}>{ambition.description}</Text>
            </>
          )}

          <View style={styles.divider} />

          <Text style={styles.metaLabel}>{t('triage.confirm.toGetThere')}</Text>
          <Text style={styles.howToText}>{t('triage.confirm.howTo')}</Text>
        </View>
      </View>

      {/* ZONA 3 — Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: groupColor }]} onPress={onNext} activeOpacity={0.8}>
          <Text style={styles.btnPrimaryText}>{t('common.continue')}</Text>
        </TouchableOpacity>
        <Text style={styles.footerHint}>{t('triage.confirm.nextHint')}</Text>
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

  body: {
    flex: 1, paddingHorizontal: 24, gap: 28,
    justifyContent: 'center',
  },

  // ZONA 1
  identity: { alignItems: 'center', gap: 12 },
  icon: { fontSize: 72, lineHeight: 84 },
  name: {
    fontSize: 28, fontWeight: '900', color: '#fff',
    textAlign: 'center', letterSpacing: -0.5,
  },
  groupTag: {
    fontSize: 11, fontWeight: '800', letterSpacing: 2,
  },

  // ZONA 2
  metaCard: {
    backgroundColor: '#111a2e',
    borderRadius: 16,
    padding: 20,
  },
  metaLabel: {
    fontSize: 10, fontWeight: '700', color: '#4a5a7b',
    letterSpacing: 2,
  },
  metaBig: {
    fontSize: 48, fontWeight: '900', letterSpacing: -1,
    marginTop: 6, marginBottom: 8,
  },
  metaMs: { fontSize: 22, fontWeight: '700' },
  metaBigText: {
    fontSize: 20, fontWeight: '900',
    marginTop: 6, marginBottom: 8,
  },
  metaDescription: {
    fontSize: 14, color: '#cbd5e1', lineHeight: 20,
  },
  metaContext: {
    fontSize: 13, color: '#4a5a7b', marginTop: 4,
  },
  divider: {
    height: 1, backgroundColor: '#1a2540',
    marginTop: 16, marginBottom: 14,
  },
  howToText: {
    fontSize: 14, color: '#cbd5e1', lineHeight: 20, marginTop: 6,
  },

  // ZONA 3
  footer: {
    paddingHorizontal: 24, paddingBottom: 32,
    alignItems: 'center', gap: 12,
  },
  btnPrimary: {
    backgroundColor: '#3b82f6', borderRadius: 14,
    paddingVertical: 18, alignItems: 'center', width: '100%',
  },
  btnPrimaryText: {
    fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 2,
  },
  footerHint: {
    fontSize: 12, color: '#4a5a7b',
  },
});
