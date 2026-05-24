import React from 'react';
import Svg, { Circle, Rect, Polygon } from 'react-native-svg';

// Forma distinta por posição no Modo Alvo — pista redundante à cor para
// acessibilidade de daltonismo. A cor atual preenche a forma (cores mantidas).
export type AlvoShape = 'circle' | 'triangle' | 'square' | 'hexagon';

// Hexágono regular pointy-top centrado em (c, c) com raio r.
function hexPoints(c: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 30);
    pts.push(`${(c + r * Math.cos(a)).toFixed(2)},${(c + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
}

interface Props {
  shape: AlvoShape;
  color: string;
  size: number;
  /** Estado de erro — desenha contorno vermelho (mantém o destaque do alvo errado). */
  wrong?: boolean;
}

export default function TargetShape({ shape, color, size, wrong = false }: Props) {
  const stroke = wrong ? '#ef4444' : undefined;
  const sw = wrong ? Math.max(3, size * 0.05) : 0;
  const pad = sw / 2 + 1;
  const c = size / 2;
  const r = c - pad;
  const rx = Math.max(4, Math.round(size * 0.06)); // quadrado: bordas levemente arredondadas
  const common = { fill: color, stroke, strokeWidth: sw, strokeLinejoin: 'round' as const };

  return (
    <Svg width={size} height={size}>
      {shape === 'circle' && <Circle cx={c} cy={c} r={r} {...common} />}
      {shape === 'square' && (
        <Rect x={pad} y={pad} width={size - 2 * pad} height={size - 2 * pad} rx={rx} {...common} />
      )}
      {shape === 'triangle' && (
        <Polygon points={`${c},${pad} ${size - pad},${size - pad} ${pad},${size - pad}`} {...common} />
      )}
      {shape === 'hexagon' && <Polygon points={hexPoints(c, r)} {...common} />}
    </Svg>
  );
}
