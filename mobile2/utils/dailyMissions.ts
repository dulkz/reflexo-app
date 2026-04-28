import { SessionRecord } from './storage';
import { UserProfile } from '../types/user';
import { loadDailySlots, saveDailySlots } from './storage';

export interface DailyMission {
  id: string;
  icon: string;
  label: string;
  current: number;
  target: number;
  done: boolean;
}

export function getDayStart(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// Build the full pool of daily missions with live progress.
// Always includes all applicable missions; selectability constraints
// (e.g. daily_early only before 9h) are enforced in getDailyMissions.
function buildDailyPool(
  sessions: SessionRecord[],
  _userProfile: UserProfile,
): DailyMission[] {
  const DAY = 86_400_000;
  const dayStart   = getDayStart();
  const today      = sessions.filter(s => s.date >= dayStart);
  const todayCount = today.length;

  const todayPartida    = today.some(s => s.mode === 'partida');
  const todayAlvo       = today.some(s => s.mode === 'alvo');
  const todaySeq        = today.some(s => s.mode === 'sequencia');
  const todayRadarCount = today.filter(s => s.mode === 'radar').length;

  // Best partida score strictly before today → for beat-record check
  const partidaBefore = sessions.filter(s => s.mode === 'partida' && s.date < dayStart);
  const bestBefore    = partidaBefore.length > 0
    ? Math.min(...partidaBefore.map(s => s.score))
    : null;
  const partidaToday  = today.filter(s => s.mode === 'partida');
  const bestToday     = partidaToday.length > 0
    ? Math.min(...partidaToday.map(s => s.score))
    : null;
  const beatRecord    = bestToday !== null && bestBefore !== null && bestToday < bestBefore;

  // Sequência history (before today)
  const hasSeqHistory = sessions.some(s => s.mode === 'sequencia' && s.date < dayStart);
  const seqCleanToday = today.some(s => s.mode === 'sequencia' && (s.noGoErrors ?? 0) === 0);

  // Early session (before 9h) today
  const earlyToday = today.some(s => new Date(s.date).getHours() < 9);

  // Simplified streak computation (no external import to avoid circular deps)
  const todayMs = dayStart;
  const sorted  = [...sessions].sort((a, b) => b.date - a.date);
  let streak    = 0;
  for (const sess of sorted) {
    const d = new Date(sess.date); d.setHours(0, 0, 0, 0);
    const diff = Math.round((todayMs - d.getTime()) / DAY);
    if (diff === streak) streak++;
    else if (diff > streak) break;
  }
  const playedToday = todayCount > 0;

  const pool: DailyMission[] = [];

  // daily_login — instantly complete when app is opened
  pool.push({
    id: 'daily_login', icon: '📱', label: 'Abra o app hoje',
    current: 1, target: 1, done: true,
  });

  // daily_play — 1 session today
  { const cur = Math.min(todayCount, 1);
    pool.push({ id: 'daily_play', icon: '⚡', label: 'Jogue 1 partida hoje',
      current: cur, target: 1, done: cur >= 1 }); }

  // daily_play_3 — 3 sessions today
  { const cur = Math.min(todayCount, 3);
    pool.push({ id: 'daily_play_3', icon: '🎯', label: 'Jogue 3 partidas hoje',
      current: cur, target: 3, done: cur >= 3 }); }

  // daily_partida
  pool.push({ id: 'daily_partida', icon: '🏎', label: 'Jogue o Modo Partida hoje',
    current: todayPartida ? 1 : 0, target: 1, done: todayPartida });

  // daily_alvo
  pool.push({ id: 'daily_alvo', icon: '🎯', label: 'Jogue o Modo Alvo hoje',
    current: todayAlvo ? 1 : 0, target: 1, done: todayAlvo });

  // daily_sequencia
  pool.push({ id: 'daily_sequencia', icon: '🧠', label: 'Jogue o Modo Sequência hoje',
    current: todaySeq ? 1 : 0, target: 1, done: todaySeq });

  // daily_radar — 1 Radar session today
  { const cur = todayRadarCount >= 1 ? 1 : 0;
    pool.push({ id: 'daily_radar', icon: '📡', label: 'Jogue o Modo Radar hoje',
      current: cur, target: 1, done: cur >= 1 }); }

  // daily_radar_2 — 2 Radar sessions today
  { const cur = Math.min(todayRadarCount, 2);
    pool.push({ id: 'daily_radar_2', icon: '📡', label: 'Jogue 2 sessões de Radar hoje',
      current: cur, target: 2, done: cur >= 2 }); }

  // daily_beat_today — only if user has a prior partida record to beat
  if (bestBefore !== null) {
    pool.push({ id: 'daily_beat_today', icon: '🏆', label: 'Bata seu recorde hoje',
      current: beatRecord ? 1 : 0, target: 1, done: beatRecord });
  }

  // daily_no_errors — only if user has prior Sequência history
  if (hasSeqHistory) {
    pool.push({ id: 'daily_no_errors', icon: '🛡️', label: 'Jogue Sequência sem erros',
      current: seqCleanToday ? 1 : 0, target: 1, done: seqCleanToday });
  }

  // daily_early — train before 9h (always in pool; selectability enforced externally)
  pool.push({ id: 'daily_early', icon: '🌅', label: 'Treine antes das 9h',
    current: earlyToday ? 1 : 0, target: 1, done: earlyToday });

  // daily_streak — only if has active streak
  if (streak >= 1) {
    pool.push({ id: 'daily_streak', icon: '🔥', label: 'Mantenha sua sequência viva',
      current: playedToday ? 1 : 0, target: 1, done: playedToday });
  }

  return pool;
}

// Static metadata used as fallback when a slot's mission is excluded from pool
// (e.g. daily_early after 9h, or daily_beat_today when no prior record exists).
const DAILY_META: Record<string, { icon: string; label: string; target: number }> = {
  daily_login:      { icon: '📱', label: 'Abra o app hoje',                target: 1 },
  daily_play:       { icon: '⚡', label: 'Jogue 1 partida hoje',            target: 1 },
  daily_play_3:     { icon: '🎯', label: 'Jogue 3 partidas hoje',           target: 3 },
  daily_partida:    { icon: '🏎', label: 'Jogue o Modo Partida hoje',       target: 1 },
  daily_alvo:       { icon: '🎯', label: 'Jogue o Modo Alvo hoje',          target: 1 },
  daily_sequencia:  { icon: '🧠', label: 'Jogue o Modo Sequência hoje',     target: 1 },
  daily_radar:      { icon: '📡', label: 'Jogue o Modo Radar hoje',         target: 1 },
  daily_radar_2:    { icon: '📡', label: 'Jogue 2 sessões de Radar hoje',   target: 2 },
  daily_beat_today: { icon: '🏆', label: 'Bata seu recorde hoje',           target: 1 },
  daily_no_errors:  { icon: '🛡️', label: 'Jogue Sequência sem erros',       target: 1 },
  daily_early:      { icon: '🌅', label: 'Treine antes das 9h',             target: 1 },
  daily_streak:     { icon: '🔥', label: 'Mantenha sua sequência viva',     target: 1 },
};

// Fallback for hydration when a slot's mission is no longer emitted by buildDailyPool.
// Returns a done=true snapshot — used for conditionally-available missions whose
// absence from the pool means the condition is satisfied (guard === done condition).
// For time-gated missions like daily_early, the live pool will correctly include them.
function getCompletedDailyMission(id: string): DailyMission | null {
  const meta = DAILY_META[id];
  if (!meta) return null;
  return { id, ...meta, current: meta.target, done: true };
}

// Async, stateful: fixes 2 slot IDs per calendar day in AsyncStorage.
// Done missions stay in their slot with done=true; progress is always live.
export async function getDailyMissions(
  sessions: SessionRecord[],
  userProfile: UserProfile,
): Promise<DailyMission[]> {
  const dayStart = getDayStart();
  const stored   = await loadDailySlots();
  const hour     = new Date().getHours();

  let slotIds: string[];

  if (!stored || stored.dayStart !== dayStart) {
    // New day: pick 2 non-done missions.
    // Exclude daily_early from candidates if it's already past 9h.
    const pool = buildDailyPool(sessions, userProfile).filter(
      m => !m.done && !(m.id === 'daily_early' && hour >= 9),
    );
    // Randomise candidate order then take first 2
    const shuffled = pool.slice().sort(() => Math.random() - 0.5);
    slotIds = shuffled.slice(0, 2).map(m => m.id);
    await saveDailySlots({ dayStart, slotIds });
  } else {
    slotIds = stored.slotIds;
  }

  // Hydrate slot IDs with live progress
  const allMissions = buildDailyPool(sessions, userProfile);
  const missionMap  = new Map(allMissions.map(m => [m.id, m]));

  const result: DailyMission[] = [];
  for (const id of slotIds) {
    const live = missionMap.get(id);
    if (live) {
      result.push(live);
    } else {
      const fallback = getCompletedDailyMission(id);
      if (fallback) result.push(fallback);
    }
  }
  return result;
}
