import React, { useMemo, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Modal, TextInput,
  Platform, StatusBar as RNStatusBar, TouchableOpacity, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import i18n, { changeLanguage } from '../i18n';
import Svg, { Defs, LinearGradient, Stop, Circle, Text as SvgText } from 'react-native-svg';
import { SvgXml } from 'react-native-svg';
import { getLevelInfo, getLevelForMode, MODE_COLORS, ModeKey } from '../utils/levels';
import { ICONS } from '../assets/icons';
import { SessionRecord, loadUnlockedAchievements } from '../utils/storage';
import { supabase } from '../lib/supabase';
import { resetMigrationFlag } from '../utils/migrateLocalSessions';
import { UserProfile } from '../types/user';
import { buildUserStats, getArchetypeFromStats, ARCHETYPES } from '../config/archetypes';

const ARCHETYPE_CHAIN: { id: string; tagline: string }[] = [
  { id: 'EXPLORADOR',  tagline: 'Descobrindo seu perfil' },
  { id: 'EM_EVOLUCAO', tagline: 'Crescendo a cada treino' },
  { id: 'RESISTENTE',  tagline: 'Consistente sob fadiga' },
  { id: 'ATIRADOR',    tagline: 'Precisão cirúrgica' },
  { id: 'VELOCISTA',   tagline: 'Velocidade de elite' },
  { id: 'PILOTO',      tagline: 'Reflexos de elite' },
];

// Destination archetype by ambition group — the "ceiling" the user is aiming for
const DEST_BY_GROUP: Record<string, { id: string; label: string }> = {
  elite_sport:  { id: 'PILOTO',     label: 'O Piloto' },
  populational: { id: 'VELOCISTA',  label: 'O Velocista' },
  brain_health: { id: 'RESISTENTE', label: 'O Consistente' },
};
import { ACHIEVEMENTS, getUnlockedCount, RARITY_CONFIG } from '../config/achievements';
import { ARCHETYPE_ICONS, UI_ICONS, ACHIEVEMENT_ICONS } from '../assets/icons';
import { AVATARS } from '../config/avatars';
import { saveUserProfile } from '../utils/userProfile';
import {
  getAmbition,
  getNextMilestone,
  getMilestonesState,
} from '../utils/ambition';
import { GROUP_COLOR } from '../config/ambitions';
import JourneyMap from '../components/JourneyMap';
import { CienciaContent } from './Ciencia';
import { HistoricoModeCards } from './Historico';
import { ConquistasContent } from './Conquistas';

const TOP = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 44;

const DAY = 86_400_000;

function shortMonthDay(ts: number, lang: string): string {
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'pt-BR', {
    day: 'numeric', month: 'short',
  }).format(new Date(ts));
}

function longMonth(ts: number, lang: string): string {
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'pt-BR', {
    month: 'long',
  }).format(new Date(ts));
}

interface Props {
  sessions: SessionRecord[];
  userProfile: UserProfile;
  onOpenTriage: (editMode: boolean) => void;
  onUpdateProfile: (p: UserProfile) => void;
  onClearData: () => void;
  onLogout?: () => void;
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

function formatRelDay(ts: number, t: (k: string, o?: Record<string, unknown>) => string, lang: string): string {
  const diff = Math.round((dayStart(Date.now()) - dayStart(ts)) / DAY);
  if (diff === 0) return t('dates.today');
  if (diff === 1) return t('dates.yesterday');
  if (diff < 7) return `${diff}d`;
  return shortMonthDay(ts, lang);
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

const MODE_ICONS_PERFIL: Record<ModeKey, string> = {
  partida:   ICONS.modes.partida,
  alvo:      ICONS.modes.alvo,
  sequencia: ICONS.modes.sequencia,
  radar:     ICONS.modes.radar,
};

// ── Bar chart ────────────────────────────────────────────────────────────────

type TFn = (k: string, o?: Record<string, unknown>) => string;

function BarChart({ sessions, t, lang }: { sessions: SessionRecord[]; t: TFn; lang: string }) {
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
          const lvl = getLevelForMode(s.score, s.mode);
          return (
            <View key={i} style={chart.barWrapper}>
              <Text style={chart.scoreLabel}>{s.score}</Text>
              <View style={{ flex: 1 }} />
              <View style={[chart.bar, { height: barH, backgroundColor: mc.accent }]} />
              <View style={[chart.levelPill, { backgroundColor: lvl.bg }]}>
                <Text style={[chart.levelText, { color: lvl.color }]} numberOfLines={1}>
                  {t(`levels.${lvl.labelKey}.label` as any).split(' ')[0]}
                </Text>
              </View>
              <Text style={chart.dayLabel}>{formatRelDay(s.date, t, lang)}</Text>
            </View>
          );
        })}
      </View>
      <Text style={chart.insight}>
        {improved
          ? t('profile.chart.improving', { delta: Math.abs(delta), n: sessions.length })
          : delta > 0
          ? t('profile.chart.declining', { delta })
          : t('profile.chart.consistent')}
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

export default function Perfil({ sessions, userProfile, onOpenTriage, onUpdateProfile, onClearData, onLogout }: Props) {
  const { t } = useTranslation();
  const lang = i18n.language;

  // Logout — reseta a flag de migração (pra re-enviar sessões no próximo login),
  // encerra a sessão no Supabase, e deixa o RootGate voltar ao AuthScreen.
  const handleLogout = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) await resetMigrationFlag(session.user.id);
    await AsyncStorage.removeItem('reflexo_guest');
    await supabase.auth.signOut();
    onLogout?.();
  };

  // Collapsible embedded sections (Histórico, Conquistas, Ciência)
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [achievementsExpanded, setAchievementsExpanded] = useState(false);
  const [scienceExpanded, setScienceExpanded] = useState(false);

  const handleLangChange = async (next: 'pt' | 'en') => {
    if (i18n.language === next) return;
    await changeLanguage(next);
    Alert.alert(t('common.languageChangedTitle'), t('common.languageChangedMessage'));
  };

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const streak = useMemo(() => computeStreak(sessions), [sessions]);
  const stats = useMemo(() => buildUserStats(sessions, streak), [sessions, streak]);
  const archetype = useMemo(() => getArchetypeFromStats(stats), [stats]);
  const equippedAchievement = useMemo(() => {
    if (!userProfile.equippedTitle) return null;
    const ach = ACHIEVEMENTS.find(a => a.id === userProfile.equippedTitle);
    return ach && ach.unlocked(stats) ? ach : null;
  }, [userProfile.equippedTitle, stats]);
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
    const keys: ModeKey[] = ['partida', 'radar', 'sequencia', 'alvo'];
    return keys.map(k => {
      const mSessions = sessions.filter(s => s.mode === k);
      // melhor tempo médio = melhor score de sessão; melhor tempo absoluto = melhor hit individual
      const bestAvg = stats.bestScoreByMode[k];
      const bestAbs = mSessions.length > 0
        ? Math.min(...mSessions.map(s => s.bestTime ?? s.score))
        : null;
      const bestAcc = stats.bestAccByMode[k];
      const lastFatigue = mSessions.length > 0 && mSessions[0].fatigueIndex !== undefined
        ? mSessions[0].fatigueIndex
        : null;
      return { key: k, count: mSessions.length, bestAvg, bestAbs, bestAcc, lastFatigue };
    });
  }, [sessions, stats]);

  const last8 = useMemo(() => sessions.slice(0, 8).reverse(), [sessions]);

  const joinedLabel = useMemo(() => {
    if (sessions.length === 0) return null;
    const oldest = sessions[sessions.length - 1];
    return longMonth(oldest.date, lang);
  }, [sessions, lang]);

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

  const allBeaten = useMemo(
    () => milestonesState.length > 0 && milestonesState.every(s => s.status !== 'pendente'),
    [milestonesState],
  );

  const nextMilestone = useMemo(
    () => ambition ? getNextMilestone(baselineMs, currentBestMs, ambition.id, sessions) : null,
    [ambition, baselineMs, currentBestMs],
  );

  const isBrainHealth = ambition?.group === 'brain_health';
  const ambitionGroupColor = ambition ? GROUP_COLOR[ambition.group] : '#3b82f6';

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
            ? (() => {
                const av = AVATARS.find(a => a.id === userProfile.selectedAvatar);
                return av?.icon
                  ? <SvgXml xml={av.icon} width={72} height={72} />
                  : <GradientAvatar size={72} letter={(userProfile.name || 'Usuário')[0].toUpperCase()} />;
              })()
            : (
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
                <SvgXml xml={UI_ICONS.edit} width={16} height={16} />
              </TouchableOpacity>
            </View>
            {equippedAchievement && (() => {
              const color = RARITY_CONFIG[equippedAchievement.rarity].cor;
              return (
                <View style={styles.titleRow}>
                  <SvgXml xml={equippedAchievement.icon} width={16} height={16} />
                  <Text
                    style={[
                      styles.titleText,
                      {
                        color,
                        textShadowColor: color,
                        textShadowOffset: { width: 0, height: 0 },
                        textShadowRadius: 8,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    ✦ {equippedAchievement.title} ✦
                  </Text>
                </View>
              );
            })()}
            <Text style={styles.identitySub}>
              {joinedLabel
                ? t('profile.identity.playingSince', { month: joinedLabel })
                : t('profile.identity.noSessions')}
            </Text>
          </View>
          <View style={styles.identityLangRow}>
            <TouchableOpacity
              style={[styles.identityLangBtn, lang === 'pt' && styles.identityLangBtnActive]}
              onPress={() => handleLangChange('pt')}
              activeOpacity={0.7}
            >
              <Text style={styles.identityLangFlag}>🇧🇷</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.identityLangBtn, lang === 'en' && styles.identityLangBtnActive]}
              onPress={() => handleLangChange('en')}
              activeOpacity={0.7}
            >
              <Text style={styles.identityLangFlag}>🇺🇸</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Archetype card ── */}
        <View style={[styles.archetypeCard, { borderColor: archetype.color + '44' }]}>
          <View style={[styles.archetypeAccent, { backgroundColor: archetype.color }]} />
          <View style={styles.archetypeHeader}>
            <SvgXml xml={archetype.icon} width={34} height={34} />
            <View style={{ flex: 1 }}>
              <Text style={styles.archetypeKicker}>{t('profile.archetype')}</Text>
              <Text style={[styles.archetypeName, { color: archetype.color }]}>{t('archetypes.' + archetype.id)}</Text>
            </View>
            {nextDef && (
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.archetypeNextKicker}>{t('profile.nextShort')}</Text>
                <Text style={[styles.archetypeNextVal, { color: nextDef.color }]} numberOfLines={1}>
                  {t('archetypes.' + nextDef.id)} →
                </Text>
              </View>
            )}
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

        {/* ── MINHA JORNADA (mapa + meta) ── */}
        {!userProfile.triageCompleted ? (
          <View style={styles.journeyCTA}>
            <Text style={styles.journeyCTATitle}>{t('journey.ctaTitle')}</Text>
            <Text style={styles.journeyCTADesc}>{t('journey.ctaDesc')}</Text>
            <TouchableOpacity style={styles.journeyCTABtn} onPress={() => onOpenTriage(false)} activeOpacity={0.8}>
              <Text style={styles.journeyCTABtnText}>{t('journey.ctaBtn')}</Text>
            </TouchableOpacity>
          </View>
        ) : ambition ? (
          <View style={styles.journeySection}>
            <View style={styles.journeySectionHeader}>
              <Text style={styles.journeyKicker}>{t('journey.myJourney')}</Text>
            </View>
            <View style={styles.journeyAmbitionRow}>
              <SvgXml xml={ambition.icon} width={22} height={22} />
              <Text style={[styles.journeyAmbitionName, { color: ambitionGroupColor }]} numberOfLines={1}>
                {ambition.name}
              </Text>
              <TouchableOpacity onPress={() => onOpenTriage(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.journeyChangeLink}>{t('journey.changeGoal')}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.journeySummary}>
              {isBrainHealth
                ? t('journey.summaryBrain', { base: baselineMs ?? '—', beaten: beatenCount, total: ambition.milestones.length })
                : t('journey.summaryGoal', { base: baselineMs ?? '—', goal: ambition.finalMetaMs ?? '—', beaten: beatenCount, total: ambition.milestones.length })}
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
          </View>
        ) : null}

        {/* ── ARQUÉTIPOS — timeline de evolução (nó + conector) ── */}
        {(() => {
          const currentIdx = ARCHETYPE_CHAIN.findIndex(a => a.id === stats.archetypeId);
          return (
            <View style={styles.chainSection}>
              <Text style={styles.sectionTitle}>{t('profile.evolution')}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tlScroll}
              >
                {ARCHETYPE_CHAIN.map((a, i) => {
                  const isPast    = i < currentIdx;
                  const isCurrent = i === currentIdx;
                  const archDef   = ARCHETYPES[a.id];
                  const lineDone  = i < currentIdx;
                  return (
                    <React.Fragment key={a.id}>
                      <View style={styles.tlNode}>
                        <View style={[
                          styles.tlCircle,
                          isPast    && styles.tlCircleDone,
                          isCurrent && { backgroundColor: archetype.color + '22', borderColor: archetype.color, borderWidth: 2 },
                          !isPast && !isCurrent && styles.tlCircleLocked,
                        ]}>
                          {isPast
                            ? <Text style={styles.tlCheck}>✓</Text>
                            : isCurrent
                            ? <Text style={[styles.tlGlyph, { color: archetype.color }]}>◉</Text>
                            : <Text style={styles.tlLockGlyph}>○</Text>}
                        </View>
                        <Text
                          style={[
                            styles.tlLabel,
                            isCurrent && { color: archetype.color, fontWeight: '800' },
                            isPast && { color: archDef.color },
                          ]}
                          numberOfLines={1}
                        >
                          {t('archetypes.' + archDef.id)}
                        </Text>
                      </View>
                      {i < ARCHETYPE_CHAIN.length - 1 && (
                        <View style={[styles.tlLine, lineDone && styles.tlLineDone]} />
                      )}
                    </React.Fragment>
                  );
                })}
              </ScrollView>
            </View>
          );
        })()}

        {/* ── METAS DE LONGO PRAZO ── */}
        <View style={styles.ltSection}>
          <Text style={styles.sectionTitle}>{t('profile.longTermGoals')}</Text>

          {/* Próximo marco de velocidade */}
          {ambition && nextMilestone && !isBrainHealth &&
           nextMilestone.type !== 'qualitative' && nextMilestone.ms !== undefined &&
           currentBestMs !== null && (
            <View style={styles.ltCard}>
              <View style={styles.ltCardTop}>
                <SvgXml xml={ARCHETYPE_ICONS.ROCKET} width={22} height={22} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.ltKicker}>{t('profile.nextMilestone')}</Text>
                  <Text style={styles.ltTitle}>{nextMilestone.label}</Text>
                  <Text style={styles.ltSub}>
                    {`${ambition.name} · ${t('profile.goalMs', { ms: nextMilestone.ms })}`}
                    {currentBestMs <= nextMilestone.ms
                      ? ` · ${t('profile.alreadyReached')}`
                      : ` · ${t('profile.remaining', { delta: currentBestMs - nextMilestone.ms })}`}
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
                <SvgXml xml={nextAchievementInfo.a.icon} width={22} height={22} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.ltKicker}>{t('profile.nextAchievement')}</Text>
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
                <SvgXml xml={nextDef.icon} width={24} height={24} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.ltKicker}>{t('profile.nextArchetypeSection')}</Text>
                  <Text style={[styles.ltTitle, { color: nextDef.color }]}>{t('archetypes.' + nextDef.id)}</Text>
                  <Text style={styles.ltSub}>
                    {t('profile.criteriaDone', {
                      done: archetype.targetCriteria.filter(c => c.done(stats)).length,
                      total: archetype.targetCriteria.length,
                    })}
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
                <Text style={styles.completedHeaderText}>{t('profile.completed')}</Text>
                <View style={styles.completedHeaderRight}>
                  <Text style={styles.completedHeaderCount}>
                    {t('profile.completedCount', { count: completedCount })}
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
                          <Text style={styles.completedSub}>{t('profile.msReached', { ms: ms.milestone.ms })}</Text>
                        )}
                      </View>
                      <Text style={styles.completedTag}>{t('profile.milestone')}</Text>
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
                      <Text style={styles.completedTag}>{t('profile.achievement')}</Text>
                    </View>
                  )}
                  {pastArchetypes.map(pa => (
                    <View key={pa.id} style={styles.completedItem}>
                      <Text style={styles.completedCheck}>✓</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.completedLabel}>{t('archetypes.' + pa.id)}</Text>
                        <Text style={styles.completedSub}>{pa.tagline}</Text>
                      </View>
                      <Text style={styles.completedTag}>{t('profile.archetypeLabel')}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* ── PARA VIRAR block ── */}
        {nextDef && archetype.targetCriteria.length > 0 && !reachedDestination && (
          <View style={styles.paraVirarCard}>
            <View style={styles.paraVirarHeader}>
              <Text style={styles.paraVirarKicker}>{t('profile.nextArchetype')}</Text>
              <View style={styles.paraVirarTarget}>
                <SvgXml xml={nextDef.icon} width={24} height={24} />
                <Text style={[styles.paraVirarName, { color: nextDef.color }]}>{t('archetypes.' + nextDef.id)}</Text>
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
                  {t('profile.beatNextMilestone', { ms: nextMilestone.ms })}
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
                <SvgXml xml={ACHIEVEMENT_ICONS.sniper} width={20} height={20} />
                <Text style={[styles.destLabel, { color: ambitionGroupColor }]}>
                  {t('profile.destinationLabel', { name: destinationArch.label })}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── Mode breakdown ── */}
        <Text style={styles.sectionTitle}>{t('profile.byMode')}</Text>
        {modeBreakdown.map(m => {
          const mc = MODE_COLORS[m.key];
          const hasData = m.bestAbs !== null && m.bestAvg !== null;
          const lvlAbs = m.bestAbs !== null ? getLevelForMode(m.bestAbs, m.key) : null;
          const lvlAvg = m.bestAvg !== null ? getLevelForMode(m.bestAvg, m.key) : null;

          return (
            <View key={m.key} style={styles.modeCard}>
              <View style={[styles.modeIconBox, { backgroundColor: mc.accent + '2a' }]}>
                <SvgXml xml={MODE_ICONS_PERFIL[m.key]} width={28} height={28} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.modeName, { color: mc.accent }]}>{t(`modes.${m.key}.name`)}</Text>
                <Text style={styles.modeSub}>{t(`profile.modeDesc.${m.key}`)}</Text>
              </View>
              <View style={styles.modeRight}>
                {hasData && lvlAbs && lvlAvg ? (
                  <>
                    {/* DOIS valores sempre visíveis: melhor absoluto + melhor média */}
                    <View style={styles.modeStatLine}>
                      <Text style={[styles.modeScore, { color: lvlAbs.color }]}>{m.bestAbs} ms</Text>
                      <Text style={styles.modeStatLabel}>{t('history.stats.absLabel')}</Text>
                    </View>
                    <View style={styles.modeStatLine}>
                      <Text style={[styles.modeScoreSecondary, { color: lvlAvg.color }]}>{m.bestAvg} ms</Text>
                      <Text style={styles.modeStatLabel}>{t('history.stats.avgBestLabel')}</Text>
                    </View>
                    <View style={[styles.modeLevelPill, { backgroundColor: lvlAvg.bg }]}>
                      <Text style={[styles.modeLevelText, { color: lvlAvg.color }]} numberOfLines={1}>
                        {t(`levels.${lvlAvg.labelKey}.label` as any)}
                      </Text>
                    </View>
                    {m.key === 'alvo' && m.bestAcc !== null && (
                      <Text style={styles.modeExtra}>{Math.round(m.bestAcc * 100)}% acc</Text>
                    )}
                    {m.key === 'sequencia' && m.lastFatigue !== null && m.lastFatigue !== undefined && (
                      <Text style={styles.modeExtra}>{m.lastFatigue.toFixed(1)}% {t('profile.fatigue')}</Text>
                    )}
                    {m.key === 'radar' && m.bestAcc !== null && (
                      <Text style={[styles.modeExtra, { color: mc.accent }]}>{t('profile.accuracy')}: {Math.round(m.bestAcc * 100)}%</Text>
                    )}
                  </>
                ) : (
                  <Text style={styles.modeNone}>{m.count > 0 ? t('profile.modeCount', { count: m.count }) : '—'}</Text>
                )}
              </View>
            </View>
          );
        })}

        {/* ── Bar chart ── */}
        {last8.length >= 2 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
              {t('profile.lastSessionsN', { n: last8.length })}
            </Text>
            <BarChart sessions={last8} t={t} lang={lang} />
          </>
        )}

        {/* ── HISTÓRICO — evolução por modo (colapsável) ── */}
        <TouchableOpacity
          style={[styles.collapseHeader, { marginTop: 20 }]}
          onPress={() => setHistoryExpanded(p => !p)}
          activeOpacity={0.8}
        >
          <Text style={styles.sectionTitle}>{t('history.evolutionByMode')}</Text>
          <Text style={styles.collapseArrow}>{historyExpanded ? '▼' : '▶'}</Text>
        </TouchableOpacity>
        {historyExpanded && <HistoricoModeCards sessions={sessions} />}

        {/* ── Achievements summary (toca para expandir lista completa) ── */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>{t('profile.achievementsSummary')}</Text>
        <TouchableOpacity style={styles.achieveSummaryCard} onPress={() => setAchievementsExpanded(p => !p)} activeOpacity={0.8}>
          <View style={styles.achieveSummaryRow}>
            <Text style={styles.achieveSummaryCount}>
              {t('achievements.unlockedFraction', { count: unlockedCount, total: visibleAchievementTotal })}
            </Text>
            <Text style={styles.achieveSummaryLink}>{achievementsExpanded ? t('common.close') : t('profile.seeAll')}</Text>
          </View>
          <View style={styles.achieveProgressTrack}>
            <View style={[styles.achieveProgressFill, { flex: unlockedCount }]} />
            <View style={{ flex: Math.max(0, visibleAchievementTotal - unlockedCount) }} />
          </View>
        </TouchableOpacity>
        {achievementsExpanded && (
          <View style={{ marginTop: 4 }}>
            <ConquistasContent
              sessions={sessions}
              userProfile={userProfile}
              onUpdateProfile={onUpdateProfile}
              showHeader={false}
            />
          </View>
        )}

        {/* ── CIÊNCIA (colapsável) ── */}
        <TouchableOpacity
          style={[styles.collapseHeader, { marginTop: 20 }]}
          onPress={() => setScienceExpanded(p => !p)}
          activeOpacity={0.8}
        >
          <Text style={styles.sectionTitle}>{t('science.title')}</Text>
          <Text style={styles.collapseArrow}>{scienceExpanded ? '▼' : '▶'}</Text>
        </TouchableOpacity>
        {scienceExpanded && (
          <CienciaContent userProfile={userProfile} sessions={sessions} showTitle={false} />
        )}

        {sessions.length === 0 && (
          <View style={styles.emptyState}>
            <SvgXml xml={UI_ICONS.emptyGame} width={48} height={48} />
            <Text style={styles.emptyText}>{t('profile.emptyProfile')}</Text>
          </View>
        )}

        {/* ── Limpar dados — discreto, confirmação em duas etapas ── */}
        <View style={styles.dangerZone}>
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={() => {
              // 1ª etapa
              Alert.alert(
                t('profile.clearDataStep1Title'),
                t('profile.clearDataStep1Message'),
                [
                  { text: t('common.cancel'), style: 'cancel' },
                  {
                    text: t('profile.clearDataStep1Confirm'),
                    style: 'destructive',
                    onPress: () => {
                      // 2ª etapa — confirmação final
                      Alert.alert(
                        t('profile.clearDataStep2Title'),
                        undefined,
                        [
                          { text: t('profile.clearDataStep2Cancel'), style: 'cancel' },
                          { text: t('profile.clearDataStep2Confirm'), style: 'destructive', onPress: onClearData },
                        ],
                      );
                    },
                  },
                ],
              );
            }}
            activeOpacity={0.6}
          >
            <Text style={styles.dangerButtonText}>{t('profile.clearData')}</Text>
          </TouchableOpacity>
        </View>

        {/* Logout — encerra a sessão; o RootGate volta ao AuthScreen */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
          <Text style={styles.logoutButtonText}>{t('profile.logout')}</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Profile edit modal */}
      <Modal
        visible={editingName}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingName(false)}
      >
        <View style={styles.nameModalOverlay}>
          <View style={styles.nameModalCard}>
            <Text style={styles.nameModalTitle}>{t('profile.editProfile')}</Text>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 4 }}>
              <Text style={styles.editFieldLabel}>{t('profile.name')}</Text>
              <TextInput
                style={styles.nameModalInput}
                value={nameInput}
                onChangeText={setNameInput}
                placeholder={t('profile.namePlaceholder')}
                placeholderTextColor="#4a5a7b"
                maxLength={30}
              />

              {(() => {
                const unlockedAvatarCount = AVATARS.filter(av => av.isUnlocked(stats, ACHIEVEMENTS)).length;
                const selectedId = userProfile.selectedAvatar ?? 'initial';
                return (
                  <View style={{ marginTop: 18 }}>
                    <View style={styles.editAvatarHeader}>
                      <Text style={styles.editFieldLabel}>{t('profile.avatar')}</Text>
                      <Text style={styles.avatarHeaderCount}>
                        {t('profile.avatarCount', { count: unlockedAvatarCount, total: AVATARS.length })}
                      </Text>
                    </View>
                    <View style={styles.avatarGrid}>
                      {AVATARS.map(av => {
                        const unlocked = av.isUnlocked(stats, ACHIEVEMENTS);
                        const selected = selectedId === av.id;
                        const avIsInitial = av.id === 'initial';
                        const cellContent = !unlocked
                          ? <SvgXml xml={UI_ICONS.lock} width={24} height={24} />
                          : avIsInitial
                            ? <Text style={styles.avatarCellLetter}>{(nameInput || userProfile.name || 'U')[0].toUpperCase()}</Text>
                            : <SvgXml xml={av.icon!} width={56} height={56} />;
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
                );
              })()}
            </ScrollView>

            <View style={styles.nameModalBtns}>
              <TouchableOpacity
                style={styles.nameModalCancel}
                onPress={() => setEditingName(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.nameModalCancelText}>{t('common.close')}</Text>
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
                <Text style={styles.nameModalSaveText}>{t('profile.save')}</Text>
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
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  titleText: { fontSize: 13, fontWeight: '800', letterSpacing: 1 },
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
  avatarSectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12,
  },
  avatarHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatarHeaderCount: { fontSize: 11, color: '#3a4a6b', fontWeight: '600' },
  avatarHeaderChevron: { fontSize: 12, color: '#3a4a6b' },
  avatarCollapsed: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCollapsedName: { fontSize: 12, color: '#4a5a7b', fontWeight: '600' },
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
    padding: 18, marginBottom: 12, overflow: 'hidden',
  },
  archetypeAccent: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 2, opacity: 0.7,
  },
  archetypeHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 },
  archetypeIcon: { fontSize: 34 },
  archetypeKicker: { fontSize: 9, fontWeight: '700', color: '#3a4a6b', letterSpacing: 2, marginBottom: 3 },
  archetypeName: { fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  archetypeNextKicker: { fontSize: 9, color: '#3a4a6b', marginBottom: 2 },
  archetypeNextVal: { fontSize: 12, fontWeight: '700', maxWidth: 110 },
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
  destLabel: { fontSize: 12, fontWeight: '700' },

  // ── Section title ─────────────────────────────────────────────────────────
  sectionTitle: { fontSize: 10, fontWeight: '700', color: '#3a4a6b', letterSpacing: 2.5, marginBottom: 10 },

  // ── Collapsible embedded-section header ───────────────────────────────────
  collapseHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  collapseArrow: { fontSize: 11, color: '#3a4a6b', marginBottom: 10 },

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
  modeRight: { alignItems: 'flex-end', gap: 4, minWidth: 96 },
  modeStatLine: { alignItems: 'flex-end' },
  modeStatLabel: { fontSize: 9, color: '#3a4a6b', fontWeight: '600', letterSpacing: 0.3 },
  modeScoreSecondary: { fontSize: 14, fontWeight: '800' },
  modeScore: { fontSize: 16, fontWeight: '800' },
  modeLevelPill: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  modeLevelText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  modeExtra: { fontSize: 10, color: '#3a4a6b', marginTop: 1 },
  modeNone: { fontSize: 13, color: '#2d3a55', fontWeight: '700' },

  // ── Archetype evolution timeline (node + connector) ───────────────────────
  chainSection: { marginBottom: 12 },
  tlScroll: { paddingVertical: 4, alignItems: 'flex-start' },
  tlNode: { alignItems: 'center', gap: 6, width: 64 },
  tlCircle: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#111a2e', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)',
  },
  tlCircleDone: { backgroundColor: 'rgba(16,185,129,0.12)', borderColor: '#10b981' },
  tlCircleLocked: { backgroundColor: '#1a2540', borderColor: '#2d3a55' },
  tlCheck: { fontSize: 13, color: '#10b981', fontWeight: '800' },
  tlGlyph: { fontSize: 13, fontWeight: '800' },
  tlLockGlyph: { fontSize: 12, color: '#4a5a7b', fontWeight: '700' },
  tlLabel: { fontSize: 9, fontWeight: '700', color: '#4a5a7b', textAlign: 'center', maxWidth: 60 },
  tlLine: { width: 18, height: 1.5, backgroundColor: '#2d3a55', marginTop: 14 },
  tlLineDone: { backgroundColor: '#10b981', opacity: 0.4 },

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
    maxHeight: '85%',
  },
  nameModalTitle: { fontSize: 11, fontWeight: '800', color: '#3a4a6b', letterSpacing: 2 },
  editFieldLabel: { fontSize: 10, fontWeight: '700', color: '#4a5a7b', letterSpacing: 2, marginBottom: 8 },
  editAvatarHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 },
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

  // ── Compact language selector (identity area, top) ───────────────────────
  identityLangRow: { flexDirection: 'row', gap: 4, alignSelf: 'flex-start' },
  identityLangBtn: {
    paddingHorizontal: 7, paddingVertical: 4,
    borderRadius: 6, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#111a2e',
  },
  identityLangBtnActive: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59,130,246,0.18)',
  },
  identityLangFlag: { fontSize: 16, lineHeight: 18 },

  // ── Limpar dados — discreto, secundário (sem borda/fundo, texto cinza) ──────
  dangerZone: { marginTop: 24, alignItems: 'center' },
  dangerButton: {
    paddingHorizontal: 24, paddingVertical: 10,
  },
  dangerButtonText: { fontSize: 13, fontWeight: '600', color: '#4a5a7b', letterSpacing: 0.3 },
  logoutButton: {
    marginTop: 16,
    marginHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FF4444',
    alignItems: 'center',
  },
  logoutButtonText: { fontSize: 13, fontWeight: '700', color: '#FF4444', letterSpacing: 1 },
});
