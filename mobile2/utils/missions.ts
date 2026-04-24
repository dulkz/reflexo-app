import { SessionRecord } from './storage';
import { UserProfile } from '../types/user';

export interface WeeklyMission {
  id: string;
  icon: string;
  label: string;
  current: number;
  target: number;
  done: boolean;
}

function getWeekStart(): number {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const daysFromMon = day === 0 ? 6 : day - 1;
  const mon = new Date(now);
  mon.setHours(0, 0, 0, 0);
  mon.setDate(mon.getDate() - daysFromMon);
  return mon.getTime();
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

export function computeWeeklyMissions(
  sessions: SessionRecord[],
  userProfile: UserProfile,
): WeeklyMission[] {
  const weekStart = getWeekStart();
  const todayStart = (() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime();
  })();

  const thisWeek = sessions.filter(s => s.date >= weekStart);
  const weekCount = thisWeek.length;

  let hasAlvo = false;
  let hasSeq = false;
  let bestPartidaBefore: number | null = null;

  for (const s of sessions) {
    if (s.mode === 'alvo') hasAlvo = true;
    if (s.mode === 'sequencia') hasSeq = true;
    if (s.mode === 'partida' && s.date < weekStart) {
      if (bestPartidaBefore === null || s.score < bestPartidaBefore) {
        bestPartidaBefore = s.score;
      }
    }
  }

  const streak = computeLocalStreak(sessions);
  const playedToday = sessions.some(s => s.date >= todayStart);
  const triageDone = userProfile.triageCompleted;

  const result: WeeklyMission[] = [];

  // 1. Always: 3 sessões esta semana
  result.push({
    id: 'week_sessions',
    icon: '📅',
    label: 'Jogue 3 sessões esta semana',
    current: Math.min(weekCount, 3),
    target: 3,
    done: weekCount >= 3,
  });

  // 2. Explore Alvo — only shown before triage or while mode is still unplayed
  if (!triageDone && !hasAlvo && result.length < 3) {
    const alvoThisWeek = thisWeek.filter(s => s.mode === 'alvo').length;
    result.push({
      id: 'try_alvo',
      icon: '🎯',
      label: 'Experimente o Modo Alvo',
      current: Math.min(alvoThisWeek, 1),
      target: 1,
      done: alvoThisWeek >= 1,
    });
  }

  // 3. Explore Sequência
  if (!triageDone && !hasSeq && result.length < 3) {
    const seqThisWeek = thisWeek.filter(s => s.mode === 'sequencia').length;
    result.push({
      id: 'try_sequencia',
      icon: '🧠',
      label: 'Experimente o Modo Sequência',
      current: Math.min(seqThisWeek, 1),
      target: 1,
      done: seqThisWeek >= 1,
    });
  }

  // 4. Improve Partida record (post-triage or all modes played)
  if ((triageDone || (hasAlvo && hasSeq)) && result.length < 3) {
    const partidaThisWeek = thisWeek.filter(s => s.mode === 'partida');
    const bestThisWeek = partidaThisWeek.length > 0
      ? Math.min(...partidaThisWeek.map(s => s.score))
      : null;
    const improved =
      bestThisWeek !== null &&
      (bestPartidaBefore === null || bestThisWeek < bestPartidaBefore);
    result.push({
      id: 'improve_partida',
      icon: '⚡',
      label: 'Melhore seu recorde no Modo Partida',
      current: improved ? 1 : 0,
      target: 1,
      done: improved,
    });
  }

  // 5. Streak today (if streak >= 3)
  if (streak >= 3 && result.length < 3) {
    result.push({
      id: 'streak_today',
      icon: '🔥',
      label: 'Mantenha a sequência — treine hoje',
      current: playedToday ? 1 : 0,
      target: 1,
      done: playedToday,
    });
  }

  return result.slice(0, 3);
}
