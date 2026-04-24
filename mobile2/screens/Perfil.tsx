import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Platform, StatusBar as RNStatusBar, TouchableOpacity,
} from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Circle, Text as SvgText } from 'react-native-svg';
import { getLevelInfo, MODE_COLORS, ModeKey } from '../utils/levels';
import { SessionRecord } from '../utils/storage';
import { UserProfile } from '../types/user';
import { buildUserStats, getArchetypeFromStats, ARCHETYPES } from '../config/archetypes';
import { ACHIEVEMENTS, getUnlockedCount } from '../config/achievements';
import {
  getAmbition,
  getNextMilestone,
  getMilestonesState,
} from '../utils/ambition';
import { GROUP_COLOR } from '../config/ambitions';
import JourneyMap from '../components/JourneyMap';

const TOP = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 44;

const DAY = 86_400_000;
const PT_MONTHS = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const PT_MONTHS_LONG = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];

interface Props {
  sessions: SessionRecord[];
  userProfile: UserProfile;
  onOpenTriage: () => void;
}

// ── Gradient avatar ──────────────────────────────────────────────────────────

function GradientAvatar({ size = 72 }: { size?: number }) {
  const r = size / 2;
  const fs = Math.round(r * 0.55);
  return (
    <Svg width={size} height={size}>
      <Defs>
        <LinearGradient id="ag" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#1A6DB5" />
          <Stop offset="1" stopColor="#7B5FC7" />
        </LinearGradient>
      </Defs>
      <Circle cx={r} cy={r} r={r} fill="url(#ag)" />
      <SvgText
        x={r} y={r + fs * 0.38}
        textAnchor="middle"
        fontSize={fs}
        fontWeight="800"
        fill="#fff"
      >
        B
      </SvgText>
    </Svg>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function dayStart(ts: number) {
  const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime();
}

function formatRelDay(ts: number): string {
  const diff = Math.round((dayStart(Date.now()) - dayStart(ts)) / DAY);
  if (diff === 0) return 'hoje';
  if (diff === 1) return 'ontem';
  if (diff < 7) return `${diff}d`;
  const d = new Date(ts);
  return `${d.getDate()} ${PT_MONTHS[d.getMonth()]}`;
}

function computeStreak(sessions: SessionRecord[]): number {
  if (sessions.length === 0) return 0;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let s = 0;
  for (let i = 0; i < sessions.length; i++) {
    const d = new Date(sessions[i].date); d.setHours(0, 0, 0, 0);
    const diff = Math.round((today.getTime() - d.getTime()) / DAY);
    if (diff === s) s++;
    else if (diff > s) break;
  }
  return s;
}

// ── Mode card data ───────────────────────────────────────────────────────────

const MODE_META: Record<ModeKey, { name: string; icon: string; sub: string }> = {
  partida: { name: 'MODO PARTIDA', icon: '🏎', sub: 'Reação simples visual' },
  alvo:    { name: 'MODO ALVO',    icon: '🎯', sub: 'Velocidade + precisão' },
  sequencia: { name: 'MODO SEQUÊNCIA', icon: '🧠', sub: 'Controle inibitório' },
};

// ── Bar chart ────────────────────────────────────────────────────────────────

function BarChart({ sessions }: { sessions: SessionRecord[] }) {
  if (sessions.length < 2) return null;

  const scores = sessions.map(s => s.score);
  const rawMin = Math.min(...scores);
  const rawMax = Math.max(...scores);
  const pad = Math.max((rawMax - rawMin) * 0.15, 20);
  const rangeMin = Math.max(100, rawMin - pad);
  const rangeMax = rawMax + pad;
  const range = rangeMax - rangeMin;

  const BAR_MAX_H = 64;
  const first = sessions[0].score;
  const last = sessions[sessions.length - 1].score;
  const delta = last - first;
  const improved = delta < 0;

  return (
    <View>
      <View style={chart.container}>
        {sessions.map((s, i) => {
          const heightPct = range > 0 ? 1 - (s.score - rangeMin) / range : 0.5;
          const barH = Math.max(6, Math.round(heightPct * BAR_MAX_H));
          const mc = MODE_COLORS[s.mode];
          const lvl = getLevelInfo(s.score);
          return (
            <View key={i} style={chart.barWrapper}>
              <Text style={chart.scoreLabel}>{s.score}</Text>
              <View style={{ flex: 1 }} />
              <View style={[chart.bar, { height: barH, backgroundColor: mc.accent }]} />
              <View style={[chart.levelPill, { backgroundColor: lvl.bg }]}>
                <Text style={[chart.levelText, { color: lvl.color }]} numberOfLines={1}>
                  {lvl.label.split(' ')[0]}
                </Text>
              </View>
              <Text style={chart.dayLabel}>{formatRelDay(s.date)}</Text>
            </View>
          );
        })}
      </View>
      <Text style={chart.insight}>
        {improved
          ? `↓ Melhorou ${Math.abs(delta)} ms nas últimas ${sessions.length} sessões`
          : delta > 0
          ? `↑ +${delta} ms — continue treinando para retomar o ritmo`
          : 'Consistência perfeita nas últimas sessões'}
      </Text>
    </View>
  );
}

const chart = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
    backgroundColor: '#111a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 12,
    paddingBottom: 8,
    height: 130,
  },
  barWrapper: { flex: 1, alignItems: 'center', height: '100%', flexDirection: 'column' },
  scoreLabel: { fontSize: 7, color: '#3a4a6b', marginBottom: 2 },
  bar: { width: '100%', borderRadius: 3 },
  levelPill: { borderRadius: 4, paddingHorizontal: 2, paddingVertical: 2, marginTop: 4, width: '100%', alignItems: 'center' },
  levelText: { fontSize: 6, fontWeight: '800', letterSpacing: 0.3 },
  dayLabel: { fontSize: 7, color: '#2d3a55', marginTop: 3 },
  insight: { fontSize: 11, color: '#4a5a7b', marginTop: 8, textAlign: 'center' },
});

// ── Main component ───────────────────────────────────────────────────────────

export default function Perfil({ sessions, userProfile, onOpenTriage }: Props) {
  const streak = useMemo(() => computeStreak(sessions), [sessions]);
  const stats = useMemo(() => buildUserStats(sessions, streak), [sessions, streak]);
  const archetype = useMemo(() => getArchetypeFromStats(stats), [stats]);
  const unlockedCount = useMemo(() => getUnlockedCount(stats), [stats]);

  const evidenceChips = useMemo(() => archetype.evidence(stats), [archetype, stats]);

  const nextDef = useMemo(() => {
    if (!archetype.nextId) return null;
    return ARCHETYPES[archetype.nextId] ?? null;
  }, [archetype.nextId]);

  const modeBreakdown = useMemo(() => {
    const keys: ModeKey[] = ['partida', 'alvo', 'sequencia'];
    return keys.map(k => {
      const mSessions = sessions.filter(s => s.mode === k);
      const best = stats.bestScoreByMode[k];
      const bestAcc = stats.bestAccByMode[k];
      const lastFatigue = mSessions.length > 0 && mSessions[0].fatigueIndex !== undefined
        ? mSessions[0].fatigueIndex
        : null;
      return { key: k, count: mSessions.length, best, bestAcc, lastFatigue };
    });
  }, [sessions, stats]);

  const last8 = useMemo(() => sessions.slice(0, 8).reverse(), [sessions]);

  const joinedLabel = useMemo(() => {
    if (sessions.length === 0) return null;
    const oldest = sessions[sessions.length - 1];
    const d = new Date(oldest.date);
    return PT_MONTHS_LONG[d.getMonth()];
  }, [sessions]);

  // ── Journey data ─────────────────────────────────────────────────────────────
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
    return getMilestonesState(baselineMs, currentBestMs, ambition.id);
  }, [ambition, baselineMs, currentBestMs]);

  const beatenCount = useMemo(
    () => milestonesState.filter(s => s.status !== 'pendente').length,
    [milestonesState],
  );

  const nextMilestone = useMemo(
    () => ambition ? getNextMilestone(baselineMs, currentBestMs, ambition.id) : null,
    [ambition, baselineMs, currentBestMs],
  );

  const isBrainHealth = ambition?.group === 'brain_health';
  const ambitionGroupColor = ambition ? GROUP_COLOR[ambition.group] : '#3b82f6';

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: TOP + 16 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Identity block ── */}
        <View style={styles.identityBlock}>
          <GradientAvatar size={72} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.identityName}>Bruno</Text>
            <Text style={styles.identitySub}>
              {joinedLabel
                ? `Jogando desde ${joinedLabel} · ${sessions.length} sessão${sessions.length !== 1 ? 'ões' : ''}`
                : 'Sem sessões ainda'}
            </Text>
          </View>
        </View>

        {/* ── Archetype card ── */}
        <View style={[styles.archetypeCard, { borderColor: archetype.color + '44' }]}>
          <View style={styles.archetypeHeader}>
            <Text style={styles.archetypeIcon}>{archetype.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.archetypeKicker}>ARQUÉTIPO ATUAL</Text>
              <Text style={[styles.archetypeName, { color: archetype.color }]}>{archetype.name}</Text>
            </View>
          </View>
          <Text style={styles.archetypeDesc}>{archetype.description}</Text>
          {evidenceChips.length > 0 && (
            <View style={styles.chipsRow}>
              {evidenceChips.map((chip, i) => (
                <View key={i} style={[styles.chip, { borderColor: archetype.color + '55' }]}>
                  <View style={[styles.chipDot, { backgroundColor: archetype.color }]} />
                  <Text style={[styles.chipText, { color: archetype.color }]}>{chip.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── MINHA JORNADA ── */}
        {!userProfile.triageCompleted ? (
          /* CTA for pre-triage users (also accessible after 3 dismissals) */
          <View style={styles.journeyCTA}>
            <Text style={styles.journeyCTATitle}>Defina sua meta</Text>
            <Text style={styles.journeyCTADesc}>
              Escolha uma ambição e veja sua jornada personalizada em todas as telas.
            </Text>
            <TouchableOpacity style={styles.journeyCTABtn} onPress={onOpenTriage} activeOpacity={0.8}>
              <Text style={styles.journeyCTABtnText}>DEFINIR MINHA META</Text>
            </TouchableOpacity>
          </View>
        ) : ambition ? (
          <View style={styles.journeySection}>
            {/* Header row */}
            <View style={styles.journeySectionHeader}>
              <Text style={styles.journeyKicker}>MINHA JORNADA</Text>
            </View>
            <View style={styles.journeyAmbitionRow}>
              <Text style={styles.journeyAmbitionIcon}>{ambition.icon}</Text>
              <Text style={[styles.journeyAmbitionName, { color: ambitionGroupColor }]}>
                {ambition.name}
              </Text>
              <TouchableOpacity onPress={onOpenTriage} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.journeyChangeLink}>trocar meta</Text>
              </TouchableOpacity>
            </View>

            {/* Summary line */}
            <Text style={styles.journeySummary}>
              {isBrainHealth
                ? `Baseline: ${baselineMs ?? '—'} ms · ${beatenCount} de ${ambition.milestones.length} marcos conquistados`
                : `Baseline: ${baselineMs ?? '—'} ms · Meta: ${ambition.finalMetaMs ?? '—'} ms · ${beatenCount} de ${ambition.milestones.length} marcos batidos`
              }
            </Text>

            {/* Compact journey map */}
            {baselineMs !== null && (
              <View style={styles.journeyMapWrap}>
                <JourneyMap
                  ambitionId={ambition.id}
                  baselineMs={baselineMs}
                  currentBestMs={currentBestMs}
                  compact
                />
              </View>
            )}

          </View>
        ) : null}

        {/* ── PARA VIRAR block ── */}
        {nextDef && archetype.targetCriteria.length > 0 && (
          <View style={styles.paraVirarCard}>
            <View style={styles.paraVirarHeader}>
              <Text style={styles.paraVirarKicker}>PARA VIRAR</Text>
              <View style={styles.paraVirarTarget}>
                <Text style={styles.paraVirarIcon}>{nextDef.icon}</Text>
                <Text style={[styles.paraVirarName, { color: nextDef.color }]}>{nextDef.name}</Text>
              </View>
            </View>
            {archetype.targetCriteria.map(c => {
              const done = c.done(stats);
              const suffix = c.dynamicSuffix ? c.dynamicSuffix(stats) : '';
              return (
                <View key={c.id} style={styles.criterionRow}>
                  <View style={[styles.criterionCircle, done && styles.criterionCircleDone]}>
                    {done && <Text style={styles.criterionCheck}>✓</Text>}
                  </View>
                  <Text style={[
                    styles.criterionLabel,
                    done && styles.criterionLabelDone,
                  ]}>
                    {c.label}
                    {!done && suffix
                      ? <Text style={styles.criterionSuffix}>{suffix}</Text>
                      : null}
                  </Text>
                </View>
              );
            })}

            {/* Dynamic milestone criterion — injected when journey is active */}
            {userProfile.triageCompleted && nextMilestone && !isBrainHealth &&
             nextMilestone.type !== 'qualitative' && nextMilestone.ms !== undefined && (
              <View style={styles.criterionRow}>
                <View style={styles.criterionCircle}>
                  {/* Pending by definition — it's the NEXT milestone not yet beaten */}
                </View>
                <Text style={styles.criterionLabel}>
                  {`Bater próximo marco: ${nextMilestone.ms} ms`}
                  {currentBestMs !== null && (
                    <Text style={styles.criterionSuffix}>
                      {` (delta: ${currentBestMs - nextMilestone.ms} ms)`}
                    </Text>
                  )}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── Mode breakdown ── */}
        <Text style={styles.sectionTitle}>POR MODO</Text>
        {modeBreakdown.map(m => {
          const mc = MODE_COLORS[m.key];
          const meta = MODE_META[m.key];
          const lvl = m.best !== null ? getLevelInfo(m.best) : null;

          return (
            <View key={m.key} style={styles.modeCard}>
              <View style={[styles.modeIconBox, { backgroundColor: mc.accent + '2a' }]}>
                <Text style={styles.modeIconText}>{meta.icon}</Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.modeName, { color: mc.accent }]}>{meta.name}</Text>
                <Text style={styles.modeSub}>{meta.sub}</Text>
              </View>
              <View style={styles.modeRight}>
                {m.best !== null && lvl ? (
                  <>
                    <Text style={[styles.modeScore, { color: lvl.color }]}>{m.best} ms</Text>
                    <View style={[styles.modeLevelPill, { backgroundColor: lvl.bg }]}>
                      <Text style={[styles.modeLevelText, { color: lvl.color }]}>
                        {lvl.label.split(' ')[0]}
                      </Text>
                    </View>
                    {m.key === 'alvo' && m.bestAcc !== null && (
                      <Text style={styles.modeExtra}>{Math.round(m.bestAcc * 100)}% acc</Text>
                    )}
                    {m.key === 'alvo' && (
                      <Text style={styles.modeExtra}>Choice RT · escala diferente</Text>
                    )}
                    {m.key === 'sequencia' && m.lastFatigue !== null && m.lastFatigue !== undefined && (
                      <Text style={styles.modeExtra}>{m.lastFatigue.toFixed(1)}% fadiga</Text>
                    )}
                  </>
                ) : (
                  <Text style={styles.modeNone}>{m.count > 0 ? `${m.count} sess.` : '—'}</Text>
                )}
              </View>
            </View>
          );
        })}

        {/* ── Bar chart ── */}
        {last8.length >= 2 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
              ÚLTIMAS {last8.length} SESSÕES
            </Text>
            <BarChart sessions={last8} />
          </>
        )}

        {/* ── Achievements ── */}
        <View style={styles.achievementsHeader}>
          <Text style={styles.sectionTitle}>CONQUISTAS</Text>
          <Text style={styles.achieveCount}>
            {unlockedCount}/{ACHIEVEMENTS.length} desbloqueadas
          </Text>
        </View>
        <View style={styles.achieveGrid}>
          {ACHIEVEMENTS.map(a => {
            const done = a.unlocked(stats);
            return (
              <View
                key={a.id}
                style={[styles.achieveCell, !done && styles.achieveCellLocked]}
              >
                <Text style={[styles.achieveIcon, !done && styles.achieveIconLocked]}>
                  {a.icon}
                </Text>
                <Text style={[styles.achieveName, !done && styles.achieveNameLocked]}>
                  {a.name}
                </Text>
                <Text style={styles.achieveDesc} numberOfLines={2}>
                  {a.description}
                </Text>
              </View>
            );
          })}
        </View>

        {sessions.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎮</Text>
            <Text style={styles.emptyText}>
              Complete sua primeira sessão para ver seu perfil evoluir!
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
  scroll: { paddingHorizontal: 20, paddingBottom: 24 },

  // ── Identity ──────────────────────────────────────────────────────────────
  identityBlock: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    marginBottom: 20,
  },
  identityName: { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  identitySub: { fontSize: 12, color: '#4a5a7b' },

  // ── Archetype card ────────────────────────────────────────────────────────
  archetypeCard: {
    backgroundColor: '#111a2e', borderRadius: 16, borderWidth: 1,
    padding: 18, marginBottom: 12,
  },
  archetypeHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 },
  archetypeIcon: { fontSize: 34 },
  archetypeKicker: { fontSize: 9, fontWeight: '700', color: '#3a4a6b', letterSpacing: 2, marginBottom: 3 },
  archetypeName: { fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  archetypeDesc: { fontSize: 13, color: '#4a5a7b', lineHeight: 19, marginBottom: 14 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipText: { fontSize: 11, fontWeight: '600' },

  // ── MINHA JORNADA — CTA (pre-triage) ─────────────────────────────────────
  journeyCTA: {
    backgroundColor: '#111a2e', borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)', padding: 18,
    marginBottom: 12, gap: 8, alignItems: 'flex-start',
  },
  journeyCTATitle: { fontSize: 15, fontWeight: '800', color: '#fff' },
  journeyCTADesc: { fontSize: 13, color: '#4a5a7b', lineHeight: 19 },
  journeyCTABtn: {
    marginTop: 4, backgroundColor: '#3b82f6', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  journeyCTABtnText: { fontSize: 12, fontWeight: '800', color: '#fff', letterSpacing: 1.5 },

  // ── MINHA JORNADA — seção (post-triage) ──────────────────────────────────
  journeySection: {
    backgroundColor: '#111a2e', borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)', padding: 16,
    marginBottom: 12,
  },
  journeySectionHeader: { marginBottom: 10 },
  journeyKicker: { fontSize: 9, fontWeight: '700', color: '#3a4a6b', letterSpacing: 2.5 },
  journeyAmbitionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8,
  },
  journeyAmbitionIcon: { fontSize: 20 },
  journeyAmbitionName: { flex: 1, fontSize: 15, fontWeight: '800' },
  journeyChangeLink: { fontSize: 11, color: '#3b82f6', fontWeight: '600', textDecorationLine: 'underline' },
  journeySummary: { fontSize: 11, color: '#4a5a7b', lineHeight: 17, marginBottom: 14 },
  journeyMapWrap: { marginBottom: 8 },
  journeyNextCard: {
    backgroundColor: '#0d1b33', borderRadius: 10, borderWidth: 1,
    padding: 12, marginTop: 4,
  },
  journeyNextKicker: { fontSize: 9, fontWeight: '700', color: '#3a4a6b', letterSpacing: 2, marginBottom: 4 },
  journeyNextLabel: { fontSize: 13, fontWeight: '600', color: '#fff', lineHeight: 19 },
  journeyNextDelta: { fontSize: 12, fontWeight: '800' },

  // ── PARA VIRAR ────────────────────────────────────────────────────────────
  paraVirarCard: {
    backgroundColor: '#0d1b33', borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)', padding: 16, marginBottom: 20,
  },
  paraVirarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  paraVirarKicker: { fontSize: 9, fontWeight: '700', color: '#3a4a6b', letterSpacing: 2 },
  paraVirarTarget: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  paraVirarIcon: { fontSize: 16 },
  paraVirarName: { fontSize: 13, fontWeight: '800', letterSpacing: 1.5 },
  criterionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  criterionCircle: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#2d3a55',
    alignItems: 'center', justifyContent: 'center',
  },
  criterionCircleDone: { backgroundColor: '#10b981', borderColor: '#10b981' },
  criterionCheck: { fontSize: 11, color: '#fff', fontWeight: '800' },
  criterionLabel: { flex: 1, fontSize: 13, color: '#7a8aa0' },
  criterionLabelDone: { color: '#10b981', textDecorationLine: 'line-through' },
  criterionSuffix: { color: '#4a5a7b', fontSize: 12 },

  // ── Section title ─────────────────────────────────────────────────────────
  sectionTitle: { fontSize: 10, fontWeight: '700', color: '#3a4a6b', letterSpacing: 2.5, marginBottom: 10 },

  // ── Mode cards ────────────────────────────────────────────────────────────
  modeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#111a2e', borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 14,
    marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  modeIconBox: {
    width: 48, height: 48, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  modeIconText: { fontSize: 24 },
  modeName: { fontSize: 12, fontWeight: '800', letterSpacing: 1.2 },
  modeSub: { fontSize: 11, color: '#3a4a6b' },
  modeRight: { alignItems: 'flex-end', gap: 3, minWidth: 64 },
  modeScore: { fontSize: 16, fontWeight: '800' },
  modeLevelPill: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  modeLevelText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  modeExtra: { fontSize: 10, color: '#3a4a6b', marginTop: 1 },
  modeNone: { fontSize: 13, color: '#2d3a55', fontWeight: '700' },

  // ── Achievements ──────────────────────────────────────────────────────────
  achievementsHeader: {
    flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between',
    marginTop: 20,
  },
  achieveCount: { fontSize: 11, color: '#3a4a6b', marginBottom: 10 },
  achieveGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  achieveCell: {
    width: '48%', backgroundColor: '#111a2e',
    borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    gap: 4,
  },
  achieveCellLocked: { opacity: 0.4 },
  achieveIcon: { fontSize: 24 },
  achieveIconLocked: { opacity: 0.5 },
  achieveName: { fontSize: 13, fontWeight: '800', color: '#fff' },
  achieveNameLocked: { color: '#3a4a6b' },
  achieveDesc: { fontSize: 11, color: '#4a5a7b', lineHeight: 16 },

  // ── Empty ─────────────────────────────────────────────────────────────────
  emptyState: { alignItems: 'center', paddingTop: 40, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 14, color: '#4a5a7b', textAlign: 'center', lineHeight: 20 },
});
