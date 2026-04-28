import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, StatusBar as RNStatusBar,
} from 'react-native';
import { SessionRecord } from '../utils/storage';
import { UserProfile } from '../types/user';
import { buildUserStats } from '../config/archetypes';
import {
  getAmbition, getNextMilestone, getMilestonesState,
} from '../utils/ambition';
import { GROUP_COLOR } from '../config/ambitions';
import JourneyMap from '../components/JourneyMap';
import { calculateStreak } from '../utils/streak';
import { getDailyMissions, DailyMission } from '../utils/dailyMissions';
import { getWeeklyMissions, WeeklyMission } from '../utils/missions';

const TOP = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 44;

interface Props {
  sessions: SessionRecord[];
  userProfile: UserProfile;
  onOpenTriage: (editMode: boolean) => void;
}

export default function Jornada({ sessions, userProfile, onOpenTriage }: Props) {
  const streak = useMemo(() => calculateStreak(sessions), [sessions]);
  const stats = useMemo(() => buildUserStats(sessions, streak.current), [sessions, streak.current]);

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

  const nextMilestone = useMemo(
    () => ambition ? getNextMilestone(baselineMs, currentBestMs, ambition.id, sessions) : null,
    [ambition, baselineMs, currentBestMs, sessions],
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
        contentContainerStyle={[styles.scroll, { paddingTop: TOP + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.kicker}>JORNADA</Text>

        {/* ── MINHA JORNADA ── */}
        {!userProfile.triageCompleted ? (
          <View style={styles.journeyCTA}>
            <Text style={styles.journeyCTATitle}>Defina sua meta</Text>
            <Text style={styles.journeyCTADesc}>
              Escolha uma ambição e veja sua jornada personalizada em todas as telas.
            </Text>
            <TouchableOpacity style={styles.journeyCTABtn} onPress={() => onOpenTriage(false)} activeOpacity={0.8}>
              <Text style={styles.journeyCTABtnText}>DEFINIR MINHA META</Text>
            </TouchableOpacity>
          </View>
        ) : ambition ? (
          <View style={styles.journeySection}>
            <View style={styles.journeySectionHeader}>
              <Text style={styles.sectionTitle}>MINHA JORNADA</Text>
            </View>
            <View style={styles.journeyAmbitionRow}>
              <Text style={styles.journeyAmbitionIcon}>{ambition.icon}</Text>
              <Text style={[styles.journeyAmbitionName, { color: ambitionGroupColor }]}>
                {ambition.name}
              </Text>
              <TouchableOpacity onPress={() => onOpenTriage(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.journeyChangeLink}>trocar meta</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.journeySummary}>
              {isBrainHealth
                ? `Baseline: ${baselineMs ?? '—'} ms · ${beatenCount} de ${ambition.milestones.length} marcos conquistados`
                : `Baseline: ${baselineMs ?? '—'} ms · Meta: ${ambition.finalMetaMs ?? '—'} ms · ${beatenCount} de ${ambition.milestones.length} marcos batidos`
              }
            </Text>
            {baselineMs !== null && (
              <View style={styles.journeyMapWrap}>
                <JourneyMap
                  ambitionId={ambition.id}
                  baselineMs={baselineMs}
                  currentBestMs={currentBestMs}
                  sessions={sessions}
                  showYouAreHere
                />
              </View>
            )}
            {nextMilestone && nextMilestone.type !== 'qualitative' && nextMilestone.ms !== undefined && currentBestMs !== null && (
              <View style={styles.nextMilestoneRow}>
                <Text style={styles.nextMilestoneLabel}>Próximo: {nextMilestone.label}</Text>
                <Text style={[styles.nextMilestoneDelta, { color: ambitionGroupColor }]}>
                  {currentBestMs <= nextMilestone.ms
                    ? '✓ atingido'
                    : `faltam ${currentBestMs - nextMilestone.ms} ms`}
                </Text>
              </View>
            )}
          </View>
        ) : null}

        {/* ── MISSÕES ── */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>MISSÕES</Text>

        {/* Diárias */}
        {dailyMissions.length > 0 && (
          <View style={styles.dailyCard}>
            <View style={styles.missionHeader}>
              <Text style={styles.missionHeaderText}>OBJETIVO DO DIA</Text>
              <Text style={styles.missionCount}>
                {'🎯 '}
                <Text style={{ color: doneDaily === dailyMissions.length ? '#10b981' : '#06b6d4' }}>
                  {doneDaily}/{dailyMissions.length}
                </Text>
                {' completos'}
              </Text>
            </View>
            <View style={styles.missionProgressTrack}>
              <View style={[
                styles.missionProgressFill,
                { flex: doneDaily, backgroundColor: doneDaily === dailyMissions.length ? '#10b981' : '#06b6d4' },
              ]} />
              <View style={{ flex: Math.max(0, dailyMissions.length - doneDaily) }} />
            </View>
            {dailyMissions.map(m => (
              <View key={m.id} style={[styles.missionRow, m.done && { opacity: 0.5 }]}>
                <Text style={styles.missionRowIcon}>{m.icon}</Text>
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
                </View>
                {m.done
                  ? <Text style={styles.missionRowCheck}>✓</Text>
                  : <Text style={styles.missionRowProgress}>{m.current}/{m.target}</Text>
                }
              </View>
            ))}
          </View>
        )}

        {/* Semanais */}
        {weeklyMissions.length > 0 && (
          <View style={styles.weeklyCard}>
            <View style={styles.missionHeader}>
              <Text style={styles.missionHeaderText}>MISSÃO DA SEMANA</Text>
              <Text style={styles.missionCount}>
                {'📋 '}
                <Text style={{ color: doneWeekly === weeklyMissions.length ? '#10b981' : '#5b4fcf' }}>
                  {doneWeekly}/{weeklyMissions.length}
                </Text>
                {' completas'}
              </Text>
            </View>
            <View style={styles.missionProgressTrack}>
              <View style={[
                styles.missionProgressFill,
                { flex: doneWeekly, backgroundColor: doneWeekly === weeklyMissions.length ? '#10b981' : '#5b4fcf' },
              ]} />
              <View style={{ flex: Math.max(0, weeklyMissions.length - doneWeekly) }} />
            </View>
            {weeklyMissions.map(m => (
              <View key={m.id} style={[styles.missionRow, m.done && { opacity: 0.5 }]}>
                <Text style={styles.missionRowIcon}>{m.icon}</Text>
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
            <Text style={styles.emptyMissionsText}>
              Complete sua primeira sessão para liberar missões.
            </Text>
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
  kicker: { fontSize: 11, fontWeight: '700', color: '#3a4a6b', letterSpacing: 4, marginBottom: 16 },
  sectionTitle: { fontSize: 10, fontWeight: '700', color: '#3a4a6b', letterSpacing: 2.5, marginBottom: 12 },

  // ── Journey CTA (pre-triage) ─────────────────────────────────────────────
  journeyCTA: {
    backgroundColor: '#111a2e', borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)', padding: 18, gap: 10,
  },
  journeyCTATitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  journeyCTADesc: { fontSize: 13, color: '#7a8aa0', lineHeight: 19 },
  journeyCTABtn: {
    backgroundColor: '#3b82f6', borderRadius: 10,
    paddingVertical: 12, alignItems: 'center', marginTop: 4,
  },
  journeyCTABtnText: { fontSize: 13, fontWeight: '800', color: '#fff', letterSpacing: 1.5 },

  // ── Journey section (post-triage) ────────────────────────────────────────
  journeySection: {
    backgroundColor: '#111a2e', borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.18)', padding: 16, gap: 12,
  },
  journeySectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  journeyAmbitionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  journeyAmbitionIcon: { fontSize: 26 },
  journeyAmbitionName: { fontSize: 18, fontWeight: '900', flex: 1, letterSpacing: -0.3 },
  journeyChangeLink: { fontSize: 11, color: '#4a5a7b', fontWeight: '600', textDecorationLine: 'underline' },
  journeySummary: { fontSize: 12, color: '#7a8aa0', lineHeight: 18 },
  journeyMapWrap: { marginTop: 4 },
  nextMilestoneRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  nextMilestoneLabel: { fontSize: 12, color: '#7a8aa0', fontWeight: '600', flex: 1 },
  nextMilestoneDelta: { fontSize: 12, fontWeight: '800' },

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
    marginBottom: 8,
  },
  missionHeaderText: { fontSize: 10, fontWeight: '800', color: '#3a4a6b', letterSpacing: 2 },
  missionCount: { fontSize: 11, color: '#4a5a7b' },
  missionProgressTrack: {
    flexDirection: 'row', height: 4, borderRadius: 2,
    backgroundColor: '#1e2d45', marginBottom: 12, overflow: 'hidden',
  },
  missionProgressFill: { borderRadius: 2 },
  missionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  missionRowIcon: { fontSize: 16, width: 22 },
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
});
