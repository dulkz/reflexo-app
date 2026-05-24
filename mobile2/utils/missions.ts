import { SessionRecord } from './storage';
import { loadWeeklySlots, saveWeeklySlots } from './storage';
import { UserProfile } from '../types/user';
import { getNextMilestone } from './ambition';
import { ACHIEVEMENT_ICONS, ARCHETYPE_ICONS, MISSION_ICONS } from '../assets/icons';

export interface WeeklyMission {
  id: string;
  icon: string;
  label: string;
  current: number;
  target: number;
  done: boolean;
}

// Priority buckets — lower value = higher priority (used only for initial slot selection)
const enum Priority {
  InProgress  = 0,
  Performance = 1,
  Consistency = 2,
  Exploration = 3,
}

interface Candidate extends WeeklyMission {
  priority: Priority;
}

function getWeekStart(): number {
  const now = new Date();
  const day = now.getDay();
  const daysFromMon = day === 0 ? 6 : day - 1;
  const mon = new Date(now);
  mon.setHours(0, 0, 0, 0);
  mon.setDate(mon.getDate() - daysFromMon);
  return mon.getTime();
}

function getTodayStart(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function computeLocalStreak(sessions: SessionRecord[]): number {
  if (sessions.length === 0) return 0;
  const DAY = 86_400_000;
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

function inProgressPriority(c: Omit<Candidate, 'priority'>, base: Priority): Priority {
  if (c.current > 0 && !c.done) return Priority.InProgress;
  return base;
}

// Returns all missions with live progress — including done ones (for slot hydration).
// Sorted by priority; done missions sort last within their bucket.
function buildMissionPool(
  sessions: SessionRecord[],
  userProfile: UserProfile,
): Candidate[] {
  const weekStart   = getWeekStart();
  const todayStart  = getTodayStart();
  const thisWeek    = sessions.filter(s => s.date >= weekStart);
  const today       = sessions.filter(s => s.date >= todayStart);
  const weekCount   = thisWeek.length;
  const streak      = computeLocalStreak(sessions);
  const triageDone  = userProfile.triageCompleted;
  const baselineMs  = userProfile.baselineMs;
  const playedToday = today.length > 0;

  let bestPartida:       number | null = null;
  let bestPartidaBefore: number | null = null;
  let hasAlvo      = false;
  let hasSeq       = false;
  let hasRadar     = false;
  let totalAlvo    = 0;
  let totalSeq     = 0;
  let totalRadar   = 0;
  let hasAlvo100   = false;
  let hasSeqClean  = false;
  let hasMorning   = false;

  for (const s of sessions) {
    if (s.mode === 'partida') {
      if (bestPartida === null || s.score < bestPartida) bestPartida = s.score;
      if (s.date < weekStart && (bestPartidaBefore === null || s.score < bestPartidaBefore)) {
        bestPartidaBefore = s.score;
      }
    }
    if (s.mode === 'alvo') {
      hasAlvo = true;
      totalAlvo++;
      if (s.accuracy === 1) hasAlvo100 = true;
    }
    if (s.mode === 'sequencia') {
      hasSeq = true;
      totalSeq++;
      if ((s.noGoErrors ?? 0) === 0) hasSeqClean = true;
    }
    if (s.mode === 'radar') {
      hasRadar = true;
      totalRadar++;
    }
    const hour = new Date(s.date).getHours();
    if (hour < 9) hasMorning = true;
  }

  // Radar-specific this-week metrics
  const radarThisWeek      = thisWeek.filter(s => s.mode === 'radar').sort((a, b) => a.date - b.date);
  const hasRadar100ThisWeek = radarThisWeek.some(s => s.accuracy === 1);
  let radarConsecImprove   = false;
  if (radarThisWeek.length >= 3) {
    let cs = 1;
    for (let i = 1; i < radarThisWeek.length; i++) {
      if (radarThisWeek[i].score < radarThisWeek[i - 1].score) {
        cs++;
        if (cs >= 3) { radarConsecImprove = true; break; }
      } else {
        cs = 1;
      }
    }
  }

  const modesDistinctThisWeek = new Set(thisWeek.map(s => s.mode)).size;
  const modesTodayDistinct    = new Set(today.map(s => s.mode)).size;
  const currentBestMs         = bestPartida;

  const pool: Candidate[] = [];

  function add(c: Omit<Candidate, 'priority'>, base: Priority) {
    pool.push({ ...c, priority: inProgressPriority(c, base) });
  }

  // ── GRUPO: Volume / consistência ─────────────────────────────────────────────

  if (!triageDone || weekCount < 3) {
    const cur = Math.min(weekCount, 3);
    add({ id: 'week_sessions', icon: MISSION_ICONS.calendar, label: 'Jogue 3 sessões esta semana', current: cur, target: 3, done: cur >= 3 }, Priority.Consistency);
  }

  if (triageDone && weekCount >= 3) {
    const cur = Math.min(weekCount, 5);
    add({ id: 'week_5_sessions', icon: MISSION_ICONS.calendar, label: 'Jogue 5 sessões esta semana', current: cur, target: 5, done: cur >= 5 }, Priority.Consistency);
  }

  if (streak < 3) {
    add({ id: 'streak_3', icon: ACHIEVEMENT_ICONS.streak5, label: 'Jogue 3 dias seguidos', current: Math.min(streak, 3), target: 3, done: streak >= 3 }, Priority.Consistency);
  }

  if (streak >= 3 && streak < 7) {
    add({ id: 'streak_7', icon: ACHIEVEMENT_ICONS.streak5, label: 'Complete uma semana inteira', current: Math.min(streak, 7), target: 7, done: streak >= 7 }, Priority.Consistency);
  }

  if (streak >= 7) {
    add({ id: 'streak_today', icon: ACHIEVEMENT_ICONS.streak5, label: 'Mantenha a sequência — treine hoje', current: playedToday ? 1 : 0, target: 1, done: playedToday }, Priority.Consistency);
  }

  add({ id: 'two_modes_today', icon: ACHIEVEMENT_ICONS.sub300, label: 'Jogue 2 modos diferentes hoje', current: Math.min(modesTodayDistinct, 2), target: 2, done: modesTodayDistinct >= 2 }, Priority.Consistency);

  // ── GRUPO: Performance ───────────────────────────────────────────────────────

  if (triageDone || (hasAlvo && hasSeq)) {
    const partidaThisWeek = thisWeek.filter(s => s.mode === 'partida');
    const bestThisWeek    = partidaThisWeek.length > 0 ? Math.min(...partidaThisWeek.map(s => s.score)) : null;
    const improved = bestThisWeek !== null && (bestPartidaBefore === null || bestThisWeek < bestPartidaBefore);
    add({ id: 'improve_partida', icon: ACHIEVEMENT_ICONS.sub300, label: 'Melhore seu recorde no Modo Partida', current: improved ? 1 : 0, target: 1, done: improved }, Priority.Performance);
  }

  if (triageDone && baselineMs !== null && (currentBestMs === null || currentBestMs > baselineMs)) {
    add({ id: 'beat_baseline', icon: ACHIEVEMENT_ICONS.cem_sessoes, label: 'Supere seu baseline no Partida', current: 0, target: 1, done: false }, Priority.Performance);
  }

  if (bestPartida === null || bestPartida > 300) {
    add({ id: 'sub300', icon: ACHIEVEMENT_ICONS.sniper, label: 'Atinja menos de 300ms no Modo Partida', current: 0, target: 1, done: false }, Priority.Performance);
  }

  if (!hasAlvo100) {
    add({ id: 'top_accuracy', icon: ACHIEVEMENT_ICONS.sniper, label: 'Acerte 100% no Modo Alvo', current: 0, target: 1, done: false }, Priority.Performance);
  }

  if (!hasSeqClean) {
    add({ id: 'no_commission', icon: ACHIEVEMENT_ICONS.semfadiga, label: 'Jogue Sequência sem erros de NoGo', current: 0, target: 1, done: false }, Priority.Performance);
  }

  if (triageDone && userProfile.ambitionId) {
    const next = getNextMilestone(baselineMs, currentBestMs, userProfile.ambitionId, sessions);
    if (next && next.ms !== undefined) {
      add({ id: 'next_milestone', icon: ARCHETYPE_ICONS.ROCKET, label: `Chegue em ${next.ms}ms no Modo Partida`, current: 0, target: 1, done: false }, Priority.Performance);
    }
  }

  // ── GRUPO: Exploração ────────────────────────────────────────────────────────

  if (!triageDone && !hasAlvo) {
    const cur = thisWeek.filter(s => s.mode === 'alvo').length > 0 ? 1 : 0;
    add({ id: 'try_alvo', icon: ACHIEVEMENT_ICONS.sniper, label: 'Experimente o Modo Alvo', current: cur, target: 1, done: cur >= 1 }, Priority.Exploration);
  }

  if (!triageDone && !hasSeq) {
    const cur = thisWeek.filter(s => s.mode === 'sequencia').length > 0 ? 1 : 0;
    add({ id: 'try_sequencia', icon: ACHIEVEMENT_ICONS.semfadiga, label: 'Experimente o Modo Sequência', current: cur, target: 1, done: cur >= 1 }, Priority.Exploration);
  }

  if (!hasRadar) {
    const cur = radarThisWeek.length > 0 ? 1 : 0;
    add({ id: 'try_radar', icon: ACHIEVEMENT_ICONS.iniciado_radar, label: 'Experimente o Modo Radar', current: cur, target: 1, done: cur >= 1 }, Priority.Exploration);
  }

  if (modesDistinctThisWeek < 4) {
    add({ id: 'try_all_modes', icon: MISSION_ICONS.medal, label: 'Jogue os 4 modos esta semana', current: modesDistinctThisWeek, target: 4, done: modesDistinctThisWeek >= 4 }, Priority.Exploration);
  }

  if (totalSeq < 5) {
    add({ id: 'seq_5_sessions', icon: ACHIEVEMENT_ICONS.semfadiga, label: 'Jogue 5 sessões de Sequência', current: Math.min(totalSeq, 5), target: 5, done: totalSeq >= 5 }, Priority.Exploration);
  }

  if (totalAlvo < 5) {
    add({ id: 'alvo_5_sessions', icon: ACHIEVEMENT_ICONS.sniper, label: 'Jogue 5 sessões de Alvo', current: Math.min(totalAlvo, 5), target: 5, done: totalAlvo >= 5 }, Priority.Exploration);
  }

  if (totalRadar < 5) {
    add({ id: 'radar_5_sessions', icon: ACHIEVEMENT_ICONS.iniciado_radar, label: 'Jogue 5 sessões de Radar', current: Math.min(totalRadar, 5), target: 5, done: totalRadar >= 5 }, Priority.Exploration);
  }

  if (!hasRadar100ThisWeek) {
    add({ id: 'radar_100_accuracy', icon: ACHIEVEMENT_ICONS.sniper, label: 'Acerte 100% em uma sessão de Radar', current: 0, target: 1, done: false }, Priority.Performance);
  }

  if (!radarConsecImprove) {
    add({ id: 'radar_streak', icon: ACHIEVEMENT_ICONS.iniciado_radar, label: 'Melhore o score em 3 Radares consecutivos esta semana', current: 0, target: 1, done: false }, Priority.Performance);
  }

  if (!hasMorning) {
    add({ id: 'morning_session', icon: MISSION_ICONS.sunrise, label: 'Treine antes das 9h', current: 0, target: 1, done: false }, Priority.Exploration);
  }

  // Sort: priority ASC, then done last within bucket, then progress DESC
  pool.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    if (a.done !== b.done) return a.done ? 1 : -1;
    return (b.current / b.target) - (a.current / a.target);
  });

  return pool;
}

// Static metadata for every known mission ID.
// Used as fallback when a slot's mission is no longer emitted by buildMissionPool
// because its guard condition is the same as its done condition (e.g. !hasAlvo100).
const MISSION_META: Record<string, { icon: string; label: string; target: number }> = {
  week_sessions:   { icon: MISSION_ICONS.calendar,              label: 'Jogue 3 sessões esta semana',               target: 3 },
  week_5_sessions: { icon: MISSION_ICONS.calendar,              label: 'Jogue 5 sessões esta semana',               target: 5 },
  streak_3:        { icon: ACHIEVEMENT_ICONS.streak5,           label: 'Jogue 3 dias seguidos',                     target: 3 },
  streak_7:        { icon: ACHIEVEMENT_ICONS.streak5,           label: 'Complete uma semana inteira',               target: 7 },
  streak_today:    { icon: ACHIEVEMENT_ICONS.streak5,           label: 'Mantenha a sequência — treine hoje',        target: 1 },
  two_modes_today: { icon: ACHIEVEMENT_ICONS.sub300,            label: 'Jogue 2 modos diferentes hoje',             target: 2 },
  improve_partida: { icon: ACHIEVEMENT_ICONS.sub300,            label: 'Melhore seu recorde no Modo Partida',       target: 1 },
  beat_baseline:   { icon: ACHIEVEMENT_ICONS.cem_sessoes,       label: 'Supere seu baseline no Partida',            target: 1 },
  sub300:          { icon: ACHIEVEMENT_ICONS.sniper,            label: 'Atinja menos de 300ms no Modo Partida',     target: 1 },
  top_accuracy:    { icon: ACHIEVEMENT_ICONS.sniper,            label: 'Acerte 100% no Modo Alvo',                  target: 1 },
  no_commission:   { icon: ACHIEVEMENT_ICONS.semfadiga,         label: 'Jogue Sequência sem erros de NoGo',         target: 1 },
  next_milestone:  { icon: ARCHETYPE_ICONS.ROCKET,              label: 'Alcance o próximo marco no Partida',        target: 1 },
  try_alvo:           { icon: ACHIEVEMENT_ICONS.sniper,         label: 'Experimente o Modo Alvo',                   target: 1 },
  try_sequencia:      { icon: ACHIEVEMENT_ICONS.semfadiga,      label: 'Experimente o Modo Sequência',              target: 1 },
  try_radar:          { icon: ACHIEVEMENT_ICONS.iniciado_radar, label: 'Experimente o Modo Radar',                  target: 1 },
  try_all_modes:      { icon: MISSION_ICONS.medal,              label: 'Jogue os 4 modos esta semana',              target: 4 },
  seq_5_sessions:     { icon: ACHIEVEMENT_ICONS.semfadiga,      label: 'Jogue 5 sessões de Sequência',              target: 5 },
  alvo_5_sessions:    { icon: ACHIEVEMENT_ICONS.sniper,         label: 'Jogue 5 sessões de Alvo',                   target: 5 },
  radar_5_sessions:   { icon: ACHIEVEMENT_ICONS.iniciado_radar, label: 'Jogue 5 sessões de Radar',                  target: 5 },
  radar_100_accuracy: { icon: ACHIEVEMENT_ICONS.sniper,         label: 'Acerte 100% em uma sessão de Radar',        target: 1 },
  radar_streak:       { icon: ACHIEVEMENT_ICONS.iniciado_radar, label: 'Melhore o score em 3 Radares consecutivos esta semana', target: 1 },
  morning_session:    { icon: MISSION_ICONS.sunrise,            label: 'Treine antes das 9h',                       target: 1 },
};

// Fallback for hydration: if a mission's guard excludes it from buildMissionPool because
// the guard condition equals the done condition, return a done=true snapshot.
function getCompletedMission(id: string): WeeklyMission | null {
  const meta = MISSION_META[id];
  if (!meta) return null;
  return { id, ...meta, current: meta.target, done: true };
}

// Async, stateful: fixes 3 slot IDs per week in AsyncStorage.
// Done missions stay in their slot; progress is always recalculated live.
export async function getWeeklyMissions(
  sessions: SessionRecord[],
  userProfile: UserProfile,
): Promise<WeeklyMission[]> {
  const weekStart = getWeekStart();
  const stored    = await loadWeeklySlots();

  let slotIds: string[];

  if (!stored || stored.weekStart !== weekStart) {
    // New week: pick 3 non-done missions in priority order
    const pool = buildMissionPool(sessions, userProfile).filter(m => !m.done);
    slotIds = pool.slice(0, 3).map(m => m.id);
    await saveWeeklySlots({ weekStart, slotIds });
  } else {
    slotIds = stored.slotIds;
  }

  // Hydrate slot IDs with live progress.
  // If a mission's guard removed it from the pool (because done === guard condition),
  // fall back to getCompletedMission so the slot always renders with ✓.
  const allMissions = buildMissionPool(sessions, userProfile);
  const missionMap  = new Map(allMissions.map(m => [m.id, m]));

  const result: WeeklyMission[] = [];
  for (const id of slotIds) {
    const live = missionMap.get(id);
    if (live) {
      const { priority: _p, ...m } = live;
      result.push(m);
    } else {
      const fallback = getCompletedMission(id);
      if (fallback) result.push(fallback);
    }
  }
  return result;
}
