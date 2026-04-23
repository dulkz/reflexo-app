import { AMBITIONS, Ambition, Milestone } from '../config/ambitions';

export function getAmbition(ambitionId: string): Ambition | undefined {
  return AMBITIONS.find(a => a.id === ambitionId);
}

export type MilestoneStatus = 'batido_no_baseline' | 'batido_no_progresso' | 'pendente';

export interface MilestoneState {
  milestone: Milestone;
  status: MilestoneStatus;
}

// A milestone is beaten when the user's RT is at or below its ms threshold (lower = faster = better).
export function getMilestonesState(
  baselineMs: number | null,
  currentBestMs: number | null,
  ambitionId: string,
): MilestoneState[] {
  const ambition = getAmbition(ambitionId);
  if (!ambition) return [];

  const effectiveBest = currentBestMs ?? baselineMs;

  return ambition.milestones.map((m): MilestoneState => {
    if (m.type === 'qualitative' || m.ms === undefined) {
      return { milestone: m, status: 'pendente' };
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
): Milestone | null {
  const states = getMilestonesState(baselineMs, currentBestMs, ambitionId);
  const next = states.find(s => s.status === 'pendente');
  return next ? next.milestone : null;
}

// Returns how many ms the user needs to improve to reach the next milestone.
// Positive = improvement needed. Null = no numeric next milestone or no sessions yet.
export function calculateDeltaToNextMilestone(
  currentBestMs: number | null,
  ambitionId: string,
  baselineMs: number | null,
): number | null {
  if (currentBestMs === null) return null;
  const next = getNextMilestone(baselineMs, currentBestMs, ambitionId);
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
