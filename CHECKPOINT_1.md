# CHECKPOINT 1 — GRUPO 1 (Bugs críticos)

Branch: feat/goal-redesign-final
Data: 2026-05-23
TypeScript: npx tsc --noEmit → 0 erros

## Resumo
A maior parte dos itens do GRUPO 1 já estava implementada funcionalmente no código.
As correções de código reais foram duas (rodadas do Sequência e barra do Splash).
Os ajustes VISUAIS dos demais itens pertencem ao GRUPO 4 (design novo, telas →
reflexo-*.html), exatamente onde o plano já os coloca.

## Alterações de código
1. Rodadas por modo — mobile2/screens/ModoSequencia.tsx
   - TOTAL_SIGNALS 20 → 10 (canônico: Sequência = 10 rodadas)
   - Ratio 75/25 Go/NoGo preservado (1º sinal Go, demais 25% NoGo independente —
     sem problema de arredondamento)
   - Comentário de score atualizado (não cita mais "20")
   - Partida=7, Alvo=10, Radar=15 já estavam corretos (verificado via TOTAL_ROUNDS)

2. Splash — mobile2/screens/Splash.tsx
   - Adicionada "barra horizontal animada" abaixo do nome REFLEXO
   - Cresce center-out via scaleX (useNativeDriver), sincronizada com o scan de luz
     existente, cor #3b82f6
   - A animação do nome REFLEXO (stagger + pulse + scan) já existia

## Itens verificados (já implementados — sem mudança de código)
- Resultado: tempo individual por rodada — os 4 modos já renderizam lista de rodadas
  com ms/nível (Resultado.tsx: Partida 566, Alvo 694, Seq 824, Radar 923).
  Polimento visual → reflexo-pos-partida.html (GRUPO 4).
- Jornada: criar perfil / destino — CTA pré-triagem (Jornada.tsx 130-137 →
  onOpenTriage(false)) + link "mudar destino" (148-150 → onOpenTriage(true)), ambos
  funcionais via TriageModal.
- Perfil: timeline dos 6 arquétipos — Perfil.tsx 484-528 já renderiza os 6
  (EXPLORADOR→PILOTO) em cadeia horizontal com estados passado(✓)/atual/futuro.
  Estilo cards→círculos → reflexo-perfil.html (GRUPO 4).
- Missões de arquétipo 2-3 com X/Y — Perfil.tsx "PARA VIRAR" (672-731) mostra os
  targetCriteria com sufixo X/Y; barra geral de progresso já existe em
  "METAS DE LONGO PRAZO". Cards + barra por missão → GRUPO 4.

## Decisão importante
config/archetypes.ts NÃO foi alterado (marcado "canônico — não alterar sem
justificativa"). O requisito X/Y já é atendido sem mexer nele.

## Validação
- npx tsc --noEmit: 0 erros
- Arquivos alterados: mobile2/screens/ModoSequencia.tsx, mobile2/screens/Splash.tsx

## Próximo — GRUPO 2 (Bugs de arquitetura)
- Streak duplicado: remover inline computeStreakFromSessions de App.tsx (linhas 47-59),
  usar sempre utils/streak.calculateStreak — verificar quais telas usam qual função.
- ModoSequencia: timing do feedback visual (círculo some lentamente) — corrigir.
- Radar nos arquétipos: adicionar como 4º modo em detectArchetypeId e targetCriteria.
  ATENÇÃO: toca config/archetypes.ts (canônico) — exige justificativa registrada.
