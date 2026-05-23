# SESSÃO HANDOFF — feat/goal-redesign-final

Data: 2026-05-23
Motivo: Rule #6 do CLAUDE.md — contexto da sessão próximo do limite antes do GRUPO 3
(grande). Próxima sessão deve ler CLAUDE.md + este arquivo e CONTINUAR do GRUPO 3.

## Estado do Git
Branch: feat/goal-redesign-final (criada a partir de main @ c3f2508)
Commits desta sessão (mais recente primeiro):
- 15640c0  feat: GRUPO 2 — streak unificado, flash Sequência 250ms, Radar nos arquétipos
- 9687b11  feat: GRUPO 1 — Sequência 10 rodadas + barra animada no Splash
- 1b6687c  chore: pin CLAUDE.md /goal plan + import design refs into repo
Backups pré-redesign: pre-goal-backup (local), origin/backup/pre-goal-redesign (remoto)
tsc --noEmit: 0 erros (validado após cada grupo)

## Concluído
- GRUPO 1 — ver CHECKPOINT_1.md (Sequência 20→10; barra animada no Splash; demais itens
  já estavam implementados — polimento visual fica no GRUPO 4)
- GRUPO 2 — ver CHECKPOINT_2.md (streak unificado em utils/streak.calculateStreak;
  flash do Sequência 500→250ms; Radar como 4º modo nos critérios do PILOTO)

## PRÓXIMO: GRUPO 3 — Intro + Onboarding novo
Referência: design/reference/reflexo-intro-onboard.html

### Decisão de arquitetura (já tomada — HÍBRIDA)
- Intro (T1–T5) = telas passivas → continua no OnboardingModal.tsx (redesign de navegação)
- OB1–OB4 = fluxo ATIVO novo → novo wrapper OnboardingFlow.tsx + 4 componentes
- Reusar TriageBaseline (captura de RT) e TriageAmbition (escolha de meta)
- Persistir UserProfile (baselineMs + ambitionId + triageCompleted=true) ao fim do OB4
- Primeira vez: NÃO mostrar TriageModal depois (triageCompleted=true já no OB4).
  TriageModal continua para "trocar meta" (Perfil) e usuários antigos sem baseline.

### PARTE 1 — Intro 5 telas (editar mobile2/screens/OnboardingModal.tsx, ~721 linhas)
- Navegação hoje: dots no TOPO-esquerda (linhas 506–519); SEM botão "Próximo" visível
  em T1–T4 (só swipe); SEM botão "Pular". onComplete salva flag (458–461).
- Mudar:
  1. dots 506–519: mover para zona inferior (bottom ~60).
  2. Adicionar botão "Próximo →" full-width na base de cada tela (cor por tela:
     T1 cyan #00f5ff, T2 blue #3b82f6, T3 amber #f59e0b, T4 cyan, T5 green #10b981).
  3. Adicionar "Pular" top-right (todas as telas); handler saveOnboardingDone()+onComplete
     (T1–T4 → vai p/ OB1; T5 não tem skip, botão é "COMEÇAR →").
  4. Reordenar telas: T2=ciência (era a antiga "ciência"), T3=meta, T4=modos
     (compacta), T5=revelação do arquétipo "O Explorador" (avatar SVG, roxo) com CTA
     "COMEÇAR →". Ajustar data/índices da FlatList (482–489) e swipeHint (493–503).

### PARTE 2 — Onboarding OB1–OB4 (criar arquivos novos)
Criar pasta mobile2/screens/onboarding/ com:
- OB1_FirstGame.tsx (~simplificar TriageBaseline p/ SÓ Partida, 3 toques; fases
  intro→countdown→jitter→go ×3→result; retorna melhor RT via onNext(rt)).
  TriageBaseline tem computeBaseline (linha ~71, média dos 2 melhores) e
  getBaselineColor (~63) — reaproveitar lógica/jitter.
- OB2_Result.tsx (props rt: number) — número grande verde + "milissegundos" +
  contexto ("Acima da média humana (250–300 ms)") + caixa roxa de lore. Botão
  "Ver meu arquétipo →".
- OB3_Archetype.tsx (props rt) — buildUserStats([{mode:'partida',score:rt,...}],0) →
  detectArchetypeId dá 'EXPLORADOR' p/ 1 sessão; render do card do arquétipo (ver
  config/archetypes.ts ARCHETYPES[id]: name/icon/color/description) + preview do
  próximo (ARCHETYPES[id].nextId). Botão "Definir minha meta →".
- OB4_Goal.tsx — wrapper sobre TriageAmbition (UI de escolha; onNext(ambitionId)).
  Botão "Entrar no Reflexo →".
- OnboardingFlow.tsx (orquestrador): step intro→ob1→ob2→ob3→ob4; guarda firstRt,
  archetype, ambition; ao fim chama saveUserProfile({baselineMs:rt, ambitionId,
  triageCompleted:true}) e onComplete().

### Integração App.tsx (linhas ~793–800)
Trocar <OnboardingModal onComplete=.../> por <OnboardingFlow onComplete=.../>.
Manter states splashVisible/onboardingVisible/onboardingNeededRef (121–129).
Garantir que pendingTriage (116–118) NÃO arme triagem pós-1ª-partida quando
triageCompleted já é true (definido no OB4).

### Persistência (referências)
- types/user.ts: UserProfile.baselineMs (nullable, ~l.7), ambitionId (~l.5),
  triageCompleted (~l.9). utils/userProfile.ts: saveUserProfile (~l.16), chave
  reflexo_user_profile_v1. config/ambitions.ts: AMBITIONS (9 opções, 3 grupos).

### Validação obrigatória
- npx tsc --noEmit = 0 erros antes do commit (Rule #5).
- Criar CHECKPOINT_3.md e commitar (Rule #9).

## Depois do GRUPO 3
- GRUPO 4 — Design novo (Home/Missões/Perfil/Resultado/Gameplays + estados de erro)
  seguindo reflexo-*.html em design/reference/. Inclui o polimento visual adiado do
  GRUPO 1 (timeline de círculos no Perfil, cards de missão com barra, etc.).
- GRUPO 5 — Animação de evolução de arquétipo (reflexo-arquetipo-evolucao.html).
- GRUPO 6 — Housekeeping (emojis→SVG, ROADMAP, CLAUDE.md final, VERSAO_FINAL.md).

## Tarefas abertas (TaskList desta sessão)
#12 GRUPO 3 PARTE 1 · Intro 5 telas redesign (pending)
#13 GRUPO 3 PARTE 2 · Onboarding OB1–OB4 (pending)
#14 GRUPO 3 · CHECKPOINT_3.md + commit (pending)
