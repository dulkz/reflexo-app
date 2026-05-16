import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Platform, StatusBar as RNStatusBar,
  StyleProp, TextStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SvgXml } from 'react-native-svg';
import { ACHIEVEMENT_ICONS, ARCHETYPE_ICONS, MISSION_ICONS } from '../assets/icons';
import { UserProfile } from '../types/user';
import { SessionRecord } from '../utils/storage';
import { getMetaBenchmark } from '../utils/ambition';
import { GROUP_COLOR, getAmbitionById } from '../config/ambitions';

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

// ── Static data (icons, sources, ranges — non-translatable parts) ─────────────

const BENCHMARK_STATIC = [
  { icon: MISSION_ICONS.eye,        source: 'McLeod 1987 · Caprioli et al., 2023 (ATP)', range: '50–100 ms',  color: '#00f5ff' },
  { icon: ARCHETYPE_ICONS.PILOTO,   source: 'Vienna Reaction Apparatus',                  range: '150–250 ms', color: '#10b981' },
  { icon: MISSION_ICONS.boxing,     source: 'Loturco et al., 2015 · Seleção Brasileira',  range: '160–220 ms', color: '#10b981' },
  { icon: MISSION_ICONS.tennis,     source: 'Journal of Sports Sciences, 2019',           range: '200–250 ms', color: '#3b82f6' },
  { icon: ARCHETYPE_ICONS.VELOCISTA,source: 'Lipps et al., 2011 · Sprint start research', range: '170–200 ms', color: '#10b981' },
  { icon: MISSION_ICONS.person,     source: 'Meta-análise · PMC, 2021',                   range: '200–300 ms', color: '#06b6d4' },
];

const CHOICE_BENCHMARK_STATIC = [
  { icon: ACHIEVEMENT_ICONS.sniper,   source: 'Balakrishnan et al., 2014 · PMC',      range: '380–420 ms', color: '#10b981' },
  { icon: MISSION_ICONS.muscle,       source: 'PMC, 2014 · Mental Chronometry',        range: '420–500 ms', color: '#3b82f6' },
  { icon: MISSION_ICONS.silhouette,   source: 'Donders RT paradigm · Wikipedia',       range: '480–560 ms', color: '#06b6d4' },
  { icon: MISSION_ICONS.diamond,      source: 'Mental Chronometry literature',          range: '550–700 ms', color: '#f59e0b' },
  { icon: MISSION_ICONS.elder,        source: 'Mental Chronometry, Wikipedia',          range: '600–800 ms', color: '#ef4444' },
];

const MECH_COLORS = ['#3b82f6', '#8b5cf6', '#10b981'];
const MECH_ICONS  = [ACHIEVEMENT_ICONS.sub280, ACHIEVEMENT_ICONS.sniper, ACHIEVEMENT_ICONS.semfadiga];
const SCI_STAT_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

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

// Returns a stable locale-independent key matching levels.ts labelKeys
function choiceLevelKey(ms: number): string {
  if (ms <= 420) return 'elite';
  if (ms <= 500) return 'veryGood';
  if (ms <= 560) return 'good';
  if (ms <= 700) return 'building';
  return 'warmingUp';
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
  const { t } = useTranslation();

  const goalBenchmarkName = userProfile.triageCompleted && userProfile.ambitionId
    ? getMetaBenchmark(userProfile.ambitionId)
    : null;

  const goalHighlightColor = GROUP_COLOR['elite_sport'];

  const bestPartidaRt = sessions.filter(s => s.mode === 'partida').reduce<number | null>(
    (best, s) => best === null || s.score < best ? s.score : best, null,
  );

  const alvoSessions = sessions.filter(s => s.mode === 'alvo');
  const bestAlvoRt = alvoSessions.length > 0
    ? Math.min(...alvoSessions.map(s => s.score))
    : null;
  const lastAlvoRt = alvoSessions.length > 0 ? alvoSessions[0].score : null;

  const ambition = userProfile.triageCompleted && userProfile.ambitionId
    ? getAmbitionById(userProfile.ambitionId)
    : null;
  const isPersonalized = ambition != null;

  type RecConfig = { times: number; mins: number; tagline: string };
  const rec: RecConfig = (() => {
    if (!ambition) return { times: 3, mins: 3, tagline: t('science.taglineDefault') };
    if (ambition.group === 'elite_sport') return { times: 5, mins: 5, tagline: t('science.taglineElite') };
    if (ambition.group === 'brain_health') return { times: 3, mins: 3, tagline: t('science.taglineBrain') };
    return { times: 4, mins: 4, tagline: t('science.taglinePopulational') };
  })();

  // i18n-resolved data arrays
  const MECHS_DATA = (t('science.mechs', { returnObjects: true }) as Array<{ num: string; title: string; desc: string }>).map(
    (m, i) => ({ ...m, color: MECH_COLORS[i], icon: MECH_ICONS[i] }),
  );
  const SCI_STATS_DATA = (t('science.stats', { returnObjects: true }) as Array<{ stat: string; desc: string; fonte: string }>).map(
    (s, i) => ({ ...s, cor: SCI_STAT_COLORS[i] }),
  );
  const BENCHMARKS_DATA = (t('science.benchmarks', { returnObjects: true }) as Array<{ name: string; level: string }>).map(
    (b, i) => ({ ...b, ...BENCHMARK_STATIC[i] }),
  );
  const CHOICE_BENCHMARKS_DATA = (t('science.choiceBenchmarks', { returnObjects: true }) as Array<{ name: string; level: string; levelKey: string }>).map(
    (b, i) => ({ ...b, ...CHOICE_BENCHMARK_STATIC[i] }),
  );

  const freqDays = [
    t('science.freqScheduleDayMon'),
    t('science.freqScheduleDayWed'),
    t('science.freqScheduleDayFri'),
  ];

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: TOP + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>{t('science.title')}</Text>

        {/* ══ SEÇÃO 1 — SUA RECOMENDAÇÃO / A DOSE CERTA ══ */}
        <SectionHeader
          kicker={isPersonalized ? t('science.recKicker') : t('science.doseKicker')}
          headline={t('science.headline1')}
        />

        <View style={styles.freqCard}>
          {isPersonalized ? (
            <View style={styles.freqAmbitionRow}>
              <SvgXml xml={ambition!.icon} width={20} height={20} />
              <Text style={styles.freqAmbitionName}>{ambition!.name}</Text>
            </View>
          ) : (
            <View style={styles.freqBadge}>
              <Text style={styles.freqBadgeText}>{t('science.recBadge')}</Text>
            </View>
          )}
          <View style={styles.freqMain}>
            <View style={styles.freqCol}>
              <Text style={styles.freqBig}>{rec.times}</Text>
              <Text style={styles.freqColLabel}>{t('science.sessions')}</Text>
            </View>
            <Text style={styles.freqTimes}>×</Text>
            <View style={styles.freqCol}>
              <Text style={styles.freqBig}>{rec.mins}</Text>
              <Text style={styles.freqColLabel}>{t('science.minutes')}</Text>
            </View>
          </View>
          <Text style={styles.freqContext}>
            {t('science.freqContext', { total: rec.times * rec.mins, daily: Math.ceil(rec.times * rec.mins / 7) })}
          </Text>
          <Text style={styles.freqRationale}>{rec.tagline}</Text>
        </View>

        {/* ══ FREQUÊNCIA IDEAL DE TREINO ══ */}
        <View style={styles.freqScheduleCard}>
          <Text style={styles.freqScheduleHeader}>{t('science.freqScheduleHeader')}</Text>
          <View style={styles.freqScheduleRow}>
            {freqDays.map(day => (
              <View key={day} style={styles.freqScheduleItem}>
                <View style={styles.freqScheduleCircle} />
                <Text style={styles.freqScheduleDay}>{day}</Text>
                <Text style={styles.freqScheduleMins}>{rec.mins} min</Text>
              </View>
            ))}
          </View>
          <Text style={styles.freqScheduleNote}>
            {t('science.freqScheduleNote')}
          </Text>
        </View>

        {/* ══ SEÇÃO 2 — QUEM REAGE MAIS RÁPIDO ══ */}
        <SectionHeader
          kicker={t('science.perspKicker')}
          headline={t('science.perspHeadline')}
        />

        <Text style={styles.benchGroupLabel}>{t('science.benchGroupPartida')}</Text>

        {BENCHMARKS_DATA.map((b, idx) => {
          if (b.level === 'SUPER-HUMANO' || b.level === 'SUPER-HUMAN' || b.level === 'IMPOSSÍVEL') {
            if (bestPartidaRt === null || bestPartidaRt >= 100) return null;
          }
          const isGoal = goalBenchmarkName !== null && BENCHMARK_STATIC[idx].source === BENCHMARK_STATIC[BENCHMARKS_DATA.findIndex(
            (_, i) => BENCHMARK_STATIC[i].source === goalBenchmarkName,
          )]?.source;
          // simpler: match by original Portuguese name via index — goalBenchmarkName is the Portuguese name
          const originalPtNames = ['Antecipação visual de elite','Piloto de F1 de ponta','Boxeador olímpico','Tenista ATP','Velocista olímpico','Adulto saudável (25–45)'];
          const isGoalCard = goalBenchmarkName !== null && originalPtNames[idx] === goalBenchmarkName;
          return (
            <View
              key={idx}
              style={[
                styles.benchCard,
                { borderColor: isGoalCard ? goalHighlightColor + 'aa' : b.color + '2a' },
                isGoalCard && { borderWidth: 2 },
              ]}
            >
              <View style={[styles.benchIconBox, { backgroundColor: b.color + '1a' }]}>
                <SvgXml xml={b.icon} width={22} height={22} />
              </View>
              <View style={styles.benchInfo}>
                {isGoalCard && (
                  <Text style={[styles.inlineBadge, { color: goalHighlightColor }]} numberOfLines={1}>
                    {t('science.goalBadge')}
                  </Text>
                )}
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

        {/* ══ SEÇÃO 5b — MODO ALVO CHOICE RT ══ */}
        <Text style={styles.benchGroupLabel}>{t('science.benchGroupAlvo')}</Text>
        <Text style={styles.benchGroupSub}>{t('science.benchGroupSub')}</Text>

        {CHOICE_BENCHMARKS_DATA.map((b, idx) => {
          const isYouHere = bestAlvoRt !== null && b.levelKey === choiceLevelKey(bestAlvoRt);
          const showLastNote = isYouHere && lastAlvoRt !== null &&
            choiceLevelKey(lastAlvoRt) !== choiceLevelKey(bestAlvoRt!);
          const youColor = bestAlvoRt !== null ? choiceLevelColor(bestAlvoRt) : b.color;
          return (
            <View
              key={idx}
              style={[
                styles.benchCard,
                { borderColor: isYouHere ? youColor + 'aa' : b.color + '2a' },
                isYouHere && { borderWidth: 2 },
              ]}
            >
              <View style={[styles.benchIconBox, { backgroundColor: b.color + '1a' }]}>
                <SvgXml xml={b.icon} width={22} height={22} />
              </View>
              <View style={styles.benchInfo}>
                {isYouHere && (
                  <Text style={[styles.inlineBadge, { color: youColor }]} numberOfLines={1}>
                    {t('science.youAreHere')}
                  </Text>
                )}
                <Text style={styles.benchName}>{b.name}</Text>
                <Text style={styles.benchSource}>{b.source}</Text>
                {showLastNote && (
                  <Text style={styles.lastSessionNote}>
                    {t('science.lastSession', { ms: lastAlvoRt, level: t(`levels.${choiceLevelKey(lastAlvoRt!)}.label` as any) })}
                  </Text>
                )}
              </View>
              <View style={styles.benchRight}>
                <Text style={[styles.benchRange, { color: b.color }]}>{b.range}</Text>
                <Text style={[styles.benchLevel, { color: b.color }]}>{b.level}</Text>
              </View>
            </View>
          );
        })}

        {/* ══ SEÇÃO 4 — COMO FUNCIONA ══ */}
        <SectionHeader
          kicker={t('science.howKicker')}
          headline={t('science.howHeadline')}
        />

        <View style={styles.editorialBlock}>
          <RichText style={styles.editorialPara}>{t('science.editorial1')}</RichText>
          <RichText style={[styles.editorialPara, styles.editorialParaLast]}>{t('science.editorial2')}</RichText>
        </View>

        {/* ══ SEÇÃO 3 — POR QUE TREINAR REAÇÃO ══ */}
        <SectionHeader kicker={t('science.whyKicker')} />

        <View style={styles.sciGrid}>
          {SCI_STATS_DATA.map((s, i) => (
            <View key={i} style={[styles.sciCard, { borderColor: s.cor + '33' }]}>
              <Text style={[styles.sciStat, { color: s.cor }]}>{s.stat}</Text>
              <Text style={styles.sciDesc}>{s.desc}</Text>
              <Text style={styles.sciSource}>{s.fonte}</Text>
            </View>
          ))}
        </View>

        {/* ══ SEÇÃO 5 — 3 MECANISMOS NEURAIS ══ */}
        <SectionHeader kicker={t('science.mechKicker')} />

        {MECHS_DATA.map(m => (
          <View key={m.num} style={[styles.mechCard, { borderColor: m.color + '33' }]}>
            <View style={[styles.mechNum, { backgroundColor: m.color + '22' }]}>
              <Text style={[styles.mechNumText, { color: m.color }]}>{m.num}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.mechHeaderRow}>
                <SvgXml xml={m.icon} width={16} height={16} />
                <Text style={[styles.mechTitle, { color: m.color }]}>{m.title}</Text>
              </View>
              <Text style={styles.mechDesc}>{m.desc}</Text>
            </View>
          </View>
        ))}

        {/* ══ FECHAMENTO EDITORIAL ══ */}
        <View style={styles.closingCard}>
          <SvgXml xml={ACHIEVEMENT_ICONS.semfadiga} width={28} height={28} style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.closingBody}>{t('science.closingBody')}</Text>
            <Text style={styles.closingEmphasis}>{t('science.closingEmphasis')}</Text>
          </View>
        </View>

        {/* ══ DISCLAIMER TÉCNICO ══ */}
        <View style={styles.toneBox}>
          <SvgXml xml={MISSION_ICONS.bulb} width={18} height={18} />
          <Text style={styles.toneText}>{t('science.disclaimer')}</Text>
        </View>

        {/* ══ FONTES ══ */}
        <Text style={styles.sourcesTitle}>{t('science.sourcesTitle')}</Text>
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

  sciGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 32,
  },
  sciCard: {
    backgroundColor: '#111a2e', borderRadius: 12, borderWidth: 1,
    padding: 14, width: '48%', minHeight: 140,
  },
  sciStat: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  sciDesc: { fontSize: 11, color: '#7a8aa0', lineHeight: 16, marginTop: 6, flex: 1 },
  sciSource: { fontSize: 9, color: '#3a4a6b', marginTop: 8 },

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
    borderColor: 'rgba(255,255,255,0.06)', padding: 28,
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
  freqAmbitionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20,
  },
  freqAmbitionIcon: { fontSize: 20 },
  freqAmbitionName: {
    fontSize: 13, fontWeight: '800', color: '#c0cfe0', letterSpacing: 0.5,
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
  freqContext: {
    fontSize: 11, color: '#3a4a6b', letterSpacing: 0.3,
    textAlign: 'center', marginBottom: 16,
  },
  freqBullets: {
    alignSelf: 'stretch', marginBottom: 16, gap: 8,
  },
  freqBulletRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  freqBullet: {
    fontSize: 12, color: '#4a5a7b', lineHeight: 18, flex: 1,
  },
  freqRationale: {
    fontSize: 13, color: '#4a5a7b', textAlign: 'center',
    lineHeight: 20, marginTop: 12, alignSelf: 'stretch',
  },

  // ── Frequência ideal (SEG/QUA/SEX) ───────────────────────────────────────
  freqScheduleCard: {
    backgroundColor: '#111a2e', borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)', padding: 16,
    alignItems: 'center', marginBottom: 32,
  },
  freqScheduleHeader: {
    fontSize: 9, fontWeight: '800', color: '#4a5a7b',
    letterSpacing: 2, marginBottom: 16,
  },
  freqScheduleRow: {
    flexDirection: 'row', gap: 32, marginBottom: 16,
  },
  freqScheduleItem: {
    alignItems: 'center', gap: 6,
  },
  freqScheduleCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#10b981',
  },
  freqScheduleDay: {
    fontSize: 12, fontWeight: '800', color: '#fff', letterSpacing: 0.5,
  },
  freqScheduleMins: {
    fontSize: 11, color: '#10b981', fontWeight: '600',
  },
  freqScheduleNote: {
    fontSize: 12, color: '#4a5a7b', textAlign: 'center',
    lineHeight: 18, borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 12, alignSelf: 'stretch',
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
  },

  inlineBadge: {
    fontSize: 11, fontWeight: '700',
    textAlign: 'right', letterSpacing: 0.2, marginBottom: 1,
  },
  lastSessionNote: {
    fontSize: 10, color: '#4a5a7b', letterSpacing: 0.2, marginTop: 1,
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
