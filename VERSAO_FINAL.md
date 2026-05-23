# VERSÃO FINAL — Reflexo App (feat/goal-redesign-final)

Data: 2026-05-23
Branch: feat/goal-redesign-final
TypeScript: `npx tsc --noEmit` → 0 erros (rodar de dentro de mobile2/)
App principal: mobile2/ (NUNCA mobile/)

Documento de fechamento do redesign aprovado pelo conselho (GRUPOS 1–6) + segunda
leva de mudanças (GRUPOS 7–9: navegação 3 tabs, tutoriais de modo, correções pontuais).
Checkpoints por grupo: CHECKPOINT_1..5.md e CHECKPOINT_7..9.md (raiz do repo).

---

## 1. O que foi implementado

### GRUPO 1 — Bugs críticos (commit 9687b11)
- Splash com animação do nome Reflexo + barra horizontal animada.
- Modo Sequência ajustado para 10 rodadas (Go/NoGo).
- Resultado renderiza o tempo individual de cada rodada nos 4 modos.
- Perfil exibe a cadeia dos 6 arquétipos (EXPLORADOR→PILOTO).

### GRUPO 2 — Bugs de arquitetura (commit 15640c0)
- Streak unificado em utils/streak.calculateStreak (removido o cálculo inline).
- Timing do feedback visual do Sequência corrigido (flash 250ms).
- Radar incorporado como 4º modo na detecção de arquétipo e nos targetCriteria.

### GRUPO 3 — Intro + Onboarding (commit 89dbbee)
- Intro de 5 telas redesenhada (navegação na zona inferior, botão Pular).
- Onboarding ativo OB1–OB4: mini-jogo de reflexo → resultado real → revelação de
  arquétipo → escolha de meta. Persiste baselineMs + ambitionId + triageCompleted;
  App.tsx suprime o triage-prompt pós-1ª-partida (hasSeenTriagePrompt).

### GRUPO 4 — Design novo das telas
- Estados de erro nos 4 gameplays (commit 44c3570): flash + shake + haptics,
  conforme reflexo-estados-erro.html. Base: utils/haptics.ts + utils/animations.ts.
- Abertura unificada dos 4 modos (commit 4a78936): ícone SVG + título + card "Como
  jogar" tintado + botão INICIAR na cor do modo.
- Home (commit ca1e87a): CTA "TREINAR AGORA" dominante + card de arquétipo + streak
  pill + stats 2-col + lore roxo.
- Resultado (commit f84633b): penalidade DISCRIMINADA no Alvo (tempo real + pílula
  +150 + total), timeouts separados, números de rodada grandes, nota de penalidade.
- Missões/Jornada (commit d221311): banner de meta roxo + rótulos Hoje/Semana +
  card de lore (neuroplasticidade).
- Perfil (commit 2c15ec7): timeline de arquétipos nó+conector (done/active/locked) +
  barra de accent no card + indicador "próximo →".

### GRUPO 5 — Animação de evolução de arquétipo (commit 845362b)
- screens/ArchetypeEvolution.tsx: takeover full-screen disparado quando o arquétipo
  avança. flash + Heavy → avatar scale → nome letra-a-letra (+Medium) → 14 partículas
  (+Success) → contador XP animado → contexto + CTA (~2.4s).
- Disparo em App.addSession comparando o índice em ARCHETYPE_ORDER (só avanço; exclui
  sessões inválidas e regressões). Toasts de conquista/marco adiados durante o takeover.

### GRUPO 6 — Housekeeping (este commit)
- Pictogramas coloridos removidos/unificados: 🧠, ⚠️ removidos das strings i18n;
  ❌ → ✗ (glifo de erro tipográfico); ⚡ do "Erros de inibição" removido (cor já
  distingue); ModoSequencia penaltyIcon ❌ → ✕ (unifica com os outros 3 modos, agora
  com cor explícita); ⚡ dos labels da timeline de Sequência removido.
- ROADMAP.md: Fase 1 marcada como concluída + bloco do redesign do conselho.
- CLAUDE.md: nota de Estado Final + checklist marcado.
- VERSAO_FINAL.md criado.

### GRUPO 7 — Navegação: 3 tabs (CHECKPOINT_7.md)
- App.tsx: 5 tabs → 3 tabs (**Início · Missões · Perfil**). FAB laranja e mode picker
  bottom sheet removidos por completo (modos seguem acessíveis pelos cards da Home).
- Nova tela `screens/Missoes.tsx`: meta pessoal no topo + missões diárias (rótulo de
  recompensa **Energia**) + semanais (rótulo **Ticket Dourado**), reusando
  dailyMissions.ts/missions.ts.
- Perfil virou hub: incorpora **MINHA JORNADA** (mapa + meta via JourneyMap),
  **HISTÓRICO — evolução por modo** (colapsável), **CIÊNCIA** (colapsável) e a lista
  completa de **Conquistas** (expandida inline pelo card-resumo).
- Refatoração de reuso: `Ciencia` exporta `CienciaContent`; `Historico` exporta
  `HistoricoModeCards`. Jornada/Ciencia/Historico **não foram deletadas** — apenas
  deixaram de ser tabs.
- i18n: blocos `nav` e `missoes` (PT/EN).

### GRUPO 8 — Tutoriais dos modos (CHECKPOINT_8.md)
- `components/ModeTutorial.tsx` (adaptado p/ TS da referência JS): tutorial animado por
  modo, primeira abertura, "não mostrar novamente" em AsyncStorage
  (`mode_tutorial_seen_{modeKey}`), respeita reduce-motion, sem emojis (dedo = touch dot).
- Integrado antes do botão INICIAR nos 4 modos; o intro virou ScrollView (evita corte).
- i18n: bloco `tutorial` (PT/EN).

### GRUPO 9 — Correções pontuais (CHECKPOINT_9.md)
- Sequência: **10 → 15 sinais** (25% NoGo mantido); descrições "20"→"15" (PT/EN).
- **Energia infinita para assinantes**: `PREMIUM_ACTIVE` em monetization.ts +
  `hasInfiniteEnergy()` em energy.ts; Home mostra **∞**; `tryStartMode` não consome
  energia quando premium. Flag default `false` (sem impacto em produção).
- Alvo: texto → "Leia a cor indicada e toque no círculo correto" (PT/EN).
- Penalidade do Alvo unificada em **+150ms** (valor real do código) em tutorial e textos.

---

## 2. Decisões de design relevantes
- Paleta: as telas seguem a paleta navy já estabelecida no app (#0b1220 / #111a2e /
  #10b981 verde / #8b5cf6 roxo / MODE_COLORS), não os hex exatos dos mocks HTML —
  prioriza coerência entre telas. Estrutura/layout seguiram os mocks.
- Fontes: o app NÃO carrega Bebas/DM Sans/Space Mono; usa a fonte do sistema com
  fontWeight 900 para os números grandes (padrão da Home redesenhada). Não referenciar
  fontFamily de fontes não carregadas.
- "XP" na evolução é um floreio celebratório escalado por tier; o app não persiste XP.
- Glifos ✓ ✗ ✕ ✦ são tipográficos (monocromáticos) e fazem parte da linguagem visual —
  mantidos de propósito; flags 🇧🇷/🇺🇸 mantidas no seletor de idioma.

---

## 3. Pendências conhecidas / não feito
- Ícone de launcher final (Fase 1 do ROADMAP) — não tratado nesta etapa.
- Emojis ⚡ (unidade de energia) em Home/App/SemEnergia e 🕛/👑 na tela SemEnergia
  (paywall) foram MANTIDOS: ⚡ é marcador consistente da unidade de energia; 🕛/👑
  exigiriam novos assets SVG e a tela de paywall não estava no escopo do redesign.
  Conversão futura é opcional.
- Glow da animação de evolução é um círculo translúcido (RN não tem blur nativo) —
  aproximação do filter:blur do mock.
- Validação só por tsc — não houve execução em device/emulador nesta sessão.
- **Recompensas das missões (Grupo 7) são exibidas, mas não concedidas ainda**: a tela
  Missões mostra que diárias dão Energia e semanais dão Ticket Dourado, porém não há
  sistema de "claim"/persistência de tickets nem evento de concessão. Implementar a
  concessão efetiva (com estado de resgate p/ não duplicar) é mecânica futura.
- `PREMIUM_ACTIVE` é uma flag manual em monetization.ts; quando houver Google Play
  Billing, derivar do estado real da assinatura.

---

## 4. Próximos passos recomendados
1. Rodar em emulador/dispositivo Android e validar visualmente as 3 telas polidas,
   a animação de evolução (forçar uma troca de arquétipo) e os estados de erro.
2. Gerar/definir o ícone de launcher final.
3. Avaliar conversão dos emojis de energia/paywall (⚡/🕛/👑) para SVG se desejado.
4. Merge de feat/goal-redesign-final → main após validação manual.
5. Fase 2 do ROADMAP (social/ranking via Supabase) quando priorizada.

---

## 5. Mapa rápido de arquivos-chave
- App.tsx — state machine + 3 tabs (Início/Missões/Perfil) + addSession + modais.
- screens/Home.tsx, Resultado.tsx, Perfil.tsx — telas redesenhadas (Perfil = hub).
- screens/Missoes.tsx — tab Missões (meta + diárias/semanais com recompensas) (GRUPO 7).
- screens/{Jornada,Ciencia,Historico}.tsx — não são mais tabs; Ciencia exporta
  CienciaContent, Historico exporta HistoricoModeCards (embutidos no Perfil).
- components/ModeTutorial.tsx — tutoriais animados por modo (GRUPO 8).
- screens/ArchetypeEvolution.tsx — animação de evolução (GRUPO 5).
- screens/Modo{Partida,Alvo,Sequencia,Radar}.tsx — gameplays + estados de erro + tutorial.
- config/archetypes.ts — detecção e catálogo dos arquétipos (canônico).
- config/monetization.ts — PREMIUM_ACTIVE; utils/energy.ts — hasInfiniteEnergy().
- utils/haptics.ts (impactMedium/error/light/heavy/success) + utils/animations.ts (shake).
- locales/pt.json + en.json — i18n (namespaces nav, missoes, tutorial, home, journey…).
