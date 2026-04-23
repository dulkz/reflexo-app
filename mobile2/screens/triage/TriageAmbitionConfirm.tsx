import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Platform, StatusBar as RNStatusBar,
} from 'react-native';
import { getAmbitionById } from '../../config/ambitions';

const TOP = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 44;

const GROUP_TITLE: Record<string, string> = {
  elite_sport: 'Boa. Você vai mirar na elite.',
  populational: 'Boa. Você quer estar entre os melhores.',
  brain_health: 'Boa. Foco no que importa — consistência.',
};

interface Props {
  ambitionId: string;
  onNext: () => void;
  onBack: () => void;
}

export default function TriageAmbitionConfirm({ ambitionId, onNext, onBack }: Props) {
  const ambition = getAmbitionById(ambitionId);
  if (!ambition) return null;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: TOP + 12 }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>
        <View style={styles.dotsRow}>
          {[1, 2, 3, 4, 5].map(n => (
            <View key={n} style={[styles.dot, n === 3 && styles.dotActive]} />
          ))}
        </View>
        <View style={{ width: 60 }} />
      </View>

      {/* Content */}
      <View style={styles.body}>
        <Text style={styles.bigIcon}>{ambition.icon}</Text>
        <Text style={styles.groupTitle}>{GROUP_TITLE[ambition.group]}</Text>
        <Text style={styles.ambitionName}>{ambition.name}</Text>
        <Text style={styles.subtitle}>
          Agora só falta a gente saber com quem comparar você — pra não medir com régua errada.
        </Text>
      </View>

      {/* CTA */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.btnPrimary} onPress={onNext} activeOpacity={0.8}>
          <Text style={styles.btnPrimaryText}>CONTINUAR</Text>
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

  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  bigIcon: { fontSize: 88, marginBottom: 28 },
  groupTitle: {
    fontSize: 24, fontWeight: '900', color: '#fff',
    textAlign: 'center', letterSpacing: -0.5, marginBottom: 8,
  },
  ambitionName: {
    fontSize: 14, fontWeight: '700', color: '#4a5a7b',
    textAlign: 'center', letterSpacing: 1, marginBottom: 28,
  },
  subtitle: {
    fontSize: 15, color: '#4a5a7b', textAlign: 'center', lineHeight: 23,
  },

  footer: { paddingHorizontal: 24, paddingBottom: 40 },
  btnPrimary: {
    backgroundColor: '#3b82f6', borderRadius: 14,
    paddingVertical: 18, alignItems: 'center',
  },
  btnPrimaryText: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 2 },
});
