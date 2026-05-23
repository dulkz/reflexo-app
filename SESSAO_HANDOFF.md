# SESSÃO HANDOFF — feat/goal-redesign-final

Data: 2026-05-23
Próxima sessão: ler CLAUDE.md + este arquivo. GRUPO 3 concluído; GRUPO 4 PARCIAL.

## Estado do Git
Branch: feat/goal-redesign-final
Commits recentes (mais novo primeiro):
- ca1e87a  feat: G4 — Home redesign (CTA dominante + arquétipo + lore)
- 4a78936  feat: G4 — abertura unificada dos 4 modos
- 44c3570  feat: G4 — estados de erro nos 4 gameplays (flash + shake + haptics)
- 89dbbee  feat: GRUPO 3 — Intro redesign + onboarding ativo OB1-OB4
tsc --noEmit: 0 erros (validado após cada sub-item)
Dependência nova: expo-haptics 15.0.8 (instalada via `npx expo install`).

## Concluído
- GRUPO 1, 2, 3 — ver CHECKPOINT_1/2/3.md.
- GRUPO 4 (PARCIAL) — ver CHECKPOINT_4.md:
  - DONE: estados de erro (4 modos), abertura unificada (4 modos), Home redesign.
  - VERIFICADO já presente (requisito funcional OK): tempos por rodada no
    Resultado; timeline de 6 arquétipos no Perfil; missões com X/Y na Jornada.

## PRÓXIMO: terminar GRUPO 4 — polimento visual (lógica já pronta, NÃO alterar)

Telas grandes, já funcionais e já estilizadas — o trabalho é alinhar ao mock.
Trabalhar em pequenos incrementos + tsc 0 + commit por tela.

### 4a. Resultado — reflexo-pos-partida.html  (mobile2/screens/Resultado.tsx, ~50KB)
- Tempos por rodada JÁ renderizam (PartidaResult result.allRounds+times.map;
  AlvoResult/RadarResult result.roundList; SeqResult result.timeline). Só refinar
  o visual dos blocos (números grandes, badge de penalidade discriminada
  "tempo real Xms + penalidade").

### 4b. Missões — reflexo-missoes.html  (mobile2/screens/Jornada.tsx, ~21KB)
- Onde as missões vivem hoje (aba "Jornada"). Aplicar: meta banner roxo no topo,
  seções "Hoje"/"Semana", cada card com ícone + título + sub + progresso X/Y +
  BARRA de progresso + CTA inline "Jogar agora →" na cor do modo. Lore roxo no fim.

### 4c. Perfil — reflexo-perfil.html  (mobile2/screens/Perfil.tsx, ~59KB)
- Timeline de 6 arquétipos (ARCHETYPE_CHAIN) JÁ existe. Refino visual da timeline
  + card do arquétipo + evidence chips, seguindo o mock. Preservar toda a lógica
  de detecção/progresso.

### Validação obrigatória
- npx tsc --noEmit = 0 (rodar de dentro de mobile2/). Commit por tela.
- Ao fechar o GRUPO 4 inteiro, atualizar CHECKPOINT_4.md (tirar o "PARCIAL").

## Depois do GRUPO 4
- GRUPO 5 — Animação de evolução de arquétipo (reflexo-arquetipo-evolucao.html).
  Modal disparado quando o arquétipo muda: flash branco + Haptics.Heavy → avatar
  scale 0→1.05→1 → nome letra-a-letra (Haptics.Medium) → partículas (Haptics.Success)
  → contador XP → CTA Continuar. Base já disponível: utils/haptics.ts,
  utils/animations.ts. Disparo: comparar archetypeId antes/depois em App.addSession.
- GRUPO 6 — Housekeeping (emojis→SVG, ROADMAP, CLAUDE.md final, VERSAO_FINAL.md).

## Notas de arquitetura úteis (desta sessão)
- Haptics: utils/haptics.ts → hapticImpactMedium / hapticError / hapticLight.
- Shake: utils/animations.ts → shake(value, amplitude, duration) em translateX.
- Onboarding ativo: screens/onboarding/ (OnboardingFlow orquestra intro→OB1..OB4 e
  persiste baselineMs+ambitionId+triageCompleted; App suprime o triage-prompt
  pós-1ª-partida via hasSeenTriagePrompt=true).
- Arquétipos canônicos: config/archetypes.ts (buildUserStats→archetypeId,
  ARCHETYPES[id] com icon/color/name/description/nextId/targetCriteria).
