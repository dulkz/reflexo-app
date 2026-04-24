import { UserStats } from './archetypes';
import { Achievement } from './achievements';

export interface AvatarDef {
  id: string;
  icon: string | null;
  name: string;
  unlockCondition: string;
  isUnlocked: (stats: UserStats, achievements: Achievement[]) => boolean;
}

export const AVATARS: AvatarDef[] = [
  {
    id: 'initial',
    icon: null,
    name: 'Inicial',
    unlockCondition: 'Padrão',
    isUnlocked: () => true,
  },
  {
    id: 'explorer',
    icon: '🔭',
    name: 'Explorador',
    unlockCondition: 'Arquétipo Explorador',
    isUnlocked: () => true,
  },
  {
    id: 'seedling',
    icon: '🌱',
    name: 'Em Evolução',
    unlockCondition: 'Alcançar arquétipo Em Evolução',
    isUnlocked: (stats) => ['EM_EVOLUCAO', 'RESISTENTE', 'ATIRADOR', 'VELOCISTA', 'PILOTO'].includes(stats.archetypeId),
  },
  {
    id: 'shield',
    icon: '🛡️',
    name: 'Resistente',
    unlockCondition: 'Alcançar arquétipo Resistente',
    isUnlocked: (stats) => ['RESISTENTE', 'ATIRADOR', 'VELOCISTA', 'PILOTO'].includes(stats.archetypeId),
  },
  {
    id: 'target',
    icon: '🎯',
    name: 'Atirador',
    unlockCondition: 'Alcançar arquétipo Atirador',
    isUnlocked: (stats) => ['ATIRADOR', 'VELOCISTA', 'PILOTO'].includes(stats.archetypeId),
  },
  {
    id: 'lightning',
    icon: '⚡',
    name: 'Velocista',
    unlockCondition: 'Alcançar arquétipo Velocista',
    isUnlocked: (stats) => ['VELOCISTA', 'PILOTO'].includes(stats.archetypeId),
  },
  {
    id: 'racer',
    icon: '🏎️',
    name: 'O Piloto',
    unlockCondition: 'Alcançar arquétipo Piloto',
    isUnlocked: (stats) => stats.archetypeId === 'PILOTO',
  },
  {
    id: 'diamond',
    icon: '💎',
    name: 'Lendário',
    unlockCondition: 'Desbloquear qualquer conquista Lendária',
    isUnlocked: (stats, achievements) =>
      achievements.filter(a => a.rarity === 'lendario').some(a => a.unlocked(stats)),
  },
  {
    id: 'fire',
    icon: '🔥',
    name: 'Em Chamas',
    unlockCondition: '30 dias seguidos de treino',
    isUnlocked: (stats) => stats.streak >= 30,
  },
  {
    id: 'eye',
    icon: '👁️',
    name: 'Reflexo Limite',
    unlockCondition: 'Bater sub-180ms',
    isUnlocked: (stats) => (stats.bestScoreByMode.partida ?? 999) <= 180,
  },
];
