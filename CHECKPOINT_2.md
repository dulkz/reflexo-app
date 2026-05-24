# CHECKPOINT 2 — GRUPO 2 (Bugs de arquitetura)

Branch: feat/goal-redesign-final
Data: 2026-05-23
TypeScript: npx tsc --noEmit → 0 erros

## Alterações

1. Streak duplicado — mobile2/App.tsx
   - Removida a função inline `computeStreakFromSessions` (contava dias consecutivos
     a partir de HOJE; quebrava o streak se o usuário ainda não tivesse jogado hoje).
   - App.tsx agora importa e usa `utils/streak.calculateStreak(...).current` nos dois
     pontos de cálculo (addSession: `prevStreak` e `updatedStreak`).
   - Resultado: um único algoritmo de streak em todo o app (Home, Perfil, conquistas),
     com a regra "vivo via ontem" (streak não quebra até o fim do dia de hoje).

2. ModoSequencia — timing do feedback visual — mobile2/screens/ModoSequencia.tsx
   - Causa-raiz: o "círculo some lentamente" é o overlay de FLASH, não o círculo. Num
     acerto (Go), `flash(false)` pinta a tela de verde (#10b981 — mesma cor do círculo
     Go) e desvanece em 500ms; o verde remanescente parece o círculo sumindo devagar.
   - Fix: duração do fade do flash 500ms → 250ms (feedback mais ágil, condizente com
     jogo de reação). O círculo em si já desmonta instantaneamente (render só em 'signal').

3. Radar nos arquétipos — mobile2/config/archetypes.ts
   - JUSTIFICATIVA (CLAUDE.md): Radar é o 4º modo do jogo e deve constar nos critérios
     do PILOTO ("todos os modos jogados, incluindo Radar").
   - `detectArchetypeId` ganhou parâmetro `radarPlayed`; PILOTO agora exige
     `fastEnough && preciseEnough && resistantEnough && radarPlayed`.
   - `buildUserStats` passa `bestScore.radar !== null` como `radarPlayed`.
   - VELOCISTA (transição → PILOTO) ganhou o critério `playRadar`
     ("Jogar Modo Radar (4º modo)").
   - Efeito: usuário que cumpre velocidade/precisão/fadiga mas nunca jogou Radar
     permanece VELOCISTA até jogar Radar (comportamento desejado).

## Validação
- npx tsc --noEmit: 0 erros
- Arquivos: mobile2/App.tsx, mobile2/config/archetypes.ts, mobile2/screens/ModoSequencia.tsx

## Próximo — GRUPO 3 (Intro + Onboarding novo)
Referência: design/reference/reflexo-intro-onboard.html
- PARTE 1 (Intro, 5 telas): mover navegação p/ zona inferior; T2 = ciência/dados;
  T3 = revelação do arquétipo "O Explorador" com avatar SVG; T4 = meta pessoal;
  T5 = modos (mais compacta); botão "Pular" no top-right; navegação "Próximo" explícita.
- PARTE 2 (Onboarding OB1-OB4): OB1 mini-jogo 3 toques (captura 1º ms); OB2 resultado
  real + lore; OB3 revelação de arquétipo por performance + preview do próximo;
  OB4 escolha de meta (4 opções) que personaliza missões da semana. Fluxo 90-120s.
