import React, { useMemo, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Modal, TextInput,
  Platform, StatusBar as RNStatusBar, TouchableOpacity,
} from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Circle, Text as SvgText } from 'react-native-svg';
import { getLevelInfo, MODE_COLORS, ModeKey } from '../utils/levels';
import { SessionRecord, loadUnlockedAchievements } from '../utils/storage';
import { UserProfile } from '../types/user';
import { buildUserStats, getArchetypeFromStats, ARCHETYPES } from '../config/archetypes';
import { getWeeklyMissions, WeeklyMission } from '../utils/missions';

const ARCHETYPE_CHAIN: { id: string; icon: string; tagline: string }[] = [
  { id: 'EXPLORADOR',  icon: '🔭', tagline: 'Descobrindo seu perfil' },
  { id: 'EM_EVOLUCAO', icon: '🌱', tagline: 'Crescendo a cada treino' },
  { id: 'RESISTENTE',  icon: '🛡️', tagline: 'Consistente sob fadiga' },
  { id: 'ATIRADOR',    icon: '🎯', tagline: 'Precisão cirúrgica' },
  { id: 'VELOCISTA',   icon: '⚡',  tagline: 'Velocidade de elite' },
  { id: 'PILOTO',      icon: '🏎️', tagline: 'Reflexos de elite' },
];

// Destination archetype by ambition group — the "ceiling" the user is aiming for
const DEST_BY_GROUP: Record<string, { id: string; label: string }> = {
  elite_sport:  { id: 'PILOTO',     label: 'O Piloto' },
  populational: { id: 'VELOCISTA',  label: 'O Velocista' },
  brain_health: { id: 'RESISTENTE', label: 'O Consistente' },
};
import { ACHIEVEMENTS, getUnlockedCount } from '../config/achievements';
import { AVATARS } from '../config/avatars';
import { saveUserProfile } from '../utils/userProfile';
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
  onOpenTriage: (editMode: boolean) => void;
  onGoToConquistas: () => void;
  onUpdateProfile: (p: UserProfile) => void;
}

// ── Gradient avatar ──────────────────────────────────────────────────────────

function GradientAvatar({ size = 72, letter = 'A' }: { size?: number; letter?: string }) {
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
        {letter}
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
  radar:   { name: 'MODO RADAR',   icon: '📡', sub: 'Localização visual' },
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

export default function Perfil({ sessions, userProfile, onOpenTriage, onGoToConquistas, onUpdateProfile }: Props) {
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const streak = useMemo(() => computeStreak(sessions), [sessions]);
  const stats = useMemo(() => buildUserStats(sessions, streak), [sessions, streak]);
  const archetype = useMemo(() => getArchetypeFromStats(stats), [stats]);
  const unlockedCount = useMemo(() => getUnlockedCount(stats), [stats]);
  // Excludes secret+locked from total so secret achievements aren't revealed in the counter
  const visibleAchievementTotal = useMemo(
    () => ACHIEVEMENTS.filter(a => !a.secret || a.unlocked(stats)).length,
    [stats],
  );

  const evidenceChips = useMemo(() => archetype.evidence(stats), [archetype, stats]);

  const nextDef = useMemo(() => {
    if (!archetype.nextId) return null;
    return ARCHETYPES[archetype.nextId] ?? null;
  }, [archetype.nextId]);

  const modeBreakdown = useMemo(() => {
    const keys: ModeKey[] = ['partida', 'alvo', 'sequencia', 'radar'];
    return keys.map(k => {
      const mSessions = sessions.filter(s => s.mode === k);
      const best = stats.bestScoreByMode[k];
      const bestAcc = stats.bestAccByMode[k];
      const lastFatigue = mSessions.length > 0 && mSessions[0].fatigueIndex !== undefined
        ? mSessions[0].fatigueIndex
        : null;
      const bestAlvoRt = k === 'alvo' && mSessions.length > 0
        ? Math.min(...mSessions.map(s => s.bestTime ?? s.score))
        : null;
      const bestRadarRt = k === 'radar' && mSessions.length > 0
        ? Math.min(...mSessions.map(s => s.bestTime ?? s.score))
        : null;
      return { key: k, count: mSessions.length, best, bestAcc, lastFatigue, bestAlvoRt, bestRadarRt };
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
    return getMilestonesState(baselineMs, currentBestMs, ambition.id, sessions);
  }, [ambition, baselineMs, currentBestMs]);

  const beatenCount = useMemo(
    () => milestonesState.filter(s => s.status !== 'pendente').length,
    [milestonesState],
  );

  const nextMilestone = useMemo(
    () => ambition ? getNextMilestone(baselineMs, currentBestMs, ambition.id, sessions) : null,
    [ambition, baselineMs, currentBestMs],
  );

  const isBrainHealth = ambition?.group === 'brain_health';
  const ambitionGroupColor = ambition ? GROUP_COLOR[ambition.group] : '#3b82f6';

  // ── Objectives data ───────────────────────────────────────────────────────────
  const [weeklyMissions, setWeeklyMissions] = useState<WeeklyMission[]>([]);
  useEffect(() => {
    getWeeklyMissions(sessions, userProfile).then(setWeeklyMissions);
  }, [sessions, userProfile]);

  const nextAchievementInfo = useMemo(() => {
    const locked = ACHIEVEMENTS.filter(a => !a.unlocked(stats) && !a.secret);
    if (locked.length === 0) return null;
    let best: { a: typeof locked[0]; pct: number } | null = null;
    for (const a of locked) {
      const match = a.progress(stats).match(/(\d+)\s*\/\s*(\d+)/);
      if (!match) continue;
      const cur = parseInt(match[1], 10);
      const tar = parseInt(match[2], 10);
      if (tar === 0) continue;
      const pct = Math.min(cur / tar, 1);
      if (pct > 0 && (best === null || pct > best.pct)) best = { a, pct };
    }
    return best;
  }, [stats]);

  const milestonePct = useMemo(() => {
    if (!ambition || !nextMilestone || isBrainHealth) return 0;
    if (nextMilestone.type === 'qualitative' || !nextMilestone.ms) return 0;
    if (baselineMs === null || currentBestMs === null) return 0;
    const range = baselineMs - nextMilestone.ms;
    if (range <= 0) return 1;
    return Math.max(0, Math.min(1, (baselineMs - currentBestMs) / range));
  }, [ambition, nextMilestone, isBrainHealth, baselineMs, currentBestMs]);

  const archetypePct = useMemo(() => {
    const total = archetype.targetCriteria.length;
    if (total === 0) return 1;
    const done = archetype.targetCriteria.filter(c => c.done(stats)).length;
    return done / total;
  }, [archetype, stats]);

  // ── Completed long-term goals ─────────────────────────────────────────────
  const [completedExpanded, setCompletedExpanded] = useState(false);
  const [unlockDates, setUnlockDates] = useState<Record<string, string>>({});
  useEffect(() => {
    loadUnlockedAchievements().then(setUnlockDates);
  }, []);

  const currentArchIdx = useMemo(
    () => ARCHETYPE_CHAIN.findIndex(a => a.id === stats.archetypeId),
    [stats.archetypeId],
  );

  const pastArchetypes = useMemo(
    () => currentArchIdx > 0 ? ARCHETYPE_CHAIN.slice(0, currentArchIdx) : [],
    [currentArchIdx],
  );

  const destinationArch = useMemo(
    () => ambition ? (DEST_BY_GROUP[ambition.group] ?? null) : null,
    [ambition],
  );

  const destinationIdx = useMemo(
    () => destinationArch ? ARCHETYPE_CHAIN.findIndex(a => a.id === destinationArch.id) : -1,
    [destinationArch],
  );

  // Hide PARA VIRAR entirely when user has reached or surpassed their ambition destination
  const reachedDestination = destinationIdx !== -1 && currentArchIdx >= destinationIdx;
  // Show "Seu destino" footer only when destination is not the immediate next archetype
  const showDestFooter = destinationArch !== null && !reachedDestination && destinationIdx > currentArchIdx + 1;

  const beatenMilestones = useMemo(
    () => milestonesState.filter(s => s.status !== 'pendente'),
    [milestonesState],
  );

  const mostRecentUnlockedAch = useMemo(() => {
    const unlocked = ACHIEVEMENTS.filter(a => !a.secret && a.unlocked(stats));
    if (unlocked.length === 0) return null;
    unlocked.sort((a, b) => {
      const da = unlockDates[a.id] ?? '';
      const db = unlockDates[b.id] ?? '';
      return db.localeCompare(da);
    });
    return unlocked[0];
  }, [stats, unlockDates]);

  const completedCount =
    beatenMilestones.length + (mostRecentUnlockedAch ? 1 : 0) + pastArchetypes.length;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: TOP + 16 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Identity block ── */}
        <View style={styles.identityBlock}>
          {userProfile.selectedAvatar && userProfile.selectedAvatar !== 'initial'
            ? (
              <View style={styles.emojiAvatarLarge}>
                <Text style={styles.emojiAvatarLargeText}>
                  {AVATARS.find(a => a.id === userProfile.selectedAvatar)?.icon ?? (userProfile.name || 'U')[0].toUpperCase()}
                </Text>
              </View>
            ) : (
              <GradientAvatar size={72} letter={(userProfile.name || 'Usuário')[0].toUpperCase()} />
            )
          }
          <View style={{ flex: 1, gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.identityName}>{userProfile.name || 'Usuário'}</Text>
              <TouchableOpacity
                onPress={() => { setNameInput(userProfile.name || ''); setEditingName(true); }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.editNameBtn}>✏️</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.identitySub}>
              {joinedLabel
                ? `Jogando desde ${joinedLabel} · ${sessions.length !== 1 ? 'sessões' : 'sessão'}`
                : 'Sem sessões ainda'}
            </Text>
          </View>
        </View>

        {/* ── MEU AVATAR ── */}
        <View style={styles.avatarSection}>
          <Text style={styles.sectionTitle}>MEU AVATAR</Text>
          <View style={styles.avatarGrid}>
            {AVATARS.map(av => {
              const unlocked = av.isUnlocked(stats, ACHIEVEMENTS);
              const selectedId = userProfile.selectedAvatar ?? 'initial';
              const selected = selectedId === av.id;
              const isInitial = av.id === 'initial';
              const cellContent = !unlocked
                ? <Text style={styles.avatarCellLock}>🔒</Text>
                : isInitial
                  ? <Text style={styles.avatarCellLetter}>{(userProfile.name || 'U')[0].toUpperCase()}</Text>
                  : <Text style={styles.avatarCellEmoji}>{av.icon}</Text>;
              return (
                <View key={av.id} style={styles.avatarItemWrap}>
                  <TouchableOpacity
                    style={[
                      styles.avatarCell,
                      selected
                        ? { borderWidth: 2, borderColor: '#5b4fcf', backgroundColor: 'rgba(91,79,207,0.15)' }
                        : { borderWidth: 1, borderColor: '#2a3a5a', backgroundColor: '#111a2e' },
                      !unlocked && styles.avatarCellLocked,
                    ]}
                    onPress={unlocked ? async () => {
                      const updated = { ...userProfile, selectedAvatar: av.id };
                      await saveUserProfile(updated);
                      onUpdateProfile(updated);
                    } : undefined}
                    disabled={!unlocked}
                    activeOpacity={0.7}
                  >
                    {cellContent}
                  </TouchableOpacity>
                  <Text style={styles.avatarCellName} numberOfLines={1}>{av.name}</Text>
                </View>
              );
            })}
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

        {/* ── ARQUÉTIPOS — cadeia de evolução ── */}
        {(() => {
          const currentIdx = ARCHETYPE_CHAIN.findIndex(a => a.id === stats.archetypeId);
          return (
            <View style={styles.chainSection}>
              <Text style={styles.sectionTitle}>EVOLUÇÃO</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chainScroll}
              >
                {ARCHETYPE_CHAIN.map((a, i) => {
                  const isPast    = i < currentIdx;
                  const isCurrent = i === currentIdx;
                  const isFuture  = i > currentIdx;
                  const archDef   = ARCHETYPES[a.id];
                  return (
                    <React.Fragment key={a.id}>
                      <View style={[
                        styles.chainCard,
                        isCurrent && styles.chainCardCurrent,
                        isPast    && styles.chainCardPast,
                        isFuture  && styles.chainCardFuture,
                      ]}>
                        {isPast && <Text style={styles.chainCheck}>✓</Text>}
                        <Text style={styles.chainIcon}>{a.icon}</Text>
                        <Text style={[
                          styles.chainName,
                          isCurrent && { color: '#fff' },
                          isPast    && { color: archDef.color },
                        ]}>
                          {archDef.name}
                        </Text>
                        <Text style={styles.chainTagline} numberOfLines={2}>{a.tagline}</Text>
                      </View>
                      {i < ARCHETYPE_CHAIN.length - 1 && (
                        <Text style={styles.chainArrow}>→</Text>
                      )}
                    </React.Fragment>
                  );
                })}
              </ScrollView>
            </View>
          );
        })()}

        {/* ── OBJETIVOS DA SEMANA ── */}
        <View style={styles.objectivesSection}>
          <Text style={styles.sectionTitle}>OBJETIVOS DA SEMANA</Text>
          {weeklyMissions.map(m => (
            <View key={m.id} style={styles.objCard}>
              <View style={styles.objCardTop}>
                <Text style={styles.objIcon}>{m.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.objLabel, m.done && styles.objLabelDone]} numberOfLines={1}>
                    {m.label}
                  </Text>
                  <Text style={styles.objProgress}>
                    {m.done ? '✓ Concluída' : `${m.current} / ${m.target}`}
                  </Text>
                </View>
                {m.done && <Text style={styles.objCheck}>✓</Text>}
              </View>
              <View style={styles.objTrack}>
                <View style={[
                  styles.objFill,
                  {
                    flex: m.current,
                    backgroundColor: m.done ? '#10b981' : '#5b4fcf',
                  },
                ]} />
                <View style={{ flex: Math.max(0, m.target - m.current) }} />
              </View>
            </View>
          ))}
        </View>

        {/* ── METAS DE LONGO PRAZO ── */}
        <View style={styles.ltSection}>
          <Text style={styles.sectionTitle}>METAS DE LONGO PRAZO</Text>

          {/* Próximo marco de velocidade */}
          {ambition && nextMilestone && !isBrainHealth &&
           nextMilestone.type !== 'qualitative' && nextMilestone.ms !== undefined &&
           currentBestMs !== null && (
            <View style={styles.ltCard}>
              <View style={styles.ltCardTop}>
                <Text style={styles.ltIcon}>🚀</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ltKicker}>PRÓXIMO MARCO</Text>
                  <Text style={styles.ltTitle}>{nextMilestone.label}</Text>
                  <Text style={styles.ltSub}>
                    {`${ambition.name} · meta ${nextMilestone.ms} ms`}
                    {currentBestMs <= nextMilestone.ms
                      ? ' · ✓ Já atingido!'
                      : ` · faltam ${currentBestMs - nextMilestone.ms} ms`}
                  </Text>
                </View>
                <Text style={styles.ltPct}>{Math.round(milestonePct * 100)}%</Text>
              </View>
              <View style={styles.ltTrack}>
                <View style={[styles.ltFill, {
                  flex: Math.round(milestonePct * 100),
                  backgroundColor: ambitionGroupColor,
                }]} />
                <View style={{ flex: Math.max(0, 100 - Math.round(milestonePct * 100)) }} />
              </View>
            </View>
          )}

          {/* Próxima conquista mais próxima */}
          {nextAchievementInfo && (
            <View style={styles.ltCard}>
              <View style={styles.ltCardTop}>
                <Text style={styles.ltIcon}>{nextAchievementInfo.a.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ltKicker}>PRÓXIMA CONQUISTA</Text>
                  <Text style={styles.ltTitle}>{nextAchievementInfo.a.name}</Text>
                  <Text style={styles.ltSub}>{nextAchievementInfo.a.progress(stats)}</Text>
                </View>
                <Text style={styles.ltPct}>{Math.round(nextAchievementInfo.pct * 100)}%</Text>
              </View>
              <View style={styles.ltTrack}>
                <View style={[styles.ltFill, {
                  flex: Math.round(nextAchievementInfo.pct * 100),
                  backgroundColor: '#8b5cf6',
                }]} />
                <View style={{ flex: Math.max(0, 100 - Math.round(nextAchievementInfo.pct * 100)) }} />
              </View>
            </View>
          )}

          {/* Próximo arquétipo */}
          {nextDef && archetype.targetCriteria.length > 0 && (
            <View style={styles.ltCard}>
              <View style={styles.ltCardTop}>
                <Text style={styles.ltIcon}>{nextDef.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ltKicker}>PRÓXIMO ARQUÉTIPO</Text>
                  <Text style={[styles.ltTitle, { color: nextDef.color }]}>{nextDef.name}</Text>
                  <Text style={styles.ltSub}>
                    {archetype.targetCriteria.filter(c => c.done(stats)).length}
                    {'/'}
                    {archetype.targetCriteria.length}
                    {' critérios concluídos'}
                  </Text>
                </View>
                <Text style={styles.ltPct}>{Math.round(archetypePct * 100)}%</Text>
              </View>
              <View style={styles.ltTrack}>
                <View style={[styles.ltFill, {
                  flex: Math.round(archetypePct * 100),
                  backgroundColor: nextDef.color,
                }]} />
                <View style={{ flex: Math.max(0, 100 - Math.round(archetypePct * 100)) }} />
              </View>
            </View>
          )}

          {/* ── CONCLUÍDAS subsection ── */}
          {completedCount > 0 && (
            <View style={styles.completedSection}>
              <TouchableOpacity
                style={styles.completedHeader}
                onPress={() => setCompletedExpanded(prev => !prev)}
                activeOpacity={0.8}
              >
                <Text style={styles.completedHeaderText}>✓ CONCLUÍDAS</Text>
                <View style={styles.completedHeaderRight}>
                  <Text style={styles.completedHeaderCount}>
                    {completedCount} conquistada{completedCount !== 1 ? 's' : ''}
                  </Text>
                  <Text style={styles.completedArrow}>
                    {completedExpanded ? '▼' : '▶'}
                  </Text>
                </View>
              </TouchableOpacity>
              {completedExpanded && (
                <View style={styles.completedList}>
                  {beatenMilestones.map((ms, i) => (
                    <View key={`ms_${i}`} style={styles.completedItem}>
                      <Text style={styles.completedCheck}>✓</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.completedLabel}>{ms.milestone.label}</Text>
                        {ms.milestone.type !== 'qualitative' && ms.milestone.ms !== undefined && (
                          <Text style={styles.completedSub}>{ms.milestone.ms} ms atingido</Text>
                        )}
                      </View>
                      <Text style={styles.completedTag}>MARCO</Text>
                    </View>
                  ))}
                  {mostRecentUnlockedAch && (
                    <View style={styles.completedItem}>
                      <Text style={styles.completedCheck}>✓</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.completedLabel}>{mostRecentUnlockedAch.name}</Text>
                        <Text style={styles.completedSub} numberOfLines={1}>
                          {mostRecentUnlockedAch.description}
                        </Text>
                      </View>
                      <Text style={styles.completedTag}>CONQUISTA</Text>
                    </View>
                  )}
                  {pastArchetypes.map(pa => (
                    <View key={pa.id} style={styles.completedItem}>
                      <Text style={styles.completedCheck}>✓</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.completedLabel}>{ARCHETYPES[pa.id].name}</Text>
                        <Text style={styles.completedSub}>{pa.tagline}</Text>
                      </View>
                      <Text style={styles.completedTag}>ARQUÉTIPO</Text>
                    </View>
                  ))}
                </View>
              )}
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
            <TouchableOpacity style={styles.journeyCTABtn} onPress={() => onOpenTriage(false)} activeOpacity={0.8}>
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
              <TouchableOpacity onPress={() => onOpenTriage(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
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

            {/* Journey map — full size with current progress */}
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

          </View>
        ) : null}

        {/* ── PARA VIRAR block ── */}
        {nextDef && archetype.targetCriteria.length > 0 && !reachedDestination && (
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

            {/* Destination footer — only when destination is further than the immediate next arch */}
            {showDestFooter && destinationArch && (
              <View style={styles.destRow}>
                <Text style={styles.destIcon}>🎯</Text>
                <Text style={[styles.destLabel, { color: ambitionGroupColor }]}>
                  Seu destino: {destinationArch.label}
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
          const displayScore = m.key === 'alvo' && m.bestAlvoRt !== null ? m.bestAlvoRt
                             : m.key === 'radar' && m.bestRadarRt !== null ? m.bestRadarRt
                             : m.best;
          const lvl = displayScore !== null ? getLevelInfo(displayScore) : null;

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
                {displayScore !== null && lvl ? (
                  <>
                    <Text style={[styles.modeScore, { color: lvl.color }]}>{displayScore} ms</Text>
                    <View style={[styles.modeLevelPill, { backgroundColor: lvl.bg }]}>
                      <Text style={[styles.modeLevelText, { color: lvl.color }]}>
                        {lvl.label.split(' ')[0]}
                      </Text>
                    </View>
                    {m.key === 'alvo' && (
                      <Text style={styles.modeExtra}>Melhor Tempo Reflexo</Text>
                    )}
                    {m.key === 'alvo' && m.bestAcc !== null && (
                      <Text style={styles.modeExtra}>{Math.round(m.bestAcc * 100)}% acc</Text>
                    )}
                    {m.key === 'sequencia' && m.lastFatigue !== null && m.lastFatigue !== undefined && (
                      <Text style={styles.modeExtra}>{m.lastFatigue.toFixed(1)}% fadiga</Text>
                    )}
                    {m.key === 'radar' && (
                      <Text style={[styles.modeExtra, { color: mc.accent }]}>Melhor Tempo Reflexo</Text>
                    )}
                    {m.key === 'radar' && m.bestAcc !== null && (
                      <Text style={[styles.modeExtra, { color: mc.accent }]}>Precisão: {Math.round(m.bestAcc * 100)}%</Text>
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

        {/* ── Achievements summary ── */}
        <Text style={styles.sectionTitle}>CONQUISTAS</Text>
        <TouchableOpacity style={styles.achieveSummaryCard} onPress={onGoToConquistas} activeOpacity={0.8}>
          <View style={styles.achieveSummaryRow}>
            <Text style={styles.achieveSummaryCount}>
              {unlockedCount}/{visibleAchievementTotal} desbloqueadas
            </Text>
            <Text style={styles.achieveSummaryLink}>Ver todas →</Text>
          </View>
          <View style={styles.achieveProgressTrack}>
            <View style={[styles.achieveProgressFill, { flex: unlockedCount }]} />
            <View style={{ flex: Math.max(0, visibleAchievementTotal - unlockedCount) }} />
          </View>
        </TouchableOpacity>

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

      {/* Name edit modal */}
      <Modal
        visible={editingName}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingName(false)}
      >
        <View style={styles.nameModalOverlay}>
          <View style={styles.nameModalCard}>
            <Text style={styles.nameModalTitle}>EDITAR NOME</Text>
            <TextInput
              style={styles.nameModalInput}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Seu nome"
              placeholderTextColor="#4a5a7b"
              maxLength={30}
              autoFocus
            />
            <View style={styles.nameModalBtns}>
              <TouchableOpacity
                style={styles.nameModalCancel}
                onPress={() => setEditingName(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.nameModalCancelText}>CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.nameModalSave}
                onPress={async () => {
                  const updated = { ...userProfile, name: nameInput.trim() };
                  await saveUserProfile(updated);
                  onUpdateProfile(updated);
                  setEditingName(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.nameModalSaveText}>SALVAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  emojiAvatarLarge: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#1a2540',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(91,79,207,0.4)',
  },
  emojiAvatarLargeText: { fontSize: 34 },

  // ── MEU AVATAR ────────────────────────────────────────────────────────────
  avatarSection: { marginBottom: 20 },
  avatarGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start',
  },
  avatarItemWrap: { alignItems: 'center', gap: 4 },
  avatarCell: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarCellLocked: { opacity: 0.3 },
  avatarCellLetter: { fontSize: 22, fontWeight: '800', color: '#fff' },
  avatarCellEmoji: { fontSize: 28 },
  avatarCellLock: { fontSize: 20 },
  avatarCellName: { width: 64, fontSize: 9, fontWeight: '700', color: '#4a5a7b', textAlign: 'center' },

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

  // ── OBJETIVOS DA SEMANA ───────────────────────────────────────────────────
  objectivesSection: { marginBottom: 12 },
  objCard: {
    backgroundColor: '#111a2e', borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(91,79,207,0.2)', padding: 14, marginBottom: 8,
  },
  objCardTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  objIcon: { fontSize: 20, width: 26 },
  objLabel: { fontSize: 13, fontWeight: '700', color: '#c0cfe0', marginBottom: 2 },
  objLabelDone: { color: '#10b981' },
  objProgress: { fontSize: 11, color: '#4a5a7b' },
  objCheck: { fontSize: 14, color: '#10b981', fontWeight: '800', width: 20, textAlign: 'right' },
  objTrack: {
    flexDirection: 'row', height: 4, borderRadius: 2,
    backgroundColor: '#1e2d45', overflow: 'hidden',
  },
  objFill: { borderRadius: 2 },

  // ── METAS DE LONGO PRAZO ─────────────────────────────────────────────────
  ltSection: { marginBottom: 12 },
  ltCard: {
    backgroundColor: '#111a2e', borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)', padding: 14, marginBottom: 8,
  },
  ltCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  ltIcon: { fontSize: 22, width: 28 },
  ltKicker: { fontSize: 9, fontWeight: '700', color: '#3a4a6b', letterSpacing: 2, marginBottom: 3 },
  ltTitle: { fontSize: 14, fontWeight: '800', color: '#fff', marginBottom: 3 },
  ltSub: { fontSize: 11, color: '#4a5a7b', lineHeight: 16 },
  ltPct: { fontSize: 13, fontWeight: '800', color: '#fff', minWidth: 36, textAlign: 'right' },
  ltTrack: {
    flexDirection: 'row', height: 5, borderRadius: 3,
    backgroundColor: '#1e2d45', overflow: 'hidden',
  },
  ltFill: { borderRadius: 3 },

  // ── CONCLUÍDAS subsection ─────────────────────────────────────────────────
  completedSection: {
    borderTopWidth: 1, borderTopColor: '#1a2a4a',
    marginTop: 8, paddingTop: 4,
  },
  completedHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10,
  },
  completedHeaderText: {
    fontSize: 10, fontWeight: '800', color: '#10b981', letterSpacing: 2,
  },
  completedHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  completedHeaderCount: { fontSize: 10, color: '#4a5a7b' },
  completedArrow: { fontSize: 10, color: '#3a4a6b' },
  completedList: { gap: 6, paddingBottom: 4 },
  completedItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#0d1526', borderRadius: 10, padding: 12,
  },
  completedCheck: { fontSize: 14, color: '#10b981', fontWeight: '800', width: 18 },
  completedLabel: { fontSize: 12, fontWeight: '700', color: '#7a8aa0', marginBottom: 2 },
  completedSub: { fontSize: 11, color: '#4a5a7b', lineHeight: 16 },
  completedTag: { fontSize: 9, fontWeight: '700', color: '#2d3a55', letterSpacing: 1 },

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

  destRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 10, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  destIcon: { fontSize: 14 },
  destLabel: { fontSize: 12, fontWeight: '700' },

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

  // ── Archetype chain ───────────────────────────────────────────────────────
  chainSection: { marginBottom: 12 },
  chainScroll: { paddingVertical: 4, alignItems: 'center' },
  chainCard: {
    width: 90, borderRadius: 12, padding: 10,
    backgroundColor: '#111a2e',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', gap: 4,
  },
  chainCardCurrent: {
    borderColor: '#5b4fcf',
    backgroundColor: 'rgba(91,79,207,0.12)',
  },
  chainCardPast: { opacity: 0.5 },
  chainCardFuture: { opacity: 0.3 },
  chainCheck: { position: 'absolute', top: 6, right: 8, fontSize: 10, color: '#10b981', fontWeight: '800' },
  chainIcon: { fontSize: 22 },
  chainName: { fontSize: 9, fontWeight: '800', color: '#4a5a7b', letterSpacing: 0.5, textAlign: 'center' },
  chainTagline: { fontSize: 9, color: '#3a4a6b', textAlign: 'center', lineHeight: 13 },
  chainArrow: { fontSize: 14, color: '#2d3a55', alignSelf: 'center', marginHorizontal: 2 },

  // ── Achievements summary ──────────────────────────────────────────────────
  achieveSummaryCard: {
    backgroundColor: '#111a2e', borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(91,79,207,0.2)', padding: 16, marginBottom: 20,
  },
  achieveSummaryRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12,
  },
  achieveSummaryCount: { fontSize: 14, fontWeight: '700', color: '#c0cfe0' },
  achieveSummaryLink: { fontSize: 13, color: '#3b82f6', fontWeight: '600' },
  achieveProgressTrack: {
    flexDirection: 'row', height: 6, borderRadius: 3,
    backgroundColor: '#1e2d45', overflow: 'hidden',
  },
  achieveProgressFill: { borderRadius: 3, backgroundColor: '#5b4fcf' },

  // ── Name edit modal ───────────────────────────────────────────────────────
  editNameBtn: { fontSize: 14 },
  nameModalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  nameModalCard: {
    backgroundColor: '#111a2e', borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)', padding: 24, width: '100%', gap: 16,
  },
  nameModalTitle: { fontSize: 11, fontWeight: '800', color: '#3a4a6b', letterSpacing: 2 },
  nameModalInput: {
    backgroundColor: '#0d1525', borderRadius: 10, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 16, color: '#fff', fontWeight: '600',
  },
  nameModalBtns: { flexDirection: 'row', gap: 10 },
  nameModalCancel: {
    flex: 1, borderRadius: 10, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)', paddingVertical: 12, alignItems: 'center',
  },
  nameModalCancelText: { fontSize: 13, fontWeight: '700', color: '#4a5a7b', letterSpacing: 1 },
  nameModalSave: {
    flex: 2, borderRadius: 10, backgroundColor: '#3b82f6',
    paddingVertical: 12, alignItems: 'center',
  },
  nameModalSaveText: { fontSize: 13, fontWeight: '800', color: '#fff', letterSpacing: 1 },

  // ── Empty ─────────────────────────────────────────────────────────────────
  emptyState: { alignItems: 'center', paddingTop: 40, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 14, color: '#4a5a7b', textAlign: 'center', lineHeight: 20 },
});
