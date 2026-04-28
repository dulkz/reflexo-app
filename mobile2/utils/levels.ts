export interface LevelInfo {
  label: string;
  desc: string;
  color: string;
  bg: string;
}

export const LEVELS: Array<LevelInfo & { maxMs: number }> = [
  { maxMs: 50,       label: 'IMPOSSÍVEL',     color: '#ff0080', bg: 'rgba(255,0,128,0.15)',   desc: 'Abaixo de qualquer limite fisiológico humano' },
  { maxMs: 100,      label: 'SUPER-HUMANO',   color: '#00f5ff', bg: 'rgba(0,245,255,0.15)',   desc: 'Abaixo do limite de reação visual humana' },
  { maxMs: 150,      label: 'ELITE EXTREMO',  color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)',  desc: 'Velocistas olímpicos em partida auditiva' },
  { maxMs: 200,      label: 'ELITE',          color: '#10b981', bg: 'rgba(16,185,129,0.15)',  desc: 'Pilotos de F1 de ponta · Top 5% da população' },
  { maxMs: 250,      label: 'MUITO BOM',      color: '#3b82f6', bg: 'rgba(59,130,246,0.15)',  desc: 'Atletas profissionais · Tenistas ATP' },
  { maxMs: 300,      label: 'BOM',            color: '#06b6d4', bg: 'rgba(6,182,212,0.15)',   desc: 'Adulto jovem saudável não treinado' },
  { maxMs: 350,      label: 'NA MÉDIA',       color: '#facc15', bg: 'rgba(250,204,21,0.15)',  desc: 'Linha de base populacional adulta' },
  { maxMs: 400,      label: 'ABAIXO DA MÉDIA',color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  desc: 'Comum sob fadiga ou sem prática específica' },
  { maxMs: 500,      label: 'DEVAGAR',        color: '#ef4444', bg: 'rgba(239,68,68,0.15)',   desc: 'Indica fadiga, distração ou pouca familiaridade' },
  { maxMs: Infinity, label: 'MUITO DEVAGAR',  color: '#b91c1c', bg: 'rgba(185,28,28,0.18)',   desc: 'Bem acima do esperado — checar contexto e atenção' },
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

// ── Per-mode level scales ──────────────────────────────────────────────────────

export const ALVO_LEVELS: Array<LevelInfo & { maxMs: number }> = [
  { maxMs: 380,      label: 'ELITE',          color: '#10b981', bg: 'rgba(16,185,129,0.15)',  desc: 'Atleta de esporte de raquete' },
  { maxMs: 450,      label: 'MUITO BOM',      color: '#3b82f6', bg: 'rgba(59,130,246,0.15)',  desc: 'Adulto jovem saudável (25–40 anos)' },
  { maxMs: 520,      label: 'BOM',            color: '#06b6d4', bg: 'rgba(6,182,212,0.15)',   desc: 'Adulto médio (40–55 anos)' },
  { maxMs: 600,      label: 'NA MÉDIA',       color: '#facc15', bg: 'rgba(250,204,21,0.15)',  desc: 'Linha de base populacional adulta' },
  { maxMs: 700,      label: 'ABAIXO DA MÉDIA',color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  desc: 'Sob fadiga ou distração' },
  { maxMs: 850,      label: 'DEVAGAR',        color: '#ef4444', bg: 'rgba(239,68,68,0.15)',   desc: 'Referência de linha de base baixa' },
  { maxMs: Infinity, label: 'MUITO DEVAGAR',  color: '#b91c1c', bg: 'rgba(185,28,28,0.18)',   desc: 'Idosos 65+ ou sob alta fadiga' },
];
export function getAlvoLevel(ms: number): LevelInfo {
  return ALVO_LEVELS.find(l => ms < l.maxMs) ?? ALVO_LEVELS[ALVO_LEVELS.length - 1];
}

export const SEQ_LEVELS: Array<LevelInfo & { maxMs: number }> = [
  { maxMs: 220,      label: 'ELITE',          color: '#10b981', bg: 'rgba(16,185,129,0.15)',  desc: 'Atleta cognitivo de alto nível' },
  { maxMs: 270,      label: 'MUITO BOM',      color: '#3b82f6', bg: 'rgba(59,130,246,0.15)',  desc: 'Adulto jovem treinado' },
  { maxMs: 320,      label: 'BOM',            color: '#06b6d4', bg: 'rgba(6,182,212,0.15)',   desc: 'Adulto saudável 30–50 anos' },
  { maxMs: 380,      label: 'NA MÉDIA',       color: '#facc15', bg: 'rgba(250,204,21,0.15)',  desc: 'Nível médio da população geral' },
  { maxMs: 450,      label: 'ABAIXO DA MÉDIA',color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  desc: 'Sob fadiga ou distração leve' },
  { maxMs: 550,      label: 'DEVAGAR',        color: '#ef4444', bg: 'rgba(239,68,68,0.15)',   desc: 'Sob alta carga cognitiva ou fadiga' },
  { maxMs: Infinity, label: 'MUITO DEVAGAR',  color: '#b91c1c', bg: 'rgba(185,28,28,0.18)',   desc: 'Bem acima do esperado — checar contexto' },
];
export function getSeqLevel(ms: number): LevelInfo {
  return SEQ_LEVELS.find(l => ms < l.maxMs) ?? SEQ_LEVELS[SEQ_LEVELS.length - 1];
}

export const RADAR_LEVELS: Array<LevelInfo & { maxMs: number }> = [
  { maxMs: 250,      label: 'ELITE',          color: '#10b981', bg: 'rgba(16,185,129,0.15)',  desc: 'Atleta de reação visual altamente treinado' },
  { maxMs: 300,      label: 'MUITO BOM',      color: '#3b82f6', bg: 'rgba(59,130,246,0.15)',  desc: 'Adulto jovem com boa coordenação visual' },
  { maxMs: 350,      label: 'BOM',            color: '#06b6d4', bg: 'rgba(6,182,212,0.15)',   desc: 'Adulto jovem saudável' },
  { maxMs: 400,      label: 'NA MÉDIA',       color: '#facc15', bg: 'rgba(250,204,21,0.15)',  desc: 'Linha de base populacional' },
  { maxMs: 500,      label: 'ABAIXO DA MÉDIA',color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  desc: 'Sob fadiga ou menor familiaridade' },
  { maxMs: 600,      label: 'DEVAGAR',        color: '#ef4444', bg: 'rgba(239,68,68,0.15)',   desc: 'Indica fadiga ou distração' },
  { maxMs: Infinity, label: 'MUITO DEVAGAR',  color: '#b91c1c', bg: 'rgba(185,28,28,0.18)',   desc: 'Bem acima do esperado' },
];
export function getRadarLevel(ms: number): LevelInfo {
  return RADAR_LEVELS.find(l => ms < l.maxMs) ?? RADAR_LEVELS[RADAR_LEVELS.length - 1];
}

/** Dispatches to the correct scale for the given mode. */
export function getLevelForMode(ms: number, mode: string): LevelInfo {
  if (mode === 'alvo')      return getAlvoLevel(ms);
  if (mode === 'sequencia') return getSeqLevel(ms);
  if (mode === 'radar')     return getRadarLevel(ms);
  return getLevelInfo(ms); // partida (default)
}

// Mode accent colors
export const MODE_COLORS = {
  partida:  { accent: '#3b82f6', bg: 'rgba(59,130,246,0.12)'  },
  alvo:     { accent: '#06b6d4', bg: 'rgba(6,182,212,0.12)'   },
  sequencia:{ accent: '#8b5cf6', bg: 'rgba(139,92,246,0.12)'  },
  radar:    { accent: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
} as const;

export type ModeKey = keyof typeof MODE_COLORS;
