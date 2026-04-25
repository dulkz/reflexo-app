import { SessionRecord } from './storage';

function toLocalMidnight(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function calculateStreak(sessions: SessionRecord[]): { current: number; playedToday: boolean } {
  if (sessions.length === 0) return { current: 0, playedToday: false };

  const DAY = 86_400_000;
  const todayMs = toLocalMidnight(Date.now());

  const uniqueDays = [...new Set(sessions.map(s => toLocalMidnight(s.date)))].sort((a, b) => b - a);

  const playedToday = uniqueDays[0] === todayMs;
  // Streak stays alive if most recent day is today or yesterday
  const startDay = playedToday ? todayMs : todayMs - DAY;

  if (uniqueDays[0] < startDay) return { current: 0, playedToday: false };

  let count = 0;
  let expected = startDay;

  for (const day of uniqueDays) {
    if (day === expected) {
      count++;
      expected -= DAY;
    } else if (day < expected) {
      break;
    }
  }

  return { current: count, playedToday };
}

export function streakColor(days: number): string {
  if (days >= 30) return '#8b5cf6';
  if (days >= 14) return '#ef4444';
  if (days >= 7)  return '#f59e0b';
  if (days >= 3)  return '#3b82f6';
  return '#4a5a7b';
}
