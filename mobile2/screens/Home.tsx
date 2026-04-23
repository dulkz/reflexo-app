import React, { useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Platform, StatusBar as RNStatusBar,
} from 'react-native';
import { getLevelInfo, MODE_COLORS, ModeKey } from '../utils/levels';
import { SessionRecord } from '../utils/storage';
import { UserProfile } from '../types/user';
import {
  getAmbition, getNextMilestone, calculateDeltaToNextMilestone, getMilestonesState,
} from '../utils/ambition';

const TOP = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 44;

interface Props {
  onStartPartida: () => void;
  onStartAlvo: () => void;
  onStartSequencia: () => void;
  sessions: SessionRecord[];
  bestByMode: Record<ModeKey, number | null>;
  userProfile: UserProfile;
}

const MODE_INFO = [
  {
    key: 'partida' as ModeKey,
    name: 'MODO PARTIDA',
    icon: '🏎',
    desc: 'Reação simples visual · 7 tentativas',
    sub: 'Top 5 de 7 — descarta as 2 piores',
  },
  {
    key: 'alvo' as ModeKey,
    name: 'MODO ALVO',
    icon: '🎯',
    desc: '4 alvos simultâneos · 10 rodadas',
    sub: 'Acerte o correto — penalidade por erro',
  },
  {
    key: 'sequencia' as ModeKey,
    name: 'MODO SEQUÊNCIA',
    icon: '🧠',
    desc: '20 sinais Go/NoGo · 80% / 20%',
    sub: 'Mede fadiga cognitiva e controle inibitório',
  },
];

export default function Home({
  onStartPartida, onStartAlvo, onStartSequencia,
  sessions, bestByMode, userProfile,
}: Props) {
  // Best score (average top-5) across all sessions — used for milestone comparison
  const currentBestMs = useMemo(
    () => sessions.length > 0 ? Math.min(...sessions.map(s => s.score)) : null,
    [sessions],
  );

  // Gap to top F1 Elite tier (upper bound = 200 ms) — fallback when triage not done
  const f1Gap = currentBestMs !== null ? Math.round(currentBestMs - 200) : null;

  const bestAccByMode = useMemo(() => {
    const acc: Record<ModeKey, number | null> = { partida: null, alvo: null, sequencia: null };
    for (const s of sessions) {
      if (s.accuracy !== undefined) {
        if (acc[s.mode] === null || s.accuracy > acc[s.mode]!) {
          acc[s.mode] = s.accuracy;
        }
      }
    }
    return acc;
  }, [sessions]);

  // ── Motivation card data ────────────────────────────────────────────────────
  const motivData = useMemo(() => {
    if (!userProfile.triageCompleted || !userProfile.ambitionId) return null;

    const ambition = getAmbition(userProfile.ambitionId);
    if (!ambition) return null;

    const baselineMs = userProfile.baselineMs ?? null;

    // Brain-health: qualitative milestones
    if (ambition.group === 'brain_health') {
      const nextM = getNextMilestone(baselineMs, currentBestMs, ambition.id);
      return {
        icon: ambition.icon,
        type: 'qualitative' as const,
        label: nextM ? `Próximo marco: ${nextM.label}` : `Meta ${ambition.name} em andamento`,
        allBeaten: nextM === null,
        ambitionName: ambition.name,
      };
    }

    // Numeric milestones
    const states = getMilestonesState(baselineMs, currentBestMs, ambition.id);
    const allBeaten = states.every(s => s.status !== 'pendente');

    if (allBeaten) {
      return {
        icon: ambition.icon,
        type: 'all_beaten' as const,
        ambitionName: ambition.name,
        label: '',
        allBeaten: true,
      };
    }

    const delta = calculateDeltaToNextMilestone(currentBestMs, ambition.id, baselineMs);
    const nextM = getNextMilestone(baselineMs, currentBestMs, ambition.id);

    return {
      icon: ambition.icon,
      type: 'numeric' as const,
      delta,
      nextLabel: nextM?.label ?? ambition.name,
      allBeaten: false,
      ambitionName: ambition.name,
    };
  }, [userProfile, currentBestMs]);

  const handlers: Record<ModeKey, () => void> = {
    partida: onStartPartida,
    alvo: onStartAlvo,
    sequencia: onStartSequencia,
  };

  return (
    <View style={styles.root}>

      {/* ── Fixed header ── */}
      <View style={[styles.header, { paddingTop: TOP + 12 }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.reflexoSmall}>REFLEXO</Text>
          <Text style={styles.greeting}>Olá, Bruno</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>B</Text>
        </View>
      </View>

      {/* ── Scrollable content ── */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>MODOS DE JOGO</Text>

        {MODE_INFO.map(m => {
          const best = bestByMode[m.key];
          const lvl = best !== null && best !== undefined ? getLevelInfo(best) : null;
          const mc = MODE_COLORS[m.key];
          const bestAcc = bestAccByMode[m.key];

          return (
            <TouchableOpacity
              key={m.key}
              style={[styles.modeCard, { borderColor: mc.accent + '33' }]}
              onPress={handlers[m.key]}
              activeOpacity={0.75}
            >
              <View style={[styles.modeAccentBar, { backgroundColor: mc.accent }]} />
              <View style={styles.modeCardInner}>

                <View style={styles.modeTop}>
                  <Text style={styles.modeIcon}>{m.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.modeName, { color: mc.accent }]}>{m.name}</Text>
                    <Text style={styles.modeDesc}>{m.desc}</Text>
                  </View>
                  <Text style={[styles.modeArrow, { color: mc.accent }]}>›</Text>
                </View>

                <View style={styles.modeDivider} />

                {best !== null && best !== undefined && lvl ? (
                  <View style={styles.modeBottom}>
                    <Text style={styles.modeBestLabel}>
                      {'Sua melhor: '}
                      <Text style={[styles.modeBestMs, { color: lvl.color }]}>{best} ms</Text>
                      {bestAcc !== null
                        ? <Text style={styles.modeBestAcc}>{` · ${Math.round(bestAcc * 100)}%`}</Text>
                        : null}
                    </Text>
                    <View style={[styles.levelPill, { backgroundColor: lvl.bg }]}>
                      <View style={[styles.levelDot, { backgroundColor: lvl.color }]} />
                      <Text style={[styles.levelPillText, { color: lvl.color }]}>
                        {lvl.label.split(' ').slice(0, 2).join(' ')}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.modeBottom}>
                    <Text style={styles.modeBestLabel}>Ainda não jogado</Text>
                    <View style={[styles.newPill, { borderColor: mc.accent + '66' }]}>
                      <Text style={[styles.newPillText, { color: mc.accent }]}>NOVO</Text>
                    </View>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* F1 insight strip */}
        <View style={styles.insightStrip}>
          <Text style={styles.insightIcon}>🏁</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.insightTitle}>Benchmark F1</Text>
            <Text style={styles.insightBody}>
              Pilotos de Fórmula 1 largam em 150–250 ms — testados em condições de corrida real.
            </Text>
          </View>
        </View>

        <Text style={styles.footer}>
          {sessions.length > 0
            ? `${sessions.length} sessão${sessions.length > 1 ? 'ões' : ''} registrada${sessions.length > 1 ? 's' : ''}`
            : 'Baseado em benchmarks científicos de atletas de elite'}
        </Text>
      </ScrollView>

      {/* ── Fixed motivation card ── */}
      <View style={styles.motivCard}>
        <Text style={styles.motivIcon}>
          {motivData ? motivData.icon : '🏎'}
        </Text>
        <View style={{ flex: 1 }}>
          {/* ── No triage: original F1 hardcoded behavior ── */}
          {!motivData && (
            currentBestMs === null ? (
              <Text style={styles.motivText}>
                Complete seu primeiro treino para medir o gap até o nível F1!
              </Text>
            ) : f1Gap !== null && f1Gap > 0 ? (
              <Text style={styles.motivText}>
                {'Você está a '}
                <Text style={styles.motivHighlight}>{f1Gap} ms</Text>
                {' do nível de piloto de F1 de ponta.'}
              </Text>
            ) : (
              <Text style={styles.motivText}>
                {'Você já está no nível '}
                <Text style={styles.motivHighlight}>Elite</Text>
                {' de piloto de F1!'}
              </Text>
            )
          )}

          {/* ── Triage done: all beaten ── */}
          {motivData?.type === 'all_beaten' && (
            <Text style={styles.motivText}>
              {'Meta '}
              <Text style={styles.motivHighlight}>{motivData.ambitionName}</Text>
              {' conquistada. Escolha sua próxima rota no Perfil.'}
            </Text>
          )}

          {/* ── Triage done: qualitative (brain_health) ── */}
          {motivData?.type === 'qualitative' && (
            <Text style={styles.motivText}>{motivData.label}</Text>
          )}

          {/* ── Triage done: numeric milestone ── */}
          {motivData?.type === 'numeric' && (
            currentBestMs === null ? (
              <Text style={styles.motivText}>
                Complete seu primeiro treino para ver o progresso até{' '}
                <Text style={styles.motivHighlight}>{motivData.ambitionName}</Text>!
              </Text>
            ) : motivData.delta !== null && motivData.delta > 0 ? (
              <Text style={styles.motivText}>
                {'Você está a '}
                <Text style={styles.motivHighlight}>{motivData.delta} ms</Text>
                {` de ${motivData.nextLabel}.`}
              </Text>
            ) : (
              <Text style={styles.motivText}>
                {'Próximo marco: '}
                <Text style={styles.motivHighlight}>{motivData.nextLabel}</Text>
                {' — continue treinando!'}
              </Text>
            )
          )}
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b1220' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerLeft: { gap: 2 },
  reflexoSmall: { fontSize: 11, fontWeight: '700', color: '#3a4a6b', letterSpacing: 4 },
  greeting: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#1A6DB5',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { fontSize: 17, fontWeight: '800', color: '#fff' },

  scroll: { paddingHorizontal: 20, paddingBottom: 8 },
  sectionTitle: { fontSize: 10, fontWeight: '700', color: '#3a4a6b', letterSpacing: 2.5, marginBottom: 12 },

  modeCard: {
    backgroundColor: '#111a2e', borderRadius: 14, borderWidth: 1,
    flexDirection: 'row', marginBottom: 10, overflow: 'hidden',
  },
  modeAccentBar: { width: 4 },
  modeCardInner: { flex: 1 },
  modeTop: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, paddingBottom: 12 },
  modeIcon: { fontSize: 26 },
  modeName: { fontSize: 13, fontWeight: '800', letterSpacing: 1.5 },
  modeDesc: { fontSize: 12, color: '#4a5a7b', marginTop: 2 },
  modeArrow: { fontSize: 22, fontWeight: '300', marginRight: 2 },
  modeDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: 14 },
  modeBottom: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10,
  },
  modeBestLabel: { fontSize: 12, color: '#4a5a7b', flexShrink: 1 },
  modeBestMs: { fontWeight: '700' },
  modeBestAcc: { color: '#4a5a7b' },
  levelPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4,
    flexShrink: 0,
  },
  levelDot: { width: 6, height: 6, borderRadius: 3 },
  levelPillText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  newPill: {
    borderWidth: 1, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  newPillText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },

  insightStrip: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    backgroundColor: '#111a2e', borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)', padding: 16, marginTop: 4, marginBottom: 16,
  },
  insightIcon: { fontSize: 22 },
  insightTitle: { fontSize: 12, fontWeight: '700', color: '#fff', marginBottom: 4 },
  insightBody: { fontSize: 12, color: '#4a5a7b', lineHeight: 18 },

  footer: { fontSize: 11, color: '#2d3a55', textAlign: 'center', marginBottom: 4 },

  motivCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0d1b33',
    borderTopWidth: 1,
    borderTopColor: 'rgba(59,130,246,0.25)',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  motivIcon: { fontSize: 22 },
  motivText: { fontSize: 13, color: '#7a8aa0', lineHeight: 19 },
  motivHighlight: { color: '#3b82f6', fontWeight: '800' },
});
