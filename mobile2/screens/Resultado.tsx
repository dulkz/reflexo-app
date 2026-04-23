import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, StatusBar as RNStatusBar,
} from 'react-native';
import { getLevelInfo, computeScore, LEVELS, MODE_COLORS, ModeKey } from '../utils/levels';
import LevelBadge from '../components/LevelBadge';
import { RoundResult } from './ModoAlvo';
import { SeqSummary } from './ModoSequencia';

const TOP = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 44;
const FALSE_START = 300;

// ── Scale bar ────────────────────────────────────────────────────────────────

const SCALE_STOPS = [
  { ms: 150, color: '#8b5cf6' },
  { ms: 200, color: '#10b981' },
  { ms: 250, color: '#3b82f6' },
  { ms: 300, color: '#06b6d4' },
  { ms: 400, color: '#f59e0b' },
  { ms: 500, color: '#ef4444' },
];
const SCALE_MIN = 100;
const SCALE_MAX = 500;

function ScaleBar({ score }: { score: number }) {
  const pct = Math.min(1, Math.max(0, (score - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)));
  const level = getLevelInfo(score);
  return (
    <View style={sb.wrapper}>
      <View style={sb.track}>
        {SCALE_STOPS.map((stop, i) => {
          const prevMs = i === 0 ? SCALE_MIN : SCALE_STOPS[i - 1].ms;
          const w = ((stop.ms - prevMs) / (SCALE_MAX - SCALE_MIN)) * 100;
          return (
            <View key={stop.ms} style={[sb.segment, { width: `${w}%`, backgroundColor: stop.color + '44' }]} />
          );
        })}
        <View style={[sb.marker, { left: `${pct * 100}%` }]}>
          <Text style={[sb.markerLabel, { color: level.color }]}>VOCÊ</Text>
          <View style={[sb.markerLine, { backgroundColor: level.color }]} />
        </View>
      </View>
      <View style={sb.labels}>
        <Text style={sb.labelText}>{'<150'}</Text>
        <Text style={sb.labelText}>250</Text>
        <Text style={sb.labelText}>{'400+'}</Text>
      </View>
    </View>
  );
}

const sb = StyleSheet.create({
  wrapper: { marginBottom: 20 },
  track: {
    height: 12, borderRadius: 6, backgroundColor: '#1a2540',
    flexDirection: 'row', overflow: 'visible', position: 'relative', marginBottom: 22,
  },
  segment: { height: 12 },
  marker: {
    position: 'absolute', top: -28,
    alignItems: 'center', transform: [{ translateX: -12 }],
  },
  markerLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 2 },
  markerLine: { width: 2, height: 22 },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
  labelText: { fontSize: 10, color: '#2d3a55' },
});

// ── Scale reference list ──────────────────────────────────────────────────────

function ScaleReference({ score }: { score: number }) {
  return (
    <View style={styles.scaleBox}>
      <Text style={styles.sectionTitle}>ESCALA DE REFERÊNCIA</Text>
      {LEVELS.map((lvl, i) => {
        const isUser = score < lvl.maxMs && (i === 0 || score >= LEVELS[i - 1].maxMs);
        const rangeStr = i === 0 ? '< 150 ms'
          : lvl.maxMs === Infinity ? '> 400 ms'
          : `${LEVELS[i - 1].maxMs}–${lvl.maxMs} ms`;
        return (
          <View
            key={lvl.label}
            style={[
              styles.scaleRow,
              isUser && {
                backgroundColor: lvl.bg,
                borderRadius: 10,
                borderWidth: 1.5,
                borderColor: lvl.color + '66',
                paddingHorizontal: 8,
                paddingVertical: 8,
                marginVertical: 2,
              },
            ]}
          >
            <View style={[styles.scaleBar, { backgroundColor: isUser ? lvl.color : '#1a2540', height: isUser ? 36 : 32 }]} />
            <View style={{ flex: 1 }}>
              <View style={styles.scaleLabelRow}>
                <Text style={[styles.scaleLabel, isUser && { color: lvl.color, fontWeight: '900', fontSize: 12 }]}>
                  {lvl.label}
                </Text>
                {isUser && (
                  <View style={[styles.youBadge, { backgroundColor: lvl.color + '33', borderColor: lvl.color + '88' }]}>
                    <Text style={[styles.youBadgeText, { color: lvl.color }]}>◄ VOCÊ</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.scaleDesc, isUser && { color: lvl.color + 'bb' }]}>{lvl.desc}</Text>
            </View>
            <Text style={[styles.scaleRange, isUser && { color: lvl.color, fontWeight: '800' }]}>{rangeStr}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ── Partida result ────────────────────────────────────────────────────────────

interface PartidaProps {
  times: number[];
  onPlayAgain: () => void;
  onHome: () => void;
}

function PartidaResult({ times, onPlayAgain, onHome }: PartidaProps) {
  const { score, bestTime, worst2Indices } = useMemo(() => computeScore(times), [times]);
  const level = getLevelInfo(score);
  const mc = MODE_COLORS.partida;

  const f1Msg = score < 150
    ? 'Incrível — você está ACIMA do nível de piloto de F1!'
    : score < 200
    ? 'Você está no nível dos melhores pilotos de F1!'
    : score < 250
    ? 'Você está dentro da faixa de pilotos de F1.'
    : `${Math.round(score - 200)} ms do nível de piloto de F1.`;

  return (
    <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: TOP + 16 }]} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>MODO PARTIDA</Text>
        <Text style={[styles.heroScore, { color: level.color }]}>{score}</Text>
        <Text style={styles.heroMs}>ms</Text>
        <LevelBadge level={level} />
        <Text style={styles.levelDesc}>{level.desc}</Text>
      </View>

      <ScaleBar score={score} />

      <View style={[styles.benchCard, { borderColor: mc.accent + '44' }]}>
        <Text style={styles.benchIcon}>🏎</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.benchTitle}>{f1Msg}</Text>
          <Text style={styles.benchSub}>Pilotos de F1 largam em 150–250 ms</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={[styles.statVal, { color: level.color }]}>{score} ms</Text>
          <Text style={styles.statLbl}>MÉDIA TOP 5</Text>
        </View>
        <View style={[styles.stat, styles.statMid]}>
          <Text style={[styles.statVal, { color: getLevelInfo(bestTime).color }]}>{bestTime} ms</Text>
          <Text style={styles.statLbl}>MELHOR</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statVal}>{times.length}</Text>
          <Text style={styles.statLbl}>RODADAS</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>TODAS AS RODADAS</Text>
      <Text style={styles.sectionSub}>As 2 piores foram descartadas do score final</Text>
      {times.map((t, i) => {
        const isWorst = worst2Indices.has(i);
        const isFalse = t === FALSE_START;
        const lvl = isFalse ? null : getLevelInfo(t);
        return (
          <View key={i} style={[styles.row, isWorst && styles.rowWorst]}>
            <Text style={[styles.rowIdx, isWorst && styles.dim]}>{i + 1}</Text>
            <View style={{ flex: 1 }}>
              {isFalse ? (
                <Text style={styles.falseText}>FALSA LARGADA</Text>
              ) : (
                <Text style={[styles.rowTime, { color: isWorst ? '#2d3a55' : lvl?.color }]}>{t} ms</Text>
              )}
            </View>
            {isWorst ? (
              <View style={styles.discardPill}><Text style={styles.discardText}>DESCARTADO</Text></View>
            ) : !isFalse && (
              <Text style={[styles.rowLevel, { color: lvl?.color }]}>{lvl?.label}</Text>
            )}
          </View>
        );
      })}

      <ScaleReference score={score} />

      <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: mc.accent }]} onPress={onPlayAgain} activeOpacity={0.8}>
        <Text style={styles.btnPrimaryText}>JOGAR NOVAMENTE</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btnSecondary} onPress={onHome} activeOpacity={0.8}>
        <Text style={styles.btnSecondaryText}>MENU PRINCIPAL</Text>
      </TouchableOpacity>
      <Text style={styles.methodNote}>Score = média das 5 melhores de 7 tentativas.</Text>
    </ScrollView>
  );
}

// ── Alvo result ───────────────────────────────────────────────────────────────

interface AlvoProps {
  alvoResults: RoundResult[];
  score: number;
  onPlayAgain: () => void;
  onHome: () => void;
}

function AlvoResult({ alvoResults, score, onPlayAgain, onHome }: AlvoProps) {
  const level = getLevelInfo(score);
  const mc = MODE_COLORS.alvo;
  const correct = alvoResults.filter(r => r.correct).length;
  const accuracy = Math.round((correct / alvoResults.length) * 100);
  const avgRt = Math.round(alvoResults.reduce((s, r) => s + r.rt, 0) / alvoResults.length);
  const best = Math.min(...alvoResults.map(r => r.rt));

  return (
    <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: TOP + 16 }]} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>MODO ALVO</Text>
        <Text style={[styles.heroScore, { color: level.color }]}>{score}</Text>
        <Text style={styles.heroMs}>ms (penalizado)</Text>
        <LevelBadge level={level} />
      </View>

      <ScaleBar score={score} />

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={[styles.statVal, { color: mc.accent }]}>{accuracy}%</Text>
          <Text style={styles.statLbl}>ACURÁCIA</Text>
        </View>
        <View style={[styles.stat, styles.statMid]}>
          <Text style={[styles.statVal, { color: getLevelInfo(avgRt).color }]}>{avgRt} ms</Text>
          <Text style={styles.statLbl}>MÉDIA RT</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statVal, { color: getLevelInfo(best).color }]}>{best} ms</Text>
          <Text style={styles.statLbl}>MELHOR</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>RODADAS</Text>
      {alvoResults.map((r, i) => (
        <View key={i} style={styles.row}>
          <Text style={styles.rowIdx}>{i + 1}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowTime, { color: r.correct ? getLevelInfo(r.rt).color : '#ef4444' }]}>
              {r.rt} ms {!r.correct && `(+150 → ${r.penalizedRt} ms)`}
            </Text>
          </View>
          <Text style={[styles.rowLevel, { color: r.correct ? '#10b981' : '#ef4444' }]}>
            {r.correct ? '✓' : '✗'}
          </Text>
        </View>
      ))}

      <ScaleReference score={score} />

      <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: mc.accent }]} onPress={onPlayAgain} activeOpacity={0.8}>
        <Text style={styles.btnPrimaryText}>JOGAR NOVAMENTE</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btnSecondary} onPress={onHome} activeOpacity={0.8}>
        <Text style={styles.btnSecondaryText}>MENU PRINCIPAL</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── Sequência result ──────────────────────────────────────────────────────────

interface SeqProps {
  summary: SeqSummary;
  onPlayAgain: () => void;
  onHome: () => void;
}

function SeqResult({ summary, onPlayAgain, onHome }: SeqProps) {
  const { avgRt, accuracy, fatigueIndex, score, hits, misses, commissions, correctInhibits } = summary;
  const level = getLevelInfo(avgRt);
  const mc = MODE_COLORS.sequencia;
  const accPct = Math.round(accuracy * 100);
  const nogoCount = summary.trials.filter(t => t.signalType === 'nogo').length;
  const inhibPct = Math.round((correctInhibits / Math.max(1, nogoCount)) * 100);

  const fatigueColor = fatigueIndex > 15 ? '#ef4444'
    : fatigueIndex > 5 ? '#f59e0b'
    : fatigueIndex < -5 ? '#10b981'
    : '#06b6d4';
  const fatigueLabel = fatigueIndex > 15 ? 'FADIGA SIGNIFICATIVA'
    : fatigueIndex > 5 ? 'LEVE FADIGA'
    : fatigueIndex < -5 ? 'MELHORA PROGRESSIVA'
    : 'ESTÁVEL';

  return (
    <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: TOP + 16 }]} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>MODO SEQUÊNCIA</Text>
        <Text style={[styles.heroScore, { color: level.color }]}>{avgRt}</Text>
        <Text style={styles.heroMs}>ms médio (Go)</Text>
        <LevelBadge level={level} />
      </View>

      <ScaleBar score={avgRt} />

      <View style={[styles.fatigueCard, { borderColor: fatigueColor + '44' }]}>
        <View style={styles.fatigueTop}>
          <Text style={[styles.fatigueVal, { color: fatigueColor }]}>
            {fatigueIndex > 0 ? '+' : ''}{fatigueIndex}%
          </Text>
          <View style={[styles.fatigueBadge, { backgroundColor: fatigueColor + '22' }]}>
            <Text style={[styles.fatigueBadgeText, { color: fatigueColor }]}>{fatigueLabel}</Text>
          </View>
        </View>
        <Text style={styles.fatigueDesc}>
          Índice de fadiga: variação do RT entre a 1ª e 2ª metade da sessão.
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={[styles.statVal, { color: accPct >= 90 ? '#10b981' : '#f59e0b' }]}>{accPct}%</Text>
          <Text style={styles.statLbl}>ACERTOS GO</Text>
        </View>
        <View style={[styles.stat, styles.statMid]}>
          <Text style={[styles.statVal, { color: inhibPct >= 80 ? '#8b5cf6' : '#ef4444' }]}>{inhibPct}%</Text>
          <Text style={styles.statLbl}>INIBIÇÃO</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statVal, { color: commissions === 0 ? '#10b981' : '#ef4444' }]}>{commissions}</Text>
          <Text style={styles.statLbl}>COMISSÕES</Text>
        </View>
      </View>

      <View style={styles.seqSummaryBox}>
        {[
          { label: '✓ Hits (Go correto)', val: hits, color: '#10b981' },
          { label: '✗ Misses (Go ignorado)', val: misses, color: '#ef4444' },
          { label: '⚡ Comissões (NoGo tocado)', val: commissions, color: '#f59e0b' },
          { label: '🧠 Inibições corretas', val: correctInhibits, color: '#8b5cf6' },
        ].map(r => (
          <View key={r.label} style={styles.seqSumRow}>
            <Text style={styles.seqSumLabel}>{r.label}</Text>
            <Text style={[styles.seqSumVal, { color: r.color }]}>{r.val}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>LINHA DO TEMPO</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        <View style={styles.timeline}>
          {summary.trials.map((t, i) => {
            const c = t.responseType === 'hit' ? '#10b981'
              : t.responseType === 'correct_inhibit' ? '#8b5cf6'
              : '#ef4444';
            return (
              <View key={i} style={styles.timelineDot}>
                <View style={[styles.tlDot, { backgroundColor: c }]} />
                <Text style={[styles.tlLabel, { color: c }]}>{t.rt !== null ? t.rt : '—'}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <ScaleReference score={avgRt} />

      <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: mc.accent }]} onPress={onPlayAgain} activeOpacity={0.8}>
        <Text style={[styles.btnPrimaryText, { color: '#fff' }]}>JOGAR NOVAMENTE</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btnSecondary} onPress={onHome} activeOpacity={0.8}>
        <Text style={styles.btnSecondaryText}>MENU PRINCIPAL</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── Unified Resultado ─────────────────────────────────────────────────────────

interface Props {
  mode: ModeKey;
  times?: number[];
  alvoResults?: RoundResult[];
  alvoScore?: number;
  seqSummary?: SeqSummary;
  onPlayAgain: () => void;
  onHome: () => void;
}

export default function Resultado({ mode, times, alvoResults, alvoScore, seqSummary, onPlayAgain, onHome }: Props) {
  return (
    <View style={styles.root}>
      {mode === 'partida' && times && (
        <PartidaResult times={times} onPlayAgain={onPlayAgain} onHome={onHome} />
      )}
      {mode === 'alvo' && alvoResults && alvoScore !== undefined && (
        <AlvoResult alvoResults={alvoResults} score={alvoScore} onPlayAgain={onPlayAgain} onHome={onHome} />
      )}
      {mode === 'sequencia' && seqSummary && (
        <SeqResult summary={seqSummary} onPlayAgain={onPlayAgain} onHome={onHome} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b1220' },
  scroll: { paddingHorizontal: 20, paddingBottom: 48 },

  hero: { alignItems: 'center', paddingVertical: 28, gap: 4 },
  heroLabel: { fontSize: 10, fontWeight: '700', color: '#3a4a6b', letterSpacing: 3, marginBottom: 6 },
  heroScore: { fontSize: 88, fontWeight: '900', letterSpacing: -3, lineHeight: 92 },
  heroMs: { fontSize: 16, fontWeight: '600', color: '#4a5a7b', letterSpacing: 1.5, marginBottom: 10 },
  levelDesc: { fontSize: 12, color: '#4a5a7b', textAlign: 'center', marginTop: 4 },

  benchCard: {
    backgroundColor: '#111a2e', borderRadius: 14, borderWidth: 1,
    flexDirection: 'row', gap: 12, padding: 16, alignItems: 'center', marginBottom: 20,
  },
  benchIcon: { fontSize: 24 },
  benchTitle: { fontSize: 14, fontWeight: '700', color: '#fff', lineHeight: 20 },
  benchSub: { fontSize: 11, color: '#4a5a7b', marginTop: 2 },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 22 },
  stat: {
    flex: 1, backgroundColor: '#111a2e', borderRadius: 12,
    padding: 12, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  statMid: { borderColor: 'rgba(255,255,255,0.1)' },
  statVal: { fontSize: 16, fontWeight: '800', color: '#fff' },
  statLbl: { fontSize: 9, fontWeight: '700', color: '#3a4a6b', letterSpacing: 1.5, marginTop: 4 },

  sectionTitle: { fontSize: 10, fontWeight: '700', color: '#3a4a6b', letterSpacing: 2.5, marginBottom: 4 },
  sectionSub: { fontSize: 11, color: '#2d3a55', marginBottom: 10 },

  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#111a2e', borderRadius: 10,
    paddingVertical: 11, paddingHorizontal: 14,
    marginBottom: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
  },
  rowWorst: { backgroundColor: '#0d1525', borderColor: '#111a2e' },
  rowIdx: { width: 22, fontSize: 12, fontWeight: '600', color: '#4a5a7b' },
  dim: { color: '#2d3a55' },
  rowTime: { fontSize: 17, fontWeight: '800' },
  rowLevel: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  falseText: { fontSize: 15, fontWeight: '800', color: '#ef4444' },
  discardPill: { backgroundColor: '#1a2540', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  discardText: { fontSize: 9, fontWeight: '700', color: '#2d3a55', letterSpacing: 1 },

  scaleBox: {
    backgroundColor: '#0f1829', borderRadius: 14, padding: 14,
    marginTop: 6, marginBottom: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    gap: 4,
  },
  scaleRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 6, paddingHorizontal: 0, marginBottom: 2,
  },
  scaleBar: { width: 4, height: 32, borderRadius: 2, marginRight: 10 },
  scaleLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  scaleLabel: { fontSize: 11, fontWeight: '700', color: '#2d3a55', letterSpacing: 1 },
  scaleDesc: { fontSize: 10, color: '#1a2540', marginTop: 2 },
  scaleRange: { fontSize: 10, fontWeight: '600', color: '#2d3a55', marginLeft: 8 },
  youBadge: {
    borderRadius: 5, borderWidth: 1,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  youBadgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },

  fatigueCard: {
    backgroundColor: '#111a2e', borderRadius: 14, borderWidth: 1,
    padding: 16, marginBottom: 20, gap: 8,
  },
  fatigueTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fatigueVal: { fontSize: 36, fontWeight: '900', letterSpacing: -1 },
  fatigueBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  fatigueBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  fatigueDesc: { fontSize: 12, color: '#4a5a7b', lineHeight: 18 },

  seqSummaryBox: {
    backgroundColor: '#111a2e', borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)', padding: 14, marginBottom: 20, gap: 8,
  },
  seqSumRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  seqSumLabel: { fontSize: 13, color: '#4a5a7b' },
  seqSumVal: { fontSize: 18, fontWeight: '800' },

  timeline: { flexDirection: 'row', gap: 12, paddingHorizontal: 4 },
  timelineDot: { alignItems: 'center', gap: 4 },
  tlDot: { width: 10, height: 10, borderRadius: 5 },
  tlLabel: { fontSize: 10, fontWeight: '600' },

  btnPrimary: { borderRadius: 14, paddingVertical: 18, alignItems: 'center', marginBottom: 10 },
  btnPrimaryText: { fontSize: 15, fontWeight: '800', color: '#000', letterSpacing: 2 },
  btnSecondary: {
    backgroundColor: '#111a2e', borderRadius: 14, paddingVertical: 15,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 24,
  },
  btnSecondaryText: { fontSize: 13, fontWeight: '700', color: '#4a5a7b', letterSpacing: 1.5 },
  methodNote: { fontSize: 11, color: '#2d3a55', textAlign: 'center', lineHeight: 16 },
});
