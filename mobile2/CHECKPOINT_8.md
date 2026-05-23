# CHECKPOINT 8 — Tutoriais dos modos

Branch: `feat/goal-redesign-final` · `npx tsc --noEmit` = 0 erros

## Objetivo
Tutorial animado por modo, exibido na primeira abertura de cada modo, com
"não mostrar novamente" persistido em AsyncStorage.

## O que foi feito

### `components/ModeTutorial.tsx` (novo)
Adaptado para TypeScript a partir da referência JS antiga
(`ClaudioIA/Reflexo-App/mobile/src/components/ModeTutorial.js`).

- **Shell `ModeTutorial({ modeKey })`**:
  - Lê `mode_tutorial_seen_{modeKey}` no mount; só aparece se ainda não visto.
  - Botão **"não mostrar novamente"** → grava a flag e some com fade-out.
  - Some automaticamente "ao iniciar" porque o intro do modo desmonta ao começar.
  - Respeita `AccessibilityInfo.isReduceMotionEnabled()` (estados estáticos).
  - Sem emojis (regra do projeto): o "dedo" é um *touch dot* animado; cores e
    círculos seguem o design system (`MODE_COLORS`).
- **Tutoriais por modo**:
  - **Partida**: círculo grande na cor do modo acende + touch dot toca + "Aguarde o
    círculo acender. / Toque o mais rápido possível."
  - **Alvo**: prompt "TOQUE O VERDE" no topo + grid 2x2 com 4 cores (alvo verde com
    glow) + touch dot na cor correta + "Leia a cor indicada e toque no círculo correto.
    Toque errado = +200ms."
  - **Sequência**: círculo grande alternando GO (verde — igual ao jogo real) / NoGo
    (vermelho) + touch dot só no GO + legenda GO/NO-GO + "Toque apenas nos sinais verdes.
    Ignore os vermelhos. 25% são armadilhas."
  - **Radar**: 5 círculos em cruz, um acende (cor do modo) + touch dot no aceso +
    "Toque no círculo que acender. 5 posições possíveis."

### Integração nos 4 modos
`ModoPartida.tsx`, `ModoAlvo.tsx`, `ModoSequencia.tsx`, `ModoRadar.tsx`:
- `<ModeTutorial modeKey="..." />` inserido **antes do botão INICIAR**, depois do card
  "Como jogar".
- O conteúdo do intro foi envolvido num `ScrollView` (contentContainerStyle com
  `flexGrow: 1` + `justifyContent: 'center'`) para evitar que o tutorial empurre o botão
  INICIAR para fora da tela em aparelhos menores.

### i18n
- `pt.json` / `en.json`: bloco `tutorial` com `dontShowAgain` + textos por modo (PT/EN).

## Decisões
- **GO verde no tutorial de Sequência** (não a cor do modo): o jogo real usa
  `#10b981` para GO e `#ef4444` para NoGo, e a legenda fala "sinais verdes" — o tutorial
  reflete o gameplay real em vez do literal "cor do modo" da spec.
- **Dedo via touch dot (sem emoji)**: a referência usava 👆/✋; substituído por um ponto
  de toque animado para respeitar a regra de "sem emojis" do projeto (Grupo 6).

## Verificação
- `npx tsc --noEmit` → **0 erros**.
