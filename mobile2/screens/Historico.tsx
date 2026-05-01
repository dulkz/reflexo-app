import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, StatusBar as RNStatusBar,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { getLevelForMode, MODE_COLORS, ModeKey } from '../utils/levels';
import { SessionRecord } from '../utils/storage';
import { UserProfile } from '../types/user';
import { ICONS } from '../assets/icons';
import { ConquistasContent } from './Conquistas';

const TOP = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 44;
const DAY = 86_400_000;

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const MODE_LABELS: Record<ModeKey, string> = {
  partida: 'Partida',
  alvo: 'Alvo',
  sequencia: 'Sequência',
  radar: 'Radar',
};

const MODE_ICONS: Record<ModeKey, string> = {
  partida:   ICONS.modes.partida,
  alvo:      ICONS.modes.alvo,
  sequencia: ICONS.modes.sequencia,
  radar:     ICONS.modes.radar,
};

function dayStart(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function formatShortDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function formatRelativeDate(ts: number): string {
  const diff = Math.round((dayStart(Date.now()) - dayStart(ts)) / DAY);
  if (diff === 0) return 'hoje';
  if (diff === 1) return 'ontem';
  if (diff < 7) return `há ${diff} dias`;
  return formatShortDate(ts);
}

// Best individual round/hit (= Melhor Tempo Reflexo). Falls back to session score if absent.
function bestReflex(s: SessionRecord): number {
  return s.bestTime ?? s.score;
}

// Session-level average score (= Média RT). Includes penalties for alvo/seq/radar.
function avgScore(s: SessionRecord): number {
  return s.score;
}

type Trend = 'up' | 'flat' | 'down' | 'unknown';

function computeTrend(scores: number[]): Trend {
  if (scores.length < 3) return 'unknown';
  // scores are chronological (oldest → newest); lower is better.
  // Compare first-half average to second-half average.
  const half = Math.floor(scores.length / 2);
  const first = scores.slice(0, half);
  const second = scores.slice(scores.length - half);
  const avg = (xs: number[]) => xs.reduce((s, n) => s + n, 0) / xs.length;
  const a = avg(first);
  const b = avg(second);
  const diff = a - b; // positive → improving (newer scores lower)
  const threshold = a * 0.03; // 3% of baseline counts as meaningful change
  if (diff > threshold)  return 'up';
  if (diff < -threshold) return 'down';
  return 'flat';
}

const TREND_META: Record<Trend, { icon: string; label: string; color: string }> = {
  up:      { icon: '↑', label: 'melhorando', color: '#10b981' },
  flat:    { icon: '→', label: 'estável',    color: '#06b6d4' },
  down:    { icon: '↓', label: 'piorando',   color: '#ef4444' },
  unknown: { icon: '·', label: '—',          color: '#4a5a7b' },
};

interface ModeCardProps {
  mode: ModeKey;
  sessions: SessionRecord[];
  expanded: boolean;
  onToggle: () => void;
}

function ModeStatsCard({ mode, sessions, expanded, onToggle }: ModeCardProps) {
  const mc = MODE_COLORS[mode];
  const mSessions = sessions.filter(s => s.mode === mode);

  const data = useMemo(() => {
    if (mSessions.length === 0) return null;

    // sessions array is newest → oldest. Reverse for chronological order.
    const chrono = mSessions.slice().reverse();

    const bestReflexes = chrono.map(bestReflex);
    const avgScores = chrono.map(avgScore);

    const bestReflexMs = Math.min(...bestReflexes);    // fastest individual round/hit ever
    const bestAvgMs    = Math.min(...avgScores);       // lowest session-level avg ever
    const first = chrono[0];
    const latest = chrono[chrono.length - 1];

    // Trend on last 5 sessions — uses session-level avg (more stable than single-round best)
    const last5 = chrono.slice(-5).map(avgScore);
    const trend = computeTrend(last5);

    // Best day of week — by avg-of-session-avgs (lower is better)
    const dayBuckets: number[][] = [[], [], [], [], [], [], []];
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    for (const s of chrono) {
      const dow = new Date(s.date).getDay();
      dayBuckets[dow].push(avgScore(s));
      dayCounts[dow] += 1;
    }
    let bestDayIdx = -1;
    let bestDayAvg = Infinity;
    for (let i = 0; i < 7; i++) {
      if (dayBuckets[i].length === 0) continue;
      const avg = dayBuckets[i].reduce((a, b) => a + b, 0) / dayBuckets[i].length;
      if (avg < bestDayAvg) { bestDayAvg = avg; bestDayIdx = i; }
    }

    // Most-played day of week (tie-break: most recent)
    let mostPlayedIdx = -1;
    let mostPlayedCount = -1;
    for (let i = 0; i < 7; i++) {
      if (dayCounts[i] > mostPlayedCount) {
        mostPlayedCount = dayCounts[i];
        mostPlayedIdx = i;
      }
    }

    return {
      bestReflexMs,
      bestAvgMs,
      firstAvg: avgScore(first),
      latestAvg: avgScore(latest),
      trend,
      total: chrono.length,
      latestDate: latest.date,
      bestDayIdx,
      bestDayAvg,
      mostPlayedIdx,
      mostPlayedCount,
    };
  }, [mSessions]);

  // Level pill is anchored to the session-level avg (Média RT) — aligns with trend metric
  const lvl = data ? getLevelForMode(data.bestAvgMs, mode) : null;
  const trendMeta = TREND_META[data?.trend ?? 'unknown'];

  return (
    <View style={[styles.modeCard, { borderColor: mc.accent + '33' }]}>
      <TouchableOpacity onPress={onToggle} activeOpacity={0.8} style={styles.modeCardHeader}>
        <View style={[styles.modeIconBox, { backgroundColor: mc.accent + '22' }]}>
          <SvgXml xml={MODE_ICONS[mode]} width={24} height={24} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[styles.modeName, { color: mc.accent }]}>{MODE_LABELS[mode].toUpperCase()}</Text>
          {data && lvl ? (
            <>
              <View style={styles.modeHeaderRow}>
                <Text style={[styles.modeBest, { color: lvl.color }]}>{data.bestAvgMs} ms</Text>
                <Text style={styles.modeBestSub}>média</Text>
                <Text style={styles.modeBestDot}>·</Text>
                <Text style={[styles.modeBestSecondary, { color: mc.accent }]}>{data.bestReflexMs} ms</Text>
                <Text style={styles.modeBestSub}>melhor</Text>
              </View>
              <View style={styles.modeHeaderRow}>
                <View style={[styles.levelMini, { backgroundColor: lvl.bg }]}>
                  <Text style={[styles.levelMiniText, { color: lvl.color }]} numberOfLines={1}>{lvl.label}</Text>
                </View>
                <Text style={[styles.trendBadge, { color: trendMeta.color }]}>
                  {trendMeta.icon} {trendMeta.label}
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.modeEmpty}>Nenhuma sessão registrada</Text>
          )}
        </View>
        <Text style={[styles.modeChevron, { color: mc.accent }]}>{expanded ? '▼' : '▶'}</Text>
      </TouchableOpacity>

      {expanded && data && (
        <View style={styles.modeBody}>
          <View style={styles.modeRow}>
            <Text style={styles.modeRowLabel}>Melhor Tempo Reflexo</Text>
            <Text style={[styles.modeRowValue, { color: mc.accent }]}>{data.bestReflexMs} ms</Text>
          </View>
          <View style={styles.modeRow}>
            <Text style={styles.modeRowLabel}>Média RT (melhor sessão)</Text>
            <Text style={[styles.modeRowValue, lvl && { color: lvl.color }]}>{data.bestAvgMs} ms</Text>
          </View>
          <View style={styles.modeRow}>
            <Text style={styles.modeRowLabel}>Primeiro vs. atual</Text>
            <Text style={styles.modeRowValue}>
              {data.firstAvg} → <Text style={{ color: mc.accent }}>{data.latestAvg} ms</Text>
              <Text style={styles.modeRowSub}>{
                data.firstAvg > data.latestAvg
                  ? `  (-${data.firstAvg - data.latestAvg} ms)`
                  : data.firstAvg < data.latestAvg
                  ? `  (+${data.latestAvg - data.firstAvg} ms)`
                  : '  (=)'
              }</Text>
            </Text>
          </View>
          <View style={styles.modeRow}>
            <Text style={styles.modeRowLabel}>Total de sessões</Text>
            <Text style={styles.modeRowValue}>{data.total}</Text>
          </View>
          <View style={styles.modeRow}>
            <Text style={styles.modeRowLabel}>Última sessão</Text>
            <Text style={styles.modeRowValue}>{formatRelativeDate(data.latestDate)}</Text>
          </View>
          {data.bestDayIdx >= 0 && (
            <View style={styles.modeRow}>
              <Text style={styles.modeRowLabel}>Melhor dia da semana</Text>
              <Text style={styles.modeRowValue}>
                {DAYS_OF_WEEK[data.bestDayIdx]}
                <Text style={styles.modeRowSub}>  · {Math.round(data.bestDayAvg)} ms</Text>
              </Text>
            </View>
          )}
          {data.mostPlayedIdx >= 0 && data.mostPlayedCount > 0 && (
            <View style={styles.modeRow}>
              <Text style={styles.modeRowLabel}>Dia mais jogado</Text>
              <Text style={styles.modeRowValue}>
                {DAYS_OF_WEEK[data.mostPlayedIdx]}
                <Text style={styles.modeRowSub}>  · {data.mostPlayedCount} sess.</Text>
              </Text>
            </View>
          )}
          <Text style={styles.modeFootnote}>
            Melhor reflexo = rodada/hit individual mais rápido. Média RT = score da melhor sessão (com penalidades quando aplicável).
          </Text>
        </View>
      )}
    </View>
  );
}

interface Props {
  sessions: SessionRecord[];
  userProfile: UserProfile;
}

export default function Historico({ sessions }: Props) {
  const [expanded, setExpanded] = useState<Record<ModeKey, boolean>>({
    partida: false, alvo: false, sequencia: false, radar: false,
  });

  const bestRtSession = useMemo(() => {
    if (sessions.length === 0) return null;
    return sessions.reduce((best, s) => s.bestTime < best.bestTime ? s : best);
  }, [sessions]);

  const { mostPlayed, modeCounts } = useMemo(() => {
    const counts: Record<ModeKey, number> = { partida: 0, alvo: 0, sequencia: 0, radar: 0 };
    for (const s of sessions) counts[s.mode]++;
    let mp: ModeKey | null = null;
    for (const k of Object.keys(counts) as ModeKey[]) {
      if (mp === null || counts[k] > counts[mp]) mp = k;
    }
    return { mostPlayed: sessions.length > 0 ? mp : null, modeCounts: counts };
  }, [sessions]);

  const streak = useMemo(() => {
    if (sessions.length === 0) return 0;
    const todayMs = dayStart(Date.now());
    let s = 0;
    for (const session of sessions) {
      const diff = Math.round((todayMs - dayStart(session.date)) / DAY);
      if (diff === s) s++;
      else if (diff > s) break;
    }
    return s;
  }, [sessions]);

  const streakStartTs = useMemo(() => {
    if (streak <= 1) return null;
    const d = new Date();
    d.setDate(d.getDate() - streak + 1);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, [streak]);

  const daysSinceFirst = useMemo(() => {
    if (sessions.length === 0) return 0;
    const oldest = sessions[sessions.length - 1].date;
    return Math.max(1, Math.round((Date.now() - oldest) / DAY) + 1);
  }, [sessions]);

  const modes: ModeKey[] = ['partida', 'alvo', 'sequencia', 'radar'];

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: TOP + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>HISTÓRICO</Text>

        {/* ── 4 summary cards ── */}
        <View style={styles.summaryGrid}>

          <View style={styles.summaryCell}>
            {bestRtSession ? (
              <>
                <Text style={[styles.sumVal, { color: getLevelForMode(bestRtSession.bestTime, bestRtSession.mode).color }]}>
                  {bestRtSession.bestTime} ms
                </Text>
                <Text style={styles.sumSubtitle}>
                  {MODE_LABELS[bestRtSession.mode]} · {formatRelativeDate(bestRtSession.date)}
                </Text>
              </>
            ) : (
              <Text style={[styles.sumVal, { color: '#4a5a7b' }]}>—</Text>
            )}
            <Text style={styles.sumLbl}>MELHOR TEMPO REFLEXO</Text>
          </View>

          <View style={styles.summaryCell}>
            {mostPlayed ? (
              <>
                <Text style={[styles.sumVal, styles.sumValMd, { color: MODE_COLORS[mostPlayed].accent }]}>
                  {MODE_LABELS[mostPlayed]}
                </Text>
                <Text style={styles.sumSubtitle}>
                  {modeCounts[mostPlayed]} de {sessions.length} sessões
                </Text>
              </>
            ) : (
              <Text style={[styles.sumVal, { color: '#4a5a7b' }]}>—</Text>
            )}
            <Text style={styles.sumLbl}>MAIS JOGADO</Text>
          </View>

          <View style={styles.summaryCell}>
            <Text style={[styles.sumVal, { color: streak > 0 ? '#f59e0b' : '#4a5a7b' }]}>
              {streak} {streak === 1 ? 'dia' : 'dias'}
            </Text>
            {streakStartTs ? (
              <Text style={styles.sumSubtitle}>🔥 desde {formatShortDate(streakStartTs)}</Text>
            ) : streak === 1 ? (
              <Text style={styles.sumSubtitle}>🔥 desde hoje</Text>
            ) : null}
            <Text style={styles.sumLbl}>STREAK ATUAL</Text>
          </View>

          <View style={styles.summaryCell}>
            <Text style={styles.sumVal}>{sessions.length}</Text>
            <Text style={styles.sumSubtitle}>
              {sessions.length > 0 ? `sessões em ${daysSinceFirst} dias` : 'nenhuma sessão'}
            </Text>
            <Text style={styles.sumLbl}>TOTAL</Text>
          </View>
        </View>

        {/* ── Evolução por modo ── */}
        <Text style={styles.sectionTitle}>EVOLUÇÃO POR MODO</Text>
        {modes.map(m => (
          <ModeStatsCard
            key={m}
            mode={m}
            sessions={sessions}
            expanded={expanded[m]}
            onToggle={() => setExpanded(prev => ({ ...prev, [m]: !prev[m] }))}
          />
        ))}

        {/* ── Conquistas ── */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>CONQUISTAS</Text>
        <ConquistasContent sessions={sessions} showHeader={false} />

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b1220' },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  pageTitle: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 4, marginBottom: 20 },
  sectionTitle: { fontSize: 10, fontWeight: '700', color: '#3a4a6b', letterSpacing: 2.5, marginBottom: 10 },

  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  summaryCell: {
    width: '47.5%',
    backgroundColor: '#111a2e', borderRadius: 12,
    padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    gap: 2,
  },
  sumVal: { fontSize: 20, fontWeight: '800', color: '#fff' },
  sumValMd: { fontSize: 16 },
  sumSubtitle: { fontSize: 11, color: '#4a5a7b', lineHeight: 16 },
  sumLbl: { fontSize: 9, fontWeight: '700', color: '#3a4a6b', letterSpacing: 1.5, marginTop: 4 },

  // ── Mode card ─────────────────────────────────────────────────────────────
  modeCard: {
    backgroundColor: '#111a2e', borderRadius: 12, borderWidth: 1,
    marginBottom: 10, overflow: 'hidden',
  },
  modeCardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
  },
  modeIconBox: {
    width: 44, height: 44, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  modeIconText: { fontSize: 20 },
  modeName: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  modeHeaderRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' },
  modeBest: { fontSize: 17, fontWeight: '900', letterSpacing: -0.5 },
  modeBestSecondary: { fontSize: 14, fontWeight: '800', letterSpacing: -0.3 },
  modeBestSub: { fontSize: 10, color: '#4a5a7b', fontWeight: '600', letterSpacing: 0.5 },
  modeBestDot: { fontSize: 12, color: '#2d3a55', marginHorizontal: 2 },
  levelMini: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  levelMiniText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  trendBadge: { fontSize: 11, fontWeight: '700' },
  modeEmpty: { fontSize: 11, color: '#4a5a7b' },
  modeChevron: { fontSize: 12, fontWeight: '800', marginLeft: 'auto' as any },

  modeBody: {
    paddingHorizontal: 14, paddingBottom: 14, paddingTop: 4,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
    gap: 8,
  },
  modeRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    paddingTop: 8,
  },
  modeRowLabel: { fontSize: 12, color: '#4a5a7b' },
  modeRowValue: { fontSize: 13, fontWeight: '700', color: '#fff' },
  modeRowSub: { fontSize: 11, color: '#4a5a7b', fontWeight: '600' },
  modeFootnote: { fontSize: 10, color: '#3a4a6b', marginTop: 6, fontStyle: 'italic' },
});
