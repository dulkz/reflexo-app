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
    id: 'explorador',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="40" fill="#1e3a5f"/><circle cx="30" cy="42" r="9" stroke="#fff" stroke-width="2.5"/><circle cx="50" cy="42" r="9" stroke="#fff" stroke-width="2.5"/><path d="M30 33l4-4h12l4 4" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M39 42h2" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg>`,
    name: 'Explorador',
    unlockCondition: 'Disponível para todos',
    isUnlocked: () => true,
  },
  {
    id: 'iniciante',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="40" fill="#166534"/><path d="M40 54V36" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><path d="M40 38c-6 0-10-4-10-10 6 0 10 4 10 10z" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/><path d="M40 42c6 0 10-4 10-10-6 0-10 4-10 10z" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/><path d="M32 54h16" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg>`,
    name: 'Iniciante',
    unlockCondition: 'Disponível para todos',
    isUnlocked: () => true,
  },
  {
    id: 'resistente',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="40" fill="#7f1d1d"/><path d="M40 22l-12 4v14c0 8 6 14 12 16 6-2 12-8 12-16V26l-12-4z" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/><path d="M35 39l4 4 7-7" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    name: 'Resistente',
    unlockCondition: 'Arquétipo Resistente',
    isUnlocked: (stats) => ['RESISTENTE', 'ATIRADOR', 'VELOCISTA', 'PILOTO'].includes(stats.archetypeId),
  },
  {
    id: 'velocista',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="40" fill="#1e1b4b"/><path d="M44 22L28 44h10l-4 14 16-22H40l4-14z" stroke="#fff" stroke-width="2.5" stroke-linejoin="round" fill="none"/></svg>`,
    name: 'Velocista',
    unlockCondition: 'Arquétipo Velocista',
    isUnlocked: (stats) => ['VELOCISTA', 'PILOTO'].includes(stats.archetypeId),
  },
  {
    id: 'atirador',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="40" fill="#164e63"/><circle cx="40" cy="40" r="14" stroke="#fff" stroke-width="2.5"/><circle cx="40" cy="40" r="6" stroke="#fff" stroke-width="2.5"/><circle cx="40" cy="40" r="1.5" fill="#fff"/><path d="M40 20v6" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><path d="M40 54v6" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><path d="M20 40h6" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><path d="M54 40h6" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg>`,
    name: 'Atirador',
    unlockCondition: 'Arquétipo Atirador',
    isUnlocked: (stats) => ['ATIRADOR', 'VELOCISTA', 'PILOTO'].includes(stats.archetypeId),
  },
  {
    id: 'piloto',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="40" fill="#450a0a"/><path d="M26 40c0-8 6-14 14-14s14 6 14 14v10c0 2-2 4-4 4H30c-2 0-4-2-4-4V40z" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><rect x="30" y="36" width="20" height="6" rx="1" fill="#fff"/></svg>`,
    name: 'Piloto F1',
    unlockCondition: 'Arquétipo Piloto',
    isUnlocked: (stats) => stats.archetypeId === 'PILOTO',
  },
  {
    id: 'boxeador',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="40" fill="#431407"/><path d="M28 32c0-3 3-6 6-6h10c4 0 7 3 7 7v9c0 3-3 6-6 6h-2v6H30v-6c-1 0-2-1-2-2V32z" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><path d="M30 46h13" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>`,
    name: 'Boxeador',
    unlockCondition: 'Bater sub-250ms no Partida',
    isUnlocked: (stats) => (stats.bestScoreByMode.partida ?? 999) <= 250,
  },
  {
    id: 'tenista',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="40" fill="#14532d"/><ellipse cx="34" cy="34" rx="11" ry="13" stroke="#fff" stroke-width="2.5" transform="rotate(-30 34 34)"/><path d="M28 28l12 12" stroke="#fff" stroke-width="1.5" opacity="0.7"/><path d="M24 32l12 12" stroke="#fff" stroke-width="1.5" opacity="0.7"/><path d="M30 24l12 12" stroke="#fff" stroke-width="1.5" opacity="0.7"/><path d="M42 42l14 14" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg>`,
    name: 'Tenista',
    unlockCondition: 'Bater sub-300ms no Partida',
    isUnlocked: (stats) => (stats.bestScoreByMode.partida ?? 999) <= 300,
  },
  {
    id: 'mestre',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="40" fill="#713f12"/><path d="M22 52V32l8 8 10-14 10 14 8-8v20H22z" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/><path d="M22 56h36" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><circle cx="22" cy="30" r="2" fill="#fff"/><circle cx="40" cy="22" r="2" fill="#fff"/><circle cx="58" cy="30" r="2" fill="#fff"/></svg>`,
    name: 'Mestre',
    unlockCondition: '50 sessões no total',
    isUnlocked: (stats) => stats.totalSessions >= 50,
  },
  {
    id: 'ninja',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="40" fill="#1a1a2e"/><path d="M22 32c4-2 10-4 18-4s14 2 18 4l-4 6H26l-4-6z" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/><path d="M24 42h32l-4 8c-2 4-7 6-12 6s-10-2-12-6l-4-8z" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/><circle cx="32" cy="46" r="2" fill="#fff"/><circle cx="48" cy="46" r="2" fill="#fff"/></svg>`,
    name: 'Ninja',
    unlockCondition: 'Bater sub-200ms no Partida',
    isUnlocked: (stats) => (stats.bestScoreByMode.partida ?? 999) <= 200,
  },
  {
    id: 'cientista',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="40" fill="#1e1b4b"/><circle cx="40" cy="40" r="3" fill="#fff"/><ellipse cx="40" cy="40" rx="18" ry="7" stroke="#fff" stroke-width="2.5"/><ellipse cx="40" cy="40" rx="18" ry="7" stroke="#fff" stroke-width="2.5" transform="rotate(60 40 40)"/><ellipse cx="40" cy="40" rx="18" ry="7" stroke="#fff" stroke-width="2.5" transform="rotate(120 40 40)"/></svg>`,
    name: 'Cientista',
    unlockCondition: '100 sessões no total',
    isUnlocked: (stats) => stats.totalSessions >= 100,
  },
  {
    id: 'robo',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="40" fill="#0c1a2e"/><rect x="28" y="28" width="24" height="24" rx="3" stroke="#fff" stroke-width="2.5"/><rect x="34" y="34" width="12" height="12" rx="1" stroke="#fff" stroke-width="2"/><path d="M24 34h4M24 40h4M24 46h4M52 34h4M52 40h4M52 46h4M34 24v4M40 24v4M46 24v4M34 52v4M40 52v4M46 52v4" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg>`,
    name: 'Robô',
    unlockCondition: '10 sessões no Modo Alvo',
    isUnlocked: (stats) => stats.alvoSessionCount >= 10,
  },
  {
    id: 'cacador',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="40" fill="#1c1917"/><circle cx="40" cy="40" r="14" stroke="#fff" stroke-width="3"/><path d="M40 26v28" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><path d="M26 40h28" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><circle cx="40" cy="40" r="2" fill="#fff"/><path d="M22 40h-4" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M62 40h-4" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>`,
    name: 'Caçador',
    unlockCondition: 'Jogar todos os 4 modos',
    isUnlocked: (stats) => {
      const modes = new Set(stats.sessions.map(s => s.mode));
      return ['partida', 'alvo', 'sequencia', 'radar'].every(m => modes.has(m as any));
    },
  },
  {
    id: 'fantasma',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="40" fill="#2d1b69"/><path d="M26 56V36c0-7.7 6.3-14 14-14s14 6.3 14 14v20l-4-4-4 4-4-4-4 4-4-4-4 4-4-4z" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/><circle cx="34" cy="38" r="2" fill="#fff"/><circle cx="46" cy="38" r="2" fill="#fff"/><path d="M36 46c1 1.5 2.5 2.5 4 2.5s3-1 4-2.5" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>`,
    name: 'Fantasma',
    unlockCondition: 'Streak de 7 dias',
    isUnlocked: (stats) => stats.streak >= 7,
  },
  {
    id: 'chama',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="40" fill="#7c2d12"/><path d="M40 22c2 6 10 8 10 18 0 7-4.5 12-10 12s-10-5-10-12c0-4 2-6 4-8 0 4 2 6 4 6-2-6 0-12 2-16z" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/><path d="M40 44c2 0 4 2 4 4s-2 4-4 4-4-2-4-4 2-4 4-4z" stroke="#fff" stroke-width="2" stroke-linejoin="round"/></svg>`,
    name: 'Chama',
    unlockCondition: 'Streak de 30 dias',
    isUnlocked: (stats) => stats.streak >= 30,
  },
  {
    id: 'diamante',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="40" fill="#0c4a6e"/><path d="M24 34l8-10h16l8 10-16 24-16-24z" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/><path d="M24 34h32" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><path d="M32 24l8 10 8-10" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/><path d="M32 34l8 24" stroke="#fff" stroke-width="2" opacity="0.7"/><path d="M48 34l-8 24" stroke="#fff" stroke-width="2" opacity="0.7"/></svg>`,
    name: 'Diamante',
    unlockCondition: 'Desbloquear conquista Lendária',
    isUnlocked: (stats, achievements) =>
      achievements.filter(a => a.rarity === 'lendario').some(a => a.unlocked(stats)),
  },
];
