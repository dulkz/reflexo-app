import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Platform, StatusBar as RNStatusBar,
  StyleProp, TextStyle,
} from 'react-native';
import { UserProfile } from '../types/user';
import { SessionRecord } from '../utils/storage';
import { getMetaBenchmark } from '../utils/ambition';
import { GROUP_COLOR } from '../config/ambitions';

const TOP = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 44;

// ── Helpers ───────────────────────────────────────────────────────────────────

function RichText({ children, style }: { children: string; style?: StyleProp<TextStyle> }) {
  const parts = children.split(/\*\*(.*?)\*\*/g);
  return (
    <Text style={style}>
      {parts.map((part, i) =>
        i % 2 === 1
          ? <Text key={i} style={rich.bold}>{part}</Text>
          : <React.Fragment key={i}>{part}</React.Fragment>
      )}
    </Text>
  );
}
const rich = StyleSheet.create({
  bold: { fontWeight: '800', color: '#e2e8f0' },
});

function SectionHeader({ kicker, headline }: { kicker: string; headline?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.kicker}>{kicker}</Text>
      {headline ? <Text style={styles.headline}>{headline}</Text> : null}
    </View>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────

const MECHS = [
  {
    num: '01',
    title: 'Velocidade de Processamento',
    desc: 'O tempo entre o estímulo e a resposta motora reflete a velocidade de condução neural — treinável com prática repetida.',
    color: '#3b82f6',
    icon: '⚡',
  },
  {
    num: '02',
    title: 'Atenção Sustentada',
    desc: 'Manter o foco por períodos prolongados sem lapso. O Modo Sequência mede isso diretamente via índice de fadiga.',
    color: '#8b5cf6',
    icon: '🎯',
  },
  {
    num: '03',
    title: 'Controle Inibitório',
    desc: 'Suprimir respostas automáticas. O paradigma Go/NoGo é o padrão-ouro clínico — usado em diagnóstico de TDAH.',
    color: '#10b981',
    icon: '🧠',
  },
];

const BENCHMARKS = [
  {
    icon: '🏎',
    name: 'Piloto de F1 de ponta',
    source: 'Vienna Reaction Apparatus',
    range: '150–250 ms',
    level: 'ELITE',
    color: '#10b981',
  },
  {
    icon: '🥊',
    name: 'Boxeador olímpico',
    source: 'Loturco et al., 2015 · Seleção Brasileira',
    range: '160–220 ms',
    level: 'ELITE',
    color: '#10b981',
  },
  {
    icon: '🎾',
    name: 'Tenista ATP',
    source: 'Journal of Sports Sciences, 2019',
    range: '200–250 ms',
    level: 'MUITO BOM',
    color: '#3b82f6',
  },
  {
    icon: '⚡',
    name: 'Velocista olímpico',
    source: 'Lipps et al., 2011 · Sprint start research',
    range: '170–200 ms',
    level: 'ELITE',
    color: '#10b981',
  },
  {
    icon: '🧍',
    name: 'Adulto saudável (25–45)',
    source: 'Meta-análise · PMC, 2021',
    range: '200–300 ms',
    level: 'BOM',
    color: '#06b6d4',
  },
];

const CHOICE_BENCHMARKS = [
  {
    icon: '🎯',
    name: 'Atleta de esporte de raquete',
    source: 'Balakrishnan et al., 2014 · PMC',
    range: '380–420 ms',
    level: 'ELITE',
    color: '#10b981',
  },
  {
    icon: '💪',
    name: 'Adulto jovem saudável (25–40)',
    source: 'PMC, 2014 · Mental Chronometry',
    range: '420–500 ms',
    level: 'MUITO BOM',
    color: '#3b82f6',
  },
  {
    icon: '👤',
    name: 'Adulto médio (40–55)',
    source: 'Donders RT paradigm · Wikipedia',
    range: '480–560 ms',
    level: 'BOM',
    color: '#06b6d4',
  },
  {
    icon: '🔶',
    name: 'Sob fadiga ou distração',
    source: 'Mental Chronometry literature',
    range: '550–700 ms',
    level: 'ABAIXO',
    color: '#f59e0b',
  },
  {
    icon: '🧓',
    name: 'Idosos (65+)',
    source: 'Mental Chronometry, Wikipedia',
    range: '600–800 ms',
    level: 'DEVAGAR',
    color: '#ef4444',
  },
];

const SOURCES = [
  'Coe et al. (2026). Advanced Cognitive Training for Independent and Vital Elderly (ACTIVE). Alzheimer\'s & Dementia. NIH.',
  'NIH Toolbox (2024). Pattern Comparison Processing Speed Test.',
  'Loturco, I. et al. (2015). Reaction time and performance in combat sports. J Strength Cond Res.',
  'Buszard, T. et al. (2019). Working memory and attention in tennis. J Sports Sciences.',
  'Der, G. & Deary, I.J. (2006). Age and sex differences in reaction time in adulthood. Intelligence.',
  'Lipps, D.B. et al. (2011). Considerations for developing a sprint start. J Sports Sciences.',
  'Balakrishnan, R. (2014). Choice reaction time and cognitive performance in athletes. PMC.',
  'Donders, F.C. (1969). On the speed of mental processes. Acta Psychologica. (Mental Chronometry)',
];

// ── Choice RT level helpers (mirrors Resultado.tsx thresholds) ────────────────

function choiceLevelLabel(ms: number): string {
  if (ms <= 420) return 'ELITE';
  if (ms <= 500) return 'MUITO BOM';
  if (ms <= 560) return 'BOM';
  if (ms <= 700) return 'ABAIXO';
  return 'DEVAGAR';
}

function choiceLevelColor(ms: number): string {
  if (ms <= 420) return '#10b981';
  if (ms <= 500) return '#3b82f6';
  if (ms <= 560) return '#06b6d4';
  if (ms <= 700) return '#f59e0b';
  return '#ef4444';
}

// ── Screen ────────────────────────────────────────────────────────────────────

interface Props {
  userProfile: UserProfile;
  sessions: SessionRecord[];
}

export default function Ciencia({ userProfile, sessions }: Props) {
  const goalBenchmarkName = userProfile.triageCompleted && userProfile.ambitionId
    ? getMetaBenchmark(userProfile.ambitionId)
    : null;

  // Highlight color: use the elite_sport group color (these are always elite_sport ambitions)
  const goalHighlightColor = GROUP_COLOR['elite_sport'];

  // Alvo RT user data for "VOCÊ ESTÁ AQUI" badge
  const alvoSessions = sessions.filter(s => s.mode === 'alvo');
  const bestAlvoRt = alvoSessions.length > 0
    ? Math.min(...alvoSessions.map(s => s.score))
    : null;
  const lastAlvoRt = alvoSessions.length > 0 ? alvoSessions[0].score : null;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: TOP + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>CIÊNCIA</Text>

        {/* ══ SEÇÃO 1 — POR QUE TREINAR REAÇÃO ══ */}
        <SectionHeader kicker="POR QUE TREINAR REAÇÃO" />

        <View style={styles.heroStat}>
          <Text style={styles.heroNum}>25%</Text>
          <Text style={styles.heroClaim}>
            menos diagnósticos de demência em 20 anos, entre quem treinou velocidade de processamento.
          </Text>
          <View style={styles.heroSourceRow}>
            <Text style={styles.heroSourceText}>
              Estudo ACTIVE · 2.802 adultos · NIH · Coe et al., 2026
            </Text>
          </View>
        </View>

        {/* ══ SEÇÃO 2 — COMO FUNCIONA ══ */}
        <SectionHeader
          kicker="COMO FUNCIONA"
          headline="Treinar reação é treinar o cérebro."
        />

        <View style={styles.editorialBlock}>
          <RichText style={styles.editorialPara}>
            {'Quando você vê um sinal e responde em menos de **300 ms**, seu cérebro não está pensando — está **executando**. É um **reflexo cognitivo**: percepção visual, decisão e comando motor disparados em paralelo.'}
          </RichText>
          <RichText style={[styles.editorialPara, styles.editorialParaLast]}>
            {'Esse **circuito é treinável**. E o efeito colateral bonito é que o mesmo sistema que acelera seu jogo mantém seu cérebro **ágil por décadas**.'}
          </RichText>
        </View>

        {/* ══ SEÇÃO 3 — 3 MECANISMOS NEURAIS ══ */}
        <SectionHeader kicker="3 MECANISMOS NEURAIS" />

        {MECHS.map(m => (
          <View key={m.num} style={[styles.mechCard, { borderColor: m.color + '33' }]}>
            <View style={[styles.mechNum, { backgroundColor: m.color + '22' }]}>
              <Text style={[styles.mechNumText, { color: m.color }]}>{m.num}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.mechHeaderRow}>
                <Text style={styles.mechIcon}>{m.icon}</Text>
                <Text style={[styles.mechTitle, { color: m.color }]}>{m.title}</Text>
              </View>
              <Text style={styles.mechDesc}>{m.desc}</Text>
            </View>
          </View>
        ))}

        {/* ══ SEÇÃO 4 — A DOSE CERTA ══ */}
        <SectionHeader
          kicker="A DOSE CERTA"
          headline="Pouco, mas todo dia."
        />

        <View style={styles.freqCard}>
          <View style={styles.freqBadge}>
            <Text style={styles.freqBadgeText}>RECOMENDAÇÃO</Text>
          </View>
          <View style={styles.freqMain}>
            <View style={styles.freqCol}>
              <Text style={styles.freqBig}>3</Text>
              <Text style={styles.freqColLabel}>VEZES{'\n'}SEMANA</Text>
            </View>
            <Text style={styles.freqTimes}>×</Text>
            <View style={styles.freqCol}>
              <Text style={styles.freqBig}>3</Text>
              <Text style={styles.freqColLabel}>MINUTOS</Text>
            </View>
          </View>
          <Text style={styles.freqRationale}>
            É o que basta para manter o circuito ativo. Acima disso, ganho marginal. Abaixo, some rápido.
          </Text>
        </View>

        {/* ══ SEÇÃO 5 — PARA COLOCAR EM PERSPECTIVA ══ */}
        <SectionHeader
          kicker="PARA COLOCAR EM PERSPECTIVA"
          headline="Quem reage mais rápido que você."
        />

        <Text style={styles.benchGroupLabel}>PARTIDA E SEQUÊNCIA — ESCALA DE REFERÊNCIA</Text>

        {BENCHMARKS.map(b => {
          const isGoal = goalBenchmarkName !== null && b.name === goalBenchmarkName;
          return (
            <View
              key={b.name}
              style={[
                styles.benchCard,
                { borderColor: isGoal ? goalHighlightColor + 'aa' : b.color + '2a' },
                isGoal && { borderWidth: 2 },
              ]}
            >
              {/* SUA META badge */}
              {isGoal && (
                <View style={[styles.goalBadge, { borderColor: goalHighlightColor + '66', backgroundColor: goalHighlightColor + '18' }]}>
                  <Text style={[styles.goalBadgeText, { color: goalHighlightColor }]} numberOfLines={1}>
                    ← SUA META
                  </Text>
                </View>
              )}

              {/* Icon */}
              <View style={[styles.benchIconBox, { backgroundColor: b.color + '1a' }]}>
                <Text style={styles.benchIconText}>{b.icon}</Text>
              </View>

              {/* Name + source */}
              <View style={styles.benchInfo}>
                <Text style={styles.benchName}>{b.name}</Text>
                <Text style={styles.benchSource}>{b.source}</Text>
              </View>

              {/* Range + level */}
              <View style={styles.benchRight}>
                <Text style={[styles.benchRange, { color: b.color }]}>{b.range}</Text>
                <Text style={[styles.benchLevel, { color: b.color }]}>{b.level}</Text>
              </View>
            </View>
          );
        })}

        {/* ══ SEÇÃO 5b — MODO ALVO CHOICE RT ══ */}
        <Text style={styles.benchGroupLabel}>MODO ALVO — ESCALA DE REFERÊNCIA</Text>
        <Text style={styles.benchGroupSub}>
          O Modo Alvo exige identificar a cor certa antes de reagir — por isso os tempos de referência são maiores.
        </Text>

        {CHOICE_BENCHMARKS.map(b => {
          const isYouHere = bestAlvoRt !== null && b.level === choiceLevelLabel(bestAlvoRt);
          const showLastNote = isYouHere && lastAlvoRt !== null &&
            choiceLevelLabel(lastAlvoRt) !== choiceLevelLabel(bestAlvoRt!);
          const youColor = bestAlvoRt !== null ? choiceLevelColor(bestAlvoRt) : b.color;
          return (
            <View
              key={b.name}
              style={[
                styles.benchCard,
                { borderColor: isYouHere ? youColor + 'aa' : b.color + '2a' },
                isYouHere && { borderWidth: 2 },
              ]}
            >
              {isYouHere && (
                <View style={[styles.youBadge, { borderColor: youColor + '66', backgroundColor: youColor + '18' }]}>
                  <Text style={[styles.youBadgeText, { color: youColor }]} numberOfLines={1}>← VOCÊ ESTÁ AQUI</Text>
                </View>
              )}
              {showLastNote && (
                <Text style={styles.lastSessionNote}>
                  {`Última sessão: ${lastAlvoRt} ms · ${choiceLevelLabel(lastAlvoRt!)}`}
                </Text>
              )}
              <View style={[styles.benchIconBox, { backgroundColor: b.color + '1a' }]}>
                <Text style={styles.benchIconText}>{b.icon}</Text>
              </View>
              <View style={styles.benchInfo}>
                <Text style={styles.benchName}>{b.name}</Text>
                <Text style={styles.benchSource}>{b.source}</Text>
              </View>
              <View style={styles.benchRight}>
                <Text style={[styles.benchRange, { color: b.color }]}>{b.range}</Text>
                <Text style={[styles.benchLevel, { color: b.color }]}>{b.level}</Text>
              </View>
            </View>
          );
        })}

        {/* ══ FECHAMENTO EDITORIAL ══ */}
        <View style={styles.closingCard}>
          <Text style={styles.closingIcon}>🧠</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.closingBody}>
              Não prometemos genialidade nem juventude eterna. Mas três minutos três vezes por semana mexem com um dos sistemas mais sensíveis ao tempo que existem no seu corpo.
            </Text>
            <Text style={styles.closingEmphasis}>Isso já vale a pena.</Text>
          </View>
        </View>

        {/* ══ DISCLAIMER TÉCNICO ══ */}
        <View style={styles.toneBox}>
          <Text style={styles.toneIcon}>💡</Text>
          <Text style={styles.toneText}>
            Resultados refletem reação simples visual — diferente de decisões complexas.
            Fatores como iluminação, sono e cafeína afetam o resultado.
          </Text>
        </View>

        {/* ══ FONTES ══ */}
        <Text style={styles.sourcesTitle}>FONTES</Text>
        {SOURCES.map(s => (
          <Text key={s} style={styles.source}>• {s}</Text>
        ))}

      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b1220' },
  scroll: { paddingHorizontal: 20, paddingBottom: 48 },

  pageTitle: {
    fontSize: 28, fontWeight: '900', color: '#fff',
    letterSpacing: 4, marginBottom: 24,
  },

  sectionHeader: { marginBottom: 16, marginTop: 8 },
  kicker: {
    fontSize: 10, fontWeight: '700', color: '#3a4a6b',
    letterSpacing: 2.5, marginBottom: 6,
  },
  headline: {
    fontSize: 22, fontWeight: '900', color: '#fff',
    letterSpacing: -0.3, lineHeight: 28,
  },

  heroStat: {
    backgroundColor: '#111a2e', borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)', padding: 28,
    alignItems: 'center', marginBottom: 32, gap: 10,
  },
  heroNum: {
    fontSize: 80, fontWeight: '900', color: '#10b981',
    letterSpacing: -3, lineHeight: 84,
  },
  heroClaim: {
    fontSize: 15, color: '#c0cfe0', textAlign: 'center',
    lineHeight: 23, fontWeight: '500',
  },
  heroSourceRow: {
    marginTop: 4,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 12, width: '100%', alignItems: 'center',
  },
  heroSourceText: {
    fontSize: 11, color: '#4a5a7b', textAlign: 'center', letterSpacing: 0.3,
  },

  editorialBlock: {
    backgroundColor: '#111a2e', borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)', padding: 20,
    marginBottom: 32, gap: 14,
  },
  editorialPara: {
    fontSize: 15, color: '#7a8aa0', lineHeight: 24,
  },
  editorialParaLast: { marginBottom: 0 },

  mechCard: {
    backgroundColor: '#111a2e', borderRadius: 14, borderWidth: 1,
    flexDirection: 'row', gap: 14, padding: 16, marginBottom: 10,
  },
  mechNum: {
    width: 44, height: 44, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  mechNumText: { fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  mechHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  mechIcon: { fontSize: 16 },
  mechTitle: { fontSize: 14, fontWeight: '800' },
  mechDesc: { fontSize: 13, color: '#4a5a7b', lineHeight: 19 },

  freqCard: {
    backgroundColor: '#111a2e', borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)', padding: 24,
    alignItems: 'center', marginBottom: 32, gap: 0,
  },
  freqBadge: {
    borderRadius: 20, borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.4)',
    backgroundColor: 'rgba(16,185,129,0.08)',
    paddingHorizontal: 14, paddingVertical: 5,
    marginBottom: 24,
  },
  freqBadgeText: {
    fontSize: 10, fontWeight: '800', color: '#10b981', letterSpacing: 2,
  },
  freqMain: {
    flexDirection: 'row', alignItems: 'center',
    gap: 20, marginBottom: 20,
  },
  freqCol: { alignItems: 'center', gap: 6 },
  freqBig: {
    fontSize: 56, fontWeight: '900', color: '#fff',
    letterSpacing: -2, lineHeight: 60,
  },
  freqColLabel: {
    fontSize: 9, fontWeight: '700', color: '#3a4a6b',
    letterSpacing: 1.5, textAlign: 'center', lineHeight: 14,
  },
  freqTimes: {
    fontSize: 28, fontWeight: '300', color: '#3a4a6b',
    marginBottom: 20,
  },
  freqRationale: {
    fontSize: 13, color: '#4a5a7b', textAlign: 'center',
    lineHeight: 20, marginTop: 4,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 16,
  },

  benchGroupLabel: {
    fontSize: 9, fontWeight: '800', color: '#3a4a6b',
    letterSpacing: 2, marginBottom: 8, marginTop: 4,
  },
  benchGroupSub: {
    fontSize: 12, color: '#4a5a7b', marginBottom: 10, lineHeight: 18,
  },

  benchCard: {
    backgroundColor: '#111a2e', borderRadius: 14, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center',
    gap: 12, padding: 14, marginBottom: 10,
    // needed for absolute badge positioning
    position: 'relative',
  },
  goalBadge: {
    position: 'absolute', top: 8, right: 8,
    borderRadius: 4, borderWidth: 1,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  goalBadgeText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },

  youBadge: {
    position: 'absolute', top: 8, right: 8,
    borderRadius: 4, borderWidth: 1,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  youBadgeText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  lastSessionNote: {
    position: 'absolute', top: 30, right: 8,
    fontSize: 8, color: '#4a5a7b', letterSpacing: 0.3,
  },

  benchIconBox: {
    width: 44, height: 44, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  benchIconText: { fontSize: 22 },
  benchInfo: { flex: 1, gap: 3 },
  benchName: { fontSize: 13, fontWeight: '800', color: '#fff' },
  benchSource: { fontSize: 10, color: '#3a4a6b', lineHeight: 14 },
  benchRight: { alignItems: 'flex-end', gap: 2, flexShrink: 0 },
  benchRange: { fontSize: 16, fontWeight: '900', letterSpacing: -0.5 },
  benchLevel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },

  closingCard: {
    backgroundColor: '#111a2e', borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    flexDirection: 'row', gap: 14, padding: 20,
    marginTop: 8, marginBottom: 16, alignItems: 'flex-start',
  },
  closingIcon: { fontSize: 28, marginTop: 2 },
  closingBody: {
    fontSize: 14, color: '#7a8aa0', lineHeight: 22, marginBottom: 10,
  },
  closingEmphasis: {
    fontSize: 15, fontWeight: '800', color: '#fff',
  },

  toneBox: {
    backgroundColor: '#0f1829', borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)', padding: 14,
    flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 28,
  },
  toneIcon: { fontSize: 18 },
  toneText: { flex: 1, fontSize: 12, color: '#4a5a7b', lineHeight: 18 },

  sourcesTitle: {
    fontSize: 10, fontWeight: '700', color: '#3a4a6b',
    letterSpacing: 2.5, marginBottom: 10,
  },
  source: { fontSize: 11, color: '#2d3a55', lineHeight: 18, marginBottom: 4 },
});
