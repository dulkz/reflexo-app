# Reflexo

## O que é
App mobile de velocidade de reação visual com posicionamento de saúde cerebral. O usuário reage a estímulos visuais e recebe feedback sobre seu tempo de reação, com contexto científico sobre o que isso indica sobre a saúde e agilidade do cérebro.

## MVP — 3 Modos de Jogo
- **Partida**: modo padrão de reação simples
- **Alvo**: reação com precisão (tocar no alvo correto)
- **Sequência**: reação em ordem a múltiplos estímulos

## Telas criadas (`design/wireframes/`)
1. `home.html` — tela inicial / menu principal
2. `partida.html` — tela do modo Partida
3. `alvo.html` — tela do modo Alvo
4. `sequencia.html` — tela do modo Sequência
5. `resultado.html` — resultado após cada partida
6. `historico.html` — histórico de desempenho do usuário
7. `perfil.html` — perfil do usuário
8. `ciencia.html` — explicação científica sobre reação e saúde cerebral
9. `styles.css` — estilos compartilhados dos wireframes

## Próximo passo
Construir o app em **React Native com Expo** para Android, usando os wireframes de `design/wireframes/` como referência visual.

## Estrutura do projeto
```
reflexo-app/
├── CLAUDE.md
├── reflexo_game_design.docx   # documento de design do jogo
├── benchmarks_reflexo.docx    # benchmarks de referência
├── design/
│   └── wireframes/            # telas HTML + CSS
├── docs/
├── backend/
├── unity-project/
└── mobile2/                   # app React Native + Expo (ativo)
    ├── App.tsx
    ├── config/
    │   ├── ambitions.ts
    │   ├── archetypes.ts
    │   └── achievements.ts
    ├── types/
    │   └── user.ts
    ├── utils/
    │   ├── levels.ts
    │   ├── storage.ts
    │   └── userProfile.ts
    ├── screens/
    │   ├── Home.tsx
    │   ├── ModoPartida.tsx
    │   ├── ModoAlvo.tsx
    │   ├── ModoSequencia.tsx
    │   ├── Resultado.tsx
    │   ├── Historico.tsx
    │   ├── Ciencia.tsx
    │   ├── Perfil.tsx
    │   └── triage/
    │       ├── TriageModal.tsx
    │       ├── TriageIntro.tsx
    │       ├── TriageAmbition.tsx
    │       ├── TriageAmbitionConfirm.tsx
    │       ├── TriageAge.tsx
    │       ├── TriageBaseline.tsx
    │       └── TriageJourneyMap.tsx
    └── components/
        └── LevelBadge.tsx
```

---

## Histórico de implementação

### Sessões anteriores ao histórico (sem data exata registrada)
Construção inicial do app em `mobile2/` com navegação por state machine em App.tsx (sem React Navigation), 4 tabs (Jogar, Histórico, Ciência, Perfil), 3 modos de jogo completos (ModoPartida, ModoAlvo, ModoSequencia), Resultado.tsx unificado, SafeAreaProvider para Android, sistema de níveis em `utils/levels.ts` e persistência via AsyncStorage em `utils/storage.ts`.

---

### Sessão — Perfil + Arquétipo + Conquistas (Prompt anterior ao Prompt A)

#### (a) Arquivos criados
- `mobile2/config/archetypes.ts` — `UserStats`, `buildUserStats()`, 6 arquétipos em cadeia linear (EXPLORADOR → EM_EVOLUCAO → RESISTENTE → ATIRADOR → VELOCISTA → PILOTO), cada um com `evidence(stats)` e `targetCriteria[]` com `dynamicSuffix`
- `mobile2/config/achievements.ts` — 8 conquistas desbloqueáveis (`Sniper`, `Rotina`, `Abaixo de 250`, `Nível F1`, `Sem Fadiga`, `O Piloto`, `Veterano`, `Madrugador`) com `unlocked(stats: UserStats)`

#### (b) Arquivos modificados
- `mobile2/screens/Perfil.tsx` — reescrita completa: avatar gradiente via `react-native-svg` LinearGradient (#1A6DB5 → #7B5FC7), bloco de identidade, card de arquétipo com evidence chips, bloco "PARA VIRAR" com checklist dinâmico (strikethrough nos critérios concluídos + delta numérico nos pendentes), mode cards com icon box 48×48, bar chart com labels de dia relativo + linha de insight, grid 2 colunas de conquistas com opacity reduzida nas bloqueadas

#### (c) Decisões de design
- `buildUserStats()` computa `archetypeId` internamente numa única passagem, evitando duplicação de lógica
- Gradiente do avatar usa SVG (já dependência existente) em vez de `expo-linear-gradient` para não adicionar dependência nova
- Conquista "O Piloto" acessa `archetypeId` via `UserStats`, não via sessões diretas
- Evidence chips são uma função `(stats) => EvidenceChip[]` em vez de array estático, para que o texto seja dinâmico (ex: "12 sessões de Sequência")

#### (d) Pendências
- `finalMetaMs` e milestones dos arquétipos não foram validados contra `benchmarks_reflexo.docx` — marcar como TODO antes de produção
- O bloco "PARA VIRAR" e o JourneyMap do Perfil ainda não estão integrados com a ambição escolhida na triagem (Prompt B pendente)

#### (e) Convenções estabelecidas
- Funções de detecção de arquétipo usam prioridade decrescente (mais específico primeiro): PILOTO → VELOCISTA → ATIRADOR → RESISTENTE → EM_EVOLUCAO → EXPLORADOR
- `UserStats` é o único tipo passado para as funções de `archetypes.ts` e `achievements.ts` — nunca passar `SessionRecord[]` diretamente

---

### Sessão — Fluxo de triagem + Mapa da jornada (Prompt A · 2026-04-23)

#### (a) Arquivos criados
- `mobile2/config/ambitions.ts` — 8 ambições em 3 grupos (`elite_sport`, `populational`, `brain_health`), cada uma com `id`, `group`, `icon`, `name`, `description`, `finalMetaMs` (null para brain_health), `milestones[]`. Tipo `Milestone` é union discriminada: `{ ms, label }` ou `{ type: 'qualitative', label }`. Nota no topo do arquivo: valores de ms são placeholders a validar contra `benchmarks_reflexo.docx`.
- `mobile2/types/user.ts` — `UserProfile` interface com `ambitionId`, `ageRange`, `baselineMs`, `baselineTakenAt` (timestamp number), `triageCompleted`, mais campos auxiliares de progresso parcial (`triageStep`, `triageTempAmbitionId`, `triageTempAgeRange`) e `triageSkipCount`. `AgeRange` como union type. `defaultUserProfile()` factory.
- `mobile2/utils/userProfile.ts` — `loadUserProfile()`, `saveUserProfile()`, `patchUserProfile()` via AsyncStorage com chave `reflexo_user_profile_v1`. Merge com `defaultUserProfile()` no load para compatibilidade com versões antigas do schema.
- `mobile2/screens/triage/TriageIntro.tsx` — Tela 1: abertura motivacional com emoji 🗺️, título "Bora traçar sua rota?", botão primário "BORA" e botão secundário "Agora não".
- `mobile2/screens/triage/TriageAmbition.tsx` — Tela 2: lista das 8 ambições em 3 seções com header em caps, cards horizontais (ícone + nome + meta em ms), seleção single-select com borda colorida por grupo, botão "CONTINUAR" desabilitado até seleção.
- `mobile2/screens/triage/TriageAmbitionConfirm.tsx` — Tela 3: ícone grande centralizado, título variável por grupo (`elite_sport` / `populational` / `brain_health`), subtítulo fixo sobre faixa etária.
- `mobile2/screens/triage/TriageAge.tsx` — Tela 4: 5 pills em grid flexWrap, seleção single-select, botão "CONTINUAR" desabilitado até seleção.
- `mobile2/screens/triage/TriageBaseline.tsx` — Tela 5: state machine interna com 9 fases (`intro` → `partida_wait` → `partida_go` → `trans_alvo` → `alvo_go` → `trans_seq` → `seq_wait` → `seq_go` → `result`). Três mini-jogos inline sem persistir no histórico. Baseline = média dos 2 menores de 3 RTs (descarta o maior).
- `mobile2/screens/triage/TriageJourneyMap.tsx` — Tela 6: mapa vertical com nó de baseline no topo (🏁 + "Você está aqui"), linha vertical conectando 5 marcos em ordem decrescente de ms, marcos batidos em verde com strikethrough, marco final destacado com borda #f59e0b, card de rodapé "SEU PRÓXIMO ALVO" com delta em ms.
- `mobile2/screens/triage/TriageModal.tsx` — Orquestrador: detecta step inicial via `userProfile.triageStep` (resume progresso parcial), salva estado parcial no AsyncStorage após cada etapa via `saveUserProfile`, chama `onComplete(updatedProfile)` com perfil finalizado.

#### (b) Arquivos modificados
- `mobile2/App.tsx` — adicionados: import de `UserProfile`, `loadUserProfile`, `saveUserProfile`, `TriageModal`; estado `userProfile` e `triageVisible`; ref `pendingTriage` e `dismissedThisSession`; lógica de trigger em `addSession` (checa `sessions.length === 1` + `!triageCompleted` + `skipCount < 3`); função `goHome` que intercepta navegação para mostrar triage se `pendingTriage.current`; `<Modal>` do React Native envolvendo `<TriageModal>` com `animationType="slide"` e `statusBarTranslucent`; handlers `handleTriageComplete` e `handleTriageDismiss`.

#### (c) Decisões de design não especificadas no prompt
- **Baseline = média dos 2 menores** (não dos 2 "melhores" sem critério): RT menor = reação mais rápida, então descartar o maior RT (mais lento) e calcular média dos outros 2 produz um baseline conservadoramente otimista sem remover outliers negativos.
- **Mini-jogos do baseline não usam componentes existentes** (ModoPartida, ModoAlvo, ModoSequencia): reescrever inline em TriageBaseline.tsx evita adicionar props `isBaseline` aos componentes de jogo e mantém o código de produção sem ramificações extras.
- **Alvo baseline aceita qualquer toque** (correto ou não): a triagem mede apenas velocidade de reação bruta; precisão não é relevante para o baseline.
- **Transições entre mini-jogos são automáticas** (1.6s via setTimeout + useEffect): mais fluido do que exigir toque do usuário para avançar, alinhado com o tom "sem pressão" da triagem.
- **Progresso parcial salvo como campos no UserProfile** (`triageStep`, `triageTempAmbitionId`, `triageTempAgeRange`) em vez de uma chave separada no AsyncStorage: simplifica o schema e reduz operações de IO.
- **TriageModal usa `step` como string state** + renders condicionais em vez de um array de componentes ou React Navigation stack: consistente com o padrão já usado no App.tsx (state machine simples sem biblioteca de navegação).
- **"Agora não" incrementa `triageSkipCount`** e seta `dismissedThisSession.current = true` (ref, não state): o ref evita re-renders desnecessários enquanto garante que a triagem não seja oferecida novamente na mesma sessão do app.
- **`baselineTakenAt` salvo como `number` (timestamp)**, não `Date`: evita problemas de serialização JSON no AsyncStorage.

#### (d) Pendências e atenção futura
- **`benchmarks_reflexo.docx` não foi consultado**: todos os valores de `finalMetaMs` e milestones intermediários em `ambitions.ts` são estimativas razoáveis mas precisam de validação antes de produção. Um comentário no topo do arquivo sinaliza isso.
- **Perfil.tsx não exibe a jornada do usuário**: o `UserProfile.ambitionId` e `baselineMs` existem mas a tela Perfil ainda mostra o JourneyMap genérico (Prompt B pendente — integração do mapa de jornada no Perfil com dados reais da triagem).
- **TriageJourneyMap não é reusado no Perfil ainda**: foi construído como tela standalone; Prompt B deve extrair um componente `JourneyMap` reutilizável em `mobile2/components/`.
- **Sem animação de progresso na barra de dots**: os dots mudam instantaneamente entre telas. Uma animação leve de largura (dot ativo = width 20 → width 8) melhoraria a UX.
- **Triage não é acessível via link no Perfil**: o prompt especifica que após 3 dismissals a triagem deve ser acessível via link no Perfil — não implementado.
- **Baseline não separa RT por modo**: os 3 RTs (Partida, Alvo, Sequência) são agregados num único número. Poderia ser útil guardar os 3 separados para análise futura.
- **Sem teste automatizado**: toda validação foi feita via `npx tsc --noEmit`. Sem testes de integração ou unitários.

#### (e) Convenções e padrões a manter
- **Storage keys com versão**: `reflexo_sessions_v1`, `reflexo_user_profile_v1` — ao mudar o schema, criar nova chave versionada e migrar, não sobrescrever a existente.
- **Merge com default no load**: `loadUserProfile` faz `{ ...defaultUserProfile(), ...parsed }` — garante que campos novos adicionados ao schema apareçam com valor default em perfis antigos sem quebrar.
- **Sem React Navigation**: toda navegação usa state machines em App.tsx. Modais fullscreen usam `<Modal>` do React Native. Manter esse padrão.
- **Progresso discreta (5 dots)**: dots de progresso nas telas de triagem usam `width: 20` para dot ativo e `width: 8` para inativo (pill animada visualmente mas não com Animated API). Reproduzir esse padrão em fluxos futuros.
- **Cores por grupo de ambição**: `elite_sport: #3b82f6`, `populational: #8b5cf6`, `brain_health: #10b981` — definidas em `GROUP_COLOR` em `ambitions.ts`. Usar sempre essas constantes, não hardcodar.
- **Dark theme consistente**: background `#0b1220`, cards `#111a2e`, texto secundário `#4a5a7b`, texto mudo `#3a4a6b`, accent azul `#3b82f6`. Nenhuma tela deve introduzir cores de fundo fora dessa paleta sem discussão.

---

### Sessão — Telas de instrução antes de cada modo do mini-teste (2026-04-23)

#### (a) Arquivo modificado
- `mobile2/screens/triage/TriageBaseline.tsx`

#### (b) Mudança
Adicionadas 3 fases de instrução (`partida_instr`, `alvo_instr`, `seq_instr`) à state machine interna, uma antes de cada mini-jogo do baseline. Cada tela mostra o ícone grande do modo (mesmo usado nos cards da Home), o nome em bold grande e uma frase explicando a mecânica, seguida do botão "COMEÇAR". O fluxo passa de 9 para 12 fases: `intro` → `partida_instr` → `partida_wait` → `partida_go` → `trans_alvo` → `alvo_instr` → `alvo_go` → `trans_seq` → `seq_instr` → `seq_wait` → `seq_go` → `result`. O setup do alvo (target/order/signalTime) foi movido do `useEffect` de `trans_alvo` para o `onStart` de `alvo_instr`, executado no momento exato em que o usuário inicia o estímulo.

#### (c) Textos exatos por modo
- **PARTIDA** (🏎): "Aperte o mais rápido possível assim que o círculo verde aparecer. Sem pressa, espera aparecer, pois será penalizado em caso de queimar a largada."
- **ALVO** (🎯): "Toque no círculo com a cor indicada no topo em cada rodada quando ele aparecer. Ignore as outras cores."
- **SEQUÊNCIA** (🧠): "Responda rápido aos sinais Go (verde). Ignore os sinais No-Go (vermelho)."

---

### Sessão — Countdown 3-2-1-GO unificado antes de cada estímulo (2026-04-23)

#### (a) Arquivo modificado
- `mobile2/screens/triage/TriageBaseline.tsx`

#### (b) Mudança
Adicionada fase `countdown` única e reutilizável que exibe 3→2→1→GO antes de cada um dos 3 estímulos do mini-teste. O countdown é acionado pelo botão "COMEÇAR" de cada tela de instrução via `countdownNext` ref, que registra qual fase segue após o GO (`partida_go`, `alvo_go` ou `seq_go`). Implementação via 4 `setTimeout` encadeados (1 s cada + 600 ms no GO), compatível com o `clearTimeout` existente — sem necessidade de `setInterval`. `signalTime.current` é setado ao final do countdown, imediatamente antes de avançar para a fase de execução, garantindo medição de RT precisa e consistente para os 3 modos.

Fases removidas: `partida_wait` e `seq_wait` — eram buffers aleatórios sem contagem visual que existiam apenas para Partida e Sequência; o countdown os substitui com feedback visual consistente para todos os modos.

Setup do Alvo: `setAlvoTarget` e `setAlvoOrder` continuam sendo chamados no `onStart` de `alvo_instr` (antes do countdown iniciar), mas `signalTime` foi desacoplado desse momento e agora é setado no fim do countdown, junto com os outros dois modos.

---

### Sessão — Jitter aleatório entre countdown e estímulo (2026-04-23)

#### (a) Arquivo modificado
- `mobile2/screens/triage/TriageBaseline.tsx`

#### (b) Mudança
Adicionadas 3 fases de espera aleatória (`partida_jitter`, `alvo_jitter`, `seq_jitter`) inseridas entre o GO do countdown e a aparição do estímulo. O objetivo é medir reflexo real em vez de antecipação: o usuário entra em estado de alerta após o GO, mas não sabe exatamente quando o estímulo vai surgir. A tela exibe apenas o nome do modo (`PARTIDA` / `ALVO` / `SEQUÊNCIA`) centralizado em cor quase invisível (`#2d3a55`) sobre fundo escuro.

#### (c) Ranges de jitter — extraídos do jogo principal
| Modo | Range | Tipo |
|------|-------|------|
| Partida | 1000–4000 ms | aleatório (`Math.floor(Math.random() * 3000) + 1000`) |
| Alvo | 700 ms | fixo (`READY_DELAY`) |
| Sequência | 1000–2200 ms | aleatório (`1000 + Math.random() * 1200`) |

#### (d) Arquivos do jogo principal consultados
- `mobile2/screens/ModoPartida.tsx` — constantes `MIN_DELAY=1000`, `MAX_DELAY=4000` (linha 9–10); lógica de jitter em `startRound` (linha 79)
- `mobile2/screens/ModoAlvo.tsx` — constante `READY_DELAY=700` (linha 10); uso em `startRound` (linha 84)
- `mobile2/screens/ModoSequencia.tsx` — constantes `MIN_INTERVAL=1000`, `MAX_INTERVAL=2200` (linha 9–10); lógica de jitter em `scheduleNext` (linha 119)

#### (e) signalTime
`signalTime.current` foi movido do fim do countdown para o fim de cada fase de jitter, imediatamente antes de `setPhase` para a fase de execução. Isso garante que o RT é medido a partir da aparição real do estímulo, não do GO.

#### (f) Falsa largada preservada
`partida_jitter` é renderizado como `Pressable`. Toque durante o jitter chama `handlePartidaFalseStart`, que cancela o timer, grava `partida = 300` (mesmo valor de `FALSE_START` em `ModoPartida.tsx`) e avança para `trans_alvo`. `alvo_jitter` e `seq_jitter` são `View` não-interativos.

---

### Sessão — Integração de jornada nas 4 telas (Prompt B · 2026-04-23)

#### (a) Arquivos criados
- `mobile2/utils/ambition.ts` — 5 helpers sobre o sistema de ambições/marcos:
  - `getAmbition(id)` → objeto completo da ambição
  - `getMilestonesState(baselineMs, currentBestMs, ambitionId)` → array de `MilestoneState` com status `batido_no_baseline | batido_no_progresso | pendente`. "Batido" significa RT atual ≤ ms do marco (mais rápido que o threshold).
  - `getNextMilestone(baselineMs, currentBestMs, ambitionId)` → primeiro marco ainda pendente
  - `calculateDeltaToNextMilestone(currentBestMs, ambitionId, baselineMs)` → ms que o usuário precisa melhorar para atingir o próximo marco (positivo = melhoria necessária)
  - `getMetaBenchmark(ambitionId)` → nome do card em Ciencia.tsx correspondente à ambição (`f1 → 'Piloto de F1 de ponta'`, etc.)
- `mobile2/components/JourneyMap.tsx` — componente visual reutilizável do mapa de marcos. Aceita `baselineMs`, `currentBestMs?`, `compact?`, `showYouAreHere?`. Nós coloridos por status: baseline azul, `batido_no_baseline` cinza opaco, `batido_no_progresso` verde, pendente neutro. Card de rodapé "SEU PRÓXIMO ALVO" com delta. Usado tanto em `TriageJourneyMap` (modo normal, `showYouAreHere=true`) quanto em `Perfil` (modo compacto com `currentBestMs` real).

#### (b) Arquivos modificados
- `mobile2/App.tsx` — adicionados: `triageEditMode` state; `openTriageForEdit()` callback repassado ao Perfil; prop `userProfile` passada para Home, Historico, Ciencia e Perfil; lógica de milestone toast em `addSession` (ver seção d); `<Modal>` de toast com overlay semi-transparente e card com emoji 🏆; `editMode` prop repassada ao `TriageModal`.
- `mobile2/screens/Home.tsx` — prop `userProfile: UserProfile` adicionada; `motivCard` completamente refatorado: fallback F1 hardcoded quando `triageCompleted === false`; texto qualitativo para `brain_health`; delta numérico para ambições com marcos em ms; mensagem "conquistada" quando todos os marcos foram batidos. Ícone do card muda para `ambition.icon`.
- `mobile2/screens/Historico.tsx` — prop `userProfile: UserProfile` adicionada ao componente e ao `EvoChart`; linha tracejada horizontal cinza `#4a5a7b` (`strokeDasharray="4 3"`) desenhada no Y do próximo marco; escala Y expandida para incluir `nextMilestoneMs` garantindo visibilidade da linha; label `"Próximo: N ms"` na ponta direita; card brain_health acima do gráfico quando ambição é `brain_health`.
- `mobile2/screens/Ciencia.tsx` — prop `userProfile: UserProfile` adicionada; card "Velocista olímpico" adicionado ao array BENCHMARKS (source: Lipps et al., 2011; range: 170–200 ms); quando `ambitionId` mapeia para um benchmark via `getMetaBenchmark`, o card recebe `borderWidth: 2`, `borderColor` na cor do grupo (`elite_sport = #3b82f6`) e badge `← SUA META` absolutamente posicionado no canto superior direito.
- `mobile2/screens/Perfil.tsx` — props `userProfile: UserProfile` e `onOpenTriage: () => void` adicionadas; nova seção "MINHA JORNADA" inserida entre card de arquétipo e "PARA VIRAR": quando `triageCompleted === false` exibe CTA card com botão "DEFINIR MINHA META" (também funciona como ponto de entrada permanente após 3 dismissals); quando `triageCompleted === true` exibe header com ícone + nome da ambição + link "trocar meta", linha de resumo baseline/meta/marcos batidos, `<JourneyMap compact />` e card de rodapé com próximo alvo e delta; critério dinâmico "Bater próximo marco: N ms" injetado no render do "PARA VIRAR" (sem modificar `archetypes.ts`).
- `mobile2/screens/triage/TriageJourneyMap.tsx` — refatorado para thin wrapper: page chrome (header "SUA JORNADA", subtitle, ScrollView, CTA button) ao redor de `<JourneyMap showYouAreHere />`. Toda a lógica de nós foi extraída para `components/JourneyMap.tsx`.
- `mobile2/screens/triage/TriageModal.tsx` — prop `editMode?: boolean` adicionada; quando `editMode === true`: step inicial é `'ambition'` (não `'intro'`), `ambitionId` pré-preenchido do `userProfile.ambitionId`, `baselineMs` state inicializado com `userProfile.baselineMs`, step `'confirm'` avança diretamente para `'map'` (pulando `'age'` e `'baseline'`), `advanceTo` é no-op em editMode para não sobrescrever estado do perfil, completion salva apenas `ambitionId` novo mantendo `ageRange`, `baselineMs` e `baselineTakenAt` do perfil existente.

#### (c) Decisões de design
- **`currentBestMs` = `Math.min(...sessions.map(s => s.score))`**: usa o `score` (média do top-5) como métrica primária, não o `bestTime` (melhor tentativa individual). Evita que um tap acidental desbloquei um marco — consistente com o que o usuário vê como sua performance.
- **Linha de marco no gráfico**: cinza neutro `#4a5a7b` tracejado (`4 3`), não colorido. Não compete visualmente com as linhas de dados por modo (verde/azul/roxo).
- **`compact` prop em JourneyMap**: um único componente com ajuste de tamanho de nós, espaçamento e fonte via prop, em vez de dois componentes separados. Node size: 22/28 (compact) vs 28/36 (normal).
- **Critério dinâmico no "PARA VIRAR" injetado no render**: não modifica `archetypes.ts`. O arquivo de arquétipos permanece sem dependência do sistema de ambições. A injeção acontece apenas no render de `Perfil.tsx` quando `triageCompleted === true`.
- **Toast de marco via `<Modal>` transparente**: overlay com `backgroundColor: 'rgba(0,0,0,0.75)'`, card centralizado, dismiss por toque. Consistente com padrão de Modal já usado no app (TriageModal). Sem `Animated` API para manter zero dependências novas.
- **Card "Velocista olímpico" adicionado em Ciencia**: era necessário para o mapeamento `sprinter → benchmark`. Source: Lipps et al., 2011 · Sprint start research. Range: 170–200 ms. Nível: ELITE. Cor: `#10b981`.

#### (d) Abordagem do toast de marco batido
Disparado em `addSession` em `App.tsx`, imediatamente após `setSessions(updated)`. Lógica:
1. Antes de salvar: `prevBest = Math.min(...sessions.map(s => s.score))` (snapshot do state anterior)
2. Depois de salvar: `newBest = Math.min(...updated.map(s => s.score))` (novo estado)
3. Se `newBest < prevBest`: procura nos milestones da ambição atual o primeiro onde `prevBest > m.ms && newBest <= m.ms`
4. Se encontrado: `setMilestoneBeat(beaten.label)` → exibe toast

A condição é **estruturalmente irrepetível** sem flag persistida: na próxima sessão, `prevBest` já será `≤ m.ms`, então a comparação dupla (`prevBest > m.ms && newBest <= m.ms`) nunca volta a ser verdadeira para o mesmo marco. Zero schema change no `UserProfile`.

#### (e) Bug corrigido durante execução
**`currentBestMs` possivelmente `undefined` em `JourneyMap.tsx`** (erro TypeScript `TS18048`): a prop `currentBestMs?: number | null` pode ser `undefined` quando não passada. A comparação `currentBestMs >= baselineMs` falha em tipagem. Correção: normalizar para `const best: number | null = currentBestMs ?? null` no início do componente e usar `best` em todas as comparações internas. Identificado e corrigido no `npx tsc --noEmit` final.

#### (f) Pendências e polimentos em aberto
- **Animação de entrada do toast**: o `<Modal animationType="fade">` é funcional mas sem animação de escala no card interno. Uma entrada com `Animated.spring` melhoraria a percepção de "conquista".
- **Recalibração de baseline após 30 dias**: `TriageModal` em `editMode` não oferece recalibração mesmo quando `baselineTakenAt` tem mais de 30 dias. Prompt B marcou como "opcional, não MVP" — implementar quando relevante.
- **Marcos qualitativos (`brain_health`) não computados automaticamente**: `getMilestonesState` sempre retorna `'pendente'` para marcos `type: 'qualitative'`. Avaliar no futuro: computar "Primeira semana completa" via streak de sessões, "Fadiga < 5%" via `avgFatigueSeq`, etc.
- **`benchmarks_reflexo.docx` ainda não consultado**: valores de `finalMetaMs` e milestones em `ambitions.ts` são placeholders. Validar contra o documento antes de produção.
- **Tela Perfil não exibe arquétipo específico por ambição**: o próximo arquétipo no "PARA VIRAR" ainda é determinado pela lógica genérica de `archetypes.ts`. Prompt B menciona que para F1 deveria ser "O Piloto", para saúde cerebral algo como "O Consistente" — não implementado.
- **"Trocar meta" no Perfil não oferece recalibração**: link abre `editMode` que pula baseline. Se o usuário quer refazer o baseline ao trocar meta, isso não está disponível.

#### (g) Convenções estabelecidas (manter em sessões futuras)
- **`currentBestMs` = `Math.min(...sessions.map(s => s.score))`** — usar sempre `score` (não `bestTime`) como proxy de performance para cálculos de marco e motivação.
- **`getAmbition()` antes de qualquer operação de marco**: nunca acessar `AMBITIONS` diretamente nas telas — sempre via `utils/ambition.ts`.
- **Milestones numéricos: beaten = `RT <= milestone.ms`** — menor RT é melhor; "bater" um marco significa atingir ou superar a velocidade alvo.
- **`delta = currentBestMs - nextMilestone.ms`** — delta positivo = ms que faltam melhorar. Não inverter o sinal (a versão original de `TriageJourneyMap` tinha sinal invertido — foi corrigido no `JourneyMap.tsx`).
- **Prop `userProfile: UserProfile` obrigatória em todas as 4 telas principais** — Home, Historico, Ciencia, Perfil recebem `userProfile` do App.tsx. Qualquer nova tela principal deve seguir o mesmo padrão.
- **`editMode` em `TriageModal` não chama `advanceTo`** — em modo edição, o progresso parcial não é salvo no AsyncStorage para não corromper o estado de triagem concluída.
- **JourneyMap embeddável (não fullscreen)**: o componente é uma `View` pura, sem `ScrollView` próprio. Sempre embuti dentro de um scroll externo. `TriageJourneyMap` é o único que adiciona chrome de página ao redor.

---

### Sessão — Grupo 1: 4 correções pontuais de bugs (2026-04-23)

#### (a) Arquivos modificados
- `mobile2/screens/Perfil.tsx`
- `mobile2/screens/triage/TriageBaseline.tsx`
- `mobile2/screens/ModoAlvo.tsx`
- `mobile2/screens/ModoSequencia.tsx`

#### (b) Causa raiz + (c) correção aplicada

**Bug 1 — Card "SEU PRÓXIMO ALVO" duplicado no Perfil (`Perfil.tsx`)**
`JourneyMap` já renderiza internamente um card "SEU PRÓXIMO ALVO" como rodapé (footer card em `JourneyMap.tsx`). `Perfil.tsx` renderizava um segundo card idêntico (`journeyNextCard`) manualmente logo abaixo do `<JourneyMap compact />`. Resultado: dois cards em sequência na seção "MINHA JORNADA".
Correção: removido o card manual em `Perfil.tsx`, o `useMemo` `deltaToNext` que o alimentava (único consumidor), e o import de `calculateDeltaToNextMilestone` que ficou orfão.

**Bug 2 — Segunda tela "GO / TOQUE AGORA!" na triagem do Modo Sequência (`TriageBaseline.tsx`)**
A fase `seq_go` renderizava `<Text>GO</Text>` + `<Text>TOQUE AGORA!</Text>` como estímulo do mini-teste. O countdown já exibe "GO" (verde) ao final — o usuário via a palavra "GO" duas vezes em sequência (countdown → jitter → seq_go), causando confusão sobre quando devia reagir.
Correção: fase `seq_go` agora exibe `<View style={styles.greenCircle} />` (estilo já existente, reutilizado), consistente com a linguagem visual de círculo colorido usada em `partida_go` e no `ModoSequencia` real. Nenhum texto após a contagem regressiva.

**Bug 3a — Sem pausa antes da primeira rodada no Modo Alvo (`ModoAlvo.tsx`)**
O botão "INICIAR" chamava `startRound()` diretamente, que apenas aguardava o `READY_DELAY` fixo de 700 ms antes de exibir os círculos. Esse delay é curto e constante, portanto não há jitter real: o usuário pode antecipar o estímulo.
Correção: adicionado estado `'initial_wait'`, constantes `INITIAL_WAIT_MIN = 1000` / `INITIAL_WAIT_MAX = 3000` ms (range compatível com os outros modos: Partida 1000–4000, Sequência 1000–2200), ref `initialWaitTimer` com cleanup. O botão "INICIAR" chama `startInitialWait()`, que seta o estado `'initial_wait'` e aguarda delay aleatório antes de chamar `startRound()`.

**Bug 3b — Cor do round anterior visível durante intervalo entre rounds (`ModoAlvo.tsx`)**
O hint de cor condicionava em `gameState === 'ready' || gameState === 'challenge'`. Porém durante `'ready'`, `startChallenge()` ainda não foi chamada (executa após `READY_DELAY = 700 ms`), então `targetIdx` ainda é o valor do round anterior. O usuário via a cor que veio antes da hora.
Correção: hint de cor (`hintBadge`) agora exibe apenas durante `gameState === 'challenge'`. Durante `'initial_wait'` e `'ready'` exibe um indicador de espera (`👁️ aguarde o estímulo`) no mesmo slot visual, sinalizando que o próximo estímulo ainda não foi revelado.

**Bug 4 — No-Go previsível no Modo Sequência (`ModoSequencia.tsx`)**
`buildSequence()` criava um array de 16 Go + 4 NoGo e embaralhava. A proporção era sempre exatamente 80/20: após ver 16 Go e 0 NoGo, o usuário sabia que os restantes seriam NoGo. Isso transforma controle inibitório reflexo em tarefa de contagem.
Correção: `buildSequence()` reescrita com probabilidade independente por evento — primeiro sinal sempre Go (âncora de feedback imediato), cada sinal seguinte com `Math.random() < 0.25` de ser NoGo sem memória dos sinais anteriores. Constante `GO_COUNT` removida. Texto da tela de instrução atualizado de "20%" para "~25%".
`TriageBaseline.tsx` (mini-teste de Sequência): sinal único, sempre Go, para garantir medição de RT. O fix #2 já torna o estímulo visual consistente (círculo verde). Nenhuma mudança de probabilidade necessária no mini-teste.

---

### Sessão — Grupo 2: bug No-Go + texto instrução + redesign intro triagem (2026-04-23)

#### (a) Arquivos modificados
- `mobile2/screens/ModoSequencia.tsx`
- `mobile2/screens/triage/TriageBaseline.tsx`

#### (b) Causa raiz do bug No-Go quase nunca aparece (`ModoSequencia.tsx`)

Em `scheduleNext`, o tipo visual do sinal era derivado no render via `sequence.current[signalIdx]`, onde `signalIdx` é estado React. O problema estava na combinação de dois comportamentos do React:

1. `setSignalIdx(currentIdx)` seguido de `setGameState('signal')` são dois setState separados. Mesmo com batching do React 18, quando `currentIdx === 0` (primeiro sinal), `setSignalIdx(0)` é um **no-op** — `signalIdx` já era 0, então React não agenda atualização para esse estado. Apenas `setGameState('signal')` dispara o re-render.
2. No re-render resultante, `gameState === 'signal'` é verdadeiro, mas `signalIdx` nunca passou pelo ciclo de atualização contextual do `scheduleNext` corrente — fica travado em 0, que é sempre `'go'` (primeiro sinal garantido por `buildSequence`).
3. Para sinais subsequentes, um descompasso análogo pode ocorrer em frames de transição onde `gameState` e `signalIdx` não coalescem no mesmo commit, fazendo a cor do círculo refletir o índice anterior (frequentemente `'go'`).

**Correção:** `currentSignalRef = useRef<SignalType>('go')` adicionado. Em `scheduleNext`, imediatamente antes de `setSignalIdx` e `setGameState`, o ref é escrito: `currentSignalRef.current = sequence.current[currentIdx]`. O render lê `currentSignalRef.current` (já atualizado antes de qualquer re-render ser disparado). `handleTap` também lê o ref em vez de `sequence.current[signalIdx]`, eliminando qualquer possibilidade de stale closure na classificação `hit` / `commission`.

#### (c) Correções aplicadas

**Correção 1 — Bug visual No-Go (`ModoSequencia.tsx`)**
Vide causa raiz acima. Três pontos de mudança: (1) ref `currentSignalRef` adicionado; (2) ref escrito em `scheduleNext` antes dos setState; (3) render e `handleTap` passam a ler o ref em vez de `sequence.current[signalIdx]`.

**Correção 2 — Texto instrução Modo Sequência (`ModoSequencia.tsx`)**
Linha ③ do `instrBox` substituída de `"~25% dos sinais são NoGo — não se precipite"` para `"Você não sabe quando o vermelho vai aparecer. Cada sinal é uma surpresa."` — elimina comunicação de proporção fixa, que induzia o usuário a contar sinais para prever o vermelho.

**Correção 3 — Redesign da tela intro do mini-teste de baseline (`TriageBaseline.tsx`)**
Ícones soltos em linha (`modeIconsRow`) substituídos por 3 cards verticais compactos, um por modo. Cada card tem: barra lateral colorida (4 px, cor do modo), ícone grande, nome em bold colorido, keyword de métrica em caps pequena, faixa de tempo esperada. Cores por modo: Partida `#3b82f6`, Alvo `#06b6d4`, Sequência `#8b5cf6` — consistentes com as cores já usadas em cada tela de modo. Estilos antigos (`modeIconsRow`, `modeIconBox`, `modeIconEmoji`, `modeIconLabel`) substituídos por `modeCard`, `modeCardBar`, `modeCardIcon`, `modeCardContent`, `modeCardName`, `modeCardMetric`, `modeCardRange`. `subtitle.marginBottom` reduzido de 36 para 24 para acomodar os cards sem comprimir a tela.
