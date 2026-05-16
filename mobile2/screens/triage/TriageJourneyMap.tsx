import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform, StatusBar as RNStatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SvgXml } from 'react-native-svg';
import { getAmbitionById, GROUP_COLOR } from '../../config/ambitions';
import JourneyMap from '../../components/JourneyMap';

const TOP = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 44;

interface Props {
  ambitionId: string;
  baselineMs: number;
  onFinish: () => void;
}

export default function TriageJourneyMap({ ambitionId, baselineMs, onFinish }: Props) {
  const { t } = useTranslation();
  const ambition = getAmbitionById(ambitionId);
  if (!ambition) return null;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: TOP + 12 }]}>
        <View style={{ width: 60 }} />
        <Text style={styles.headerTitle}>{t('triage.baseline.journeyTitle')}</Text>
        <View style={{ width: 60 }} />
      </View>
      <View style={styles.ambitionSubRow}>
        <SvgXml xml={ambition.icon} width={28} height={28} />
        <Text style={styles.ambitionSubText}>{t('triage.baseline.headingTo', { name: ambition.name })}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <JourneyMap
          ambitionId={ambitionId}
          baselineMs={baselineMs}
          showYouAreHere
        />
        <View style={{ height: 16 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btnPrimary, { backgroundColor: GROUP_COLOR[ambition.group] }]}
          onPress={onFinish}
          activeOpacity={0.8}
        >
          <Text style={styles.btnPrimaryText}>{t('triage.baseline.startPlaying')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b1220' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 4,
  },
  headerTitle: { fontSize: 13, fontWeight: '800', color: '#fff', letterSpacing: 2 },
  ambitionSubRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginBottom: 20, paddingHorizontal: 24,
  },
  ambitionSubText: { fontSize: 13, color: '#4a5a7b' },

  scroll: { paddingHorizontal: 24 },

  footer: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 8 },
  btnPrimary: {
    backgroundColor: '#3b82f6', borderRadius: 14,
    paddingVertical: 18, alignItems: 'center',
  },
  btnPrimaryText: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 2 },
});
