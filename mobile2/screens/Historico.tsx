import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, StatusBar as RNStatusBar,
} from 'react-native';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import { getLevelInfo, MODE_COLORS, ModeKey } from '../utils/levels';
import { SessionRecord } from '../utils/storage';
import { UserProfile } from '../types/user';
import { getAmbition, getNextMilestone } from '../utils/ambition';

const TOP = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 44;
const DAY = 86_400_000;

// ── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function dayStart(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function formatRelativeDate(ts: number): string {
  const diff = Math.round((dayStart(Date.now()) - dayStart(ts)) / DAY);
  if (diff === 0) return 'hoje';
  if (diff === 1) return 'ontem';
  if (diff < 7) return `há ${diff} dias`;
  const d = new Date(ts);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function formatRelativeDateTime(ts: number): string {
  const d = new Date(ts);
  const time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  const diff = Math.round((dayStart(Date.now()) - dayStart(ts)) / DAY);
  if (diff === 0) return `Hoje, ${time}`;
  if (diff === 1) return `Ontem, ${time}`;
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${time}`;
}

function formatShortDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

// ── Constants ─────────────────────────────────────────────────────────────────

type FilterKey = 'all' | ModeKey;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',       label: 'Todos' },
  { key: 'partida',   label: 'Partida' },
  { key: 'alvo',      label: 'Alvo' },
  { key: 'sequencia', label: 'Sequência' },
];

const MODE_LABELS: Record<ModeKey, string> = {
  partida: 'Partida',
  alvo: 'Alvo',
  sequencia: 'Sequência',
};

const MODE_ICONS: Record<ModeKey, string> = {
  partida:  '🏁',
  alvo:     '🎯',
  sequencia:'📊',
};

// ── EvoChart ──────────────────────────────────────────────────────────────────

interface EvoProps {
  sessions: SessionRecord[];
  filter: FilterKey;
  userProfile?: UserProfile;
}

function EvoChart({ sessions, filter, userProfile }: EvoProps) {
  const W = 320;
  const H = 140;
  const PAD = { t: 20, r: 8, b: 28, l: 40 };
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;

  // Filter sessions for chart based on active filter
  const chartSessions = filter === 'all'
    ? sessions
    : sessions.filter(s => s.mode === (filter as ModeKey));

  const last20 = chartSessions.slice(0, 20).reverse(); // oldest → newest
  if (last20.length < 1) return null;

  const allScores = last20.map(s => s.score);
  const rawMin = Math.min(...allScores);
  const rawMax = Math.max(...allScores);

  const isBrainHealth = userProfile?.triageCompleted &&
    userProfile.ambitionId &&
    getAmbition(userProfile.ambitionId)?.group === 'brain_health';

  // ── Next milestone line (not used for alvo — choice RT scale is different) ─
  let nextMilestoneMs: number | null = null;
  if (filter !== 'alvo' && userProfile?.triageCompleted && userProfile.ambitionId && !isBrainHealth) {
    const currentBestMs = Math.min(...allScores);
    const next = getNextMilestone(
      userProfile.baselineMs ?? null,
      currentBestMs,
      userProfile.ambitionId,
    );
    if (next && next.type !== 'qualitative' && next.ms !== undefined) {
      nextMilestoneMs = next.ms;
    }
  }

  // ── Y scale ────────────────────────────────────────────────────────────────
  let minV: number, maxV: number;
  if (filter === 'alvo') {
    minV = 300; maxV = 800;
  } else if (filter === 'partida' || filter === 'sequencia') {
    minV = 150; maxV = 500;
  } else {
    // 'all': dynamic — include milestone so dashed line stays visible
    const effectiveMin = nextMilestoneMs !== null ? Math.min(rawMin, nextMilestoneMs) : rawMin;
    minV = Math.floor((effectiveMin - 20) / 20) * 20;
    maxV = Math.ceil((rawMax + 20) / 20) * 20;
  }
  const range = maxV - minV || 80;

  // Choice RT reference for alvo (ELITE boundary)
  const choiceRTRef: number | null = filter === 'alvo' ? 420 : null;

  // Simple RT elite reference for partida/sequencia (top of F1/sprinter range)
  const simpleRTRef: number | null = (filter === 'partida' || filter === 'sequencia') ? 200 : null;

  const toY = (v: number) => PAD.t + (1 - (v - minV) / range) * innerH;

  // X: time-based when sessions span ≥ 1 day, else index-based
  const tMin = last20[0].date;
  const tNow = Date.now();
  const timeSpan = tNow - tMin;
  const useTimeBased = timeSpan >= DAY && last20.length > 1;

  const toX = (date: number, idx: number): number => {
    if (last20.length <= 1) return PAD.l + innerW / 2;
    if (useTimeBased) return PAD.l + Math.max(0, Math.min(1, (date - tMin) / timeSpan)) * innerW;
    return PAD.l + (idx / (last20.length - 1)) * innerW;
  };

  const xTicks: { x: number; label: string; anchor: 'start' | 'middle' | 'end' }[] = [];
  if (useTimeBased) {
    xTicks.push({ x: PAD.l + innerW, label: 'hoje', anchor: 'end' });
    const x7 = PAD.l + ((tNow - 7 * DAY - tMin) / timeSpan) * innerW;
    if (x7 > PAD.l + 8 && x7 < PAD.l + innerW - 20)
      xTicks.push({ x: x7, label: '7d', anchor: 'middle' });
    const x15 = PAD.l + ((tNow - 15 * DAY - tMin) / timeSpan) * innerW;
    if (x15 >= PAD.l && x15 < x7 - 20)
      xTicks.push({ x: x15, label: '15d', anchor: 'middle' });
    xTicks.push({ x: PAD.l, label: formatShortDate(tMin), anchor: 'start' });
  } else {
    xTicks.push({ x: PAD.l + innerW / 2, label: 'Hoje', anchor: 'middle' });
  }

  const modes: ModeKey[] = ['partida', 'alvo', 'sequencia'];

  return (
    <View style={chart.wrapper}>
      {/* Brain-health notice (no milestone line for qualitative journeys) */}
      {isBrainHealth && (
        <View style={chart.brainCard}>
          <Text style={chart.brainText}>
            🧠 Sua jornada é de consistência. Continue jogando regularmente.
          </Text>
        </View>
      )}

      <Svg width={W} height={H}>
        {/* Y grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(p => {
          const y = PAD.t + p * innerH;
          const val = Math.round(maxV - p * range);
          return (
            <React.Fragment key={p}>
              <Line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y}
                stroke="#1a2540" strokeWidth={1} />
              <SvgText x={PAD.l - 4} y={y + 4} fontSize={8}
                fill="#2d3a55" textAnchor="end">{val}</SvgText>
            </React.Fragment>
          );
        })}

        {/* X-axis tick labels */}
        {xTicks.map(t => (
          <SvgText key={t.label} x={t.x} y={H - 5} fontSize={8}
            fill="#2d3a55" textAnchor={t.anchor}>{t.label}</SvgText>
        ))}

        {/* Journey milestone dashed line (non-alvo, only if within Y range) */}
        {nextMilestoneMs !== null && nextMilestoneMs >= minV && nextMilestoneMs <= maxV && (
          <React.Fragment>
            <Line
              x1={PAD.l} y1={toY(nextMilestoneMs)}
              x2={W - PAD.r} y2={toY(nextMilestoneMs)}
              stroke="#4a5a7b" strokeWidth={1}
              strokeDasharray="4 3"
            />
            <SvgText
              x={W - PAD.r - 2} y={toY(nextMilestoneMs) - 3}
              fontSize={7} fill="#4a5a7b" textAnchor="end"
            >
              {`Próximo: ${nextMilestoneMs} ms`}
            </SvgText>
          </React.Fragment>
        )}

        {/* Choice RT ELITE reference line (alvo filter only) */}
        {choiceRTRef !== null && (
          <React.Fragment>
            <Line
              x1={PAD.l} y1={toY(choiceRTRef)}
              x2={W - PAD.r} y2={toY(choiceRTRef)}
              stroke="#10b981" strokeWidth={1}
              strokeDasharray="4 3"
            />
            <SvgText
              x={W - PAD.r - 2} y={toY(choiceRTRef) - 3}
              fontSize={7} fill="#10b981" textAnchor="end"
            >
              Elite: 420 ms
            </SvgText>
          </React.Fragment>
        )}

        {/* Simple RT ELITE reference line (partida/sequencia filters) */}
        {simpleRTRef !== null && (
          <React.Fragment>
            <Line
              x1={PAD.l} y1={toY(simpleRTRef)}
              x2={W - PAD.r} y2={toY(simpleRTRef)}
              stroke="#4a5a7b" strokeWidth={1}
              strokeDasharray="4 3"
            />
            <SvgText
              x={W - PAD.r - 2} y={toY(simpleRTRef) - 3}
              fontSize={7} fill="#4a5a7b" textAnchor="end"
            >
              Elite: 200 ms
            </SvgText>
          </React.Fragment>
        )}

        {/* Series — only modes matching the active filter */}
        {(filter === 'all' ? modes : [filter as ModeKey]).map(mode => {
          const mc = MODE_COLORS[mode];
          const modePts = last20
            .map((s, i) => s.mode === mode
              ? { x: toX(s.date, i), y: toY(s.score) }
              : null)
            .filter((p): p is { x: number; y: number } => p !== null);

          if (modePts.length === 0) return null;
          return (
            <React.Fragment key={mode}>
              {modePts.length >= 2 && (
                <Polyline
                  points={modePts.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none" stroke={mc.accent}
                  strokeWidth={2} strokeOpacity={0.85}
                />
              )}
              {modePts.map((p, i) => (
                <Circle key={i} cx={p.x} cy={p.y} r={3.5} fill={mc.accent} />
              ))}
            </React.Fragment>
          );
        })}
      </Svg>

      {filter === 'all' && (
        <View style={chart.legend}>
          {modes.map(m => (
            <View key={m} style={chart.legendItem}>
              <View style={[chart.legendDot, { backgroundColor: MODE_COLORS[m].accent }]} />
              <Text style={chart.legendLabel}>{MODE_LABELS[m]}</Text>
            </View>
          ))}
        </View>
      )}

      {filter === 'all' && (
        <Text style={chart.allModeNote}>
          O Modo Alvo usa escala diferente — selecione-o para ver sua evolução isolada.
        </Text>
      )}
    </View>
  );
}

const chart = StyleSheet.create({
  wrapper: {
    backgroundColor: '#111a2e', borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)', padding: 12, marginBottom: 20,
  },
  brainCard: {
    backgroundColor: 'rgba(16,185,129,0.08)', borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)',
    paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10,
  },
  brainText: { fontSize: 12, color: '#10b981', lineHeight: 18 },
  legend: { flexDirection: 'row', gap: 16, justifyContent: 'center', marginTop: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 10, color: '#4a5a7b' },
  allModeNote: {
    fontSize: 10, color: '#3a4a6b', textAlign: 'center',
    marginTop: 6, lineHeight: 14, paddingHorizontal: 4,
  },
});

// ── Historico ─────────────────────────────────────────────────────────────────

interface Props {
  sessions: SessionRecord[];
  userProfile: UserProfile;
}

export default function Historico({ sessions, userProfile }: Props) {
  const [filter, setFilter] = useState<FilterKey>('all');

  const modeCounts = useMemo((): Record<FilterKey, number> => {
    const c: Record<FilterKey, number> = { all: sessions.length, partida: 0, alvo: 0, sequencia: 0 };
    for (const s of sessions) c[s.mode]++;
    return c;
  }, [sessions]);

  const filtered = useMemo(() =>
    filter === 'all' ? sessions : sessions.filter(s => s.mode === filter),
    [sessions, filter],
  );

  const bestRtSession = useMemo(() => {
    if (sessions.length === 0) return null;
    return sessions.reduce((best, s) => s.bestTime < best.bestTime ? s : best);
  }, [sessions]);

  const { mostPlayed, modeCounts: modeCountsMap } = useMemo(() => {
    const counts: Record<ModeKey, number> = { partida: 0, alvo: 0, sequencia: 0 };
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

  const pbSessionByMode = useMemo(() => {
    const pb: Partial<Record<ModeKey, SessionRecord>> = {};
    for (const s of sessions) {
      if (!pb[s.mode] || s.bestTime < pb[s.mode]!.bestTime) pb[s.mode] = s;
    }
    return pb as Record<ModeKey, SessionRecord | undefined>;
  }, [sessions]);

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
                <Text style={[styles.sumVal, { color: getLevelInfo(bestRtSession.bestTime).color }]}>
                  {bestRtSession.bestTime} ms
                </Text>
                <Text style={styles.sumSubtitle}>
                  {MODE_LABELS[bestRtSession.mode]} · {formatRelativeDate(bestRtSession.date)}
                </Text>
              </>
            ) : (
              <Text style={[styles.sumVal, { color: '#4a5a7b' }]}>—</Text>
            )}
            <Text style={styles.sumLbl}>MELHOR RT</Text>
          </View>

          <View style={styles.summaryCell}>
            {mostPlayed ? (
              <>
                <Text style={[styles.sumVal, styles.sumValMd, { color: MODE_COLORS[mostPlayed].accent }]}>
                  {MODE_LABELS[mostPlayed]}
                </Text>
                <Text style={styles.sumSubtitle}>
                  {modeCountsMap[mostPlayed]} de {sessions.length} sessões
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

        {/* ── Evolution chart ── */}
        {sessions.length >= 1 && (
          <>
            <Text style={styles.sectionTitle}>EVOLUÇÃO</Text>
            <EvoChart sessions={sessions} filter={filter} userProfile={userProfile} />
          </>
        )}

        {/* ── Filter pills with counts ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {FILTERS.map(f => {
            const active = filter === f.key;
            const ac = f.key !== 'all'
              ? MODE_COLORS[f.key as ModeKey].accent
              : '#3b82f6';
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.pill, active && { backgroundColor: ac + '22', borderColor: ac + '66' }]}
                onPress={() => setFilter(f.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.pillText, active && { color: ac }]}>
                  {f.label}
                  <Text style={[styles.pillCount, active && { color: ac + 'bb' }]}>
                    {` · ${modeCounts[f.key]}`}
                  </Text>
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Session list ── */}
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>Nenhuma sessão registrada ainda.</Text>
          </View>
        ) : (
          filtered.map(s => {
            const mc = MODE_COLORS[s.mode];
            const lvl = getLevelInfo(s.score);
            const acc = s.accuracy !== undefined ? Math.round(s.accuracy * 100) : null;
            const isPB = pbSessionByMode[s.mode]?.id === s.id;

            return (
              <View key={s.id} style={styles.sessionCard}>
                <View style={[styles.sessionAccent, { backgroundColor: mc.accent }]} />
                <View style={[styles.sessionIconBox, { backgroundColor: mc.accent + '2a' }]}>
                  <Text style={styles.sessionIconText}>{MODE_ICONS[s.mode]}</Text>
                </View>
                <View style={styles.sessionBody}>
                  <View style={styles.sessionTop}>
                    <Text style={[styles.sessionMode, { color: mc.accent }]}>
                      {MODE_LABELS[s.mode].toUpperCase()}
                    </Text>
                    <Text style={styles.sessionDate}>{formatRelativeDateTime(s.date)}</Text>
                  </View>
                  <View style={styles.sessionStats}>
                    <Text style={[styles.sessionScore, { color: lvl.color }]}>{s.score} ms</Text>
                    <View style={[styles.levelMini, { backgroundColor: lvl.bg }]}>
                      <Text style={[styles.levelMiniText, { color: lvl.color }]}>{lvl.label}</Text>
                    </View>
                    {isPB && (
                      <View style={styles.pbBadge}>
                        <Text style={styles.pbText}>🏆 PB</Text>
                      </View>
                    )}
                    {acc !== null && (
                      <Text style={styles.sessionAcc}>{acc}%</Text>
                    )}
                  </View>
                  {acc !== null && (
                    <View style={styles.accBarBg}>
                      <View style={[styles.accBarFill, { width: `${acc}%`, backgroundColor: mc.accent }]} />
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

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

  filterRow: { marginBottom: 16 },
  pill: {
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14, paddingVertical: 7, marginRight: 8,
    backgroundColor: '#111a2e',
  },
  pillText: { fontSize: 13, fontWeight: '600', color: '#4a5a7b' },
  pillCount: { fontSize: 11, fontWeight: '500', color: '#2d3a55' },

  sessionCard: {
    flexDirection: 'row',
    backgroundColor: '#111a2e', borderRadius: 12,
    marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
    alignItems: 'stretch',
  },
  sessionAccent: { width: 4 },
  sessionIconBox: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  sessionIconText: { fontSize: 20 },
  sessionBody: { flex: 1, padding: 11, paddingLeft: 10, gap: 5 },
  sessionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sessionMode: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  sessionDate: { fontSize: 11, color: '#2d3a55' },
  sessionStats: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  sessionScore: { fontSize: 20, fontWeight: '800' },
  levelMini: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  levelMiniText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  pbBadge: {
    backgroundColor: 'rgba(251,191,36,0.15)',
    borderRadius: 6, borderWidth: 1, borderColor: 'rgba(251,191,36,0.35)',
    paddingHorizontal: 6, paddingVertical: 2,
  },
  pbText: { fontSize: 9, fontWeight: '800', color: '#fbbf24', letterSpacing: 0.5 },
  sessionAcc: { marginLeft: 'auto' as any, fontSize: 13, color: '#4a5a7b' },
  accBarBg: { height: 3, backgroundColor: '#1a2540', borderRadius: 2 },
  accBarFill: { height: 3, borderRadius: 2 },

  emptyState: { alignItems: 'center', paddingTop: 48, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 14, color: '#4a5a7b' },
});
