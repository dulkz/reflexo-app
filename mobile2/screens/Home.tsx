import React, { useMemo, useRef, useEffect, useState, RefObject } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Platform, StatusBar as RNStatusBar, Animated,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SvgXml } from 'react-native-svg';
import { getLevelForMode, MODE_COLORS, ModeKey } from '../utils/levels';
import { SessionRecord } from '../utils/storage';
import { UserProfile } from '../types/user';
import { AVATARS } from '../config/avatars';
import { calculateStreak, streakColor } from '../utils/streak';
import { MAX_ENERGY_PER_MODE } from '../config/monetization';
import { ICONS, ACHIEVEMENT_ICONS } from '../assets/icons';

const TOP = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 44;

function getStreakSvg(days: number): string {
  if (days >= 30) return ACHIEVEMENT_ICONS.streak60;
  const color =
    days < 4  ? '#6b7280' :
    days < 7  ? '#3b82f6' :
    days < 10 ? '#8b5cf6' :
                '#f59e0b';
  return ACHIEVEMENT_ICONS.streak5.replace('#3b82f6', color);
}

interface Props {
  onStartPartida: () => void;
  onStartAlvo: () => void;
  onStartSequencia: () => void;
  onStartRadar: () => void;
  sessions: SessionRecord[];
  bestByMode: Record<ModeKey, number | null>;
  userProfile: UserProfile;
  onGoToPerfil: () => void;
  scrollRef?: RefObject<ScrollView | null>;
  /** Energia restante por modo (null = dados ainda carregando) */
  energyCounts?: Record<ModeKey, number> | null;
  /** true enquanto o período de graça de 3 dias estiver ativo */
  inGrace?: boolean;
  /** Timestamp de expiração da graça, para countdown (ms) */
  graceExpiryMs?: number | null;
}

const MODE_INFO: { key: ModeKey; icon: string }[] = [
  { key: 'partida',  icon: ICONS.modes.partida  },
  { key: 'alvo',     icon: ICONS.modes.alvo     },
  { key: 'sequencia',icon: ICONS.modes.sequencia },
  { key: 'radar',    icon: ICONS.modes.radar    },
];

export default function Home({
  onStartPartida, onStartAlvo, onStartSequencia, onStartRadar,
  sessions, bestByMode, userProfile, onGoToPerfil, scrollRef,
  energyCounts = null, inGrace = false, graceExpiryMs = null,
}: Props) {
  const { t } = useTranslation();
  const bestAccByMode = useMemo(() => {
    const acc: Record<ModeKey, number | null> = { partida: null, alvo: null, sequencia: null, radar: null };
    for (const s of sessions) {
      if (s.accuracy !== undefined) {
        if (acc[s.mode] === null || s.accuracy > acc[s.mode]!) {
          acc[s.mode] = s.accuracy;
        }
      }
    }
    return acc;
  }, [sessions]);

  const streak = useMemo(() => calculateStreak(sessions), [sessions]);

  // Tick a cada 60s para atualizar o countdown da graça no badge
  const [graceTick, setGraceTick] = useState(0);
  useEffect(() => {
    if (!inGrace) return;
    const id = setInterval(() => setGraceTick(t => t + 1), 60_000);
    return () => clearInterval(id);
  }, [inGrace]);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (streak.current >= 1 && !streak.playedToday) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.5, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.0, duration: 600, useNativeDriver: true }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [streak.current, streak.playedToday]);

  const handlers: Record<ModeKey, () => void> = {
    partida: onStartPartida,
    alvo: onStartAlvo,
    sequencia: onStartSequencia,
    radar: onStartRadar,
  };

  return (
    <View style={styles.root}>

      {/* ── Fixed header ── */}
      <View style={[styles.header, { paddingTop: TOP + 12 }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.reflexoSmall}>{t('home.appName')}</Text>
          <Text style={styles.greeting}>{t('home.greeting', { name: userProfile.name || 'Atleta' })}</Text>
        </View>
        <TouchableOpacity style={styles.avatar} onPress={onGoToPerfil} activeOpacity={0.8}>
          {(() => {
            const av = (userProfile.selectedAvatar ?? 'initial') !== 'initial'
              ? AVATARS.find(a => a.id === userProfile.selectedAvatar)
              : null;
            return av?.icon
              ? <SvgXml xml={av.icon} width={42} height={42} />
              : <Text style={styles.avatarLetter}>{(userProfile.name || 'Atleta')[0].toUpperCase()}</Text>;
          })()}
        </TouchableOpacity>
      </View>

      {/* ── Scrollable content ── */}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Streak block ── */}
        {streak.current >= 1 && (
          <View style={styles.streakCard}>
            <SvgXml xml={getStreakSvg(streak.current)} width={22} height={22} />
            <Text style={[styles.streakNumber, { color: streakColor(streak.current) }]}>
              {streak.current}
            </Text>
            <Text style={styles.streakLabel}>{t('home.streakDays')}</Text>
            {streak.playedToday ? (
              <View style={styles.streakBadgeDone}>
                <Text style={styles.streakBadgeDoneText}>{t('home.streakToday')}</Text>
              </View>
            ) : (
              <Animated.View style={[styles.streakBadgePulse, { opacity: pulseAnim }]}>
                <Text style={styles.streakBadgePulseText}>{t('home.streakPlayToday')}</Text>
              </Animated.View>
            )}
          </View>
        )}

        <Text style={styles.sectionTitle}>{t('home.modesTitle')}</Text>

        {MODE_INFO.map(m => {
          const best = bestByMode[m.key];
          const lvl = best !== null && best !== undefined ? getLevelForMode(best, m.key) : null;
          const mc = MODE_COLORS[m.key];
          const bestAcc = bestAccByMode[m.key];

          // ── Badge de energia ──────────────────────────────────────────
          const modeEnergy = energyCounts ? energyCounts[m.key] : null;
          const noEnergy = !inGrace && modeEnergy !== null && modeEnergy <= 0;
          let energyBadgeText: string | null = null;
          let energyBadgeStyle: object = styles.energyBadgeOk;
          if (inGrace && graceExpiryMs !== null) {
            void graceTick; // força re-render quando tick muda
            const msLeft = Math.max(0, graceExpiryMs - Date.now());
            const h = Math.floor(msLeft / (60 * 60 * 1000));
            const min = Math.floor((msLeft % (60 * 60 * 1000)) / 60_000);
            const displayTime = h > 0 ? `${h}h` : min > 0 ? `${min}m` : '<1m';
            energyBadgeText = t('home.graceExpiring', { time: displayTime });
            energyBadgeStyle = styles.energyBadgeGrace;
          } else if (modeEnergy !== null) {
            energyBadgeText = t('home.energyCount', { current: modeEnergy, max: MAX_ENERGY_PER_MODE });
            energyBadgeStyle = noEnergy ? styles.energyBadgeEmpty : styles.energyBadgeOk;
          }

          return (
            <TouchableOpacity
              key={m.key}
              style={[styles.modeCard, { borderColor: mc.accent + '33' }]}
              onPress={handlers[m.key]}
              activeOpacity={0.75}
            >
              <View style={[styles.modeAccentBar, { backgroundColor: mc.accent }]} />
              <View style={styles.modeCardInner}>

                <View style={styles.modeTop}>
                  <SvgXml xml={m.icon} width={28} height={28} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.modeName, { color: mc.accent }]}>{t(`modes.${m.key}.name`)}</Text>
                    <Text style={styles.modeDesc}>{t(`modes.${m.key}.desc`)}</Text>
                  </View>
                  <Text style={[styles.modeArrow, { color: mc.accent }]}>›</Text>
                </View>

                <View style={styles.modeDivider} />

                {best !== null && best !== undefined && lvl ? (
                  <View style={styles.modeBottom}>
                    <View style={{ flexShrink: 1 }}>
                      <Text style={styles.modeBestLabel}>
                        {t('home.yourBest')}
                        <Text style={[styles.modeBestMs, { color: lvl.color }]}>{best} ms</Text>
                        {bestAcc !== null
                          ? <Text style={styles.modeBestAcc}>{` · ${Math.round(bestAcc * 100)}%`}</Text>
                          : null}
                      </Text>
                      <Text style={styles.modeBestSubLabel}>
                        {(m.key === 'alvo' || m.key === 'radar') ? t('home.bestReflexTime') : t('home.avgRt')}
                      </Text>
                    </View>
                    <View style={styles.modeBottomRight}>
                      {energyBadgeText !== null && (
                        <Text style={[styles.energyBadge, energyBadgeStyle]} numberOfLines={1}>
                          {energyBadgeText}
                        </Text>
                      )}
                      <View style={[styles.levelPill, { backgroundColor: lvl.bg }]}>
                        <View style={[styles.levelDot, { backgroundColor: lvl.color }]} />
                        <Text style={[styles.levelPillText, { color: lvl.color }]} numberOfLines={1}>
                          {t(`levels.${lvl.labelKey}.label` as any)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.modeBottom}>
                    <Text style={styles.modeBestLabel}>{t('home.notPlayed')}</Text>
                    <View style={styles.modeBottomRight}>
                      {energyBadgeText !== null && (
                        <Text style={[styles.energyBadge, energyBadgeStyle]} numberOfLines={1}>
                          {energyBadgeText}
                        </Text>
                      )}
                      <View style={[styles.newPill, { borderColor: mc.accent + '66' }]}>
                        <Text style={[styles.newPillText, { color: mc.accent }]}>{t('common.newBadge')}</Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* F1 insight strip */}
        <View style={styles.insightStrip}>
          <SvgXml xml={ACHIEVEMENT_ICONS.piloto} width={22} height={22} />
          <View style={{ flex: 1 }}>
            <Text style={styles.insightTitle}>{t('home.f1BenchmarkTitle')}</Text>
            <Text style={styles.insightBody}>{t('home.f1BenchmarkBody')}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          {sessions.length > 0
            ? t('home.sessionsCount', { count: sessions.length })
            : t('home.noSessions')}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b1220' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerLeft: { gap: 2 },
  reflexoSmall: { fontSize: 11, fontWeight: '700', color: '#3a4a6b', letterSpacing: 4 },
  greeting: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#1A6DB5',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { fontSize: 17, fontWeight: '800', color: '#fff' },

  scroll: { paddingHorizontal: 20, paddingBottom: 8 },
  sectionTitle: { fontSize: 10, fontWeight: '700', color: '#3a4a6b', letterSpacing: 2.5, marginBottom: 12 },

  // ── Streak card ──────────────────────────────────────────────────────────
  streakCard: {
    backgroundColor: '#111a2e', borderRadius: 12, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12,
  },
  streakFire: { fontSize: 22 },
  streakNumber: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  streakLabel: { fontSize: 12, color: '#4a5a7b', fontWeight: '600', flex: 1 },
  streakBadgeDone: {
    backgroundColor: 'rgba(16,185,129,0.15)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  streakBadgeDoneText: { fontSize: 11, color: '#10b981', fontWeight: '700' },
  streakBadgePulse: {
    backgroundColor: 'rgba(245,158,11,0.15)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  streakBadgePulseText: { fontSize: 11, color: '#f59e0b', fontWeight: '700' },

  modeCard: {
    backgroundColor: '#111a2e', borderRadius: 14, borderWidth: 1,
    flexDirection: 'row', marginBottom: 10, overflow: 'hidden',
  },
  modeAccentBar: { width: 4 },
  modeCardInner: { flex: 1 },
  modeTop: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, paddingBottom: 12 },
  modeName: { fontSize: 13, fontWeight: '800', letterSpacing: 1.5 },
  modeDesc: { fontSize: 12, color: '#4a5a7b', marginTop: 2 },
  modeArrow: { fontSize: 22, fontWeight: '300', marginRight: 2 },
  modeDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: 14 },
  modeBottom: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10, gap: 8,
  },
  modeBottomRight: {
    flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0,
  },
  modeBestLabel: { fontSize: 12, color: '#4a5a7b', flexShrink: 1 },
  modeBestSubLabel: { fontSize: 9, color: '#3a4a6b', marginTop: 1 },
  modeBestMs: { fontWeight: '700' },
  modeBestAcc: { color: '#4a5a7b' },
  levelPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4,
    flexShrink: 0,
  },
  levelDot: { width: 6, height: 6, borderRadius: 3 },
  levelPillText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  newPill: {
    borderWidth: 1, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  newPillText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  // ── Badge de energia ─────────────────────────────────────────────────────
  energyBadge: {
    fontSize: 9, fontWeight: '700', letterSpacing: 0.5,
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 6, overflow: 'hidden',
  },
  energyBadgeGrace: {
    color: '#10b981',
    backgroundColor: 'rgba(16,185,129,0.12)',
  },
  energyBadgeOk: {
    color: '#3b82f6',
    backgroundColor: 'rgba(59,130,246,0.12)',
  },
  energyBadgeEmpty: {
    color: '#ef4444',
    backgroundColor: 'rgba(239,68,68,0.12)',
  },

  insightStrip: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    backgroundColor: '#111a2e', borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)', padding: 16, marginTop: 4, marginBottom: 16,
  },
  insightIcon: { fontSize: 22 },
  insightTitle: { fontSize: 12, fontWeight: '700', color: '#fff', marginBottom: 4 },
  insightBody: { fontSize: 12, color: '#4a5a7b', lineHeight: 18 },

  footer: { fontSize: 11, color: '#2d3a55', textAlign: 'center', marginBottom: 4 },
});
