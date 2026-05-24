import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Platform, StatusBar as RNStatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SvgXml } from 'react-native-svg';
import { ARCHETYPES, buildUserStats } from '../../config/archetypes';
import { SessionRecord } from '../../utils/storage';

const TOP = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 44;

// Friendly title-case identity names for the reveal moment. Data (icon/desc/
// nextId) still comes from the canonical ARCHETYPES catalog.
const ARCH_DISPLAY: Record<string, string> = {
  EXPLORADOR:  'O Explorador',
  EM_EVOLUCAO: 'Em Evolução',
  RESISTENTE:  'O Resistente',
  ATIRADOR:    'O Atirador',
  VELOCISTA:   'O Velocista',
  PILOTO:      'O Piloto',
};

function displayName(id: string): string {
  return ARCH_DISPLAY[id] ?? ARCHETYPES[id]?.name ?? id;
}

interface Props {
  rt: number;
  onNext: () => void;
}

export default function OB3Archetype({ rt, onNext }: Props) {
  const { t } = useTranslation();

  // Synthetic first session so detection runs through the real engine.
  const session: SessionRecord = {
    id: 'ob-baseline',
    mode: 'partida',
    score: rt,
    bestTime: rt,
    rounds: 3,
    times: [rt],
    date: Date.now(),
  };
  const stats = buildUserStats([session], 0);
  const arch = ARCHETYPES[stats.archetypeId] ?? ARCHETYPES.EXPLORADOR;
  const next = arch.nextId ? ARCHETYPES[arch.nextId] : null;

  return (
    <View style={styles.root}>
      <View style={styles.body}>
        <Text style={styles.kicker}>{t('onboarding.ob.ob3.kicker')}</Text>

        <View style={styles.arqCard}>
          <View style={styles.arqAvatar}>
            <SvgXml xml={arch.icon} width={48} height={48} />
          </View>
          <Text style={styles.arqEyebrow}>{t('onboarding.ob.ob3.eyebrow')}</Text>
          <Text style={styles.arqName}>{displayName(arch.id)}</Text>
          <Text style={styles.arqDesc}>{t('onboarding.ob.ob3.desc', { rt })}</Text>
        </View>

        {next && (
          <View style={styles.nextRow}>
            <View style={styles.nextAvatar}>
              <SvgXml xml={next.icon} width={26} height={26} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nextLabel}>{t('onboarding.ob.ob3.nextLabel')}</Text>
              <Text style={styles.nextName}>{displayName(next.id)}</Text>
            </View>
            <Text style={styles.nextArrow}>→</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.btnPrimary} onPress={onNext} activeOpacity={0.85}>
          <Text style={styles.btnPrimaryText}>{t('onboarding.ob.ob3.cta')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b1220' },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: TOP,
    paddingHorizontal: 28,
    gap: 14,
  },
  kicker: { fontSize: 13, color: '#7a8aa0', textAlign: 'center', marginBottom: 2 },

  arqCard: {
    width: '100%',
    backgroundColor: 'rgba(139,92,246,0.12)',
    borderColor: 'rgba(139,92,246,0.30)',
    borderWidth: 1, borderRadius: 16,
    paddingVertical: 22, paddingHorizontal: 18,
    alignItems: 'center',
  },
  arqAvatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#1e3a5f',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(139,92,246,0.45)',
    marginBottom: 10,
  },
  arqEyebrow: {
    fontSize: 10, fontWeight: '700', color: '#4a5a7b',
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 3,
  },
  arqName: {
    fontSize: 30, fontWeight: '900', color: '#8b5cf6',
    letterSpacing: -0.5, marginBottom: 6,
  },
  arqDesc: { fontSize: 13, color: '#94a3b8', textAlign: 'center', lineHeight: 20 },

  nextRow: {
    width: '100%',
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#1e2533',
    borderColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  nextAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#164e63',
    alignItems: 'center', justifyContent: 'center',
  },
  nextLabel: {
    fontSize: 9, fontWeight: '700', color: '#4a5a7b',
    letterSpacing: 1.5, textTransform: 'uppercase',
  },
  nextName: { fontSize: 14, fontWeight: '700', color: '#cbd5e1', marginTop: 1 },
  nextArrow: { fontSize: 18, color: '#10b981', fontWeight: '700' },

  footer: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 8 },
  btnPrimary: {
    backgroundColor: '#8b5cf6', borderRadius: 14,
    paddingVertical: 18, alignItems: 'center',
  },
  btnPrimaryText: { fontSize: 15, fontWeight: '900', color: '#fff', letterSpacing: 1 },
});
