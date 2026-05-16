import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Platform, StatusBar as RNStatusBar, Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { ModeKey, MODE_COLORS } from '../utils/levels';
import {
  EnergyData, addEnergy,
  getTimeUntilReset, formatResetCountdown, TimeUntilReset,
} from '../utils/energy';
import {
  MONETIZATION_ENABLED,
  ENERGY_PACKAGES, SUBSCRIPTIONS,
} from '../config/monetization';
import { SvgXml } from 'react-native-svg';
import { ICONS } from '../assets/icons';

const TOP = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 44;

const MODE_ICON: Record<ModeKey, string> = {
  partida:   ICONS.modes.partida,
  alvo:      ICONS.modes.alvo,
  sequencia: ICONS.modes.sequencia,
  radar:     ICONS.modes.radar,
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
  const { t } = useTranslation();
  const mc = MODE_COLORS[mode];

  const [countdown, setCountdown] = useState<TimeUntilReset>(getTimeUntilReset());

  useEffect(() => {
    const id = setInterval(() => {
      const next = getTimeUntilReset();
      setCountdown(next);
      if (next.totalMs === 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const handleBuyPackage = useCallback(async (energies: number, label: string) => {
    if (!MONETIZATION_ENABLED) {
      Alert.alert(
        t('energy.testModeTitle'),
        t('energy.testModeEnergy', { energies }),
        [
          {
            text: t('common.ok'),
            onPress: async () => {
              const updated = await addEnergy('all', energies, energyData);
              onEnergyAdded(updated);
            },
          },
        ],
      );
    } else {
      Alert.alert(t('common.soon'), t('energy.comingSoonPackage', { label }));
    }
  }, [energyData, onEnergyAdded, t]);

  const handleSubscribe = useCallback(async (label: string, price: string) => {
    if (!MONETIZATION_ENABLED) {
      Alert.alert(
        t('energy.testModeTitle'),
        t('energy.testModeSubscription', { label }),
        [
          {
            text: t('common.ok'),
            onPress: async () => {
              const updated = await addEnergy('all', 999, energyData);
              onEnergyAdded(updated);
            },
          },
        ],
      );
    } else {
      Alert.alert(t('common.soon'), t('energy.comingSoonSubscription', { label, price }));
    }
  }, [energyData, onEnergyAdded, t]);

  return (
    <View style={styles.root}>

      {/* ── Back button ── */}
      <View style={[styles.topBar, { paddingTop: TOP + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Hero — ícone + título + contador ── */}
        <View style={styles.hero}>
          <SvgXml xml={MODE_ICON[mode]} width={54} height={54} style={{ marginBottom: 4 }} />
          <Text style={[styles.heroMode, { color: mc.accent }]}>{t(`modes.${mode}.name`)}</Text>
          <Text style={styles.heroTitle}>{t('energy.depleted')}</Text>

          <View style={styles.energyBadge}>
            <Text style={styles.energyBadgeIcon}>⚡</Text>
            <Text style={styles.energyBadgeCount}>0</Text>
            <Text style={styles.energyBadgeSlash}>/</Text>
            <Text style={styles.energyBadgeMax}>5</Text>
          </View>
        </View>

        {/* ── Reset countdown ── */}
        <View style={styles.resetCard}>
          <Text style={styles.resetLabel}>{t('energy.resetLabel')}</Text>
          <View style={styles.resetCountdownRow}>
            <Text style={styles.resetClockIcon}>🕛</Text>
            <Text style={styles.resetCountdown}>
              {formatResetCountdown(countdown)}
            </Text>
          </View>
          <Text style={styles.resetSub}>{t('energy.resetSub')}</Text>
        </View>

        {/* ── Divisor ── */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t('energy.rechargeNow')}</Text>
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
                  {t('energy.perModeDesc', { energies: pkg.energies })}
                </Text>
              </View>
            </View>
            <View style={styles.packageRight}>
              <Text style={styles.packagePrice}>{pkg.price}</Text>
              <Text style={styles.packageOnce}>{t('energy.once')}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* ── Premium ── */}
        <View style={styles.premiumCard}>
          <View style={styles.premiumHeader}>
            <Text style={styles.premiumCrown}>👑</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.premiumTitle}>{t('energy.premium')}</Text>
              <Text style={styles.premiumDesc}>{t('energy.premiumDesc')}</Text>
            </View>
            <View style={styles.bestValueBadge}>
              <Text style={styles.bestValueText}>{t('energy.best')}</Text>
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
          <Text style={styles.testModeLabel}>{t('energy.testModeFooter')}</Text>
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
