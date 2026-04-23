import { UserStats } from './archetypes';

export interface Achievement {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlocked: (stats: UserStats) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'sniper',
    name: 'Sniper',
    icon: '🎯',
    description: '100% de precisão numa sessão de Alvo',
    unlocked: (s) => s.sessions.some(r => r.mode === 'alvo' && r.accuracy === 1),
  },
  {
    id: 'rotina',
    name: 'Rotina',
    icon: '🔥',
    description: '7 dias seguidos de treino',
    unlocked: (s) => s.streak >= 7,
  },
  {
    id: 'sub250',
    name: 'Abaixo de 250',
    icon: '⚡',
    description: 'Score < 250 ms no Modo Partida',
    unlocked: (s) => s.bestScoreByMode.partida !== null && s.bestScoreByMode.partida < 250,
  },
  {
    id: 'f1level',
    name: 'Nível F1',
    icon: '🏎',
    description: 'Score < 200 ms no Modo Partida — zona dos pilotos de elite',
    unlocked: (s) => s.bestScoreByMode.partida !== null && s.bestScoreByMode.partida < 200,
  },
  {
    id: 'semfadiga',
    name: 'Sem Fadiga',
    icon: '🧠',
    description: 'Fadiga < 5% em 5 sessões de Sequência',
    unlocked: (s) => s.seqSessionCount >= 5 && s.avgFatigueSeq !== null && s.avgFatigueSeq < 5,
  },
  {
    id: 'piloto',
    name: 'O Piloto',
    icon: '🏁',
    description: 'Alcançar o arquétipo PILOTO',
    unlocked: (s) => s.archetypeId === 'PILOTO',
  },
  {
    id: 'veterano',
    name: 'Veterano',
    icon: '🎖',
    description: '50 sessões completadas',
    unlocked: (s) => s.totalSessions >= 50,
  },
  {
    id: 'madrugador',
    name: 'Madrugador',
    icon: '🌅',
    description: '10 sessões antes das 8h',
    unlocked: (s) => {
      const earlyCount = s.sessions.filter(r => new Date(r.date).getHours() < 8).length;
      return earlyCount >= 10;
    },
  },
];

export function getUnlockedCount(stats: UserStats): number {
  return ACHIEVEMENTS.filter(a => a.unlocked(stats)).length;
}
