import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, StatusBar as RNStatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SvgXml } from 'react-native-svg';
import { ACHIEVEMENT_ICONS, MISSION_ICONS, REWARD_ICONS } from '../assets/icons';
import { SessionRecord } from '../utils/storage';
import { UserProfile } from '../types/user';
import {
  getAmbition, getMilestonesState,
} from '../utils/ambition';
import { GROUP_COLOR } from '../config/ambitions';
import { MONETIZATION_ENABLED } from '../config/monetization';
import { getDailyMissions, DailyMission } from '../utils/dailyMissions';
import { getWeeklyMissions, WeeklyMission } from '../utils/missions';

const TOP = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 44;

interface Props {
  sessions: SessionRecord[];
  userProfile: UserProfile;
  onOpenTriage: (editMode: boolean) => void;
}

export default function Missoes({ sessions, userProfile, onOpenTriage }: Props) {
  const { t } = useTranslation();

  const currentBestMs = useMemo(
    () => sessions.length > 0 ? Math.min(...sessions.map(s => s.score)) : null,
    [sessions],
  );

  const ambition = useMemo(
    () => userProfile.triageCompleted && userProfile.ambitionId
      ? getAmbition(userProfile.ambitionId) ?? null
      : null,
    [userProfile],
  );

  const baselineMs = userProfile.baselineMs ?? null;

  const milestonesState = useMemo(() => {
    if (!ambition) return [];
    return getMilestonesState(baselineMs, currentBestMs, ambition.id, sessions);
  }, [ambition, baselineMs, currentBestMs, sessions]);

  const beatenCount = useMemo(
    () => milestonesState.filter(s => s.status !== 'pendente').length,
    [milestonesState],
  );

  const isBrainHealth = ambition?.group === 'brain_health';
  const ambitionGroupColor = ambition ? GROUP_COLOR[ambition.group] : '#3b82f6';

  const [dailyMissions, setDailyMissions] = useState<DailyMission[]>([]);
  useEffect(() => {
    getDailyMissions(sessions, userProfile).then(setDailyMissions);
  }, [sessions, userProfile]);

  const [weeklyMissions, setWeeklyMissions] = useState<WeeklyMission[]>([]);
  useEffect(() => {
    getWeeklyMissions(sessions, userProfile).then(setWeeklyMissions);
  }, [sessions, userProfile]);

  const doneDaily = dailyMissions.filter(m => m.done).length;
  const doneWeekly = weeklyMissions.filter(m => m.done).length;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: TOP + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>{t('missoes.title')}</Text>

        {/* ── Meta pessoal — banner roxo no topo ── */}
        {userProfile.triageCompleted && ambition ? (() => {
          const metaDistance = !isBrainHealth && ambition.finalMetaMs != null && currentBestMs != null
            ? Math.max(0, currentBestMs - ambition.finalMetaMs)
            : null;
          const subText = isBrainHealth
            ? t('journey.summaryBrain', { base: baselineMs ?? '—', beaten: beatenCount, total: ambition.milestones.length })
            : metaDistance !== null && metaDistance > 0
            ? t('journey.metaDistance', { delta: metaDistance })
            : t('journey.metaReached');
          return (
            <TouchableOpacity style={styles.metaBanner} onPress={() => onOpenTriage(true)} activeOpacity={0.85}>
              <View style={styles.metaIcon}>
                <SvgXml xml={ambition.icon} width={22} height={22} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.metaLabel}>{t('journey.yourGoalLabel')}</Text>
                <Text style={[styles.metaValue, { color: ambitionGroupColor }]} numberOfLines={1}>{ambition.name}</Text>
                <Text style={styles.metaSub} numberOfLines={1}>{subText}</Text>
              </View>
              <View style={styles.metaEdit}>
                <Text style={styles.metaEditText}>{t('journey.changeGoal')}</Text>
              </View>
            </TouchableOpacity>
          );
        })() : (
          <TouchableOpacity style={styles.metaCTA} onPress={() => onOpenTriage(false)} activeOpacity={0.85}>
            <Text style={styles.metaCTATitle}>{t('journey.ctaTitle')}</Text>
            <Text style={styles.metaCTADesc}>{t('journey.ctaDesc')}</Text>
            <View style={styles.metaCTABtn}>
              <Text style={styles.metaCTABtnText}>{t('journey.ctaBtn')}</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* ── Diárias — cada missão concluída dá Energia ── */}
        {dailyMissions.length > 0 && (
          <Text style={styles.missionGroupLabel}>{t('journey.today')}</Text>
        )}
        {dailyMissions.length > 0 && (
          <View style={styles.dailyCard}>
            <View style={styles.missionHeader}>
              <Text style={styles.missionHeaderText}>{t('journey.dailyGoal')}</Text>
              <View style={styles.missionCount}>
                <SvgXml xml={ACHIEVEMENT_ICONS.sniper} width={14} height={14} />
                <Text style={{ fontSize: 11, color: doneDaily === dailyMissions.length ? '#10b981' : '#06b6d4' }}>
                  {t('journey.dailyProgress', { done: doneDaily, total: dailyMissions.length })}
                </Text>
              </View>
            </View>
            {MONETIZATION_ENABLED && (
              <View style={styles.rewardHint}>
                <SvgXml xml={REWARD_ICONS.energy} width={13} height={13} />
                <Text style={styles.rewardHintText}>{t('missoes.dailyRewardHint')}</Text>
              </View>
            )}
            <View style={styles.missionProgressTrack}>
              <View style={[
                styles.missionProgressFill,
                { flex: doneDaily, backgroundColor: doneDaily === dailyMissions.length ? '#10b981' : '#06b6d4' },
              ]} />
              <View style={{ flex: Math.max(0, dailyMissions.length - doneDaily) }} />
            </View>
            {dailyMissions.map(m => (
              <View key={m.id} style={[styles.missionRow, m.done && { opacity: 0.5 }]}>
                <SvgXml xml={m.icon} width={22} height={22} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={[styles.missionRowLabel, m.done && { color: '#10b981' }]} numberOfLines={1}>
                    {m.label}
                  </Text>
                  {m.target > 1 && (
                    <View style={styles.missionMiniTrack}>
                      <View style={[
                        styles.missionMiniFill,
                        { flex: m.current, backgroundColor: m.done ? '#10b981' : '#06b6d4' },
                      ]} />
                      <View style={{ flex: Math.max(0, m.target - m.current) }} />
                    </View>
                  )}
                  {MONETIZATION_ENABLED && (
                    <View style={[styles.rewardChip, styles.rewardChipEnergy, m.done && styles.rewardChipDone]}>
                      <SvgXml xml={REWARD_ICONS.energy} width={11} height={11} />
                      <Text style={[styles.rewardChipText, { color: m.done ? '#10b981' : '#06b6d4' }]}>
                        {m.done ? t('missoes.energyEarned') : t('missoes.energyReward')}
                      </Text>
                    </View>
                  )}
                </View>
                {m.done
                  ? <Text style={styles.missionRowCheck}>✓</Text>
                  : <Text style={styles.missionRowProgress}>{m.current}/{m.target}</Text>
                }
              </View>
            ))}
          </View>
        )}

        {/* ── Semanais — cada missão concluída dá Ticket Dourado ── */}
        {weeklyMissions.length > 0 && (
          <Text style={styles.missionGroupLabel}>{t('journey.thisWeek')}</Text>
        )}
        {weeklyMissions.length > 0 && (
          <View style={styles.weeklyCard}>
            <View style={styles.missionHeader}>
              <Text style={styles.missionHeaderText}>{t('journey.weeklyMission')}</Text>
              <View style={styles.missionCount}>
                <SvgXml xml={MISSION_ICONS.clipboard} width={14} height={14} />
                <Text style={{ fontSize: 11, color: doneWeekly === weeklyMissions.length ? '#10b981' : '#5b4fcf' }}>
                  {t('journey.weeklyProgress', { done: doneWeekly, total: weeklyMissions.length })}
                </Text>
              </View>
            </View>
            {MONETIZATION_ENABLED && (
              <View style={styles.rewardHint}>
                <SvgXml xml={REWARD_ICONS.ticket} width={13} height={13} />
                <Text style={styles.rewardHintText}>{t('missoes.weeklyRewardHint')}</Text>
              </View>
            )}
            <View style={styles.missionProgressTrack}>
              <View style={[
                styles.missionProgressFill,
                { flex: doneWeekly, backgroundColor: doneWeekly === weeklyMissions.length ? '#10b981' : '#5b4fcf' },
              ]} />
              <View style={{ flex: Math.max(0, weeklyMissions.length - doneWeekly) }} />
            </View>
            {weeklyMissions.map(m => (
              <View key={m.id} style={[styles.missionRow, m.done && { opacity: 0.5 }]}>
                <SvgXml xml={m.icon} width={22} height={22} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={[styles.missionRowLabel, m.done && { color: '#10b981' }]} numberOfLines={1}>
                    {m.label}
                  </Text>
                  <View style={styles.missionMiniTrack}>
                    <View style={[
                      styles.missionMiniFill,
                      { flex: m.current, backgroundColor: m.done ? '#10b981' : '#5b4fcf' },
                    ]} />
                    <View style={{ flex: Math.max(0, m.target - m.current) }} />
                  </View>
                  {MONETIZATION_ENABLED && (
                    <View style={[styles.rewardChip, styles.rewardChipTicket, m.done && styles.rewardChipDone]}>
                      <SvgXml xml={REWARD_ICONS.ticket} width={11} height={11} />
                      <Text style={[styles.rewardChipText, { color: m.done ? '#10b981' : '#f59e0b' }]}>
                        {m.done ? t('missoes.ticketEarned') : t('missoes.ticketReward')}
                      </Text>
                    </View>
                  )}
                </View>
                {m.done
                  ? <Text style={styles.missionRowCheck}>✓</Text>
                  : <Text style={styles.missionRowProgress}>{m.current}/{m.target}</Text>
                }
              </View>
            ))}
          </View>
        )}

        {dailyMissions.length === 0 && weeklyMissions.length === 0 && (
          <View style={styles.emptyMissions}>
            <Text style={styles.emptyMissionsText}>{t('journey.emptyMissions')}</Text>
          </View>
        )}

        {/* Lore contextual — por que treinar com intervalos */}
        {(dailyMissions.length > 0 || weeklyMissions.length > 0) && (
          <View style={styles.loreCard}>
            <View style={styles.loreDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.loreTitle}>{t('journey.loreTitle')}</Text>
              <Text style={styles.loreBody}>{t('journey.loreBody')}</Text>
            </View>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b1220' },
  scroll: { paddingHorizontal: 20, paddingBottom: 16 },
  pageTitle: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 4, marginBottom: 20 },

  // ── Meta pessoal banner ───────────────────────────────────────────────────
  metaBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#111a2e', borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.25)',
    paddingHorizontal: 14, paddingVertical: 14, marginBottom: 20,
  },
  metaIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(139,92,246,0.12)',
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  metaLabel: { fontSize: 9, fontWeight: '800', color: '#3a4a6b', letterSpacing: 2, marginBottom: 3 },
  metaValue: { fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  metaSub: { fontSize: 11, color: '#7a8aa0', marginTop: 1 },
  metaEdit: {
    paddingHorizontal: 9, paddingVertical: 5, borderRadius: 7,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  metaEditText: { fontSize: 11, color: '#7a8aa0', fontWeight: '600' },

  // ── Meta CTA (pre-triage) ─────────────────────────────────────────────────
  metaCTA: {
    backgroundColor: '#111a2e', borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)', padding: 18, gap: 10, marginBottom: 20,
  },
  metaCTATitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  metaCTADesc: { fontSize: 13, color: '#7a8aa0', lineHeight: 19 },
  metaCTABtn: {
    backgroundColor: '#3b82f6', borderRadius: 10,
    paddingVertical: 12, alignItems: 'center', marginTop: 4,
  },
  metaCTABtnText: { fontSize: 13, fontWeight: '800', color: '#fff', letterSpacing: 1.5 },

  // ── Group label (Hoje / Semana) ──────────────────────────────────────────
  missionGroupLabel: {
    fontSize: 10, fontWeight: '800', color: '#4a5a7b', letterSpacing: 2,
    textTransform: 'uppercase', marginBottom: 8, marginTop: 2,
  },

  // ── Mission cards ────────────────────────────────────────────────────────
  dailyCard: {
    backgroundColor: '#111a2e', borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(6,182,212,0.3)', padding: 14, marginBottom: 10,
  },
  weeklyCard: {
    backgroundColor: '#111a2e', borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(91,79,207,0.3)', padding: 14, marginBottom: 10,
  },
  missionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 6,
  },
  missionHeaderText: { fontSize: 10, fontWeight: '800', color: '#3a4a6b', letterSpacing: 2 },
  missionCount: { flexDirection: 'row', alignItems: 'center', gap: 4 },

  // ── Reward hint (under header) ────────────────────────────────────────────
  rewardHint: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  rewardHintText: { fontSize: 10, color: '#4a5a7b', fontWeight: '600', letterSpacing: 0.2 },

  // ── Reward chip (per mission) ─────────────────────────────────────────────
  rewardChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start',
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  rewardChipEnergy: { backgroundColor: 'rgba(6,182,212,0.12)' },
  rewardChipTicket: { backgroundColor: 'rgba(245,158,11,0.12)' },
  rewardChipDone: { backgroundColor: 'rgba(16,185,129,0.12)' },
  rewardChipText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },

  missionProgressTrack: {
    flexDirection: 'row', height: 4, borderRadius: 2,
    backgroundColor: '#1e2d45', marginBottom: 12, overflow: 'hidden',
  },
  missionProgressFill: { borderRadius: 2 },
  missionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  missionRowLabel: { fontSize: 12, color: '#7a8aa0', fontWeight: '600' },
  missionRowCheck: { fontSize: 13, color: '#10b981', fontWeight: '800', width: 22, textAlign: 'right' },
  missionRowProgress: { fontSize: 11, color: '#4a5a7b', width: 28, textAlign: 'right' },
  missionMiniTrack: {
    flexDirection: 'row', height: 3, borderRadius: 2,
    backgroundColor: '#1e2d45', overflow: 'hidden',
  },
  missionMiniFill: { borderRadius: 2 },

  emptyMissions: {
    backgroundColor: '#111a2e', borderRadius: 12,
    padding: 18, alignItems: 'center',
  },
  emptyMissionsText: { fontSize: 12, color: '#4a5a7b', textAlign: 'center' },

  // ── Lore card ─────────────────────────────────────────────────────────────
  loreCard: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: 'rgba(139,92,246,0.10)', borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.25)', padding: 14, marginTop: 6,
  },
  loreDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#8b5cf6', marginTop: 6 },
  loreTitle: { fontSize: 12, fontWeight: '700', color: '#a78bfa', marginBottom: 4 },
  loreBody: { fontSize: 12, color: '#7a8aa0', lineHeight: 18 },
});
