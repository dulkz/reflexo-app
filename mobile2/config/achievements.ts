import { UserStats } from './archetypes';

export type RarityKey = 'comum' | 'medio' | 'dificil' | 'raro' | 'epico' | 'lendario';

export const RARITY_CONFIG: Record<RarityKey, { cor: string; label: string }> = {
  comum:    { cor: '#6b7280', label: 'COMUM' },
  medio:    { cor: '#3b82f6', label: 'MÉDIO' },
  dificil:  { cor: '#8b5cf6', label: 'DIFÍCIL' },
  raro:     { cor: '#10b981', label: 'RARO' },
  epico:    { cor: '#ef4444', label: 'ÉPICO' },
  lendario: { cor: '#f59e0b', label: 'LENDÁRIO' },
};

export interface Achievement {
  id: string;
  name: string;
  icon: string;
  description: string;
  rarity: RarityKey;
  secret?: boolean;
  unlocked: (stats: UserStats) => boolean;
  progress: (stats: UserStats) => string;
}

const ARCHETYPE_NAMES: Record<string, string> = {
  EXPLORADOR:  'Explorador',
  EM_EVOLUCAO: 'Em Evolução',
  RESISTENTE:  'Resistente',
  ATIRADOR:    'Atirador',
  VELOCISTA:   'Velocista',
  PILOTO:      'Piloto',
};

export const ACHIEVEMENTS: Achievement[] = [

  // ── EXISTENTES ───────────────────────────────────────────────────────────────
  {
    id: 'sniper',
    name: 'Sniper',
    icon: '🎯',
    description: '100% de precisão numa sessão de Alvo',
    rarity: 'dificil',
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
    rarity: 'medio',
    unlocked: (s) => s.streak >= 7,
    progress: (s) => `${s.streak} / 7 dias consecutivos`,
  },
  {
    id: 'sub250',
    name: 'Abaixo de 250',
    icon: '⚡',
    description: 'Score < 250 ms no Modo Partida',
    rarity: 'medio',
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
    rarity: 'raro',
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
    rarity: 'dificil',
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
    rarity: 'epico',
    unlocked: (s) => s.archetypeId === 'PILOTO',
    progress: (s) => `Arquétipo atual: ${ARCHETYPE_NAMES[s.archetypeId] ?? s.archetypeId}`,
  },
  {
    id: 'veterano',
    name: 'Veterano',
    icon: '🎖',
    description: '50 sessões completadas',
    rarity: 'medio',
    unlocked: (s) => s.totalSessions >= 50,
    progress: (s) => `${s.totalSessions} / 50 sessões`,
  },
  {
    id: 'madrugador',
    name: 'Madrugador',
    icon: '⏰',
    description: '10 sessões antes das 8h',
    rarity: 'raro',
    unlocked: (s) => {
      const earlyCount = s.sessions.filter(r => new Date(r.date).getHours() < 8).length;
      return earlyCount >= 10;
    },
    progress: (s) => {
      const earlyCount = s.sessions.filter(r => new Date(r.date).getHours() < 8).length;
      return `${earlyCount} / 10 sessões antes das 8h`;
    },
  },

  // ── HUMORÍSTICAS ─────────────────────────────────────────────────────────────
  {
    id: 'o_apressado',
    name: 'O Apressado',
    icon: '🏃',
    description: 'Queimou a largada 3 vezes numa mesma sessão',
    rarity: 'comum',
    secret: true,
    unlocked: (s) => s.sessions.some(r => r.mode === 'partida' && (r.falseStartCount ?? 0) >= 3),
    progress: (s) => {
      const partidas = s.sessions.filter(r => r.mode === 'partida');
      if (partidas.length === 0) return 'Nenhuma sessão de Partida ainda';
      const best = Math.max(...partidas.map(r => r.falseStartCount ?? 0));
      return `Melhor: ${best} falsa${best !== 1 ? 's' : ''} largada${best !== 1 ? 's' : ''}`;
    },
  },
  {
    id: 'a_tartaruga',
    name: 'A Tartaruga',
    icon: '🐢',
    description: 'Score acima de 900 ms no Modo Partida',
    rarity: 'comum',
    secret: true,
    unlocked: (s) => s.sessions.some(r => r.mode === 'partida' && r.score >= 900),
    progress: (s) => {
      const partidas = s.sessions.filter(r => r.mode === 'partida');
      if (partidas.length === 0) return 'Nenhuma sessão de Partida ainda';
      const worst = Math.max(...partidas.map(r => r.score));
      return `Seu melhor (pior?): ${worst} ms`;
    },
  },
  {
    id: 'mae_dina',
    name: 'Mãe Diná',
    icon: '🔮',
    description: 'Queimou a largada 5 vezes ou mais numa sessão — você viu o futuro',
    rarity: 'comum',
    secret: true,
    unlocked: (s) => s.sessions.some(r => r.mode === 'partida' && (r.falseStartCount ?? 0) >= 5),
    progress: (s) => {
      const partidas = s.sessions.filter(r => r.mode === 'partida');
      if (partidas.length === 0) return 'Nenhuma sessão de Partida ainda';
      const best = Math.max(...partidas.map(r => r.falseStartCount ?? 0));
      return `Recorde de previsões: ${best}`;
    },
  },
  {
    id: 'o_dorminhoco',
    name: 'O Dorminhoco',
    icon: '😴',
    description: 'Deixou 3 rodadas expirarem no Modo Alvo numa mesma sessão',
    rarity: 'comum',
    secret: true,
    unlocked: (s) => s.sessions.some(r => r.mode === 'alvo' && (r.timeouts ?? 0) >= 3),
    progress: (s) => {
      const alvos = s.sessions.filter(r => r.mode === 'alvo');
      if (alvos.length === 0) return 'Nenhuma sessão de Alvo ainda';
      const best = Math.max(...alvos.map(r => r.timeouts ?? 0));
      return `Maior soneca: ${best} rodada${best !== 1 ? 's' : ''}`;
    },
  },

  // ── SECRETAS SÉRIAS ──────────────────────────────────────────────────────────
  {
    id: 'madrugada',
    name: 'Insônia Produtiva',
    icon: '🌙',
    description: 'Completou uma sessão entre 3h e 5h da manhã',
    rarity: 'raro',
    secret: true,
    unlocked: (s) => s.sessions.some(r => {
      const h = new Date(r.date).getHours();
      return h >= 3 && h < 5;
    }),
    progress: () => 'Nenhuma sessão nesse horário ainda',
  },
  {
    id: 'hat_trick',
    name: 'Hat-Trick',
    icon: '🎯',
    description: 'Bateu seu recorde pessoal 3 sessões consecutivas de Partida',
    rarity: 'epico',
    secret: true,
    unlocked: (s) => {
      const partidas = s.sessions
        .filter(r => r.mode === 'partida')
        .sort((a, b) => a.date - b.date);
      if (partidas.length < 3) return false;
      let streak = 1;
      for (let i = 1; i < partidas.length; i++) {
        if (partidas[i].score < partidas[i - 1].score) {
          streak++;
          if (streak >= 3) return true;
        } else {
          streak = 1;
        }
      }
      return false;
    },
    progress: (s) => {
      const partidas = s.sessions
        .filter(r => r.mode === 'partida')
        .sort((a, b) => a.date - b.date);
      if (partidas.length === 0) return 'Nenhuma sessão de Partida ainda';
      let streak = 1;
      for (let i = 1; i < partidas.length; i++) {
        if (partidas[i].score < partidas[i - 1].score) streak++;
        else streak = 1;
      }
      return `Sequência atual: ${streak} melhora${streak !== 1 ? 's' : ''} consecutiva${streak !== 1 ? 's' : ''}`;
    },
  },
  {
    id: 'maratona',
    name: 'Maratonista',
    icon: '💪',
    description: 'Completou 10 sessões no mesmo dia',
    rarity: 'raro',
    secret: true,
    unlocked: (s) => {
      const dayCounts: Record<string, number> = {};
      for (const r of s.sessions) {
        const day = new Date(r.date).toDateString();
        dayCounts[day] = (dayCounts[day] ?? 0) + 1;
      }
      return Object.values(dayCounts).some(c => c >= 10);
    },
    progress: (s) => {
      const dayCounts: Record<string, number> = {};
      for (const r of s.sessions) {
        const day = new Date(r.date).toDateString();
        dayCounts[day] = (dayCounts[day] ?? 0) + 1;
      }
      const best = s.sessions.length > 0 ? Math.max(...Object.values(dayCounts)) : 0;
      return `Recorde diário: ${best} sessã${best !== 1 ? 'ões' : 'o'}`;
    },
  },

  // ── NOVAS — COMUM ─────────────────────────────────────────────────────────────
  {
    id: 'primeira_sessao',
    name: 'Primeira Reação',
    icon: '🎯',
    description: 'Complete sua primeira sessão',
    rarity: 'comum',
    unlocked: (s) => s.totalSessions >= 1,
    progress: (s) => `${Math.min(s.totalSessions, 1)}/1 sessões`,
  },
  {
    id: 'tres_modos',
    name: 'Triatleta',
    icon: '🧪',
    description: 'Jogue os 3 modos ao menos uma vez',
    rarity: 'comum',
    unlocked: (s) =>
      s.bestScoreByMode.partida !== null &&
      s.bestScoreByMode.alvo !== null &&
      s.bestScoreByMode.sequencia !== null,
    progress: (s) => {
      const count = (['partida', 'alvo', 'sequencia'] as const)
        .filter(m => s.bestScoreByMode[m] !== null).length;
      return `${count}/3 modos`;
    },
  },
  {
    id: 'sub300',
    name: 'Abaixo de 300ms',
    icon: '⚡',
    description: 'Score < 300ms no Modo Partida',
    rarity: 'comum',
    unlocked: (s) => s.bestScoreByMode.partida !== null && s.bestScoreByMode.partida <= 300,
    progress: (s) => s.bestScoreByMode.partida !== null
      ? `Seu melhor: ${s.bestScoreByMode.partida} ms`
      : 'Sem sessão de Partida ainda',
  },
  {
    id: 'cinco_sessoes',
    name: 'Aquecendo',
    icon: '📅',
    description: '5 sessões completadas',
    rarity: 'comum',
    unlocked: (s) => s.totalSessions >= 5,
    progress: (s) => `${Math.min(s.totalSessions, 5)}/5 sessões`,
  },

  // ── NOVAS — MÉDIO ─────────────────────────────────────────────────────────────
  {
    id: 'dez_alvo',
    name: 'Atirador Frequente',
    icon: '🎯',
    description: '10 sessões no Modo Alvo',
    rarity: 'medio',
    unlocked: (s) => s.alvoSessionCount >= 10,
    progress: (s) => `${s.alvoSessionCount}/10 sessões no Alvo`,
  },
  {
    id: 'sub280',
    name: 'Abaixo de 280ms',
    icon: '💨',
    description: 'Score < 280ms no Modo Partida',
    rarity: 'medio',
    unlocked: (s) => s.bestScoreByMode.partida !== null && s.bestScoreByMode.partida <= 280,
    progress: (s) => s.bestScoreByMode.partida !== null
      ? `Seu melhor: ${s.bestScoreByMode.partida} ms`
      : 'Sem sessão de Partida ainda',
  },
  {
    id: 'streak5',
    name: 'Semana de Fogo',
    icon: '🔥',
    description: '5 dias seguidos de treino',
    rarity: 'medio',
    unlocked: (s) => s.streak >= 5,
    progress: (s) => `${s.streak}/5 dias`,
  },

  // ── NOVAS — DIFÍCIL ───────────────────────────────────────────────────────────
  {
    id: 'sub240',
    name: 'Abaixo de 240ms',
    icon: '⚡',
    description: 'Score < 240ms no Modo Partida',
    rarity: 'dificil',
    unlocked: (s) => s.bestScoreByMode.partida !== null && s.bestScoreByMode.partida <= 240,
    progress: (s) => s.bestScoreByMode.partida !== null
      ? `Seu melhor: ${s.bestScoreByMode.partida} ms`
      : 'Sem sessão de Partida ainda',
  },
  {
    id: 'precisao90',
    name: 'Olho de Águia',
    icon: '🎯',
    description: '90% de precisão em 3 sessões de Alvo',
    rarity: 'dificil',
    unlocked: (s) => {
      const accs = s.sessions
        .filter(r => r.mode === 'alvo' && r.accuracy !== undefined)
        .map(r => r.accuracy!)
        .sort((a, b) => b - a)
        .slice(0, 3);
      return accs.length >= 3 && (accs[0] + accs[1] + accs[2]) / 3 >= 0.9;
    },
    progress: (s) => {
      const accs = s.sessions
        .filter(r => r.mode === 'alvo' && r.accuracy !== undefined)
        .map(r => r.accuracy!);
      if (accs.length === 0) return 'Sem sessões de Alvo ainda';
      return `Melhor precisão: ${Math.round(Math.max(...accs) * 100)}%`;
    },
  },
  {
    id: 'seq10',
    name: 'Mestre da Sequência',
    icon: '🧠',
    description: '10 sessões no Modo Sequência',
    rarity: 'dificil',
    unlocked: (s) => s.seqSessionCount >= 10,
    progress: (s) => `${s.seqSessionCount}/10 sessões de Sequência`,
  },
  {
    id: 'streak14',
    name: '2 Semanas Seguidas',
    icon: '📆',
    description: '14 dias seguidos',
    rarity: 'dificil',
    unlocked: (s) => s.streak >= 14,
    progress: (s) => `${s.streak}/14 dias`,
  },

  // ── NOVAS — RARO ─────────────────────────────────────────────────────────────
  {
    id: 'sub210',
    name: 'Zona de Elite',
    icon: '🚀',
    description: 'Score < 210ms',
    rarity: 'raro',
    unlocked: (s) => s.bestScoreByMode.partida !== null && s.bestScoreByMode.partida <= 210,
    progress: (s) => s.bestScoreByMode.partida !== null
      ? `Seu melhor: ${s.bestScoreByMode.partida} ms`
      : 'Sem sessão de Partida ainda',
  },
  {
    id: 'cem_sessoes',
    name: 'Centenário',
    icon: '💯',
    description: '100 sessões completadas',
    rarity: 'raro',
    unlocked: (s) => s.totalSessions >= 100,
    progress: (s) => `${s.totalSessions}/100 sessões`,
  },
  {
    id: 'streak30',
    name: 'Mês Inteiro',
    icon: '🗓️',
    description: '30 dias seguidos',
    rarity: 'raro',
    unlocked: (s) => s.streak >= 30,
    progress: (s) => `${s.streak}/30 dias`,
  },
  {
    id: 'arquetipo_velocista',
    name: 'O Velocista',
    icon: '⚡',
    description: 'Alcançar o arquétipo VELOCISTA',
    rarity: 'raro',
    unlocked: (s) => s.archetypeId === 'VELOCISTA' || s.archetypeId === 'PILOTO',
    progress: (s) => `Arquétipo atual: ${ARCHETYPE_NAMES[s.archetypeId] ?? s.archetypeId}`,
  },

  // ── NOVAS — ÉPICO ─────────────────────────────────────────────────────────────
  {
    id: 'sub180',
    name: 'Reflexo Humano Limite',
    icon: '🏁',
    description: 'Score < 180ms',
    rarity: 'epico',
    unlocked: (s) => s.bestScoreByMode.partida !== null && s.bestScoreByMode.partida <= 180,
    progress: (s) => s.bestScoreByMode.partida !== null
      ? `Seu melhor: ${s.bestScoreByMode.partida} ms`
      : 'Sem sessão de Partida ainda',
  },
  {
    id: 'sniper3x',
    name: 'Sniper em Série',
    icon: '🎯',
    description: '100% precisão no Alvo em 3 sessões',
    rarity: 'epico',
    unlocked: (s) =>
      s.sessions.filter(r => r.mode === 'alvo' && r.accuracy === 1).length >= 3,
    progress: (s) => {
      const cnt = s.sessions.filter(r => r.mode === 'alvo' && r.accuracy === 1).length;
      return `${cnt}/3 sessões perfeitas`;
    },
  },
  {
    id: 'duzentas_sessoes',
    name: 'Dedicação Total',
    icon: '🏆',
    description: '200 sessões completadas',
    rarity: 'epico',
    unlocked: (s) => s.totalSessions >= 200,
    progress: (s) => `${s.totalSessions}/200 sessões`,
  },
  {
    id: 'streak60',
    name: '2 Meses Seguidos',
    icon: '🔥',
    description: '60 dias seguidos',
    rarity: 'epico',
    unlocked: (s) => s.streak >= 60,
    progress: (s) => `${s.streak}/60 dias`,
  },

  // ── NOVAS — LENDÁRIO ──────────────────────────────────────────────────────────
  {
    id: 'sub160',
    name: 'Além do Humano',
    icon: '👁️',
    description: 'Score < 160ms',
    rarity: 'lendario',
    unlocked: (s) => s.bestScoreByMode.partida !== null && s.bestScoreByMode.partida <= 160,
    progress: (s) => s.bestScoreByMode.partida !== null
      ? `Seu melhor: ${s.bestScoreByMode.partida} ms`
      : 'Sem sessão de Partida ainda',
  },
  {
    id: 'quinhentas_sessoes',
    name: 'Lenda Viva',
    icon: '🌟',
    description: '500 sessões completadas',
    rarity: 'lendario',
    unlocked: (s) => s.totalSessions >= 500,
    progress: (s) => `${s.totalSessions}/500 sessões`,
  },
  {
    id: 'todos_arquetipos',
    name: 'A Jornada Completa',
    icon: '🏎️',
    description: 'Alcançar o arquétipo PILOTO',
    rarity: 'lendario',
    unlocked: (s) => s.archetypeId === 'PILOTO',
    progress: (s) => `Arquétipo atual: ${ARCHETYPE_NAMES[s.archetypeId] ?? s.archetypeId}`,
  },
  {
    id: 'streak100',
    name: '100 Dias',
    icon: '💎',
    description: '100 dias seguidos',
    rarity: 'lendario',
    unlocked: (s) => s.streak >= 100,
    progress: (s) => `${s.streak}/100 dias`,
  },
];

export function getUnlockedCount(stats: UserStats): number {
  return ACHIEVEMENTS.filter(a => a.unlocked(stats)).length;
}
