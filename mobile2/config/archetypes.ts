import { SessionRecord } from '../utils/storage';
import { ModeKey } from '../utils/levels';

export interface UserStats {
  sessions: SessionRecord[];
  totalSessions: number;
  bestScoreByMode: Record<ModeKey, number | null>;
  bestAccByMode: Record<ModeKey, number | null>;
  avgFatigueSeq: number | null;
  seqSessionCount: number;
  alvoSessionCount: number;
  streak: number;
  archetypeId: string;
}

export interface EvidenceChip {
  label: string;
}

export interface TargetCriterion {
  id: string;
  label: string;
  dynamicSuffix?: (stats: UserStats) => string;
  done: (stats: UserStats) => boolean;
}

export interface ArchetypeDefinition {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  evidence: (stats: UserStats) => EvidenceChip[];
  nextId: string | null;
  targetCriteria: TargetCriterion[];
}

// ── Detection ────────────────────────────────────────────────────────────────

function detectArchetypeId(
  totalSessions: number,
  bestPartida: number | null,
  bestAlvoAcc: number | null,
  alvoSessions: number,
  seqSessions: number,
  avgFatigue: number | null,
): string {
  if (totalSessions < 3) return 'EXPLORADOR';

  const fastEnough = bestPartida !== null && bestPartida < 200;
  const preciseEnough = bestAlvoAcc !== null && bestAlvoAcc >= 0.95;
  const resistantEnough = seqSessions >= 5 && avgFatigue !== null && avgFatigue < 3;

  if (fastEnough && preciseEnough && resistantEnough) return 'PILOTO';
  if (fastEnough && bestAlvoAcc !== null && bestAlvoAcc >= 0.85) return 'VELOCISTA';
  if (bestAlvoAcc !== null && bestAlvoAcc >= 0.92 && alvoSessions >= 5) return 'ATIRADOR';
  if (seqSessions >= 5 && avgFatigue !== null && avgFatigue < 5) return 'RESISTENTE';
  return 'EM_EVOLUCAO';
}

export function buildUserStats(sessions: SessionRecord[], streak: number): UserStats {
  const bestScore: Record<ModeKey, number | null> = { partida: null, alvo: null, sequencia: null, radar: null };
  const bestAcc: Record<ModeKey, number | null> = { partida: null, alvo: null, sequencia: null, radar: null };
  let fatSum = 0;
  let fatCount = 0;
  let alvoSessions = 0;
  let seqSessions = 0;

  for (const s of sessions) {
    if (bestScore[s.mode] === null || s.score < bestScore[s.mode]!) bestScore[s.mode] = s.score;
    if (s.accuracy !== undefined) {
      if (bestAcc[s.mode] === null || s.accuracy > bestAcc[s.mode]!) bestAcc[s.mode] = s.accuracy;
    }
    if (s.mode === 'alvo') alvoSessions++;
    if (s.mode === 'sequencia') {
      seqSessions++;
      if (s.fatigueIndex !== undefined) { fatSum += s.fatigueIndex; fatCount++; }
    }
  }

  const avgFatigue = fatCount > 0 ? fatSum / fatCount : null;
  const archetypeId = detectArchetypeId(
    sessions.length,
    bestScore.partida,
    bestAcc.alvo,
    alvoSessions,
    seqSessions,
    avgFatigue,
  );

  return {
    sessions,
    totalSessions: sessions.length,
    bestScoreByMode: bestScore,
    bestAccByMode: bestAcc,
    avgFatigueSeq: avgFatigue,
    seqSessionCount: seqSessions,
    alvoSessionCount: alvoSessions,
    streak,
    archetypeId,
  };
}

// ── Archetype catalog ────────────────────────────────────────────────────────

export const ARCHETYPES: Record<string, ArchetypeDefinition> = {

  EXPLORADOR: {
    id: 'EXPLORADOR',
    name: 'EXPLORADOR',
    icon: '🔭',
    color: '#4a5a7b',
    description: 'Você está descobrindo como seu cérebro reage. Complete mais sessões para revelar seu perfil.',
    evidence: (s) => [
      { label: `${s.totalSessions} sessão${s.totalSessions !== 1 ? 'ões' : ''} registrada${s.totalSessions !== 1 ? 's' : ''}` },
      { label: 'Perfil em formação' },
    ],
    nextId: 'EM_EVOLUCAO',
    targetCriteria: [
      {
        id: 'sessions3',
        label: '3 sessões completas',
        dynamicSuffix: (s) => ` (${s.totalSessions}/3)`,
        done: (s) => s.totalSessions >= 3,
      },
      {
        id: 'tryPartida',
        label: 'Jogar Modo Partida',
        done: (s) => (s.bestScoreByMode.partida !== null),
      },
      {
        id: 'tryAlvo',
        label: 'Jogar Modo Alvo',
        done: (s) => (s.bestScoreByMode.alvo !== null),
      },
    ],
  },

  EM_EVOLUCAO: {
    id: 'EM_EVOLUCAO',
    name: 'EM EVOLUÇÃO',
    icon: '📈',
    color: '#f59e0b',
    description: 'Seu ritmo de treino está crescendo. Diversifique os modos para acelerar a evolução.',
    evidence: (s) => {
      const chips: EvidenceChip[] = [
        { label: `${s.totalSessions} sessões acumuladas` },
      ];
      if (s.bestScoreByMode.partida !== null) chips.push({ label: `Melhor Tempo Reflexo: ${s.bestScoreByMode.partida} ms` });
      return chips;
    },
    nextId: 'RESISTENTE',
    targetCriteria: [
      {
        id: 'seq5',
        label: '5 sessões de Sequência',
        dynamicSuffix: (s) => ` (${s.seqSessionCount}/5)`,
        done: (s) => s.seqSessionCount >= 5,
      },
      {
        id: 'fatigue8',
        label: 'Fadiga média < 8%',
        dynamicSuffix: (s) => s.avgFatigueSeq !== null ? ` (atual: ${s.avgFatigueSeq.toFixed(1)}%)` : '',
        done: (s) => s.avgFatigueSeq !== null && s.avgFatigueSeq < 8,
      },
      {
        id: 'partida280',
        label: 'Partida < 280 ms',
        dynamicSuffix: (s) => s.bestScoreByMode.partida !== null ? ` (sua: ${s.bestScoreByMode.partida} ms)` : '',
        done: (s) => s.bestScoreByMode.partida !== null && s.bestScoreByMode.partida < 280,
      },
    ],
  },

  RESISTENTE: {
    id: 'RESISTENTE',
    name: 'O RESISTENTE',
    icon: '🛡️',
    color: '#06b6d4',
    description: 'Mantém consistência sob fadiga — uma habilidade rara que separa atletas de amadores.',
    evidence: (s) => {
      const chips: EvidenceChip[] = [
        { label: `${s.seqSessionCount} sessões de Sequência` },
      ];
      if (s.avgFatigueSeq !== null) chips.push({ label: `Fadiga média ${s.avgFatigueSeq.toFixed(1)}%` });
      return chips;
    },
    nextId: 'ATIRADOR',
    targetCriteria: [
      {
        id: 'alvo5',
        label: '5 sessões de Alvo',
        dynamicSuffix: (s) => ` (${s.alvoSessionCount}/5)`,
        done: (s) => s.alvoSessionCount >= 5,
      },
      {
        id: 'alvoAcc92',
        label: 'Precisão no Alvo > 92%',
        dynamicSuffix: (s) => s.bestAccByMode.alvo !== null
          ? ` (sua: ${Math.round(s.bestAccByMode.alvo * 100)}%)`
          : '',
        done: (s) => s.bestAccByMode.alvo !== null && s.bestAccByMode.alvo >= 0.92,
      },
      {
        id: 'partida250',
        label: 'Partida < 250 ms',
        dynamicSuffix: (s) => s.bestScoreByMode.partida !== null ? ` (sua: ${s.bestScoreByMode.partida} ms)` : '',
        done: (s) => s.bestScoreByMode.partida !== null && s.bestScoreByMode.partida < 250,
      },
    ],
  },

  ATIRADOR: {
    id: 'ATIRADOR',
    name: 'O ATIRADOR',
    icon: '🎯',
    color: '#3b82f6',
    description: 'Precisão cirúrgica no Alvo. Agora foca na velocidade pura do Partida para chegar ao Elite.',
    evidence: (s) => {
      const chips: EvidenceChip[] = [];
      if (s.bestAccByMode.alvo !== null) chips.push({ label: `Precisão ${Math.round(s.bestAccByMode.alvo * 100)}% no Alvo` });
      chips.push({ label: `${s.alvoSessionCount} sessões de Alvo` });
      return chips;
    },
    nextId: 'VELOCISTA',
    targetCriteria: [
      {
        id: 'partida220',
        label: 'Partida < 220 ms',
        dynamicSuffix: (s) => s.bestScoreByMode.partida !== null ? ` (delta: ${s.bestScoreByMode.partida - 220} ms)` : '',
        done: (s) => s.bestScoreByMode.partida !== null && s.bestScoreByMode.partida < 220,
      },
      {
        id: 'alvoAcc92keep',
        label: 'Manter precisão > 90%',
        dynamicSuffix: (s) => s.bestAccByMode.alvo !== null
          ? ` (sua: ${Math.round(s.bestAccByMode.alvo * 100)}%)`
          : '',
        done: (s) => s.bestAccByMode.alvo !== null && s.bestAccByMode.alvo >= 0.90,
      },
    ],
  },

  VELOCISTA: {
    id: 'VELOCISTA',
    name: 'O VELOCISTA',
    icon: '⚡',
    color: '#8b5cf6',
    description: 'Velocidade de elite com boa precisão. O nível Piloto de F1 está ao alcance.',
    evidence: (s) => {
      const chips: EvidenceChip[] = [];
      if (s.bestScoreByMode.partida !== null) chips.push({ label: `${s.bestScoreByMode.partida} ms no Partida` });
      if (s.bestAccByMode.alvo !== null) chips.push({ label: `${Math.round(s.bestAccByMode.alvo * 100)}% precisão` });
      return chips;
    },
    nextId: 'PILOTO',
    targetCriteria: [
      {
        id: 'partida200',
        label: 'Partida < 200 ms',
        dynamicSuffix: (s) => s.bestScoreByMode.partida !== null ? ` (delta: +${s.bestScoreByMode.partida - 200} ms)` : '',
        done: (s) => s.bestScoreByMode.partida !== null && s.bestScoreByMode.partida < 200,
      },
      {
        id: 'alvoAcc95',
        label: 'Precisão no Alvo > 95%',
        dynamicSuffix: (s) => s.bestAccByMode.alvo !== null
          ? ` (sua: ${Math.round(s.bestAccByMode.alvo * 100)}%)`
          : '',
        done: (s) => s.bestAccByMode.alvo !== null && s.bestAccByMode.alvo >= 0.95,
      },
      {
        id: 'fatigue3',
        label: 'Fadiga média < 3%',
        dynamicSuffix: (s) => s.avgFatigueSeq !== null ? ` (atual: ${s.avgFatigueSeq.toFixed(1)}%)` : '',
        done: (s) => s.avgFatigueSeq !== null && s.avgFatigueSeq < 3,
      },
    ],
  },

  PILOTO: {
    id: 'PILOTO',
    name: 'O PILOTO',
    icon: '🏎',
    color: '#10b981',
    description: 'Rápido, preciso e resistente à fadiga. Você atingiu o perfil do piloto de corrida de elite.',
    evidence: (s) => {
      const chips: EvidenceChip[] = [];
      if (s.bestScoreByMode.partida !== null) chips.push({ label: `${s.bestScoreByMode.partida} ms — nível F1` });
      if (s.bestAccByMode.alvo !== null) chips.push({ label: `${Math.round(s.bestAccByMode.alvo * 100)}% precisão no Alvo` });
      if (s.avgFatigueSeq !== null) chips.push({ label: `Fadiga ${s.avgFatigueSeq.toFixed(1)}% sob pressão` });
      return chips;
    },
    nextId: null,
    targetCriteria: [],
  },
};

export function getArchetypeFromStats(stats: UserStats): ArchetypeDefinition {
  return ARCHETYPES[stats.archetypeId] ?? ARCHETYPES['EXPLORADOR'];
}
