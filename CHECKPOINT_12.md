# CHECKPOINT 12 — Modo Alvo reformulado (choice RT · posições fixas)

Branch: feat/goal-redesign-final · tsc --noEmit = 0 erros

## Nova mecânica (screens/ModoAlvo.tsx)
- **4 círculos em posições FIXAS e permanentes** (nunca mudam):
  - top-left = AZUL · top-right = LARANJA · bottom-left = ROXO · bottom-right = VERDE
  - Removido o embaralhamento de posições (`colorOrder` + `shuffle`).
- **Círculos sempre visíveis** em todas as fases (waiting · signal · feedback). O grid é renderizado continuamente; apenas o cabeçalho acima muda por fase (`headerArea` com altura fixa para o grid não pular).
  - waiting (`initial_wait`/`ready`): círculos visíveis, sem prompt (só "aguarde o estímulo").
  - signal (`challenge`): prompt "TOQUE NO CÍRCULO" + badge da cor-alvo.
  - feedback (`correct`/`wrong`): ícone + CORRETO/ERROU + RT.
- **Hit**: toque na cor-alvo → registra RT.
- **Miss**: toque na cor errada → +150ms + flash vermelho + shake no círculo tocado (anel + ✕).
- **Timeout 1500ms**: +200ms → penalizedRt = 1700ms (`CHALLENGE_TIMEOUT` 2000→1500, `TIMEOUT_PENALTY`=200).
- **10 rodadas**, score = média de TODAS as rodadas penalizadas (sem descarte).

## Escala recalibrada (utils/levels.ts — ALVO_LEVELS)
Choice RT com posições fixas (mais rápido que busca visual):
- ELITE < 250ms · MUITO BOM < 320ms · BOM < 420ms · AQUECENDO < 550ms · INICIANDO ≥ 550ms

## Tutorial (components/ModeTutorial.tsx — AlvoTutorial)
- Grid 2×2 de posições fixas + **legenda das 4 posições** (chips com cor + nome) + prompt de cor.
- Texto: "Memorize as posições. Quando a cor aparecer, toque imediatamente."

## Textos (locales/pt.json + en.json)
- `modes.alvo.desc` → "Reflexo de decisão · posições fixas · 10 rodadas"
- `target.subtitle` → "Posições fixas · 10 rodadas"
- `target.howToText` → mecânica nova (+150ms erro, +200ms timeout)
- `tutorial.alvo.text` → "Memorize as posições. Quando a cor aparecer, toque imediatamente."
