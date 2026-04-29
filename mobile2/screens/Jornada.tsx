import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, StatusBar as RNStatusBar, Animated,
} from 'react-native';
import { SessionRecord } from '../utils/storage';
import { saveUserProfile } from '../utils/userProfile';
import { UserProfile } from '../types/user';
import { buildUserStats } from '../config/archetypes';
import {
  getAmbition, getNextMilestone, getMilestonesState, getNextAmbitionId,
} from '../utils/ambition';
import { GROUP_COLOR, getAmbitionById } from '../config/ambitions';
import JourneyMap from '../components/JourneyMap';
import { calculateStreak } from '../utils/streak';
import { getDailyMissions, DailyMission } from '../utils/dailyMissions';
import { getWeeklyMissions, WeeklyMission } from '../utils/missions';

const TOP = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 44;

interface Props {
  sessions: SessionRecord[];
  userProfile: UserProfile;
  onOpenTriage: (editMode: boolean) => void;
  /** Chamado após ativar nova meta — sincroniza estado em App.tsx */
  onUpdateProfile: (profile: UserProfile) => void;
}

export default function Jornada({ sessions, userProfile, onOpenTriage, onUpdateProfile }: Props) {
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

  // ── Jornada completa: próxima meta ──────────────────────────────────────────
  const allBeaten = useMemo(
    () => milestonesState.length > 0 && milestonesState.every(s => s.status !== 'pendente'),
    [milestonesState],
  );

  const nextAmbitionId = useMemo(
    () => ambition ? getNextAmbitionId(ambition.id) : null,
    [ambition],
  );

  const nextAmbition = useMemo(
    () => nextAmbitionId ? (getAmbitionById(nextAmbitionId) ?? null) : null,
    [nextAmbitionId],
  );

  // Estado do botão "Iniciar próximo desafio"
  const [starting, setStarting] = useState(false);
  // Animação de fade-in do card de conclusão
  const completionAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (allBeaten) {
      completionAnim.setValue(0);
      Animated.spring(completionAnim, {
        toValue: 1, tension: 60, friction: 8, useNativeDriver: true,
      }).start();
    }
  }, [allBeaten]);

  const handleActivateNextAmbition = useCallback(async () => {
    if (!nextAmbitionId || starting) return;
    setStarting(true);
    const updated: UserProfile = { ...userProfile, ambitionId: nextAmbitionId };
    await saveUserProfile(updated);
    onUpdateProfile(updated);
    // setStarting(false) não necessário — componente re-renderiza com nova ambição
  }, [nextAmbitionId, userProfile, onUpdateProfile, starting]);

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
                  hideCompletionCard={allBeaten}
                />
              </View>
            )}

            {/* Próximo marco (estado normal, não concluído) */}
            {!allBeaten && nextMilestone && nextMilestone.type !== 'qualitative' && nextMilestone.ms !== undefined && currentBestMs !== null && (
              <View style={styles.nextMilestoneRow}>
                <Text style={styles.nextMilestoneLabel}>Próximo: {nextMilestone.label}</Text>
                <Text style={[styles.nextMilestoneDelta, { color: ambitionGroupColor }]}>
                  {currentBestMs <= nextMilestone.ms
                    ? '✓ atingido'
                    : `faltam ${currentBestMs - nextMilestone.ms} ms`}
                </Text>
              </View>
            )}

            {/* Card de jornada completa */}
            {allBeaten && (
              <Animated.View
                style={[
                  styles.completionCard,
                  {
                    opacity: completionAnim,
                    transform: [{ scale: completionAnim.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }],
                  },
                ]}
              >
                {nextAmbition ? (
                  <>
                    {/* ── Tem próxima meta ── */}
                    <View style={styles.completionHeader}>
                      <Text style={styles.completionIcon}>🎯</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.completionKicker}>JORNADA COMPLETA</Text>
                        <Text style={styles.completionTitle}>
                          Todos os marcos de{' '}
                          <Text style={{ color: ambitionGroupColor }}>
                            {ambition.name}
                          </Text>
                          {' '}batidos!
                        </Text>
                      </View>
                    </View>

                    <View style={styles.completionDivider} />

                    <TouchableOpacity
                      style={[
                        styles.nextAmbitionBtn,
                        { borderColor: GROUP_COLOR[nextAmbition.group] + '66',
                          backgroundColor: GROUP_COLOR[nextAmbition.group] + '14' },
                        starting && styles.nextAmbitionBtnDisabled,
                      ]}
                      onPress={handleActivateNextAmbition}
                      activeOpacity={0.8}
                      disabled={starting}
                    >
                      <Text style={styles.nextAmbitionBtnKicker}>INICIAR PRÓXIMO DESAFIO</Text>
                      <View style={styles.nextAmbitionBtnRow}>
                        <Text style={styles.nextAmbitionBtnIcon}>{nextAmbition.icon}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.nextAmbitionBtnName, { color: GROUP_COLOR[nextAmbition.group] }]}>
                            {starting ? 'Iniciando…' : nextAmbition.name}
                          </Text>
                          {nextAmbition.finalMetaMs !== null && (
                            <Text style={styles.nextAmbitionBtnMs}>
                              Meta: {nextAmbition.finalMetaMs} ms
                            </Text>
                          )}
                        </View>
                        {!starting && (
                          <Text style={[styles.nextAmbitionBtnArrow, { color: GROUP_COLOR[nextAmbition.group] }]}>→</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  </>
                ) : (
                  /* ── Pináculo: sem próxima meta ── */
                  <View style={styles.completionPeak}>
                    <Text style={styles.completionPeakIcon}>🏆</Text>
                    <Text style={styles.completionPeakTitle}>Você atingiu o nível máximo!</Text>
                    <Text style={styles.completionPeakSub}>
                      Velocidade de reação do 1% mais rápido do mundo.{'\n'}Nenhum desafio restante.
                    </Text>
                  </View>
                )}
              </Animated.View>
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

  // ── Card de jornada completa ──────────────────────────────────────────────
  completionCard: {
    marginTop: 4, borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.35)',
    backgroundColor: 'rgba(16,185,129,0.07)',
    overflow: 'hidden',
  },
  completionHeader: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    padding: 16, paddingBottom: 12,
  },
  completionIcon: { fontSize: 28, lineHeight: 34 },
  completionKicker: {
    fontSize: 9, fontWeight: '800', color: '#10b981',
    letterSpacing: 2, marginBottom: 4,
  },
  completionTitle: {
    fontSize: 13, fontWeight: '700', color: '#cbd5e1', lineHeight: 19,
  },
  completionDivider: {
    height: 1, backgroundColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: 16,
  },
  // Botão da próxima meta
  nextAmbitionBtn: {
    margin: 12, borderRadius: 12, borderWidth: 1,
    padding: 14, gap: 8,
  },
  nextAmbitionBtnDisabled: { opacity: 0.6 },
  nextAmbitionBtnKicker: {
    fontSize: 9, fontWeight: '800', color: '#4a5a7b', letterSpacing: 2,
  },
  nextAmbitionBtnRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  nextAmbitionBtnIcon: { fontSize: 24, lineHeight: 30 },
  nextAmbitionBtnName: {
    fontSize: 15, fontWeight: '900', letterSpacing: -0.3,
  },
  nextAmbitionBtnMs: {
    fontSize: 11, color: '#4a5a7b', marginTop: 2,
  },
  nextAmbitionBtnArrow: {
    fontSize: 22, fontWeight: '300',
  },
  // Estado de pináculo (sem próxima meta)
  completionPeak: {
    padding: 20, alignItems: 'center', gap: 8,
  },
  completionPeakIcon: { fontSize: 44, lineHeight: 52 },
  completionPeakTitle: {
    fontSize: 17, fontWeight: '900', color: '#f59e0b',
    textAlign: 'center', letterSpacing: -0.3,
  },
  completionPeakSub: {
    fontSize: 12, color: '#4a5a7b', textAlign: 'center', lineHeight: 18, marginTop: 2,
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
