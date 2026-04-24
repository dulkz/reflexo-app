import { AMBITIONS, Ambition, Milestone } from '../config/ambitions';
import { SessionRecord } from './storage';

// ── Private helpers for qualitative milestone evaluation ─────────────────────

function getWeekStart(): number {
  const now = new Date();
  const day = now.getDay();
  const daysFromMon = day === 0 ? 6 : day - 1;
  const mon = new Date(now);
  mon.setHours(0, 0, 0, 0);
  mon.setDate(mon.getDate() - daysFromMon);
  return mon.getTime();
}

function getWeekKey(ts: number): string {
  const d = new Date(ts);
  const day = d.getDay();
  const daysFromMon = day === 0 ? 6 : day - 1;
  const mon = new Date(d);
  mon.setHours(0, 0, 0, 0);
  mon.setDate(mon.getDate() - daysFromMon);
  return String(mon.getTime());
}

function computeStreakDays(sessions: SessionRecord[]): number {
  if (sessions.length === 0) return 0;
  const DAY = 86_400_000;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let streak = 0;
  for (let i = 0; i < sessions.length; i++) {
    const d = new Date(sessions[i].date); d.setHours(0, 0, 0, 0);
    const diff = Math.round((today.getTime() - d.getTime()) / DAY);
    if (diff === streak) streak++;
    else if (diff > streak) break;
  }
  return streak;
}

function isQualitativeMilestoneBeaten(label: string, sessions: SessionRecord[]): boolean {
  if (label.includes('Primeira semana')) {
    return sessions.filter(s => s.date >= getWeekStart()).length >= 3;
  }
  if (label.includes('Rotina estabelecida')) {
    return computeStreakDays(sessions) >= 14;
  }
  if (label.includes('Hábito consolidado')) {
    return computeStreakDays(sessions) >= 30;
  }
  if (label.includes('Fadiga')) {
    const good = sessions.filter(
      s => s.mode === 'sequencia' && s.fatigueIndex !== undefined && s.fatigueIndex < 5,
    );
    return new Set(good.map(s => getWeekKey(s.date))).size >= 3;
  }
  if (label.includes('Consistência mestre')) {
    const months = sessions.map(s => {
      const d = new Date(s.date);
      return `${d.getFullYear()}-${d.getMonth()}`;
    });
    return new Set(months).size >= 3;
  }
  return false;
}

export function getAmbition(ambitionId: string): Ambition | undefined {
  return AMBITIONS.find(a => a.id === ambitionId);
}

export type MilestoneStatus = 'batido_no_baseline' | 'batido_no_progresso' | 'pendente';

export interface MilestoneState {
  milestone: Milestone;
  status: MilestoneStatus;
}

// A milestone is beaten when the user's RT is at or below its ms threshold (lower = faster = better).
// For qualitative milestones, sessions must be provided to evaluate them; omitting sessions
// leaves qualitative milestones as 'pendente' (safe for triage/preview contexts).
export function getMilestonesState(
  baselineMs: number | null,
  currentBestMs: number | null,
  ambitionId: string,
  sessions?: SessionRecord[],
): MilestoneState[] {
  const ambition = getAmbition(ambitionId);
  if (!ambition) return [];

  const effectiveBest = currentBestMs ?? baselineMs;

  return ambition.milestones.map((m): MilestoneState => {
    if (m.type === 'qualitative' || m.ms === undefined) {
      const beaten = sessions ? isQualitativeMilestoneBeaten(m.label, sessions) : false;
      return { milestone: m, status: beaten ? 'batido_no_progresso' : 'pendente' };
    }
    const beatenNow = effectiveBest !== null && effectiveBest <= m.ms;
    if (!beatenNow) return { milestone: m, status: 'pendente' };
    const beatenAtBaseline = baselineMs !== null && baselineMs <= m.ms;
    return {
      milestone: m,
      status: beatenAtBaseline ? 'batido_no_baseline' : 'batido_no_progresso',
    };
  });
}

// Returns the first milestone not yet beaten (pending).
export function getNextMilestone(
  baselineMs: number | null,
  currentBestMs: number | null,
  ambitionId: string,
  sessions?: SessionRecord[],
): Milestone | null {
  const states = getMilestonesState(baselineMs, currentBestMs, ambitionId, sessions);
  const next = states.find(s => s.status === 'pendente');
  return next ? next.milestone : null;
}

// Returns how many ms the user needs to improve to reach the next milestone.
// Positive = improvement needed. Null = no numeric next milestone or no sessions yet.
export function calculateDeltaToNextMilestone(
  currentBestMs: number | null,
  ambitionId: string,
  baselineMs: number | null,
  sessions?: SessionRecord[],
): number | null {
  if (currentBestMs === null) return null;
  const next = getNextMilestone(baselineMs, currentBestMs, ambitionId, sessions);
  if (!next || next.type === 'qualitative' || next.ms === undefined) return null;
  return Math.round(currentBestMs - next.ms);
}

// Maps elite_sport ambitionId → benchmark card name as it appears in Ciencia.tsx.
const BENCHMARK_MAP: Record<string, string> = {
  f1:       'Piloto de F1 de ponta',
  boxer:    'Boxeador olímpico',
  tennis:   'Tenista ATP',
  sprinter: 'Velocista olímpico',
};

export function getMetaBenchmark(ambitionId: string): string | null {
  return BENCHMARK_MAP[ambitionId] ?? null;
}
