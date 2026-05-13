// NOTE: finalMetaMs values and intermediate milestone thresholds are placeholders.
// Validate all numbers against benchmarks_reflexo.docx before production release.

import { ACHIEVEMENT_ICONS, ARCHETYPE_ICONS, MISSION_ICONS } from '../assets/icons';

export type AmbitionGroup = 'elite_sport' | 'populational' | 'brain_health';

export type Milestone =
  | { ms: number; label: string; type?: never }
  | { type: 'qualitative'; label: string; ms?: never };

export interface Ambition {
  id: string;
  group: AmbitionGroup;
  icon: string;
  name: string;
  description: string;
  finalMetaMs: number | null;
  milestones: Milestone[];
}

export const AMBITIONS: Ambition[] = [
  // ── ELITE DO ESPORTE ───────────────────────────────────────────────────────
  {
    id: 'f1',
    group: 'elite_sport',
    icon: ARCHETYPE_ICONS.PILOTO,
    name: 'F1 de ponta',
    description: 'Atingir o tempo de reação dos melhores pilotos de Fórmula 1.',
    finalMetaMs: 200,
    milestones: [
      { ms: 350, label: 'Acima da média populacional' },
      { ms: 300, label: 'Nível adulto jovem saudável' },
      { ms: 260, label: 'Zona de atleta amador' },
      { ms: 230, label: 'Nível tenista ATP' },
      { ms: 200, label: 'F1 de ponta — meta final' },
    ],
  },
  {
    id: 'boxer',
    group: 'elite_sport',
    icon: MISSION_ICONS.boxing,
    name: 'Boxeador olímpico',
    description: 'Desenvolver a velocidade de reação de um boxeador de alto rendimento.',
    finalMetaMs: 250, // Seleção Brasileira: 240–260 ms (Loturco et al., 2015)
    milestones: [
      { ms: 380, label: 'Acima da média populacional' },
      { ms: 320, label: 'Adulto jovem saudável' },
      { ms: 290, label: 'Acima da média de esportistas' },
      { ms: 270, label: 'Zona de ringue amador' },
      { ms: 250, label: 'Boxeador olímpico — meta final' },
    ],
  },
  {
    id: 'tennis',
    group: 'elite_sport',
    icon: MISSION_ICONS.tennis,
    name: 'Tenista ATP',
    description: 'Atingir a velocidade de reação de um tenista profissional de alto nível.',
    finalMetaMs: 250,
    milestones: [
      { ms: 380, label: 'Acima da média populacional' },
      { ms: 330, label: 'Adulto jovem saudável' },
      { ms: 290, label: 'Nível clube competitivo' },
      { ms: 270, label: 'Acima da média ATP' },
      { ms: 250, label: 'Tenista ATP — meta final' },
    ],
  },
  {
    id: 'sprinter',
    group: 'elite_sport',
    icon: ARCHETYPE_ICONS.VELOCISTA,
    name: 'Velocista olímpico',
    description: 'Treinar a velocidade de reação de largada dos melhores velocistas do mundo.',
    finalMetaMs: 160, // referência auditiva — visual seria ~200 ms (PLoS ONE 2018: 120–160 ms ao tiro de partida)
    milestones: [
      { ms: 340, label: 'Acima da média populacional' },
      { ms: 280, label: 'Adulto jovem saudável' },
      { ms: 230, label: 'Atleta treinado' },
      { ms: 190, label: 'Elite internacional' },
      { ms: 160, label: 'Velocista olímpico — meta final' },
    ],
  },

  // ── POSIÇÃO POPULACIONAL ───────────────────────────────────────────────────
  {
    id: 'top50',
    group: 'populational',
    icon: MISSION_ICONS.percent_50,
    name: 'Top 50% de todas as idades',
    description: 'Superar a maioria das pessoas da sua faixa etária em velocidade de reação.',
    finalMetaMs: 280, // adulto jovem saudável: 250–300 ms (Wikipedia Mental Chronometry)
    milestones: [
      { ms: 400, label: 'Saindo da cauda lenta' },
      { ms: 350, label: 'Acima de sob fadiga/distração' },
      { ms: 320, label: 'Na média populacional' },
      { ms: 300, label: 'Quase lá' },
      { ms: 280, label: 'Top 50% — meta final' },
    ],
  },
  {
    id: 'top10',
    group: 'populational',
    icon: MISSION_ICONS.percent_10,
    name: 'Top 10% de todas as idades',
    description: 'Estar entre os 10% mais rápidos da população geral.',
    finalMetaMs: 240,
    milestones: [
      { ms: 380, label: 'Saindo da cauda lenta' },
      { ms: 320, label: 'Média populacional' },
      { ms: 280, label: 'Top 30%' },
      { ms: 260, label: 'Top 20%' },
      { ms: 240, label: 'Top 10% — meta final' },
    ],
  },
  {
    id: 'top1',
    group: 'populational',
    icon: MISSION_ICONS.percent_1,
    name: 'Top 1% de todas as idades',
    description: 'Atingir o nível de reação do 1% mais rápido da população.',
    finalMetaMs: 200,
    milestones: [
      { ms: 360, label: 'Saindo da cauda lenta' },
      { ms: 300, label: 'Média populacional' },
      { ms: 260, label: 'Top 20%' },
      { ms: 230, label: 'Top 5%' },
      { ms: 200, label: 'Top 1% — meta final' },
    ],
  },

  // ── SAÚDE CEREBRAL ─────────────────────────────────────────────────────────
  {
    id: 'brain',
    group: 'brain_health',
    icon: ACHIEVEMENT_ICONS.semfadiga,
    name: 'Manter o cérebro afiado',
    description: 'Usar o treino de reação como ferramenta de saúde cognitiva e longevidade mental.',
    finalMetaMs: null,
    milestones: [
      { type: 'qualitative', label: 'Primeira semana completa — 3 sessões' },
      { type: 'qualitative', label: 'Rotina estabelecida — 2 semanas consecutivas' },
      { type: 'qualitative', label: 'Hábito consolidado — 1 mês' },
      { type: 'qualitative', label: 'Fadiga <5% em Sequência por 3 semanas' },
      { type: 'qualitative', label: 'Consistência mestre — 3 meses ativos' },
    ],
  },
];

export const GROUP_LABELS: Record<AmbitionGroup, string> = {
  elite_sport: 'ELITE DO ESPORTE',
  populational: 'POSIÇÃO POPULACIONAL',
  brain_health: 'SAÚDE CEREBRAL',
};

export const GROUP_COLOR: Record<AmbitionGroup, string> = {
  elite_sport: '#3b82f6',
  populational: '#8b5cf6',
  brain_health: '#10b981',
};

export function getAmbitionById(id: string): Ambition | undefined {
  return AMBITIONS.find(a => a.id === id);
}
