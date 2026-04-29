import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Platform, StatusBar as RNStatusBar, Alert,
} from 'react-native';
import { ModeKey, MODE_COLORS } from '../utils/levels';
import {
  EnergyData, addEnergy,
  getTimeUntilReset, formatResetCountdown, TimeUntilReset,
} from '../utils/energy';
import {
  MONETIZATION_ENABLED,
  ENERGY_PACKAGES, SUBSCRIPTIONS,
} from '../config/monetization';

const TOP = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 44;

// ── Texto por modo ────────────────────────────────────────────────────────────
const MODE_LABEL: Record<ModeKey, string> = {
  partida:   'MODO PARTIDA',
  alvo:      'MODO ALVO',
  sequencia: 'MODO SEQUÊNCIA',
  radar:     'MODO RADAR',
};
const MODE_ICON: Record<ModeKey, string> = {
  partida:   '🏎',
  alvo:      '🎯',
  sequencia: '🧠',
  radar:     '📡',
};

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  mode: ModeKey;
  energyData: EnergyData;
  onBack: () => void;
  /** Chamado quando energia é adicionada (simulada ou real). Recebe EnergyData atualizado. */
  onEnergyAdded: (updated: EnergyData) => void;
}

export default function SemEnergia({ mode, energyData, onBack, onEnergyAdded }: Props) {
  const mc = MODE_COLORS[mode];

  // ── Countdown ao próximo reset ──────────────────────────────────────────────
  const [countdown, setCountdown] = useState<TimeUntilReset>(getTimeUntilReset());

  useEffect(() => {
    const id = setInterval(() => {
      const t = getTimeUntilReset();
      setCountdown(t);
      if (t.totalMs === 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // ── Handlers de compra ──────────────────────────────────────────────────────
  const handleBuyPackage = useCallback(async (energies: number, label: string) => {
    if (!MONETIZATION_ENABLED) {
      // Modo teste — simula compra instantânea
      Alert.alert(
        '⚡ Modo teste',
        `${energies} energias adicionadas a todos os modos (sem cobrança real).`,
        [
          {
            text: 'OK',
            onPress: async () => {
              const updated = await addEnergy('all', energies, energyData);
              onEnergyAdded(updated);
            },
          },
        ],
      );
    } else {
      // TODO: Fase 2 — integrar Google Play Billing
      Alert.alert('Em breve', `Compra de "${label}" será processada via Google Play.`);
    }
  }, [energyData, onEnergyAdded]);

  const handleSubscribe = useCallback(async (label: string, price: string) => {
    if (!MONETIZATION_ENABLED) {
      Alert.alert(
        '⚡ Modo teste',
        `Assinatura "${label}" simulada — energia ilimitada ativada (sem cobrança real).`,
        [
          {
            text: 'OK',
            onPress: async () => {
              // Adiciona energia grande para simular "ilimitado" no dia
              const updated = await addEnergy('all', 999, energyData);
              onEnergyAdded(updated);
            },
          },
        ],
      );
    } else {
      Alert.alert('Em breve', `Assinatura "${label}" (${price}) via Google Play.`);
    }
  }, [energyData, onEnergyAdded]);

  return (
    <View style={styles.root}>

      {/* ── Back button ── */}
      <View style={[styles.topBar, { paddingTop: TOP + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Hero — ícone + título + contador ── */}
        <View style={styles.hero}>
          <Text style={styles.heroIcon}>{MODE_ICON[mode]}</Text>
          <Text style={[styles.heroMode, { color: mc.accent }]}>{MODE_LABEL[mode]}</Text>
          <Text style={styles.heroTitle}>ENERGIA ESGOTADA</Text>

          {/* ⚡ 0/5 em vermelho */}
          <View style={styles.energyBadge}>
            <Text style={styles.energyBadgeIcon}>⚡</Text>
            <Text style={styles.energyBadgeCount}>0</Text>
            <Text style={styles.energyBadgeSlash}>/</Text>
            <Text style={styles.energyBadgeMax}>5</Text>
          </View>
        </View>

        {/* ── Reset countdown ── */}
        <View style={styles.resetCard}>
          <Text style={styles.resetLabel}>Energia repõe à meia-noite</Text>
          <View style={styles.resetCountdownRow}>
            <Text style={styles.resetClockIcon}>🕛</Text>
            <Text style={styles.resetCountdown}>
              {formatResetCountdown(countdown)}
            </Text>
          </View>
          <Text style={styles.resetSub}>Aguarde ou recarregue agora</Text>
        </View>

        {/* ── Divisor ── */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>RECARREGAR AGORA</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* ── Pacotes de energia ── */}
        {ENERGY_PACKAGES.map(pkg => (
          <TouchableOpacity
            key={pkg.id}
            style={styles.packageCard}
            onPress={() => handleBuyPackage(pkg.energies, pkg.label)}
            activeOpacity={0.8}
          >
            <View style={styles.packageLeft}>
              <Text style={styles.packageIcon}>⚡</Text>
              <View>
                <Text style={styles.packageLabel}>{pkg.label}</Text>
                <Text style={styles.packageDesc}>
                  {pkg.energies} energias · todos os modos
                </Text>
              </View>
            </View>
            <View style={styles.packageRight}>
              <Text style={styles.packagePrice}>{pkg.price}</Text>
              <Text style={styles.packageOnce}>única</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* ── Premium ── */}
        <View style={styles.premiumCard}>
          <View style={styles.premiumHeader}>
            <Text style={styles.premiumCrown}>👑</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.premiumTitle}>PREMIUM</Text>
              <Text style={styles.premiumDesc}>
                Energia ilimitada · Sem anúncios · Badge exclusivo
              </Text>
            </View>
            <View style={styles.bestValueBadge}>
              <Text style={styles.bestValueText}>MELHOR</Text>
            </View>
          </View>

          {SUBSCRIPTIONS.map(sub => (
            <TouchableOpacity
              key={sub.id}
              style={styles.subOption}
              onPress={() => handleSubscribe(sub.label, sub.price)}
              activeOpacity={0.8}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.subLabel}>{sub.label}</Text>
                {sub.perMonth && (
                  <Text style={styles.subPerMonth}>{sub.perMonth}</Text>
                )}
              </View>
              <Text style={styles.subPrice}>{sub.price}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Rodapé modo teste ── */}
        {!MONETIZATION_ENABLED && (
          <Text style={styles.testModeLabel}>
            ⚙ Modo teste ativo — compras simuladas sem cobrança
          </Text>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b1220' },

  topBar: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  backBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  backText: { fontSize: 12, fontWeight: '700', color: '#0b1220', letterSpacing: 0.3 },

  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 28,
    gap: 6,
  },
  heroIcon: { fontSize: 54, lineHeight: 64, marginBottom: 4 },
  heroMode: { fontSize: 11, fontWeight: '800', letterSpacing: 2.5 },
  heroTitle: {
    fontSize: 22, fontWeight: '900', color: '#ef4444',
    letterSpacing: 1.5, marginTop: 4,
  },
  energyBadge: {
    flexDirection: 'row', alignItems: 'baseline',
    gap: 3, marginTop: 10,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
  },
  energyBadgeIcon: { fontSize: 22, lineHeight: 26 },
  energyBadgeCount: { fontSize: 36, fontWeight: '900', color: '#ef4444', lineHeight: 42 },
  energyBadgeSlash: { fontSize: 20, color: '#4a5a7b', lineHeight: 26 },
  energyBadgeMax: { fontSize: 20, color: '#4a5a7b', lineHeight: 26 },

  // ── Reset card ────────────────────────────────────────────────────────────
  resetCard: {
    backgroundColor: '#111a2e',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 18,
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  resetLabel: { fontSize: 12, color: '#4a5a7b', fontWeight: '600' },
  resetCountdownRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  resetClockIcon: { fontSize: 20 },
  resetCountdown: {
    fontSize: 28, fontWeight: '900', color: '#cbd5e1',
    fontVariant: ['tabular-nums'], letterSpacing: 1,
  },
  resetSub: { fontSize: 11, color: '#3a4a6b', marginTop: 2 },

  // ── Divisor ───────────────────────────────────────────────────────────────
  dividerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.07)' },
  dividerText: {
    fontSize: 10, fontWeight: '800', color: '#3a4a6b', letterSpacing: 2,
  },

  // ── Pacotes de energia ────────────────────────────────────────────────────
  packageCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#111a2e',
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 18, paddingVertical: 14,
    marginBottom: 10,
  },
  packageLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  packageIcon: { fontSize: 26, lineHeight: 32 },
  packageLabel: { fontSize: 14, fontWeight: '800', color: '#fff' },
  packageDesc: { fontSize: 11, color: '#4a5a7b', marginTop: 2 },
  packageRight: { alignItems: 'flex-end' },
  packagePrice: { fontSize: 16, fontWeight: '900', color: '#f59e0b' },
  packageOnce: { fontSize: 10, color: '#3a4a6b', marginTop: 1 },

  // ── Premium card ──────────────────────────────────────────────────────────
  premiumCard: {
    backgroundColor: '#0f1729',
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)',
    overflow: 'hidden',
    marginTop: 4, marginBottom: 16,
  },
  premiumHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  premiumCrown: { fontSize: 28, lineHeight: 34 },
  premiumTitle: {
    fontSize: 13, fontWeight: '900', color: '#f59e0b', letterSpacing: 1.5,
  },
  premiumDesc: { fontSize: 11, color: '#4a5a7b', marginTop: 2, lineHeight: 16 },
  bestValueBadge: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.4)',
  },
  bestValueText: { fontSize: 9, fontWeight: '800', color: '#f59e0b', letterSpacing: 1 },
  subOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
  },
  subLabel: { fontSize: 14, fontWeight: '700', color: '#fff' },
  subPerMonth: { fontSize: 11, color: '#4a5a7b', marginTop: 2 },
  subPrice: { fontSize: 15, fontWeight: '800', color: '#f59e0b' },

  // ── Rodapé modo teste ─────────────────────────────────────────────────────
  testModeLabel: {
    fontSize: 10, color: '#2d3a55', textAlign: 'center',
    marginTop: 4, letterSpacing: 0.5,
  },
});
