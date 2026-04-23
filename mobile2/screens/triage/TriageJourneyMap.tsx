import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform, StatusBar as RNStatusBar,
} from 'react-native';
import { getAmbitionById, Milestone } from '../../config/ambitions';

const TOP = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 44;

function isMilestoneBeaten(milestone: Milestone, baselineMs: number): boolean {
  if (milestone.type === 'qualitative') return false;
  return baselineMs <= milestone.ms;
}

interface Props {
  ambitionId: string;
  baselineMs: number;
  onFinish: () => void;
}

export default function TriageJourneyMap({ ambitionId, baselineMs, onFinish }: Props) {
  const ambition = getAmbitionById(ambitionId);
  if (!ambition) return null;

  const milestones = ambition.milestones;

  // First non-beaten milestone = next target
  const nextMilestone = milestones.find(m => !isMilestoneBeaten(m, baselineMs)) ?? milestones[milestones.length - 1];
  const nextDelta = nextMilestone.type !== 'qualitative' && nextMilestone.ms !== undefined
    ? nextMilestone.ms - baselineMs  // negative = already faster
    : null;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: TOP + 12 }]}>
        <View style={{ width: 60 }} />
        <Text style={styles.headerTitle}>SUA JORNADA</Text>
        <View style={{ width: 60 }} />
      </View>
      <Text style={styles.ambitionSub}>{`Rumo a ${ambition.name} ${ambition.icon}`}</Text>

      {/* Map */}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Baseline node (top) */}
        <View style={styles.nodeRow}>
          <View style={styles.nodeLineArea}>
            <View style={styles.baselineNode}>
              <Text style={styles.baselineNodeIcon}>🏁</Text>
            </View>
            <View style={styles.connector} />
          </View>
          <View style={styles.nodeContent}>
            <Text style={styles.baselineLabel}>Baseline: {baselineMs} ms</Text>
            <View style={styles.youHerePill}>
              <Text style={styles.youHereText}>Você está aqui</Text>
            </View>
          </View>
        </View>

        {/* Milestones */}
        {milestones.map((m, i) => {
          const beaten = isMilestoneBeaten(m, baselineMs);
          const isLast = i === milestones.length - 1;
          const msLabel = m.type !== 'qualitative' && m.ms !== undefined ? `${m.ms} ms` : null;

          return (
            <View key={i} style={styles.nodeRow}>
              <View style={styles.nodeLineArea}>
                <View style={[
                  styles.milestoneNode,
                  beaten && styles.milestoneNodeDone,
                  isLast && styles.milestoneNodeFinal,
                ]}>
                  {beaten
                    ? <Text style={styles.nodeCheck}>✓</Text>
                    : isLast
                    ? <Text style={styles.nodeStar}>{ambition.icon}</Text>
                    : <View style={[styles.nodeDot, beaten && styles.nodeDotDone]} />
                  }
                </View>
                {!isLast && <View style={[styles.connector, beaten && styles.connectorDone]} />}
              </View>
              <View style={[styles.nodeContent, beaten && styles.nodeContentDone]}>
                {msLabel && (
                  <Text style={[styles.milestoneMs, beaten && styles.milestoneMsDone, isLast && styles.milestoneMsFinal]}>
                    {msLabel}
                  </Text>
                )}
                <Text style={[styles.milestoneLabel, beaten && styles.milestoneLabelDone]}>
                  {m.label}
                </Text>
              </View>
            </View>
          );
        })}

        {/* Footer card */}
        <View style={styles.nextCard}>
          <Text style={styles.nextCardKicker}>SEU PRÓXIMO ALVO</Text>
          <Text style={styles.nextCardLabel}>{nextMilestone.label}</Text>
          {nextDelta !== null && nextDelta > 0 && (
            <Text style={styles.nextCardDelta}>faltam {nextDelta} ms</Text>
          )}
          {nextDelta !== null && nextDelta <= 0 && (
            <Text style={[styles.nextCardDelta, { color: '#10b981' }]}>✓ Já atingido!</Text>
          )}
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* CTA */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.btnPrimary} onPress={onFinish} activeOpacity={0.8}>
          <Text style={styles.btnPrimaryText}>COMEÇAR A JOGAR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b1220' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 4,
  },
  headerTitle: { fontSize: 13, fontWeight: '800', color: '#fff', letterSpacing: 2 },
  ambitionSub: { fontSize: 13, color: '#4a5a7b', textAlign: 'center', marginBottom: 20, paddingHorizontal: 24 },

  scroll: { paddingHorizontal: 24 },

  nodeRow: { flexDirection: 'row', gap: 16, marginBottom: 0 },
  nodeLineArea: { alignItems: 'center', width: 36 },

  baselineNode: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#1a2540', borderWidth: 2, borderColor: '#3b82f6',
    alignItems: 'center', justifyContent: 'center',
  },
  baselineNodeIcon: { fontSize: 16 },

  milestoneNode: {
    width: 28, height: 28, borderRadius: 14, marginLeft: 4,
    backgroundColor: '#111a2e', borderWidth: 1.5, borderColor: '#2d3a55',
    alignItems: 'center', justifyContent: 'center',
  },
  milestoneNodeDone: { backgroundColor: '#10b981', borderColor: '#10b981' },
  milestoneNodeFinal: {
    width: 36, height: 36, borderRadius: 18, marginLeft: 0,
    borderWidth: 2, borderColor: '#f59e0b',
  },

  nodeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2d3a55' },
  nodeDotDone: { backgroundColor: '#fff' },
  nodeCheck: { fontSize: 12, color: '#fff', fontWeight: '900' },
  nodeStar: { fontSize: 16 },

  connector: { width: 2, flex: 1, backgroundColor: '#1a2540', minHeight: 32 },
  connectorDone: { backgroundColor: '#10b981' },

  nodeContent: { flex: 1, paddingBottom: 28, paddingTop: 4 },
  nodeContentDone: { opacity: 0.5 },

  baselineLabel: { fontSize: 16, fontWeight: '800', color: '#fff' },
  youHerePill: {
    marginTop: 4, alignSelf: 'flex-start',
    backgroundColor: 'rgba(59,130,246,0.2)', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  youHereText: { fontSize: 10, fontWeight: '700', color: '#3b82f6', letterSpacing: 1 },

  milestoneMs: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  milestoneMsDone: { color: '#10b981' },
  milestoneMsFinal: { color: '#f59e0b' },
  milestoneLabel: { fontSize: 12, color: '#4a5a7b', marginTop: 2, lineHeight: 17 },
  milestoneLabelDone: { textDecorationLine: 'line-through' },

  nextCard: {
    backgroundColor: '#111a2e', borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)', padding: 16,
    marginTop: 8, marginBottom: 8,
  },
  nextCardKicker: { fontSize: 9, fontWeight: '700', color: '#3a4a6b', letterSpacing: 2, marginBottom: 6 },
  nextCardLabel: { fontSize: 14, fontWeight: '700', color: '#fff', lineHeight: 20, marginBottom: 4 },
  nextCardDelta: { fontSize: 13, fontWeight: '700', color: '#3b82f6' },

  footer: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 8 },
  btnPrimary: {
    backgroundColor: '#3b82f6', borderRadius: 14,
    paddingVertical: 18, alignItems: 'center',
  },
  btnPrimaryText: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 2 },
});
