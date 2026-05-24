export interface LevelInfo {
  labelKey: string;
  label: string;
  desc: string;
  color: string;
  bg: string;
}

export const LEVELS: Array<LevelInfo & { maxMs: number }> = [
  { maxMs: 50,       labelKey: 'impossible',   label: 'IMPOSSÍVEL',     color: '#ff0080', bg: 'rgba(255,0,128,0.15)',   desc: 'Abaixo de qualquer limite fisiológico humano' },
  { maxMs: 100,      labelKey: 'superhuman',   label: 'SUPER-HUMANO',   color: '#00f5ff', bg: 'rgba(0,245,255,0.15)',   desc: 'Abaixo do limite de reação visual humana' },
  { maxMs: 150,      labelKey: 'extremeElite', label: 'ELITE EXTREMO',  color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)',  desc: 'Velocistas olímpicos em partida auditiva' },
  { maxMs: 200,      labelKey: 'elite',        label: 'ELITE',          color: '#10b981', bg: 'rgba(16,185,129,0.15)',  desc: 'Pilotos de F1 de ponta · Top 5% da população' },
  { maxMs: 250,      labelKey: 'veryGood',     label: 'MUITO BOM',      color: '#3b82f6', bg: 'rgba(59,130,246,0.15)',  desc: 'Atletas profissionais · Tenistas ATP' },
  { maxMs: 300,      labelKey: 'good',         label: 'BOM',            color: '#06b6d4', bg: 'rgba(6,182,212,0.15)',   desc: 'Reflexo funcional, base para evoluir' },
  { maxMs: 350,      labelKey: 'average',      label: 'NA MÉDIA',       color: '#facc15', bg: 'rgba(250,204,21,0.15)',  desc: 'Linha de base populacional adulta' },
  { maxMs: 400,      labelKey: 'building',     label: 'CONSTRUINDO',    color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  desc: 'Todo treino começa aqui' },
  { maxMs: 500,      labelKey: 'warmingUp',    label: 'AQUECENDO',      color: '#ef4444', bg: 'rgba(239,68,68,0.15)',   desc: 'O ritmo vai aumentar' },
  { maxMs: Infinity, labelKey: 'starting',     label: 'INICIANDO',      color: '#b91c1c', bg: 'rgba(185,28,28,0.18)',   desc: 'Cada sessão já muda isso' },
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

// Choice RT com posições fixas (mais rápido que busca visual) — recalibrado p/ GRUPO 12.
export const ALVO_LEVELS: Array<LevelInfo & { maxMs: number }> = [
  { maxMs: 250,      labelKey: 'elite',     label: 'ELITE',       color: '#10b981', bg: 'rgba(16,185,129,0.15)',  desc: 'Decisão de elite com posições memorizadas' },
  { maxMs: 320,      labelKey: 'veryGood',  label: 'MUITO BOM',   color: '#3b82f6', bg: 'rgba(59,130,246,0.15)',  desc: 'Reflexo de decisão afiado' },
  { maxMs: 420,      labelKey: 'good',      label: 'BOM',         color: '#06b6d4', bg: 'rgba(6,182,212,0.15)',   desc: 'Tempo de decisão sólido' },
  { maxMs: 550,      labelKey: 'warmingUp', label: 'AQUECENDO',   color: '#ef4444', bg: 'rgba(239,68,68,0.15)',   desc: 'O ritmo vai aumentar' },
  { maxMs: Infinity, labelKey: 'starting',  label: 'INICIANDO',   color: '#b91c1c', bg: 'rgba(185,28,28,0.18)',   desc: 'Cada rodada já calibra a decisão' },
];
export function getAlvoLevel(ms: number): LevelInfo {
  return ALVO_LEVELS.find(l => ms < l.maxMs) ?? ALVO_LEVELS[ALVO_LEVELS.length - 1];
}

export const SEQ_LEVELS: Array<LevelInfo & { maxMs: number }> = [
  { maxMs: 220,      labelKey: 'elite',     label: 'ELITE',          color: '#10b981', bg: 'rgba(16,185,129,0.15)',  desc: 'Atleta cognitivo de alto nível' },
  { maxMs: 270,      labelKey: 'veryGood',  label: 'MUITO BOM',      color: '#3b82f6', bg: 'rgba(59,130,246,0.15)',  desc: 'Adulto jovem treinado' },
  { maxMs: 320,      labelKey: 'good',      label: 'BOM',            color: '#06b6d4', bg: 'rgba(6,182,212,0.15)',   desc: 'Controle inibitório natural' },
  { maxMs: 380,      labelKey: 'average',   label: 'NA MÉDIA',       color: '#facc15', bg: 'rgba(250,204,21,0.15)',  desc: 'Nível médio da população geral' },
  { maxMs: 450,      labelKey: 'building',  label: 'CONSTRUINDO',    color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  desc: 'O controle inibitório está se formando' },
  { maxMs: 550,      labelKey: 'warmingUp', label: 'AQUECENDO',      color: '#ef4444', bg: 'rgba(239,68,68,0.15)',   desc: 'O foco vai se afiar' },
  { maxMs: Infinity, labelKey: 'starting',  label: 'INICIANDO',      color: '#b91c1c', bg: 'rgba(185,28,28,0.18)',   desc: 'Cada sessão treina inibição' },
];
export function getSeqLevel(ms: number): LevelInfo {
  return SEQ_LEVELS.find(l => ms < l.maxMs) ?? SEQ_LEVELS[SEQ_LEVELS.length - 1];
}

export const RADAR_LEVELS: Array<LevelInfo & { maxMs: number }> = [
  { maxMs: 250,      labelKey: 'elite',     label: 'ELITE',          color: '#10b981', bg: 'rgba(16,185,129,0.15)',  desc: 'Atleta de reação visual altamente treinado' },
  { maxMs: 300,      labelKey: 'veryGood',  label: 'MUITO BOM',      color: '#3b82f6', bg: 'rgba(59,130,246,0.15)',  desc: 'Coordenação visual afiada' },
  { maxMs: 350,      labelKey: 'good',      label: 'BOM',            color: '#06b6d4', bg: 'rgba(6,182,212,0.15)',   desc: 'Localização visual consistente' },
  { maxMs: 400,      labelKey: 'average',   label: 'NA MÉDIA',       color: '#facc15', bg: 'rgba(250,204,21,0.15)',  desc: 'Linha de base populacional' },
  { maxMs: 500,      labelKey: 'building',  label: 'CONSTRUINDO',    color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  desc: 'O mapa visual está se formando' },
  { maxMs: 600,      labelKey: 'warmingUp', label: 'AQUECENDO',      color: '#ef4444', bg: 'rgba(239,68,68,0.15)',   desc: 'A acuidade espacial vai crescer' },
  { maxMs: Infinity, labelKey: 'starting',  label: 'INICIANDO',      color: '#b91c1c', bg: 'rgba(185,28,28,0.18)',   desc: 'Cada rodada calibra o sistema' },
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
