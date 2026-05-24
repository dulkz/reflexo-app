/**
 * REFLEXO — Gameplay Components
 * React Native · Design System: Deep Performance
 *
 * Componentes:
 *   ModeIntroScreen   — tela de abertura (todos os modos)
 *   PartidaCircle     — círculo com estados idle / active / result
 *   AlvoGrid          — grade 2×2 com indicador de cor
 *   SequenciaCircle   — Go / NoGo com feedback visual
 *   RadarCross        — 5 círculos em cruz
 *   CountdownScreen   — contagem regressiva com cor do modo
 *
 * Dependências: react-native
 * Fontes necessárias: BebasNeue_400Regular, SpaceMono_400Regular, DMSans_400Regular, DMSans_700Bold
 * Configure via expo-font ou @expo-google-fonts
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

// ─────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────
export const C = {
  bg0:    '#080B10',
  bg1:    '#0F1520',
  bg2:    '#1A2030',
  bg3:    '#252D3E',
  t0:     '#EDF0F7',
  t1:     '#8892A4',
  t2:     '#4A5268',
  border: 'rgba(255,255,255,0.06)',

  // Modo
  partida:   '#3b82f6',
  alvo:      '#06b6d4',
  sequencia: '#8b5cf6',
  radar:     '#f59e0b',

  // Semânticos
  green: '#4AFFA3',
  red:   '#FF5757',
} as const;

// Helpers de opacidade
const hex = (color: string, opacity: number) => {
  const map: Record<string, string> = { [C.green]: '4AFFA3', [C.red]: 'FF5757', [C.partida]: '3b82f6', [C.alvo]: '06b6d4', [C.sequencia]: '8b5cf6', [C.radar]: 'f59e0b' };
  const h = map[color] ?? color.replace('#', '');
  const a = Math.round(opacity * 255).toString(16).padStart(2, '0');
  return `#${h}${a}`;
};

// ─────────────────────────────────────────────────────
// ModeIntroScreen
// ─────────────────────────────────────────────────────
interface ModeIntroProps {
  title: string;
  meta: string;
  color: string;
  instruction: string;
  icon: React.ReactNode;
  onBack: () => void;
  onStart: () => void;
}

export function ModeIntroScreen({ title, meta, color, instruction, icon, onBack, onStart }: ModeIntroProps) {
  // Texto do botão: cores claras (ciano, âmbar) pedem texto escuro
  const btnTextColor = (color === C.alvo || color === C.radar) ? '#020f14' : '#ffffff';

  return (
    <View style={[s.screen, { backgroundColor: C.bg0 }]}>
      <TouchableOpacity style={s.backBtn} onPress={onBack} hitSlop={8}>
        <Text style={s.backArrow}>←</Text>
      </TouchableOpacity>

      <View style={s.introBody}>
        <View style={s.iconWrap}>{icon}</View>

        <Text style={[s.modeTitle, { color }]}>{title}</Text>
        <Text style={s.modeMeta}>{meta}</Text>

        <View style={[s.instrCard, { backgroundColor: hex(color, 0.06), borderColor: hex(color, 0.18) }]}>
          <Text style={[s.instrLabel, { color }]}>Como jogar</Text>
          <Text style={s.instrText}>{instruction}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[s.btnIniciar, { backgroundColor: color }]}
        onPress={onStart}
        activeOpacity={0.85}
      >
        <Text style={[s.btnIniciarText, { color: btnTextColor }]}>INICIAR</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────────────
// PartidaCircle
// ─────────────────────────────────────────────────────
type PartidaState = 'idle' | 'active' | 'result';

interface PartidaCircleProps {
  state: PartidaState;
  round: number;
  total: number;
  reactionMs?: number;
  badge?: string;
  onTap?: () => void;
  onNext?: () => void;
}

const CIRCLE = 140;

export function PartidaCircle({ state, round, total, reactionMs, badge, onTap, onNext }: PartidaCircleProps) {
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (state === 'active') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glow, { toValue: 1, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(glow, { toValue: 0, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        ])
      ).start();
    } else {
      glow.stopAnimation();
      glow.setValue(0);
    }
  }, [state]);

  const ringOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.5] });
  const isActive = state === 'active';

  return (
    <View style={s.partidaScreen}>
      {/* Progress dots */}
      <View style={s.dotsRow}>
        {Array.from({ length: total }).map((_, i) => (
          <View key={i} style={[s.dot, i < round - 1 && s.dotDone, i === round - 1 && s.dotCurrent]} />
        ))}
      </View>
      <Text style={s.roundLabel}>RODADA {round} / {total}</Text>

      {state === 'result' ? (
        <View style={s.resultBlock}>
          <Text style={s.resultMs}>{reactionMs}</Text>
          <Text style={s.resultUnit}>milissegundos</Text>
          {badge && (
            <View style={s.resultBadge}><Text style={s.resultBadgeText}>{badge}</Text></View>
          )}
          <TouchableOpacity style={s.btnNext} onPress={onNext} activeOpacity={0.85}>
            <Text style={s.btnNextText}>PRÓXIMA RODADA →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Pressable
          style={s.circleStage}
          onPress={isActive ? onTap : undefined}
          android_ripple={isActive ? { color: 'rgba(74,255,163,0.2)', radius: CIRCLE / 2 } : undefined}
        >
          {/* Three rings */}
          <Animated.View style={[s.cr3, { opacity: ringOpacity }]} />
          <Animated.View style={[s.cr2, { opacity: ringOpacity }]} />
          <View style={s.cr1} />
          {/* Core */}
          <View style={[s.core, isActive ? s.coreActive : s.coreIdle]}>
            <View style={[s.inner, isActive ? s.innerActive : s.innerIdle]} />
          </View>
        </Pressable>
      )}

      {state === 'idle' && <Text style={s.waitHint}>aguarde o sinal...</Text>}
      {state === 'active' && <Text style={[s.waitHint, { color: C.green }]}>TOQUE!</Text>}
    </View>
  );
}

// ─────────────────────────────────────────────────────
// AlvoGrid
// ─────────────────────────────────────────────────────
interface AlvoGridProps {
  targetLabel: string;   // "VERDE"
  targetColor: string;   // hex do alvo
  circles: string[];     // 4 hexes
  targetIndex: number;
  round: number;
  total: number;
  onTap: (i: number) => void;
  onQuit: () => void;
}

export function AlvoGrid({ targetLabel, targetColor, circles, targetIndex, round, total, onTap, onQuit }: AlvoGridProps) {
  return (
    <View style={[s.screen, { backgroundColor: C.bg0, paddingHorizontal: 20 }]}>
      {/* Header */}
      <View style={s.gameHeader}>
        <Text style={s.roundLabel}>RODADA {round}/{total}</Text>
        <TouchableOpacity onPress={onQuit} hitSlop={8}>
          <Text style={s.desistir}>desistir</Text>
        </TouchableOpacity>
      </View>

      {/* Color indicator */}
      <View style={s.colorIndWrap}>
        <Text style={s.colorPrompt}>toque no círculo</Text>
        <View style={s.colorInd}>
          <View style={[s.colorDot, { backgroundColor: targetColor, shadowColor: targetColor, shadowOpacity: 0.7, shadowRadius: 6, elevation: 4 }]} />
          <Text style={[s.colorLabel, { color: targetColor }]}>{targetLabel}</Text>
        </View>
      </View>

      {/* 2×2 grid */}
      <View style={s.alvoGrid}>
        {circles.map((hex, i) => (
          <TouchableOpacity
            key={i}
            style={[
              s.alvoCircle,
              { backgroundColor: hex },
              i === targetIndex && { shadowColor: hex, shadowOpacity: 0.45, shadowRadius: 20, elevation: 8 },
            ]}
            onPress={() => onTap(i)}
            activeOpacity={0.75}
          />
        ))}
      </View>

      {/* Progress pills */}
      <View style={s.alvoProgRow}>
        {Array.from({ length: total }).map((_, i) => (
          <View key={i} style={[s.alvoProgPill, i < round - 1 && { backgroundColor: C.alvo }]} />
        ))}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────
// SequenciaCircle
// ─────────────────────────────────────────────────────
type SeqSignal = 'go' | 'nogo' | 'idle';

interface SequenciaProps {
  signal: SeqSignal;
  current: number;
  total: number;
  acertos: number;
  erros: number;
  onTap: () => void;
}

const SEQ = 120;

export function SequenciaCircle({ signal, current, total, acertos, erros, onTap }: SequenciaProps) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (signal !== 'idle') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.05, duration: 550, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 550, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulse.stopAnimation(); pulse.setValue(1);
    }
  }, [signal]);

  const accent = signal === 'go' ? C.green : signal === 'nogo' ? C.red : C.sequencia;
  const label  = signal === 'go' ? 'GO' : signal === 'nogo' ? 'NOGO' : '...';
  const hint   = signal === 'go' ? 'TOQUE AGORA' : signal === 'nogo' ? 'SEGURE O IMPULSO' : '';
  const progress = current / total;

  return (
    <Pressable style={s.seqScreen} onPress={signal === 'go' ? onTap : undefined}>
      {/* Progress bar */}
      <View style={s.seqProgWrap}>
        <View style={s.seqProgBg}>
          <View style={[s.seqProgFill, { width: `${progress * 100}%` as any, backgroundColor: C.sequencia }]} />
        </View>
        <View style={s.seqStatRow}>
          <Text style={s.seqStat}>{current} / {total} sinais</Text>
          <Text style={s.seqStat}>{acertos} acertos · {erros} erros</Text>
        </View>
      </View>

      {/* Circle */}
      <Animated.View style={[
        s.seqCircle,
        { borderColor: accent, backgroundColor: hex(accent, 0.10), transform: [{ scale: pulse }] },
      ]}>
        <View style={[s.seqR1, { borderColor: hex(accent, 0.25) }]} />
        <View style={[s.seqR2, { borderColor: hex(accent, 0.12) }]} />
        <Text style={[s.seqLabel, { color: accent }]}>{label}</Text>
      </Animated.View>

      {hint ? <Text style={[s.seqHint, { color: accent }]}>{hint}</Text> : null}
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────
// RadarCross
// ─────────────────────────────────────────────────────
interface RadarCrossProps {
  activeIndex: number | null;
  round: number;
  total: number;
  onTap: (i: number) => void;
  onQuit: () => void;
}

// Posições absolutas dentro de um container 180×200
const RADAR_POS = [
  { top: 0,   left: 65 },
  { top: 70,  left: 0  },
  { top: 70,  left: 65 },
  { top: 70,  left: 130},
  { top: 140, left: 65 },
] as const;
const RC = 52;

export function RadarCross({ activeIndex, round, total, onTap, onQuit }: RadarCrossProps) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (activeIndex !== null) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 0.85, duration: 450, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 450, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulse.stopAnimation(); pulse.setValue(1);
    }
  }, [activeIndex]);

  const progress = (round - 1) / total;

  return (
    <View style={[s.screen, { backgroundColor: C.bg0, paddingHorizontal: 20 }]}>
      <View style={s.gameHeader}>
        <View>
          <View style={s.radarProgBg}>
            <View style={[s.radarProgFill, { width: `${progress * 100}%` as any }]} />
          </View>
          <Text style={s.roundLabel}>RODADA {round} / {total}</Text>
        </View>
        <TouchableOpacity onPress={onQuit} hitSlop={8}>
          <Text style={s.desistir}>desistir</Text>
        </TouchableOpacity>
      </View>

      <Text style={[s.waitHint, { marginBottom: 8 }]}>
        {activeIndex === null ? 'aguarde o sinal...' : ''}
      </Text>

      <View style={s.radarCross}>
        {RADAR_POS.map((pos, i) => {
          const isActive = i === activeIndex;
          return (
            <TouchableOpacity
              key={i}
              style={[
                s.radarCircle,
                { top: pos.top, left: pos.left },
                isActive
                  ? { borderColor: C.radar, borderWidth: 2, backgroundColor: 'rgba(245,158,11,0.07)' }
                  : { borderColor: 'rgba(255,255,255,0.10)', borderWidth: 1.5 },
              ]}
              onPress={() => onTap(i)}
              activeOpacity={0.7}
            >
              {isActive && (
                <>
                  <Animated.View style={[s.radarRing, { transform: [{ scale: pulse }] }]} />
                  <View style={s.radarCore} />
                </>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────
// CountdownScreen
// ─────────────────────────────────────────────────────
interface CountdownProps {
  number: 1 | 2 | 3;
  modeColor: string;
}

export function CountdownScreen({ number, modeColor }: CountdownProps) {
  const scale   = useRef(new Animated.Value(0.4)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    scale.setValue(0.4); opacity.setValue(0);
    Animated.parallel([
      Animated.spring(scale,   { toValue: 1, useNativeDriver: true, tension: 55, friction: 7 }),
      Animated.timing(opacity, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  }, [number]);

  return (
    <View style={s.cdownScreen}>
      <Animated.Text style={[s.cdownNum, { color: modeColor, transform: [{ scale }], opacity }]}>
        {number}
      </Animated.Text>
      <Text style={s.cdownSub}>PREPARE-SE</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.bg0,
    alignItems: 'center',
  },

  // ModeIntroScreen
  backBtn: {
    position: 'absolute', top: 16, left: 16,
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 0.5, borderColor: C.bordermid,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 10,
  } as ViewStyle,
  backArrow:    { color: C.t1, fontSize: 18 },
  introBody:    { flex: 1, alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, width: '100%' },
  iconWrap:     { marginTop: 44, marginBottom: 12 },
  modeTitle:    { fontFamily: 'BebasNeue_400Regular', fontSize: 34, letterSpacing: 1, marginBottom: 4 },
  modeMeta:     { fontFamily: 'SpaceMono_400Regular', fontSize: 11, color: C.t2, letterSpacing: 0.4, marginBottom: 22 },
  instrCard:    { width: '100%', borderWidth: 0.5, borderRadius: 12, padding: 14, marginBottom: 16 },
  instrLabel:   { fontFamily: 'SpaceMono_400Regular', fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  instrText:    { fontFamily: 'DMSans_400Regular', color: C.t1, fontSize: 13, lineHeight: 20 },
  btnIniciar:   { width: '90%', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 32 },
  btnIniciarText: { fontFamily: 'BebasNeue_400Regular', fontSize: 20, letterSpacing: 1.5 },

  // PartidaCircle
  partidaScreen: { flex: 1, backgroundColor: C.bg0, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 24 },
  dotsRow:    { flexDirection: 'row', gap: 5 },
  dot:        { width: 6, height: 6, borderRadius: 3, backgroundColor: C.bg3 },
  dotDone:    { backgroundColor: C.green, opacity: 0.5 },
  dotCurrent: { backgroundColor: C.green },
  roundLabel: { fontFamily: 'SpaceMono_400Regular', fontSize: 10, color: C.t2, letterSpacing: 0.4 },
  circleStage:{ width: CIRCLE + 40, height: CIRCLE + 40, alignItems: 'center', justifyContent: 'center' },
  cr3: {
    position: 'absolute', width: CIRCLE + 36, height: CIRCLE + 36,
    borderRadius: (CIRCLE + 36) / 2, borderWidth: 1, borderStyle: 'dashed',
    borderColor: C.green,
  } as ViewStyle,
  cr2: {
    position: 'absolute', width: CIRCLE + 18, height: CIRCLE + 18,
    borderRadius: (CIRCLE + 18) / 2, borderWidth: 1, borderColor: C.green,
  } as ViewStyle,
  cr1: {
    position: 'absolute', width: CIRCLE, height: CIRCLE,
    borderRadius: CIRCLE / 2, borderWidth: 2, borderColor: C.green, opacity: 0.4,
  } as ViewStyle,
  core:        { width: CIRCLE, height: CIRCLE, borderRadius: CIRCLE / 2, alignItems: 'center', justifyContent: 'center' },
  coreIdle:    { backgroundColor: 'rgba(74,255,163,0.05)' },
  coreActive:  { backgroundColor: C.green },
  inner:       { width: 48, height: 48, borderRadius: 24 },
  innerIdle:   { backgroundColor: 'rgba(74,255,163,0.18)' },
  innerActive: { backgroundColor: 'rgba(0,0,0,0.18)' },
  waitHint:    { fontFamily: 'SpaceMono_400Regular', fontSize: 11, color: C.t2, letterSpacing: 0.4 },
  resultBlock: { alignItems: 'center', gap: 8 },
  resultMs:    { fontFamily: 'BebasNeue_400Regular', fontSize: 72, color: C.green, lineHeight: 72 },
  resultUnit:  { fontFamily: 'SpaceMono_400Regular', fontSize: 11, color: C.t1 },
  resultBadge: { backgroundColor: 'rgba(74,255,163,0.09)', borderWidth: 0.5, borderColor: 'rgba(74,255,163,0.35)', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3 },
  resultBadgeText: { fontFamily: 'SpaceMono_400Regular', fontSize: 10, color: C.green, fontWeight: '700' },
  btnNext:     { backgroundColor: C.green, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 28, alignItems: 'center', marginTop: 6 },
  btnNextText: { fontFamily: 'BebasNeue_400Regular', fontSize: 16, color: '#081400', letterSpacing: 0.8 },

  // AlvoGrid
  gameHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingTop: 16, marginBottom: 10 },
  colorIndWrap:  { alignItems: 'center', gap: 4, marginBottom: 12 },
  colorPrompt:   { fontFamily: 'SpaceMono_400Regular', fontSize: 9, color: C.t2, textTransform: 'uppercase', letterSpacing: 0.5 },
  colorInd:      { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.09)' },
  colorDot:      { width: 10, height: 10, borderRadius: 5 },
  colorLabel:    { fontFamily: 'SpaceMono_400Regular', fontSize: 12, fontWeight: '700' },
  alvoGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'center', marginBottom: 12 },
  alvoCircle:    { width: 118, height: 118, borderRadius: 59 },
  alvoProgRow:   { flexDirection: 'row', gap: 4, justifyContent: 'center' },
  alvoProgPill:  { width: 16, height: 3, borderRadius: 2, backgroundColor: C.bg3 },
  desistir:      { fontFamily: 'SpaceMono_400Regular', fontSize: 9, color: C.t2, letterSpacing: 0.3 },

  // SequenciaCircle
  seqScreen:    { flex: 1, backgroundColor: C.bg0, alignItems: 'center', justifyContent: 'center', gap: 20, paddingHorizontal: 24 },
  seqProgWrap:  { width: '100%', gap: 4 },
  seqProgBg:    { width: '100%', height: 3, backgroundColor: 'rgba(139,92,246,0.12)', borderRadius: 2, overflow: 'hidden' },
  seqProgFill:  { height: 3, borderRadius: 2 },
  seqStatRow:   { flexDirection: 'row', justifyContent: 'space-between' },
  seqStat:      { fontFamily: 'SpaceMono_400Regular', fontSize: 9, color: C.t2 },
  seqCircle:    { width: SEQ, height: SEQ, borderRadius: SEQ / 2, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  seqR1:        { position: 'absolute', width: SEQ + 16, height: SEQ + 16, borderRadius: (SEQ + 16) / 2, borderWidth: 1, top: -9, left: -9 } as ViewStyle,
  seqR2:        { position: 'absolute', width: SEQ + 32, height: SEQ + 32, borderRadius: (SEQ + 32) / 2, borderWidth: 1, borderStyle: 'dashed', top: -17, left: -17 } as ViewStyle,
  seqLabel:     { fontFamily: 'BebasNeue_400Regular', fontSize: 26, letterSpacing: 1 },
  seqHint:      { fontFamily: 'SpaceMono_400Regular', fontSize: 10, letterSpacing: 0.4 },

  // RadarCross
  radarProgBg:  { width: 180, height: 2, backgroundColor: 'rgba(245,158,11,0.12)', borderRadius: 1, overflow: 'hidden', marginBottom: 3 },
  radarProgFill:{ height: 2, backgroundColor: C.radar },
  radarCross:   { width: 182, height: 192, position: 'relative', marginTop: 12 },
  radarCircle:  { position: 'absolute', width: RC, height: RC, borderRadius: RC / 2, alignItems: 'center', justifyContent: 'center' },
  radarRing:    { position: 'absolute', width: RC + 14, height: RC + 14, borderRadius: (RC + 14) / 2, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(245,158,11,0.35)', top: -7, left: -7 } as ViewStyle,
  radarCore:    { width: 26, height: 26, borderRadius: 13, backgroundColor: C.radar },

  // CountdownScreen
  cdownScreen:  { flex: 1, backgroundColor: C.bg0, alignItems: 'center', justifyContent: 'center', gap: 12 },
  cdownNum:     { fontFamily: 'BebasNeue_400Regular', fontSize: 130, lineHeight: 130 },
  cdownSub:     { fontFamily: 'SpaceMono_400Regular', fontSize: 11, color: C.t2, letterSpacing: 1.5, textTransform: 'uppercase' },
});

// Tipagem auxiliar — adicione ao seu constants.ts se preferir
type BorderStyle = 'solid' | 'dashed' | 'dotted';
