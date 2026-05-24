import { UserStats } from './archetypes';
import { ACHIEVEMENT_ICONS } from '../assets/icons';

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
  title: string;
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
    title: 'Sniper',
    icon: ACHIEVEMENT_ICONS.sniper,
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
    title: 'Rotina',
    icon: ACHIEVEMENT_ICONS.rotina,
    description: '7 dias seguidos de treino',
    rarity: 'medio',
    unlocked: (s) => s.streak >= 7,
    progress: (s) => `${s.streak} / 7 dias consecutivos`,
  },
  {
    id: 'sub250',
    name: 'Abaixo de 250',
    title: 'Reflexo Vivo',
    icon: ACHIEVEMENT_ICONS.sub250,
    description: 'Score < 250 ms no Modo Partida',
    rarity: 'dificil',
    unlocked: (s) => s.bestScoreByMode.partida !== null && s.bestScoreByMode.partida < 250,
    progress: (s) => s.bestScoreByMode.partida !== null
      ? `Seu melhor: ${s.bestScoreByMode.partida} ms`
      : 'Nenhuma sessão de Partida ainda',
  },
  {
    id: 'f1level',
    name: 'Nível F1',
    title: 'Nível F1',
    icon: ACHIEVEMENT_ICONS.f1level,
    description: 'Score < 200 ms no Modo Partida — zona dos pilotos de elite',
    rarity: 'epico',
    unlocked: (s) => s.bestScoreByMode.partida !== null && s.bestScoreByMode.partida < 200,
    progress: (s) => s.bestScoreByMode.partida !== null
      ? `Seu melhor: ${s.bestScoreByMode.partida} ms`
      : 'Nenhuma sessão de Partida ainda',
  },
  {
    id: 'semfadiga',
    name: 'Sem Fadiga',
    title: 'Sem Fadiga',
    icon: ACHIEVEMENT_ICONS.semfadiga,
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
    title: 'O Piloto',
    icon: ACHIEVEMENT_ICONS.piloto,
    description: 'Alcançar o arquétipo PILOTO',
    rarity: 'epico',
    unlocked: (s) => s.archetypeId === 'PILOTO',
    progress: (s) => `Arquétipo atual: ${ARCHETYPE_NAMES[s.archetypeId] ?? s.archetypeId}`,
  },
  {
    id: 'veterano',
    name: 'Veterano',
    title: 'Veterano',
    icon: ACHIEVEMENT_ICONS.veterano,
    description: '50 sessões completadas',
    rarity: 'medio',
    unlocked: (s) => s.totalSessions >= 50,
    progress: (s) => `${s.totalSessions} / 50 sessões`,
  },
  {
    id: 'madrugador',
    name: 'Madrugador',
    title: 'Madrugador',
    icon: ACHIEVEMENT_ICONS.madrugador,
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
    title: 'O Apressado',
    icon: ACHIEVEMENT_ICONS.o_apressado,
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
    title: 'A Tartaruga',
    icon: ACHIEVEMENT_ICONS.a_tartaruga,
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
    title: 'Mãe Diná',
    icon: ACHIEVEMENT_ICONS.mae_dina,
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
    title: 'O Dorminhoco',
    icon: ACHIEVEMENT_ICONS.o_dorminhoco,
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
    title: 'Insônia Produtiva',
    icon: ACHIEVEMENT_ICONS.madrugada,
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
    title: 'Hat-Trick',
    icon: ACHIEVEMENT_ICONS.hat_trick,
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
    title: 'Maratonista',
    icon: ACHIEVEMENT_ICONS.maratona,
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
    title: 'Novato',
    icon: ACHIEVEMENT_ICONS.primeira_sessao,
    description: 'Complete sua primeira sessão',
    rarity: 'comum',
    unlocked: (s) => s.totalSessions >= 1,
    progress: (s) => `${Math.min(s.totalSessions, 1)}/1 sessões`,
  },
  {
    id: 'tres_modos',
    name: 'Triatleta',
    title: 'Triatleta',
    icon: ACHIEVEMENT_ICONS.tres_modos,
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
    title: 'Calibrado',
    icon: ACHIEVEMENT_ICONS.sub300,
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
    title: 'Aquecendo',
    icon: ACHIEVEMENT_ICONS.cinco_sessoes,
    description: '5 sessões completadas',
    rarity: 'comum',
    unlocked: (s) => s.totalSessions >= 5,
    progress: (s) => `${Math.min(s.totalSessions, 5)}/5 sessões`,
  },

  // ── NOVAS — MÉDIO ─────────────────────────────────────────────────────────────
  {
    id: 'dez_alvo',
    name: 'Atirador Frequente',
    title: 'O Atirador',
    icon: ACHIEVEMENT_ICONS.dez_alvo,
    description: '10 sessões no Modo Alvo',
    rarity: 'medio',
    unlocked: (s) => s.alvoSessionCount >= 10,
    progress: (s) => `${s.alvoSessionCount}/10 sessões no Alvo`,
  },
  {
    id: 'sub280',
    name: 'Abaixo de 280ms',
    title: 'Faísca',
    icon: ACHIEVEMENT_ICONS.sub280,
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
    title: 'Semana de Fogo',
    icon: ACHIEVEMENT_ICONS.streak5,
    description: '5 dias seguidos de treino',
    rarity: 'medio',
    unlocked: (s) => s.streak >= 5,
    progress: (s) => `${s.streak}/5 dias`,
  },

  // ── NOVAS — DIFÍCIL ───────────────────────────────────────────────────────────
  {
    id: 'sub240',
    name: 'Abaixo de 240ms',
    title: 'Velocidade Pura',
    icon: ACHIEVEMENT_ICONS.sub240,
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
    title: 'Olho de Águia',
    icon: ACHIEVEMENT_ICONS.precisao90,
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
    title: 'Mestre da Sequência',
    icon: ACHIEVEMENT_ICONS.seq10,
    description: '10 sessões no Modo Sequência',
    rarity: 'dificil',
    unlocked: (s) => s.seqSessionCount >= 10,
    progress: (s) => `${s.seqSessionCount}/10 sessões de Sequência`,
  },
  {
    id: 'streak14',
    name: '2 Semanas Seguidas',
    title: 'Ritmista',
    icon: ACHIEVEMENT_ICONS.streak14,
    description: '14 dias seguidos',
    rarity: 'dificil',
    unlocked: (s) => s.streak >= 14,
    progress: (s) => `${s.streak}/14 dias`,
  },

  // ── NOVAS — RARO ─────────────────────────────────────────────────────────────
  {
    id: 'sub210',
    name: 'Zona de Elite',
    title: 'Zona de Elite',
    icon: ACHIEVEMENT_ICONS.sub210,
    description: 'Score < 210ms',
    rarity: 'epico',
    unlocked: (s) => s.bestScoreByMode.partida !== null && s.bestScoreByMode.partida <= 210,
    progress: (s) => s.bestScoreByMode.partida !== null
      ? `Seu melhor: ${s.bestScoreByMode.partida} ms`
      : 'Sem sessão de Partida ainda',
  },
  {
    id: 'cem_sessoes',
    name: 'Centenário',
    title: 'Centenário',
    icon: ACHIEVEMENT_ICONS.cem_sessoes,
    description: '100 sessões completadas',
    rarity: 'raro',
    unlocked: (s) => s.totalSessions >= 100,
    progress: (s) => `${s.totalSessions}/100 sessões`,
  },
  {
    id: 'streak30',
    name: 'Mês Inteiro',
    title: 'Obcecado',
    icon: ACHIEVEMENT_ICONS.streak30,
    description: '30 dias seguidos',
    rarity: 'raro',
    unlocked: (s) => s.streak >= 30,
    progress: (s) => `${s.streak}/30 dias`,
  },
  {
    id: 'arquetipo_velocista',
    name: 'O Velocista',
    title: 'O Velocista',
    icon: ACHIEVEMENT_ICONS.arquetipo_velocista,
    description: 'Alcançar o arquétipo VELOCISTA',
    rarity: 'raro',
    unlocked: (s) => s.archetypeId === 'VELOCISTA' || s.archetypeId === 'PILOTO',
    progress: (s) => `Arquétipo atual: ${ARCHETYPE_NAMES[s.archetypeId] ?? s.archetypeId}`,
  },

  // ── NOVAS — ÉPICO ─────────────────────────────────────────────────────────────
  {
    id: 'sub180',
    name: 'Reflexo Humano Limite',
    title: 'Na Fronteira',
    icon: ACHIEVEMENT_ICONS.sub180,
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
    title: 'Sniper em Série',
    icon: ACHIEVEMENT_ICONS.sniper3x,
    description: '100% precisão no Alvo em 3 sessões',
    rarity: 'raro',
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
    title: 'Dedicação Total',
    icon: ACHIEVEMENT_ICONS.duzentas_sessoes,
    description: '200 sessões completadas',
    rarity: 'epico',
    unlocked: (s) => s.totalSessions >= 200,
    progress: (s) => `${s.totalSessions}/200 sessões`,
  },
  {
    id: 'streak60',
    name: '2 Meses Seguidos',
    title: 'O Buda',
    icon: ACHIEVEMENT_ICONS.streak60,
    description: '60 dias seguidos',
    rarity: 'epico',
    unlocked: (s) => s.streak >= 60,
    progress: (s) => `${s.streak}/60 dias`,
  },

  // ── NOVAS — LENDÁRIO ──────────────────────────────────────────────────────────
  {
    id: 'sub160',
    name: 'Além do Humano',
    title: 'De Outra Espécie',
    icon: ACHIEVEMENT_ICONS.sub160,
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
    title: 'Lenda Viva',
    icon: ACHIEVEMENT_ICONS.quinhentas_sessoes,
    description: '500 sessões completadas',
    rarity: 'lendario',
    unlocked: (s) => s.totalSessions >= 500,
    progress: (s) => `${s.totalSessions}/500 sessões`,
  },
  // ── RADAR ────────────────────────────────────────────────────────────────────
  {
    id: 'iniciado_radar',
    name: 'Iniciado no Radar',
    title: 'Focado',
    icon: ACHIEVEMENT_ICONS.iniciado_radar,
    description: 'Complete 5 sessões de Radar',
    rarity: 'comum',
    unlocked: (s) => s.sessions.filter(r => r.mode === 'radar').length >= 5,
    progress: (s) => {
      const n = s.sessions.filter(r => r.mode === 'radar').length;
      return `${Math.min(n, 5)}/5 sessões de Radar`;
    },
  },
  {
    id: 'radar_afiado',
    name: 'Radar Afiado',
    title: 'Radar Afiado',
    icon: ACHIEVEMENT_ICONS.radar_afiado,
    description: 'Score abaixo de 300ms em qualquer sessão de Radar',
    rarity: 'dificil',
    unlocked: (s) => s.sessions.some(r => r.mode === 'radar' && r.score < 300),
    progress: (s) => {
      const best = s.bestScoreByMode.radar;
      return best !== null ? `Seu melhor: ${best} ms` : 'Sem sessão de Radar ainda';
    },
  },
  {
    id: 'mestre_radar',
    name: 'Mestre do Radar',
    title: 'Mestre do Radar',
    icon: ACHIEVEMENT_ICONS.mestre_radar,
    description: '100% de acurácia em 3 sessões consecutivas de Radar',
    rarity: 'epico',
    unlocked: (s) => {
      const radar = s.sessions
        .filter(r => r.mode === 'radar')
        .sort((a, b) => a.date - b.date);
      if (radar.length < 3) return false;
      let streak = 1;
      for (let i = 1; i < radar.length; i++) {
        if ((radar[i].accuracy ?? 0) === 1) {
          streak++;
          if (streak >= 3) return true;
        } else {
          streak = 1;
        }
      }
      return false;
    },
    progress: (s) => {
      const radar = s.sessions
        .filter(r => r.mode === 'radar')
        .sort((a, b) => a.date - b.date);
      if (radar.length === 0) return 'Sem sessão de Radar ainda';
      let streak = 1;
      for (let i = 1; i < radar.length; i++) {
        if ((radar[i].accuracy ?? 0) === 1) streak++;
        else streak = 1;
      }
      return `Sequência atual: ${streak} sessão${streak !== 1 ? 'ões' : ''} com 100%`;
    },
  },
  {
    id: 'sniper_radar',
    name: 'Sniper do Radar',
    title: 'Sniper GOD',
    icon: ACHIEVEMENT_ICONS.sniper_radar,
    description: 'Score abaixo de 250ms em qualquer sessão de Radar',
    rarity: 'lendario',
    unlocked: (s) => s.sessions.some(r => r.mode === 'radar' && r.score < 250),
    progress: (s) => {
      const best = s.bestScoreByMode.radar;
      return best !== null ? `Seu melhor: ${best} ms` : 'Sem sessão de Radar ainda';
    },
  },

  // ── QUADRIATLETA ─────────────────────────────────────────────────────────────
  {
    id: 'quadriatleta',
    name: 'Quadriatleta',
    title: 'Quadriatleta',
    icon: ACHIEVEMENT_ICONS.quadriatleta,
    description: 'Jogue os 4 modos ao menos uma vez',
    rarity: 'raro',
    unlocked: (s) =>
      s.bestScoreByMode.partida !== null &&
      s.bestScoreByMode.alvo !== null &&
      s.bestScoreByMode.sequencia !== null &&
      s.bestScoreByMode.radar !== null,
    progress: (s) => {
      const count = (['partida', 'alvo', 'sequencia', 'radar'] as const)
        .filter(m => s.bestScoreByMode[m] !== null).length;
      return `${count}/4 modos`;
    },
  },

  {
    id: 'the_goat',
    name: 'The GOAT',
    title: 'The GOAT',
    icon: ACHIEVEMENT_ICONS.the_goat,
    description: 'Complete todas as conquistas não-secretas do app.',
    rarity: 'lendario',
    unlocked: (s) => ACHIEVEMENTS.filter(a => !a.secret && a.id !== 'the_goat').every(a => a.unlocked(s)),
    progress: (s) => {
      const nonSecret = ACHIEVEMENTS.filter(a => !a.secret && a.id !== 'the_goat');
      const done = nonSecret.filter(a => a.unlocked(s)).length;
      return `${done}/${nonSecret.length} conquistas não-secretas`;
    },
  },
  {
    id: 'streak100',
    name: '100 Dias',
    title: 'Sr. Kaio',
    icon: ACHIEVEMENT_ICONS.streak100,
    description: '100 dias seguidos',
    rarity: 'lendario',
    unlocked: (s) => s.streak >= 100,
    progress: (s) => `${s.streak}/100 dias`,
  },

  // ── EASTER EGG ────────────────────────────────────────────────────────────────
  {
    id: 'the_flash',
    name: 'The Flash',
    title: 'The Flash',
    icon: ACHIEVEMENT_ICONS.the_flash,
    description: 'Você reagiu em menos de 80ms. Isso é fisicamente impossível. Parabéns por alcançar o impossível.',
    rarity: 'lendario',
    secret: true,
    unlocked: (s) => s.sessions.some(r => r.mode === 'partida' && r.score < 80),
    progress: (_s) => 'Como você fez isso?',
  },
];

export function getUnlockedCount(stats: UserStats): number {
  return ACHIEVEMENTS.filter(a => a.unlocked(stats)).length;
}
