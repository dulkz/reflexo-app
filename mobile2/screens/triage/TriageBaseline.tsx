import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Pressable,
  Platform, StatusBar as RNStatusBar,
} from 'react-native';

const TOP = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 44;

type Phase =
  | 'intro'
  | 'partida_instr'
  | 'partida_wait'
  | 'partida_go'
  | 'trans_alvo'
  | 'alvo_instr'
  | 'alvo_go'
  | 'trans_seq'
  | 'seq_instr'
  | 'seq_wait'
  | 'seq_go'
  | 'result';

interface Rts { partida: number | null; alvo: number | null; seq: number | null }

const CIRCLE_COLORS = [
  { key: 'AZUL',    color: '#3b82f6' },
  { key: 'VERDE',   color: '#10b981' },
  { key: 'LARANJA', color: '#f59e0b' },
  { key: 'ROXO',    color: '#8b5cf6' },
];

function shuffle(arr: number[]): number[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function computeBaseline(rts: Rts): number {
  const all = [rts.partida!, rts.alvo!, rts.seq!];
  const sorted = [...all].sort((a, b) => a - b); // ascending
  return Math.round((sorted[0] + sorted[1]) / 2); // drop highest, avg 2 best
}

interface Props {
  onNext: (baselineMs: number) => void;
  onBack: () => void;
}

export default function TriageBaseline({ onNext, onBack }: Props) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [rts, setRts] = useState<Rts>({ partida: null, alvo: null, seq: null });
  const [alvoTarget, setAlvoTarget] = useState(0);
  const [alvoOrder, setAlvoOrder] = useState([0, 1, 2, 3]);

  const signalTime = useRef(0);
  const phaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (phaseTimer.current) { clearTimeout(phaseTimer.current); phaseTimer.current = null; }
  };

  useEffect(() => () => clearTimer(), []);

  // Auto-advance logic
  useEffect(() => {
    clearTimer();

    if (phase === 'partida_wait') {
      const delay = 1500 + Math.random() * 1500;
      phaseTimer.current = setTimeout(() => {
        signalTime.current = Date.now();
        setPhase('partida_go');
      }, delay);
    }

    if (phase === 'trans_alvo') {
      phaseTimer.current = setTimeout(() => {
        setPhase('alvo_instr');
      }, 1600);
    }

    if (phase === 'trans_seq') {
      phaseTimer.current = setTimeout(() => {
        setPhase('seq_instr');
      }, 1600);
    }

    if (phase === 'seq_wait') {
      const delay = 800 + Math.random() * 700;
      phaseTimer.current = setTimeout(() => {
        signalTime.current = Date.now();
        setPhase('seq_go');
      }, delay);
    }
  }, [phase]);

  const handlePartidaTap = useCallback(() => {
    if (phase !== 'partida_go') return;
    const rt = Date.now() - signalTime.current;
    setRts(prev => ({ ...prev, partida: rt }));
    setPhase('trans_alvo');
  }, [phase]);

  const handleAlvoPress = useCallback((colorIdx: number) => {
    if (phase !== 'alvo_go') return;
    const rt = Date.now() - signalTime.current;
    // We accept any tap (correct or not) — just measuring RT
    void colorIdx;
    setRts(prev => ({ ...prev, alvo: rt }));
    setPhase('trans_seq');
  }, [phase]);

  const handleSeqTap = useCallback(() => {
    if (phase !== 'seq_go') return;
    const rt = Date.now() - signalTime.current;
    setRts(prev => {
      const updated = { ...prev, seq: rt };
      return updated;
    });
    setPhase('result');
  }, [phase]);

  // Compute baseline once in result phase
  const baseline = (phase === 'result' && rts.partida !== null && rts.alvo !== null && rts.seq !== null)
    ? computeBaseline(rts)
    : null;

  // ── Renders ──────────────────────────────────────────────────────────────────

  const renderHeader = (stepNum: number) => (
    <View style={[styles.header, { paddingTop: TOP + 12 }]}>
      <TouchableOpacity
        onPress={phase === 'intro' ? onBack : undefined}
        style={styles.backBtn}
      >
        {phase === 'intro' && <Text style={styles.backText}>← Voltar</Text>}
      </TouchableOpacity>
      <View style={styles.dotsRow}>
        {[1, 2, 3, 4, 5].map(n => (
          <View key={n} style={[styles.dot, n === stepNum && styles.dotActive]} />
        ))}
      </View>
      <View style={{ width: 60 }} />
    </View>
  );

  // ── INTRO ────────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <View style={styles.root}>
        {renderHeader(5)}
        <View style={styles.body}>
          <Text style={styles.title}>Vamos ver onde você está agora.</Text>
          <Text style={styles.subtitle}>
            1 largada de cada modo. Nenhuma delas entra no seu histórico. Sem pressão.
          </Text>
          <View style={styles.modeIconsRow}>
            {[
              { icon: '🏎', label: 'Partida' },
              { icon: '🎯', label: 'Alvo' },
              { icon: '🧠', label: 'Sequência' },
            ].map(m => (
              <View key={m.label} style={styles.modeIconBox}>
                <Text style={styles.modeIconEmoji}>{m.icon}</Text>
                <Text style={styles.modeIconLabel}>{m.label}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.footer}>
          <TouchableOpacity style={styles.btnPrimary} onPress={() => setPhase('partida_instr')} activeOpacity={0.8}>
            <Text style={styles.btnPrimaryText}>COMEÇAR</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── INSTRUCTION SCREENS ──────────────────────────────────────────────────────
  const INSTR_DATA = {
    partida_instr: {
      icon: '🏎',
      name: 'PARTIDA',
      desc: 'Aperte o mais rápido possível assim que o círculo verde aparecer. Sem pressa, espera aparecer, pois será penalizado em caso de queimar a largada.',
      onStart: () => setPhase('partida_wait'),
    },
    alvo_instr: {
      icon: '🎯',
      name: 'ALVO',
      desc: 'Toque no círculo com a cor indicada no topo em cada rodada quando ele aparecer. Ignore as outras cores.',
      onStart: () => {
        const target = Math.floor(Math.random() * 4);
        const order = shuffle([0, 1, 2, 3]);
        setAlvoTarget(target);
        setAlvoOrder(order);
        signalTime.current = Date.now();
        setPhase('alvo_go');
      },
    },
    seq_instr: {
      icon: '🧠',
      name: 'SEQUÊNCIA',
      desc: 'Responda rápido aos sinais Go (verde). Ignore os sinais No-Go (vermelho).',
      onStart: () => setPhase('seq_wait'),
    },
  } as const;

  if (phase === 'partida_instr' || phase === 'alvo_instr' || phase === 'seq_instr') {
    const instr = INSTR_DATA[phase];
    return (
      <View style={styles.root}>
        {renderHeader(5)}
        <View style={styles.instrBody}>
          <Text style={styles.instrIcon}>{instr.icon}</Text>
          <Text style={styles.instrName}>{instr.name}</Text>
          <Text style={styles.instrDesc}>{instr.desc}</Text>
        </View>
        <View style={styles.footer}>
          <TouchableOpacity style={styles.btnPrimary} onPress={instr.onStart} activeOpacity={0.8}>
            <Text style={styles.btnPrimaryText}>COMEÇAR</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── PARTIDA WAIT ─────────────────────────────────────────────────────────────
  if (phase === 'partida_wait') {
    return (
      <View style={styles.root}>
        {renderHeader(5)}
        <View style={styles.miniGameArea}>
          <Text style={styles.miniModeLabel}>MODO PARTIDA</Text>
          <Text style={styles.waitText}>Aguarde...</Text>
          <Text style={styles.waitDots}>· · ·</Text>
        </View>
      </View>
    );
  }

  // ── PARTIDA GO ───────────────────────────────────────────────────────────────
  if (phase === 'partida_go') {
    return (
      <View style={styles.root}>
        {renderHeader(5)}
        <Pressable style={styles.tapArea} onPressIn={handlePartidaTap}>
          <Text style={styles.miniModeLabel}>MODO PARTIDA</Text>
          <View style={styles.greenCircle} />
          <Text style={styles.tapHint}>TOQUE AGORA!</Text>
        </Pressable>
      </View>
    );
  }

  // ── TRANSITION ───────────────────────────────────────────────────────────────
  if (phase === 'trans_alvo' || phase === 'trans_seq') {
    const from = phase === 'trans_alvo' ? 'Partida' : 'Alvo';
    const next = phase === 'trans_alvo' ? 'Alvo' : 'Sequência';
    return (
      <View style={styles.root}>
        {renderHeader(5)}
        <View style={styles.transArea}>
          <Text style={styles.transCheck}>✓</Text>
          <Text style={styles.transText}>{from} concluído.</Text>
          <Text style={styles.transNext}>Próximo: {next}</Text>
        </View>
      </View>
    );
  }

  // ── ALVO GO ──────────────────────────────────────────────────────────────────
  if (phase === 'alvo_go') {
    const target = CIRCLE_COLORS[alvoTarget];
    return (
      <View style={styles.root}>
        {renderHeader(5)}
        <View style={styles.alvoArea}>
          <Text style={styles.miniModeLabel}>MODO ALVO</Text>
          <Text style={styles.alvoHint}>Toque no círculo: <Text style={[styles.alvoTargetName, { color: target.color }]}>{target.key}</Text></Text>
          <View style={styles.alvoGrid}>
            {alvoOrder.map(colorIdx => {
              const c = CIRCLE_COLORS[colorIdx];
              return (
                <Pressable
                  key={colorIdx}
                  style={[styles.alvoCircle, { backgroundColor: c.color }]}
                  onPressIn={() => handleAlvoPress(colorIdx)}
                />
              );
            })}
          </View>
        </View>
      </View>
    );
  }

  // ── SEQ WAIT + GO ────────────────────────────────────────────────────────────
  if (phase === 'seq_wait') {
    return (
      <View style={styles.root}>
        {renderHeader(5)}
        <View style={styles.miniGameArea}>
          <Text style={styles.miniModeLabel}>MODO SEQUÊNCIA</Text>
          <Text style={styles.waitText}>Prepare-se...</Text>
          <Text style={styles.waitDots}>· · ·</Text>
        </View>
      </View>
    );
  }

  if (phase === 'seq_go') {
    return (
      <View style={styles.root}>
        {renderHeader(5)}
        <Pressable style={styles.tapArea} onPressIn={handleSeqTap}>
          <Text style={styles.miniModeLabel}>MODO SEQUÊNCIA</Text>
          <Text style={styles.goText}>GO</Text>
          <Text style={styles.tapHint}>TOQUE AGORA!</Text>
        </Pressable>
      </View>
    );
  }

  // ── RESULT ───────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      {renderHeader(5)}
      <View style={styles.resultBody}>
        <Text style={styles.resultLabel}>SEU BASELINE</Text>
        <Text style={styles.resultMs}>{baseline}</Text>
        <Text style={styles.resultUnit}>ms</Text>
        <Text style={styles.resultSub}>Ponto de partida registrado. Agora vem a parte boa — sua jornada.</Text>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={() => baseline !== null && onNext(baseline)}
          activeOpacity={0.8}
        >
          <Text style={styles.btnPrimaryText}>VER MINHA JORNADA</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b1220' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 8,
  },
  backBtn: { paddingVertical: 8, width: 60 },
  backText: { color: '#4a5a7b', fontSize: 15, fontWeight: '600' },
  dotsRow: { flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1a2540' },
  dotActive: { backgroundColor: '#3b82f6', width: 20 },

  body: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '900', color: '#fff', marginBottom: 12, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: '#4a5a7b', lineHeight: 23, marginBottom: 36 },
  modeIconsRow: { flexDirection: 'row', justifyContent: 'center', gap: 24 },
  modeIconBox: { alignItems: 'center', gap: 8 },
  modeIconEmoji: { fontSize: 36 },
  modeIconLabel: { fontSize: 11, fontWeight: '700', color: '#3a4a6b', letterSpacing: 1 },

  instrBody: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 16 },
  instrIcon: { fontSize: 72 },
  instrName: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 1.5 },
  instrDesc: { fontSize: 15, color: '#7a8aa0', textAlign: 'center', lineHeight: 24 },

  miniGameArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  miniModeLabel: { fontSize: 11, fontWeight: '700', color: '#3a4a6b', letterSpacing: 2.5 },
  waitText: { fontSize: 22, fontWeight: '700', color: '#4a5a7b' },
  waitDots: { fontSize: 32, color: '#1a2540', letterSpacing: 12 },

  tapArea: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20,
  },
  greenCircle: {
    width: 160, height: 160, borderRadius: 80, backgroundColor: '#10b981',
    shadowColor: '#10b981', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 24, elevation: 20,
  },
  tapHint: { fontSize: 13, fontWeight: '800', color: '#10b981', letterSpacing: 2.5 },

  goText: {
    fontSize: 96, fontWeight: '900', color: '#10b981',
    letterSpacing: -3, lineHeight: 100,
  },

  transArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  transCheck: { fontSize: 56, color: '#10b981' },
  transText: { fontSize: 22, fontWeight: '800', color: '#fff' },
  transNext: { fontSize: 14, color: '#4a5a7b', fontWeight: '600' },

  alvoArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, paddingBottom: 40 },
  alvoHint: { fontSize: 16, fontWeight: '600', color: '#7a8aa0' },
  alvoTargetName: { fontWeight: '900' },
  alvoGrid: {
    width: 256, height: 256, flexDirection: 'row', flexWrap: 'wrap', gap: 14,
  },
  alvoCircle: {
    width: 114, height: 114, borderRadius: 57,
    elevation: 12, shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 12,
  },

  resultBody: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 4 },
  resultLabel: { fontSize: 11, fontWeight: '700', color: '#3a4a6b', letterSpacing: 2.5, marginBottom: 8 },
  resultMs: { fontSize: 88, fontWeight: '900', color: '#fff', letterSpacing: -3, lineHeight: 92 },
  resultUnit: { fontSize: 18, fontWeight: '600', color: '#4a5a7b', marginBottom: 24 },
  resultSub: { fontSize: 15, color: '#4a5a7b', textAlign: 'center', lineHeight: 23 },

  footer: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 8 },
  btnPrimary: {
    backgroundColor: '#3b82f6', borderRadius: 14,
    paddingVertical: 18, alignItems: 'center',
  },
  btnPrimaryText: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 2 },
});
