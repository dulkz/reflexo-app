import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { getAmbition, getMilestonesState, MilestoneState } from '../utils/ambition';
import { SessionRecord } from '../utils/storage';

interface Props {
  ambitionId: string;
  baselineMs: number;
  currentBestMs?: number | null;
  compact?: boolean;
  sessions?: SessionRecord[];
  // When true, shows "Você está aqui" pill at the baseline node (for triage flow where no
  // real-session progress exists yet). When false/omitted with currentBestMs, shows
  // "Sua melhor: N ms" pill at the first pending milestone instead.
  showYouAreHere?: boolean;
  // When true, suprime o footer card "JORNADA COMPLETA" para que o pai renderize
  // seu próprio card interativo (usado em Jornada.tsx).
  hideCompletionCard?: boolean;
}

export default function JourneyMap({
  ambitionId,
  baselineMs,
  currentBestMs,
  compact = false,
  sessions,
  showYouAreHere,
  hideCompletionCard = false,
}: Props) {
  const ambition = getAmbition(ambitionId);
  if (!ambition) return null;

  // Normalize optional prop to null so comparisons are safe throughout
  const best: number | null = currentBestMs ?? null;

  const states: MilestoneState[] = getMilestonesState(baselineMs, best, ambitionId, sessions);

  const nextState = states.find(s => s.status === 'pendente');
  const nextMilestone = nextState?.milestone ?? null;
  const allBeaten = nextMilestone === null;

  // Delta = how many ms the user must shave off to reach the next milestone (positive = pending)
  const deltaToNext =
    nextMilestone && nextMilestone.type !== 'qualitative' && nextMilestone.ms !== undefined
      ? Math.round((best ?? baselineMs) - nextMilestone.ms)
      : null;

  // Show "Você está aqui" at baseline when no real progress or explicitly requested
  const pill = showYouAreHere !== undefined
    ? showYouAreHere
    : best === null || best >= baselineMs;

  const nodeSize     = compact ? 22 : 28;
  const finalSize    = compact ? 28 : 36;
  const baseSize     = compact ? 28 : 36;
  const connectorMin = compact ? 20 : 32;
  const contentPb    = compact ? 14 : 28;

  return (
    <View>
      {/* ── Baseline node ── */}
      <View style={s.nodeRow}>
        <View style={s.nodeLineArea}>
          <View style={[
            s.baselineNode,
            { width: baseSize, height: baseSize, borderRadius: baseSize / 2 },
          ]}>
            <Text style={{ fontSize: compact ? 12 : 16 }}>🏁</Text>
          </View>
          <View style={[s.connector, { minHeight: connectorMin }]} />
        </View>
        <View style={[s.nodeContent, { paddingBottom: contentPb }]}>
          <Text style={[s.baselineLabel, compact && s.baselineLabelSm]}>
            {best !== null && best < baselineMs
              ? `Ponto de partida: ${baselineMs} ms`
              : `Baseline: ${baselineMs} ms`}
          </Text>
          {pill && (
            <View style={s.youHerePill}>
              <Text style={s.youHereText}>Você está aqui</Text>
            </View>
          )}
          {best !== null && best !== baselineMs && (
            <Text style={s.baselineBest}>Seu melhor atual: {best} ms</Text>
          )}
        </View>
      </View>

      {/* ── Milestone nodes ── */}
      {states.map(({ milestone: m, status }, i) => {
        const beaten       = status !== 'pendente';
        const byProgress   = status === 'batido_no_progresso';
        const isLast       = i === ambition.milestones.length - 1;
        const isNext       = !beaten && m === nextMilestone;
        const msLabel      = m.type !== 'qualitative' && m.ms !== undefined ? `${m.ms} ms` : null;
        const sz           = isLast ? finalSize : nodeSize;

        return (
          <View key={i} style={s.nodeRow}>
            <View style={s.nodeLineArea}>
              <View style={[
                s.milestoneNode,
                { width: sz, height: sz, borderRadius: sz / 2 },
                beaten && (byProgress ? s.nodeProgress : s.nodeDoneBaseline),
                isLast && s.nodeFinal,
              ]}>
                {beaten
                  ? <Text style={s.nodeCheck}>✓</Text>
                  : isLast
                  ? <SvgXml xml={ambition.icon} width={compact ? 14 : 18} height={compact ? 14 : 18} />
                  : <View style={s.nodeDot} />
                }
              </View>
              {!isLast && (
                <View style={[
                  s.connector,
                  { minHeight: connectorMin },
                  byProgress && s.connectorProgress,
                  beaten && !byProgress && s.connectorDoneBaseline,
                ]} />
              )}
            </View>

            <View style={[
              s.nodeContent,
              { paddingBottom: contentPb },
              beaten && !byProgress && s.nodeContentFaded,
            ]}>
              {msLabel && (
                <Text style={[
                  s.milestoneMs,
                  compact && s.milestoneMsSm,
                  beaten && s.milestoneMsDone,
                  isLast && s.milestoneMsFinal,
                ]}>
                  {msLabel}
                </Text>
              )}
              <Text style={[
                s.milestoneLabel,
                compact && s.milestoneLabelSm,
                beaten && s.milestoneLabelDone,
              ]}>
                {m.label}
              </Text>
              {/* Current position pill: shown at first pending milestone when progress exists */}
              {isNext && !pill && best !== null && (
                <View style={[s.youHerePill, { marginTop: 4 }]}>
                  <Text style={s.youHereText}>Sua melhor: {best} ms</Text>
                </View>
              )}
              {isNext && deltaToNext !== null && deltaToNext > 0 && (
                <Text style={s.deltaText}>faltam {deltaToNext} ms</Text>
              )}
            </View>
          </View>
        );
      })}

      {/* ── Footer card ── */}
      {!allBeaten && nextMilestone ? (
        <View style={[s.nextCard, compact && s.nextCardSm]}>
          <Text style={s.nextCardKicker}>SEU PRÓXIMO ALVO</Text>
          <Text style={[s.nextCardLabel, compact && s.nextCardLabelSm]}>
            {nextMilestone.label}
          </Text>
          {deltaToNext !== null && deltaToNext > 0 && (
            <Text style={s.nextCardDelta}>faltam {deltaToNext} ms</Text>
          )}
        </View>
      ) : allBeaten && !hideCompletionCard ? (
        // Card estático — renderizado apenas quando o pai não fornece o seu próprio
        <View style={[s.nextCard, compact && s.nextCardSm]}>
          <Text style={s.nextCardKicker}>JORNADA COMPLETA</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <SvgXml xml={ambition.icon} width={18} height={18} />
            <Text style={[s.nextCardLabel, compact && s.nextCardLabelSm]}>{ambition.name}</Text>
          </View>
          <Text style={[s.nextCardDelta, { color: '#10b981' }]}>
            ✓ Todos os marcos batidos!
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  nodeRow:      { flexDirection: 'row', gap: 16 },
  nodeLineArea: { alignItems: 'center', width: 40 },

  baselineNode: {
    backgroundColor: '#1a2540', borderWidth: 2, borderColor: '#3b82f6',
    alignItems: 'center', justifyContent: 'center',
  },

  milestoneNode: {
    marginLeft: 2,
    backgroundColor: '#111a2e', borderWidth: 1.5, borderColor: '#2d3a55',
    alignItems: 'center', justifyContent: 'center',
  },
  nodeDoneBaseline: { backgroundColor: '#2d3a55', borderColor: '#2d3a55', opacity: 0.6 },
  nodeProgress:     { backgroundColor: '#10b981', borderColor: '#10b981' },
  nodeFinal:        { borderWidth: 2, borderColor: '#f59e0b' },

  nodeDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2d3a55' },
  nodeCheck: { fontSize: 12, color: '#fff', fontWeight: '900' },

  connector:            { width: 2, flex: 1, backgroundColor: '#1a2540' },
  connectorDoneBaseline: { backgroundColor: '#2d3a55', opacity: 0.5 },
  connectorProgress:    { backgroundColor: '#10b981' },

  nodeContent:      { flex: 1, paddingTop: 4 },
  nodeContentFaded: { opacity: 0.45 },

  baselineLabel:   { fontSize: 16, fontWeight: '800', color: '#fff' },
  baselineLabelSm: { fontSize: 13 },

  youHerePill: {
    marginTop: 4, alignSelf: 'flex-start',
    backgroundColor: 'rgba(59,130,246,0.18)', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  youHereText: { fontSize: 10, fontWeight: '700', color: '#3b82f6', letterSpacing: 1 },

  milestoneMs:      { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  milestoneMsSm:    { fontSize: 14 },
  milestoneMsDone:  { color: '#10b981' },
  milestoneMsFinal: { color: '#f59e0b' },

  milestoneLabel:    { fontSize: 12, color: '#4a5a7b', marginTop: 2, lineHeight: 17 },
  milestoneLabelSm:  { fontSize: 11 },
  milestoneLabelDone: { textDecorationLine: 'line-through' },

  nextCard: {
    backgroundColor: '#111a2e', borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)', padding: 16,
    marginTop: 8, marginBottom: 8,
  },
  nextCardSm:       { padding: 12, marginTop: 4 },
  nextCardKicker:   { fontSize: 9, fontWeight: '700', color: '#3a4a6b', letterSpacing: 2, marginBottom: 6 },
  nextCardLabel:    { fontSize: 14, fontWeight: '700', color: '#fff', lineHeight: 20, marginBottom: 4 },
  nextCardLabelSm:  { fontSize: 12, marginBottom: 2 },
  nextCardDelta:    { fontSize: 13, fontWeight: '700', color: '#3b82f6' },

  baselineBest: {
    fontSize: 11, fontWeight: '700', color: '#10b981',
    marginTop: 4,
  },
  deltaText: {
    fontSize: 11, fontWeight: '700', color: '#3b82f6',
    marginTop: 2,
  },
});
