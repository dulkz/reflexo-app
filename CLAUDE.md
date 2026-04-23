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
