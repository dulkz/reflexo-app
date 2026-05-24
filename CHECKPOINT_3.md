# CHECKPOINT 3 — GRUPO 3 (Intro + Onboarding novo)

Branch: feat/goal-redesign-final
Data: 2026-05-23
TypeScript: npx tsc --noEmit → 0 erros
Referência: design/reference/reflexo-intro-onboard.html

Arquitetura HÍBRIDA (conforme SESSAO_HANDOFF):
- Intro (T1–T5) = telas passivas → permanece em `OnboardingModal.tsx` (redesign de navegação).
- OB1–OB4 = fluxo ATIVO novo → `screens/onboarding/` (4 telas + orquestrador).
- Fluxo total: intro → COMEÇAR/pular → OB1 → OB2 → OB3 → OB4 → Home.

## PARTE 1 — Intro 5 telas (mobile2/screens/OnboardingModal.tsx — reescrita)

Reordenação narrativa (marca → por que funciona → sua meta → como funciona → quem você é):
- T1 — Marca (ciano): círculo pulsante + REFLEXO + tagline. (mantida, nav corrigida)
- T2 — Ciência (verde): ondas + "Seu cérebro é treinável" + 3 stat rows (10–15% / <5min / neuroplast.).
- T3 — Meta (âmbar): trilha (journey) + "Uma meta só sua." + caixa âmbar "A gente mostra o caminho.".
- T4 — Modos (azul, compacta): título à esquerda + 4 mode items (Partida/Alvo/Sequência/Radar).
- T5 — Arquétipo reveal (roxo, NOVA): card com avatar SVG do EXPLORADOR + "O Explorador" + CTA "COMEÇAR →".

Navegação (correção do affordance failure — antes dots no topo + só swipe):
- Dots movidos para a ZONA INFERIOR, acima do botão.
- Botão "Próximo →" full-width explícito na base (cor âncora verde; T3 âmbar). Última tela = "COMEÇAR →".
- "pular introdução" discreto no top-right (T1–T4; T5 não tem skip — é o comprometimento).
- COMEÇAR e Pular chamam o mesmo `onComplete` → avançam para OB1 (sem persistir aqui).
- FlatList mantida (swipe ainda funciona) + `scrollToIndex` dirigido pelo botão; `getItemLayout` para confiabilidade.
- Tela antiga "Tudo registrado / #" (streak quebrado "#") REMOVIDA.

## PARTE 2 — Onboarding OB1–OB4 (mobile2/screens/onboarding/ — novos)

- OB1_FirstGame.tsx — Modo Partida simplificado, 3 toques (jitter 1000–4000 ms espelhando
  ModoPartida/TriageBaseline). Toque antecipado = "Cedo demais!" e repete a rodada (garante
  3 toques válidos). Retorna o MELHOR (menor) RT via onNext(rt).
- OB2_Result.tsx — número grande verde + "milissegundos" + pílula de contexto (tier por RT
  vs. média humana 250–300 ms) + caixa roxa de lore ("córtex pré-frontal processou em {rt} ms…").
  CTA "Ver meu arquétipo →".
- OB3_Archetype.tsx — monta uma SessionRecord sintética e roda `buildUserStats(...)` → detecção
  real dá EXPLORADOR p/ 1 sessão. Renderiza o card do arquétipo (icon/desc canônicos) + preview
  do próximo (ARCHETYPES[id].nextId = EM_EVOLUCAO). Nomes de exibição title-case (ARCH_DISPLAY).
  CTA "Definir minha meta →".
- OB4_Goal.tsx — wrapper sobre TriageAmbition (picker canônico de 8 ambições/3 grupos, ligado a
  milestones/missões). CTA "Entrar no Reflexo →"; dots de etapa ocultados (stepDots={null}).
- OnboardingFlow.tsx — orquestrador (step intro→ob1→ob2→ob3→ob4); guarda firstRt; ao fim chama
  `patchUserProfile({ baselineMs, baselineTakenAt, ambitionId, triageCompleted:true, … })`,
  `saveOnboardingDone()` e `onComplete(updatedProfile)`.

## Suporte / integração

- TriageAmbition.tsx — props opcionais `ctaLabel?` e `stepDots?` (backward-compatible; defaults
  preservam o uso em TriageModal). Permite OB4 customizar CTA e ocultar os 5 dots da triagem.
- App.tsx — `<OnboardingModal/>` → `<OnboardingFlow onComplete={handleOnboardingComplete}/>`.
  `handleOnboardingComplete` adota o perfil persistido e seta `hasSeenTriagePrompt=true` (suprime
  o prompt de triagem pós-1ª-partida, pois a triagem já foi feita no onboarding).
  Garantia de não-duplicação: addSession só arma `pendingTriage` quando `!profile.triageCompleted`
  (recarregado do storage) — e OB4 já gravou triageCompleted=true. Sem dupla triagem.
- i18n — bloco `onboarding` reescrito (chaves t1–t5 + ob.*) em pt.json e en.json; chaves antigas
  screen1–5/swipeHint/continue removidas (nenhum outro consumidor).

## Validação
- npx tsc --noEmit: 0 erros.
- Arquivos novos: mobile2/screens/onboarding/{OB1_FirstGame,OB2_Result,OB3_Archetype,OB4_Goal,OnboardingFlow}.tsx
- Arquivos alterados: mobile2/App.tsx, mobile2/screens/OnboardingModal.tsx,
  mobile2/screens/triage/TriageAmbition.tsx, mobile2/locales/{pt,en}.json

## Próximo — GRUPO 4 (Design novo)
Aplicar reflexo-*.html sobre Home/Missões/Perfil/Resultado/Gameplays + estados de erro por modo.
Inclui o polimento visual adiado do GRUPO 1 (timeline de 6 arquétipos no Perfil, cards de missão
com barra X/Y, tempos individuais por rodada no Resultado).
