# SESSÃO HANDOFF — feat/goal-redesign-final

Data: 2026-05-23
Próxima sessão: ler CLAUDE.md + este arquivo. GRUPOS 1–3 concluídos; GRUPO 4 PARCIAL.
Retomar exatamente nos itens 4a / 4b / 4c abaixo.

## Estado do Git
Branch: feat/goal-redesign-final  (working tree limpo)
HEAD atual: ca0d52c
Commits recentes (mais novo primeiro):
- ca0d52c  docs: G4 parcial — CHECKPOINT_4 + handoff
- ca1e87a  feat: G4 — Home redesign (CTA dominante + arquétipo + lore)
- 4a78936  feat: G4 — abertura unificada dos 4 modos
- 44c3570  feat: G4 — estados de erro nos 4 gameplays (flash + shake + haptics)
- 89dbbee  feat: GRUPO 3 — Intro redesign + onboarding ativo OB1-OB4
tsc --noEmit: 0 erros (rodar SEMPRE de dentro de mobile2/).
Dependência nova nesta etapa: expo-haptics 15.0.8 (já instalada e em package.json).

## GRUPO 4 — estado EXATO

### ✅ DONE (commitado)
1. Estados de erro nos 4 gameplays — commit 44c3570
   - ModoPartida/ModoAlvo/ModoSequencia/ModoRadar.tsx + utils/haptics.ts +
     utils/animations.ts (shake). Specs do reflexo-estados-erro.html cumpridas.
2. Abertura unificada dos 4 modos — commit 4a78936
   - Telas de intro dos 4 ModoX.tsx: ícone ICONS.modes.* + título + card "Como
     jogar" tintado + botão INICIAR na cor do modo.
3. Home redesign — commit ca1e87a
   - mobile2/screens/Home.tsx: CTA "TREINAR AGORA", card de arquétipo, streak
     pill, stats 2-col, lore roxo. +10 chaves i18n home.* (pt/en).

### ⏸️ FALTA — só polimento visual (LÓGICA JÁ COMPLETA, NÃO ALTERAR)
Telas grandes, já funcionais e já estilizadas. Trabalhar em incrementos pequenos,
`npx tsc --noEmit` = 0, e UM commit por tela. Ao fechar as 3, atualizar
CHECKPOINT_4.md (remover "PARCIAL").

#### 4a. Resultado — reflexo-pos-partida.html
Arquivo: mobile2/screens/Resultado.tsx (~50KB)
- Tempo individual por rodada JÁ RENDERIZA — não reimplementar:
  - PartidaResult (def ~l.514): `t('result.allRounds')` ~l.564 + `times.map` ~l.566
    + nota de descarte `t('result.discardedNote')`.
  - AlvoResult (def ~l.615): `t('result.roundList')` ~l.693 + `alvoResults.map` ~l.694.
  - SeqResult (def ~l.730): `t('result.timeline')` ~l.821 + `summary.trials.map` ~l.824.
  - RadarResult (def ~l.871): `t('result.roundList')` ~l.922 + `radarResults.map` ~l.923.
  - Props raiz: ~l.954–968.
- A FAZER: refino visual seguindo o mock — números grandes (estilo Bebas),
  badge de penalidade DISCRIMINADA ("tempo real Xms + 150ms penalidade = Yms"),
  espaçamento/cards. Sem mexer em cálculo de score/penalidade.

#### 4b. Missões — reflexo-missoes.html
Arquivo: mobile2/screens/Jornada.tsx (~21KB) — missões vivem na aba "Jornada".
- JÁ EXISTE: seção "MISSÕES" ~l.252; daily card ~l.257 (header+contagem+barra
  `missionProgressTrack`/`missionProgressFill` ~l.267, linhas com `missionMiniTrack`
  /`missionMiniFill` ~l.282); weekly logo abaixo. Dados via getDailyMissions
  (utils/dailyMissions) e getWeeklyMissions (utils/missions). doneDaily/doneWeekly
  ~l.118–119.
- A FAZER: aplicar o mock — meta-banner roxo no topo (meta do usuário +
  "X ms de distância" + editar→onOpenTriage), rótulos "Hoje"/"Semana", cada card
  com ícone+título+sub+progresso X/Y + BARRA + CTA inline "Jogar agora →" na cor
  do modo (precisa de callbacks de start de modo — hoje Jornada NÃO recebe; ou
  navegar via prop nova, ou só destacar visualmente sem CTA funcional numa 1ª
  passada). Lore roxo no fim. Preservar a lógica de missões.

#### 4c. Perfil — reflexo-perfil.html
Arquivo: mobile2/screens/Perfil.tsx (~59KB)
- JÁ EXISTE timeline de 6 arquétipos — não reimplementar:
  - `ARCHETYPE_CHAIN` (EXPLORADOR→PILOTO) ~l.16; render da timeline ~l.486–519
    (ícones ARCHETYPES[id].icon + conectores); card do arquétipo ~l.462–477
    (evidence chips); `archetypePct` ~l.328; pastArchetypes ~l.347; destino ~l.358.
  - stats via buildUserStats ~l.222; getArchetypeFromStats ~l.223.
- A FAZER: refino visual da timeline e do card seguindo o mock (cores/raios/
  conectores/tipografia). NÃO alterar detecção de arquétipo nem progresso.

## Notas de arquitetura (desta sessão)
- Haptics: utils/haptics.ts → hapticImpactMedium / hapticError / hapticLight
  (fire-and-forget, .catch vazio).
- Shake: utils/animations.ts → shake(value: Animated.Value, amplitude=6,
  duration=400) em translateX (useNativeDriver), espelha os keyframes CSS.
- Onboarding ativo: screens/onboarding/ — OnboardingFlow orquestra intro→OB1..OB4
  e persiste baselineMs+ambitionId+triageCompleted; App.tsx suprime o triage-prompt
  pós-1ª-partida via hasSeenTriagePrompt=true. (GRUPO 3, commit 89dbbee.)
- Arquétipos canônicos: config/archetypes.ts — buildUserStats(sessions, streak)
  → archetypeId; ARCHETYPES[id] = { icon, color, name, description, nextId,
  targetCriteria[] }. detectArchetypeId é interno (não exportado).

## Depois do GRUPO 4
- GRUPO 5 — Animação de evolução de arquétipo (reflexo-arquetipo-evolucao.html):
  modal disparado quando archetypeId muda (comparar antes/depois em
  App.addSession). Frames: flash branco + Haptics.Heavy → avatar scale 0→1.05→1
  → nome letra-a-letra (Haptics.Medium) → partículas (Haptics.Success) → contador
  XP → CTA Continuar. Base pronta: utils/haptics.ts + utils/animations.ts.
- GRUPO 6 — Housekeeping (emojis→SVG, ROADMAP.md, CLAUDE.md final, VERSAO_FINAL.md).
