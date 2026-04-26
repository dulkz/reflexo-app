export interface LevelInfo {
  label: string;
  desc: string;
  color: string;
  bg: string;
}

export const LEVELS: Array<LevelInfo & { maxMs: number }> = [
  { maxMs: 50,       label: 'IMPOSSÍVEL',    color: '#ff0080', bg: 'rgba(255,0,128,0.15)',   desc: 'Abaixo de qualquer limite fisiológico humano' },
  { maxMs: 100,      label: 'SUPER-HUMANO',  color: '#00f5ff', bg: 'rgba(0,245,255,0.15)',   desc: 'Abaixo do limite de reação visual humana' },
  { maxMs: 150,      label: 'ELITE EXTREMO', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)',  desc: 'Velocistas olímpicos em partida auditiva' },
  { maxMs: 200,      label: 'ELITE',          color: '#10b981', bg: 'rgba(16,185,129,0.15)',  desc: 'Pilotos de F1 de ponta · Top 5% da população' },
  { maxMs: 250,      label: 'MUITO BOM',      color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', desc: 'Atletas profissionais · Tenistas ATP' },
  { maxMs: 300,      label: 'BOM',            color: '#06b6d4', bg: 'rgba(6,182,212,0.15)',  desc: 'Adulto jovem saudável não treinado' },
  { maxMs: 400,      label: 'ABAIXO DA MÉDIA',color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', desc: 'Comum sob fadiga ou sem prática específica' },
  { maxMs: Infinity, label: 'DEVAGAR',        color: '#ef4444', bg: 'rgba(239,68,68,0.15)',  desc: 'Indica fadiga, distração ou pouca familiaridade' },
];

export function getLevelInfo(ms: number): LevelInfo {
  return LEVELS.find(l => ms < l.maxMs) ?? LEVELS[LEVELS.length - 1];
}

export function getF1Message(ms: number): string {
  if (ms < 150) return 'Incrível — você está ACIMA do nível de piloto de F1!';
  if (ms < 200) return 'Você está no nível dos melhores pilotos de F1!';
  if (ms < 250) return 'Você está dentro da faixa de pilotos de F1 (150–250 ms).';
  return `Você está ${Math.round(ms - 200)} ms do nível de piloto de F1 (150–250 ms).`;
}

export function computeScore(times: number[]): {
  score: number;
  bestTime: number;
  worst2Indices: Set<number>;
} {
  const indexed = times.map((t, i) => ({ t, i })).sort((a, b) => a.t - b.t);
  const worst2Indices = new Set(indexed.slice(5).map(x => x.i));
  const score = Math.round(indexed.slice(0, 5).reduce((s, x) => s + x.t, 0) / 5);
  return { score, bestTime: indexed[0].t, worst2Indices };
}

// Mode accent colors
export const MODE_COLORS = {
  partida:  { accent: '#3b82f6', bg: 'rgba(59,130,246,0.12)'  },
  alvo:     { accent: '#06b6d4', bg: 'rgba(6,182,212,0.12)'   },
  sequencia:{ accent: '#8b5cf6', bg: 'rgba(139,92,246,0.12)'  },
} as const;

export type ModeKey = keyof typeof MODE_COLORS;
