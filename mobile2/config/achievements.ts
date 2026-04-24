import { UserStats } from './archetypes';

export interface Achievement {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlocked: (stats: UserStats) => boolean;
  progress: (stats: UserStats) => string;
}

const ARCHETYPE_NAMES: Record<string, string> = {
  EXPLORADOR: 'Explorador',
  EM_EVOLUCAO: 'Em Evolução',
  RESISTENTE: 'Resistente',
  ATIRADOR: 'Atirador',
  VELOCISTA: 'Velocista',
  PILOTO: 'Piloto',
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'sniper',
    name: 'Sniper',
    icon: '🎯',
    description: '100% de precisão numa sessão de Alvo',
    unlocked: (s) => s.sessions.some(r => r.mode === 'alvo' && r.accuracy === 1),
    progress: (s) => {
      const best = s.bestAccByMode.alvo;
      return best !== null
        ? `Melhor precisão no Alvo: ${Math.round(best * 100)}%`
        : 'Nenhuma sessão de Alvo ainda';
    },
  },
  {
    id: 'rotina',
    name: 'Rotina',
    icon: '🔥',
    description: '7 dias seguidos de treino',
    unlocked: (s) => s.streak >= 7,
    progress: (s) => `${s.streak} / 7 dias consecutivos`,
  },
  {
    id: 'sub250',
    name: 'Abaixo de 250',
    icon: '⚡',
    description: 'Score < 250 ms no Modo Partida',
    unlocked: (s) => s.bestScoreByMode.partida !== null && s.bestScoreByMode.partida < 250,
    progress: (s) => s.bestScoreByMode.partida !== null
      ? `Seu melhor: ${s.bestScoreByMode.partida} ms`
      : 'Nenhuma sessão de Partida ainda',
  },
  {
    id: 'f1level',
    name: 'Nível F1',
    icon: '🏎',
    description: 'Score < 200 ms no Modo Partida — zona dos pilotos de elite',
    unlocked: (s) => s.bestScoreByMode.partida !== null && s.bestScoreByMode.partida < 200,
    progress: (s) => s.bestScoreByMode.partida !== null
      ? `Seu melhor: ${s.bestScoreByMode.partida} ms`
      : 'Nenhuma sessão de Partida ainda',
  },
  {
    id: 'semfadiga',
    name: 'Sem Fadiga',
    icon: '🧠',
    description: 'Fadiga < 5% em 5 sessões de Sequência',
    unlocked: (s) => s.seqSessionCount >= 5 && s.avgFatigueSeq !== null && s.avgFatigueSeq < 5,
    progress: (s) => {
      const count = s.seqSessionCount;
      const avg = s.avgFatigueSeq;
      if (count === 0) return 'Nenhuma sessão de Sequência ainda';
      if (count < 5) return `${count} / 5 sessões de Sequência`;
      return avg !== null ? `Fadiga média: ${avg.toFixed(1)}%` : `${count} sessões de Sequência`;
    },
  },
  {
    id: 'piloto',
    name: 'O Piloto',
    icon: '🏁',
    description: 'Alcançar o arquétipo PILOTO',
    unlocked: (s) => s.archetypeId === 'PILOTO',
    progress: (s) => `Arquétipo atual: ${ARCHETYPE_NAMES[s.archetypeId] ?? s.archetypeId}`,
  },
  {
    id: 'veterano',
    name: 'Veterano',
    icon: '🎖',
    description: '50 sessões completadas',
    unlocked: (s) => s.totalSessions >= 50,
    progress: (s) => `${s.totalSessions} / 50 sessões`,
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
    progress: (s) => {
      const earlyCount = s.sessions.filter(r => new Date(r.date).getHours() < 8).length;
      return `${earlyCount} / 10 sessões antes das 8h`;
    },
  },
];

export function getUnlockedCount(stats: UserStats): number {
  return ACHIEVEMENTS.filter(a => a.unlocked(stats)).length;
}
