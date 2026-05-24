# CHECKPOINT 5 — GRUPO 5 (Animação de evolução de arquétipo) — COMPLETO

Branch: feat/goal-redesign-final
Data: 2026-05-23
TypeScript: npx tsc --noEmit → 0 erros
Referência: design/reference/reflexo-arquetipo-evolucao.html (prioridade máxima do conselho)

## O que foi implementado

### Novo componente — screens/ArchetypeEvolution.tsx
Takeover full-screen disparado quando o arquétipo do usuário avança. Sequência
(~2.4s até o CTA), espelhando o storyboard de 6 frames do mock com Animated do RN:

- Frame 1 (0ms): flash branco (opacity 0→0.32→0) + `hapticHeavy()`.
- Frame 2 (300ms): glow atrás do avatar + avatar entra com scale 0→1.05→1
  (Easing.back + spring) e fade-in.
- 700ms: ring ping expande (scale 0.7→2.2, opacity 0.55→0).
- Frame 3 (850ms): nome do arquétipo revelado letra-a-letra (setInterval 45ms) +
  `hapticImpactMedium()`.
- Frame 4 (1100ms): 14 partículas explodindo em ângulos distribuídos
  (translate + scale→0 + fade) + `hapticSuccess()`.
- Frame 5 (1300ms): pílula de XP entra + contador XP animado 0→recompensa
  (Animated.Value com listener → setState; recompensa escala por tier:
  250 + tierIdx*150).
- 1900ms: contexto (descrição + preview do próximo arquétipo) fade/slide-in.
- Frame 6 (2400ms): CTA "Continuar treinando →" fade-in (sem pressa).

Cores: paleta do app (avatar/glow/ring usam a cor do arquétipo destino; CTA verde
de ação #10b981), coerente com o design system e com as anotações do mock
(roxo = identidade, verde = ação).

### utils/haptics.ts
+ `hapticHeavy()` (Impact.Heavy) e `hapticSuccess()` (Notification.Success).

### App.tsx — disparo
- Detecção em `addSession`, reaproveitando `prevStats`/`updatedStats` (já calculados
  para conquistas e que JÁ excluem sessões invalidForAchievements). Compara o índice
  de `archetypeId` em `ARCHETYPE_ORDER`; dispara só em AVANÇO (newIdx > prevIdx e > 0)
  → nunca em regressão nem em sessão descartada.
- `evolutionTo` (state) controla um `<Modal>` opaco renderizado por último (topo).
- Toasts de conquista e de marco ficam `visible` apenas quando `evolutionTo === null`
  — o estado persiste, então aparecem logo após o usuário tocar "Continuar",
  evitando empilhamento de modais sobre o takeover.

### i18n
+ namespace `evolution` (eyebrow, xp, next, maxReached, continue) em pt/en.
Nome/descrição do arquétipo vêm de config/archetypes.ts (PT, consistente com Perfil).

## Notas / limitações conscientes
- Sem blur nativo no RN: o glow é um círculo translúcido grande (aproximação do
  filter:blur do mock). Suficiente para o efeito.
- "XP" é um floreio celebratório do momento (escalado por tier); o app não persiste
  XP — não é um sistema de pontos, é o "peso" da conquista, como no mock.

## Próximo — GRUPO 6 (Housekeeping)
emojis restantes → SVG; ROADMAP.md; CLAUDE.md estado final; VERSAO_FINAL.md;
commit final.
