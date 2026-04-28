import React, { useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, StatusBar as RNStatusBar,
} from 'react-native';
import { getLevelInfo, computeScore, LEVELS, MODE_COLORS, ModeKey } from '../utils/levels';
import LevelBadge from '../components/LevelBadge';
import { RoundResult } from './ModoAlvo';
import { RoundResult as RadarRound } from './ModoRadar';
import { SeqSummary } from './ModoSequencia';
import { SessionRecord } from '../utils/storage';
import { UserProfile } from '../types/user';
import { getNextMilestone, calculateDeltaToNextMilestone } from '../utils/ambition';
import { playSfx } from '../utils/sfx';

const TOP = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 44;
const FALSE_START = 300;

// ── Scale bar ────────────────────────────────────────────────────────────────

const SCALE_STOPS = [
  { ms: 150, color: '#8b5cf6' },
  { ms: 200, color: '#10b981' },
  { ms: 250, color: '#3b82f6' },
  { ms: 300, color: '#06b6d4' },
  { ms: 350, color: '#facc15' },
  { ms: 400, color: '#f59e0b' },
  { ms: 500, color: '#ef4444' },
];
const SCALE_MIN = 100;
const SCALE_MAX = 500;

// ── Choice RT (Modo Alvo) ─────────────────────────────────────────────────────

interface ChoiceLevel { color: string; bg: string; label: string; desc: string }

function getChoiceRTLevel(ms: number): ChoiceLevel {
  if (ms <= 420) return { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'ELITE',        desc: 'Nível de atleta de esporte de raquete' };
  if (ms <= 500) return { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', label: 'MUITO BOM',    desc: 'Adulto jovem saudável (25–40 anos)' };
  if (ms <= 560) return { color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',  label: 'BOM',          desc: 'Adulto médio (40–55 anos)' };
  if (ms <= 700) return { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'ABAIXO',       desc: 'Sob fadiga ou distração' };
  return             { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   label: 'DEVAGAR',      desc: 'Referência de linha de base baixa' };
}

const CHOICE_SCALE_STOPS = [
  { ms: 420, color: '#10b981' },
  { ms: 500, color: '#3b82f6' },
  { ms: 560, color: '#06b6d4' },
  { ms: 700, color: '#f59e0b' },
  { ms: 800, color: '#ef4444' },
];
const CHOICE_SCALE_MIN = 280;
const CHOICE_SCALE_MAX = 800;

const CHOICE_LEVELS = [
  { label: 'ELITE',     maxMs: 420,      color: '#10b981', bg: 'rgba(16,185,129,0.12)', desc: 'Atleta de esporte de raquete · 380–420 ms' },
  { label: 'MUITO BOM', maxMs: 500,      color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', desc: 'Adulto jovem saudável 25–40 · 420–500 ms' },
  { label: 'BOM',       maxMs: 560,      color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',  desc: 'Adulto médio 40–55 · 480–560 ms' },
  { label: 'ABAIXO',    maxMs: 700,      color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', desc: 'Sob fadiga ou distração · 550–700 ms' },
  { label: 'DEVAGAR',   maxMs: Infinity, color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  desc: 'Idosos 65+ · 600–800 ms' },
];

function ChoiceScaleBar({ score }: { score: number }) {
  const pct = Math.min(1, Math.max(0, (score - CHOICE_SCALE_MIN) / (CHOICE_SCALE_MAX - CHOICE_SCALE_MIN)));
  const level = getChoiceRTLevel(score);
  return (
    <View style={sb.wrapper}>
      <View style={sb.track}>
        {CHOICE_SCALE_STOPS.map((stop, i) => {
          const prevMs = i === 0 ? CHOICE_SCALE_MIN : CHOICE_SCALE_STOPS[i - 1].ms;
          const w = ((stop.ms - prevMs) / (CHOICE_SCALE_MAX - CHOICE_SCALE_MIN)) * 100;
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
        <Text style={sb.labelText}>{'<420'}</Text>
        <Text style={sb.labelText}>560</Text>
        <Text style={sb.labelText}>{'800+'}</Text>
      </View>
    </View>
  );
}

// ── Seq RT scale reference ────────────────────────────────────────────────────

const SEQ_LEVELS = [
  { label: 'ELITE',     maxMs: 250,      color: '#10b981', bg: 'rgba(16,185,129,0.12)', desc: 'Jogador de esporte coletivo de alto nível' },
  { label: 'MUITO BOM', maxMs: 320,      color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', desc: 'Adulto jovem treinado' },
  { label: 'BOM',       maxMs: 380,      color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',  desc: 'Adulto saudável 30–50 anos' },
  { label: 'MÉDIO',     maxMs: 450,      color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', desc: 'Nível médio da população geral' },
  { label: 'ABAIXO',    maxMs: 550,      color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', desc: 'Sob fadiga ou distração leve' },
  { label: 'DEVAGAR',   maxMs: Infinity, color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  desc: 'Sob alta carga cognitiva ou fadiga' },
];

function SeqScaleReference({ score }: { score: number }) {
  return (
    <View style={styles.scaleBox}>
      <Text style={styles.sectionTitle}>ESCALA DE REFERÊNCIA — SEQUÊNCIA</Text>
      {SEQ_LEVELS.map((lvl, i) => {
        const isUser = score < lvl.maxMs && (i === 0 || score >= SEQ_LEVELS[i - 1].maxMs);
        const rangeStr = i === 0 ? '< 250 ms'
          : lvl.maxMs === Infinity ? '> 550 ms'
          : `${SEQ_LEVELS[i - 1].maxMs}–${lvl.maxMs} ms`;
        return (
          <View
            key={lvl.label}
            style={[
              styles.scaleRow,
              isUser && {
                backgroundColor: lvl.bg,
                borderRadius: 10, borderWidth: 1.5,
                borderColor: lvl.color + '66',
                paddingHorizontal: 8, paddingVertical: 8, marginVertical: 2,
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

function ChoiceScaleReference({ score }: { score: number }) {
  return (
    <View style={styles.scaleBox}>
      <Text style={styles.sectionTitle}>ESCALA CHOICE RT — MODO ALVO</Text>
      {CHOICE_LEVELS.map((lvl, i) => {
        const isUser = score <= lvl.maxMs && (i === 0 || score > CHOICE_LEVELS[i - 1].maxMs);
        return (
          <View
            key={lvl.label}
            style={[
              styles.scaleRow,
              isUser && {
                backgroundColor: lvl.bg,
                borderRadius: 10, borderWidth: 1.5,
                borderColor: lvl.color + '66',
                paddingHorizontal: 8, paddingVertical: 8, marginVertical: 2,
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
          </View>
        );
      })}
    </View>
  );
}

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
        <Text style={sb.labelText}>300</Text>
        <Text style={sb.labelText}>{'500+'}</Text>
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
        const rangeStr = i === 0 ? `< ${lvl.maxMs} ms`
          : lvl.maxMs === Infinity ? `> ${LEVELS[i - 1].maxMs} ms`
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

// ── Journey progress card ─────────────────────────────────────────────────────

interface JourneyCardProps {
  sessions: SessionRecord[];
  userProfile: UserProfile;
  currentSessionScore: number;
}

function JourneyProgressCard({ sessions, userProfile, currentSessionScore }: JourneyCardProps) {
  if (!userProfile.triageCompleted || !userProfile.ambitionId) return null;

  const partidaSessions = sessions.filter(s => s.mode === 'partida');
  const currentBestMs = partidaSessions.length > 0
    ? Math.min(...partidaSessions.map(s => s.score))
    : currentSessionScore;
  const isNewRecord = currentSessionScore <= currentBestMs;

  useEffect(() => {
    if (isNewRecord) playSfx('record');
  // fires once on mount — card only mounts once per game session
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nextMilestone = getNextMilestone(
    userProfile.baselineMs,
    currentBestMs,
    userProfile.ambitionId,
    sessions,
  );

  const delta = calculateDeltaToNextMilestone(
    currentBestMs,
    userProfile.ambitionId,
    userProfile.baselineMs,
    sessions,
  );

  const allBeaten = nextMilestone === null;

  const baseline = userProfile.baselineMs ?? currentBestMs;
  const targetMs =
    !allBeaten && nextMilestone && nextMilestone.type !== 'qualitative' && nextMilestone.ms !== undefined
      ? nextMilestone.ms
      : null;

  let fillPct = 0;
  if (allBeaten) {
    fillPct = 1;
  } else if (targetMs !== null && baseline > targetMs) {
    fillPct = Math.min(1, Math.max(0, (baseline - currentBestMs) / (baseline - targetMs)));
  }

  const fillWidth = `${Math.round(fillPct * 100)}%` as `${number}%`;

  return (
    <View style={jc.wrapper}>
      <View style={jc.separator} />
      <View style={jc.card}>
        <Text style={jc.label}>SUA JORNADA</Text>
        <Text style={jc.bestRow}>
          {'🏆 Seu melhor: '}<Text style={jc.bestMs}>{currentBestMs} ms</Text>
        </Text>
        {isNewRecord && (
          <View style={jc.recordBadge}>
            <Text style={jc.recordText}>🎉 NOVO RECORDE!</Text>
          </View>
        )}
        {allBeaten ? (
          <Text style={jc.completeText}>🏁 Jornada completa!</Text>
        ) : (
          <Text style={jc.nextMeta}>
            {nextMilestone && nextMilestone.type !== 'qualitative' && nextMilestone.ms !== undefined
              ? `Próxima meta: ${nextMilestone.ms} ms${delta !== null ? ` — faltam ${delta} ms` : ''}`
              : nextMilestone?.label ?? ''}
          </Text>
        )}
        <View style={jc.barTrack}>
          <View style={[jc.barFill, { width: fillWidth }]} />
        </View>
      </View>
    </View>
  );
}

// ── Partida result ────────────────────────────────────────────────────────────

interface PartidaProps {
  times: number[];
  onPlayAgain: () => void;
  onHome: () => void;
  sessions: SessionRecord[];
  userProfile: UserProfile;
}

function PartidaResult({ times, onPlayAgain, onHome, sessions, userProfile }: PartidaProps) {
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

      <JourneyProgressCard sessions={sessions} userProfile={userProfile} currentSessionScore={score} />

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
  sessions: SessionRecord[];
  userProfile: UserProfile;
}

function AlvoResult({ alvoResults, score, onPlayAgain, onHome, sessions, userProfile }: AlvoProps) {
  const level = getChoiceRTLevel(score);
  const mc = MODE_COLORS.alvo;
  const hitsAlvo = alvoResults.filter(r => r.correct);
  const correct = hitsAlvo.length;
  const accuracy = Math.round((correct / alvoResults.length) * 100);
  const avgRt = hitsAlvo.length > 0
    ? Math.round(hitsAlvo.reduce((s, r) => s + r.rt, 0) / hitsAlvo.length)
    : Math.round(alvoResults.reduce((s, r) => s + r.rt, 0) / alvoResults.length);
  const best = hitsAlvo.length > 0
    ? Math.min(...hitsAlvo.map(r => r.rt))
    : Math.min(...alvoResults.map(r => r.rt));
  const worstRt = Math.max(...alvoResults.map(r => r.rt));
  const variation = worstRt - best;
  const consistencyTarget = best + 100;

  const choiceBenchMsg = score <= 420
    ? 'Você está no nível de atletas de esporte de raquete!'
    : score <= 500
    ? `${score - 420} ms do nível de atleta de raquete (ELITE)`
    : score <= 560
    ? `${score - 500} ms do nível de adulto jovem saudável`
    : `Continue treinando — próximo nível: ${score <= 700 ? 'BOM (até 560 ms)' : 'ABAIXO (até 700 ms)'}`;

  return (
    <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: TOP + 16 }]} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>MODO ALVO</Text>
        <Text style={[styles.heroScore, { color: level.color }]}>{score}</Text>
        <Text style={styles.heroMs}>ms (penalizado)</Text>
        <View style={[styles.choiceBadge, { backgroundColor: level.bg, borderColor: level.color + '66' }]}>
          <Text style={[styles.choiceBadgeText, { color: level.color }]}>{level.label}</Text>
        </View>
        <Text style={styles.levelDesc}>{level.desc}</Text>
      </View>

      <ChoiceScaleBar score={score} />

      {variation > 200 && (
        <View style={styles.consistencyCard}>
          <Text style={styles.consistencyTitle}>Sua consistência é o próximo nível</Text>
          <Text style={styles.consistencyLine}>
            {`Melhor rodada: ${best}ms · Pior rodada: ${worstRt}ms · Variação: ${variation}ms`}
          </Text>
          <Text style={styles.consistencyLine}>
            Seu cérebro já sabe reagir rápido — agora treine fazer isso sempre
          </Text>
          <Text style={styles.consistencyMeta}>
            {`Tente manter todas as rodadas abaixo de ${consistencyTarget}ms`}
          </Text>
        </View>
      )}

      <View style={[styles.benchCard, { borderColor: mc.accent + '44' }]}>
        <Text style={styles.benchIcon}>🎯</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.benchTitle}>{choiceBenchMsg}</Text>
          <Text style={styles.benchSub}>Choice RT · Identificação de cor sob pressão</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={[styles.statVal, { color: mc.accent }]}>{accuracy}%</Text>
          <Text style={styles.statLbl}>ACURÁCIA</Text>
        </View>
        <View style={[styles.stat, styles.statMid]}>
          <Text style={[styles.statVal, { color: getChoiceRTLevel(avgRt).color }]}>{avgRt} ms</Text>
          <Text style={styles.statLbl}>MÉDIA RT</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statVal, { color: getChoiceRTLevel(best).color }]}>{best} ms</Text>
          <Text style={styles.statLbl}>MELHOR</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>RODADAS</Text>
      {alvoResults.map((r, i) => (
        <View key={i} style={styles.row}>
          <Text style={styles.rowIdx}>{i + 1}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowTime, { color: r.correct ? getChoiceRTLevel(r.rt).color : '#ef4444' }]}>
              {r.rt} ms {!r.correct && `(+150 → ${r.penalizedRt} ms)`}
            </Text>
          </View>
          <Text style={[styles.rowLevel, { color: r.correct ? '#10b981' : '#ef4444' }]}>
            {r.correct ? '✓' : '✗'}
          </Text>
        </View>
      ))}

      <ChoiceScaleReference score={score} />

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
  sessions: SessionRecord[];
  userProfile: UserProfile;
}

function SeqResult({ summary, onPlayAgain, onHome, sessions, userProfile }: SeqProps) {
  const { avgRt, accuracy, fatigueIndex, score, hits, misses, commissions, correctInhibits, noGoErrors, noGoAccuracy } = summary;
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
      {summary.suspiciousSpam && (
        <View style={styles.spamBanner}>
          <Text style={styles.spamBannerText}>
            ⚠️ Detectamos toques muito rápidos nessa sessão — resultado não salvo.
          </Text>
        </View>
      )}
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>MODO SEQUÊNCIA</Text>
        <Text style={[styles.heroScore, { color: level.color }]}>{avgRt}</Text>
        <Text style={styles.heroMs}>ms médio (Go)</Text>
        <LevelBadge level={level} />
        <View style={styles.inhibRow}>
          <Text style={styles.inhibText}>
            🧠 Controle inibitório: {noGoAccuracy}% · {noGoErrors} {noGoErrors === 1 ? 'erro' : 'erros'}
          </Text>
        </View>
        {(summary.earlyTapCount ?? 0) > 0 && (
          <Text style={styles.earlyTapLine}>
            ❌ Antecipações: {summary.earlyTapCount} × +150ms
          </Text>
        )}
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
          <Text style={styles.statLbl}>ERROS INIBIÇÃO</Text>
        </View>
      </View>

      <View style={styles.seqSummaryBox}>
        {[
          { label: '✓ Hits (Go correto)', val: hits, color: '#10b981' },
          { label: '✗ Misses (Go ignorado)', val: misses, color: '#ef4444' },
          { label: '⚡ Erros de inibição (NoGo tocado)', val: commissions, color: '#f59e0b' },
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
            const ep = t.earlyPenalty ?? 0;
            const hasEarly = ep > 0;
            const c = t.responseType === 'hit' ? '#10b981'
              : t.responseType === 'correct_inhibit' ? (hasEarly ? '#f59e0b' : '#8b5cf6')
              : '#ef4444';
            // Base label per scenario, then append early annotation if applicable
            // Scenario A: Go hit (± early)
            // Scenario B: NoGo correct inhibit + early penalty only
            // Scenario C: NoGo commission (± early)
            const baseLabel =
              t.responseType === 'hit' ? `${t.rt}ms`
              : t.responseType === 'miss' ? '400ms (timeout)'
              : t.responseType === 'commission' ? '400ms (NoGo)'
              : '—'; // correct_inhibit without early
            const earlyLabel = t.responseType === 'correct_inhibit'
              ? `+${ep}ms ⚡` // Scenario B: only early penalty
              : `${baseLabel} +${ep}⚡`;
            const label = hasEarly ? earlyLabel : baseLabel;
            return (
              <View key={i} style={styles.timelineDot}>
                <View style={[styles.tlDot, { backgroundColor: c }]} />
                <Text style={[styles.tlLabel, { color: c }]}>{label}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <SeqScaleReference score={avgRt} />

      <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: mc.accent }]} onPress={onPlayAgain} activeOpacity={0.8}>
        <Text style={[styles.btnPrimaryText, { color: '#fff' }]}>JOGAR NOVAMENTE</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btnSecondary} onPress={onHome} activeOpacity={0.8}>
        <Text style={styles.btnSecondaryText}>MENU PRINCIPAL</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── Radar result ──────────────────────────────────────────────────────────────

interface RadarProps {
  radarResults: RadarRound[];
  score: number;
  onPlayAgain: () => void;
  onHome: () => void;
}

function RadarResult({ radarResults, score, onPlayAgain, onHome }: RadarProps) {
  const level = getLevelInfo(score);
  const mc = MODE_COLORS.radar;
  const hits = radarResults.filter(r => r.hit);
  const timeoutCount = radarResults.filter(r => r.timeout).length;
  const missCount = radarResults.filter(r => !r.hit && !r.timeout).length;
  const accuracy = Math.round((hits.length / radarResults.length) * 100);
  const bestHit = hits.length > 0 ? Math.min(...hits.map(r => r.rt)) : null;

  return (
    <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: TOP + 16 }]} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>MODO RADAR</Text>
        <Text style={[styles.heroScore, { color: level.color }]}>{score}</Text>
        <Text style={styles.heroMs}>ms (média dos acertos)</Text>
        <LevelBadge level={level} />
        <Text style={styles.levelDesc}>{level.desc}</Text>
      </View>

      <ScaleBar score={score} />

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={[styles.statVal, { color: mc.accent }]}>{accuracy}%</Text>
          <Text style={styles.statLbl}>ACURÁCIA</Text>
        </View>
        <View style={[styles.stat, styles.statMid]}>
          <Text style={[styles.statVal, { color: bestHit !== null ? getLevelInfo(bestHit).color : '#4a5a7b' }]}>
            {bestHit !== null ? `${bestHit} ms` : '—'}
          </Text>
          <Text style={styles.statLbl}>MELHOR HIT</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statVal}>{hits.length}/{radarResults.length}</Text>
          <Text style={styles.statLbl}>ACERTOS</Text>
        </View>
      </View>

      {missCount > 0 && (
        <Text style={styles.earlyTapLine}>
          ❌ Erros: {missCount} (+200ms avg)
        </Text>
      )}
      {timeoutCount > 0 && (
        <Text style={styles.earlyTapLine}>
          ⏱ {timeoutCount} timeout{timeoutCount > 1 ? 's' : ''} (sem toque a tempo)
        </Text>
      )}

      <Text style={styles.sectionTitle}>RODADAS</Text>
      {radarResults.map((r, i) => {
        const icon = r.hit ? '✓' : r.timeout ? '⏱' : '✗';
        const iconColor = r.hit ? '#10b981' : '#ef4444';
        const rtColor = r.hit ? getLevelInfo(r.rt).color : '#2d3a55';
        const rtText = r.timeout ? '— timeout' : `${r.rt} ms`;
        return (
          <View key={i} style={styles.row}>
            <Text style={styles.rowIdx}>{i + 1}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTime, { color: rtColor }]}>{rtText}</Text>
            </View>
            <Text style={[styles.rowLevel, { color: iconColor }]}>{icon}</Text>
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
      <Text style={styles.methodNote}>Score = média dos RTs das rodadas com acerto.</Text>
    </ScrollView>
  );
}

// ── Unified Resultado ─────────────────────────────────────────────────────────

interface Props {
  mode: ModeKey;
  times?: number[];
  alvoResults?: RoundResult[];
  alvoScore?: number;
  radarResults?: RadarRound[];
  radarScore?: number;
  seqSummary?: SeqSummary;
  onPlayAgain: () => void;
  onHome: () => void;
  sessions: SessionRecord[];
  userProfile: UserProfile;
}

export default function Resultado({ mode, times, alvoResults, alvoScore, radarResults, radarScore, seqSummary, onPlayAgain, onHome, sessions, userProfile }: Props) {
  return (
    <View style={styles.root}>
      {mode === 'partida' && times && (
        <PartidaResult times={times} onPlayAgain={onPlayAgain} onHome={onHome} sessions={sessions} userProfile={userProfile} />
      )}
      {mode === 'alvo' && alvoResults && alvoScore !== undefined && (
        <AlvoResult alvoResults={alvoResults} score={alvoScore} onPlayAgain={onPlayAgain} onHome={onHome} sessions={sessions} userProfile={userProfile} />
      )}
      {mode === 'sequencia' && seqSummary && (
        <SeqResult summary={seqSummary} onPlayAgain={onPlayAgain} onHome={onHome} sessions={sessions} userProfile={userProfile} />
      )}
      {mode === 'radar' && radarResults && radarScore !== undefined && (
        <RadarResult radarResults={radarResults} score={radarScore} onPlayAgain={onPlayAgain} onHome={onHome} />
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

  inhibRow: {
    marginTop: 10,
    backgroundColor: 'rgba(139,92,246,0.12)',
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)',
    paddingHorizontal: 14, paddingVertical: 6,
  },
  inhibText: { fontSize: 12, fontWeight: '700', color: '#8b5cf6', letterSpacing: 0.3 },
  earlyTapLine: { fontSize: 11, color: '#4a5a7b', marginTop: 6, textAlign: 'center' },

  choiceBadge: {
    borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 5, marginTop: 6,
  },
  choiceBadgeText: { fontSize: 13, fontWeight: '900', letterSpacing: 1.5 },

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

  consistencyCard: {
    backgroundColor: '#0d1f35', borderRadius: 14, borderWidth: 1,
    borderColor: '#06b6d450', padding: 16, marginBottom: 20, gap: 8,
  },
  consistencyTitle: { fontSize: 14, fontWeight: '800', color: '#fff' },
  consistencyLine: { fontSize: 12, color: '#4a5a7b', lineHeight: 18 },
  consistencyMeta: { fontSize: 12, fontWeight: '700', color: '#06b6d4' },

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

  spamBanner: {
    backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: 10, borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.35)', padding: 14, marginBottom: 16,
  },
  spamBannerText: { fontSize: 13, fontWeight: '700', color: '#ef4444', lineHeight: 20 },
});

const jc = StyleSheet.create({
  wrapper: { marginTop: 20 },
  separator: { height: 1, backgroundColor: '#1a2a4a', marginBottom: 12 },
  card: { backgroundColor: '#111a2e', borderRadius: 12, padding: 16 },
  label: { fontSize: 10, fontWeight: '700', color: '#4a5a7b', letterSpacing: 2, marginBottom: 8 },
  bestRow: { fontSize: 14, color: '#8a9ab8', marginBottom: 4 },
  bestMs: { fontSize: 14, fontWeight: '800', color: '#fff' },
  recordBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f59e0b', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5, marginBottom: 8,
  },
  recordText: { fontSize: 12, fontWeight: '800', color: '#0b1220' },
  completeText: { fontSize: 13, fontWeight: '700', color: '#f59e0b', marginBottom: 10 },
  nextMeta: { fontSize: 12, color: '#4a5a7b', marginBottom: 10 },
  barTrack: {
    height: 6, borderRadius: 3,
    backgroundColor: '#1a2540', overflow: 'hidden', marginTop: 4,
  },
  barFill: { height: 6, borderRadius: 3, backgroundColor: '#3b82f6' },
});
