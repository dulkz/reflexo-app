# Reflexo App — Contexto do Projeto

## O que é
App mobile de treino de velocidade de reação visual com benchmarks de atletas de elite.
Plataforma: React Native + Expo (Android primeiro).
Público: adultos 25–55 anos. Posicionamento duplo: jogo competitivo + saúde cerebral.

## Estrutura de arquivos
```
mobile/
  App.js                        # Navegação (React Navigation native stack)
  app.json                      # Config Expo
  package.json
  babel.config.js
  screens/
    HomeScreen.js               # Tela inicial com os 3 modos
    ModoPartida.js              # Motor do Modo Partida (jogo principal)
    ResultadoPartida.js         # Tela de resultado pós-sessão
  utils/
    levels.js                   # Faixas de nível, cores, mensagens F1
```

## Modos de jogo
| Modo | Status | Tipo |
|------|--------|------|
| Partida | ✅ Implementado | Reação simples visual |
| Alvo | 🔜 Em breve | Reação de escolha (velocidade + precisão) |
| Sequência | 🔜 Em breve | Go/No-Go — atenção sustentada |

## Modo Partida — Mecânica
- Delay aleatório 1–4 s antes do sinal verde (círculo centralizado)
- Falsa largada (toque antes do sinal) = +300 ms de penalidade
- 7 rodadas por sessão; as 2 piores são descartadas
- Score = média das 5 melhores tentativas
- Exibição: score em ms + faixa de nível + comparação com pilotos de F1

## Faixas de nível (levels.js)
| Faixa | Label | Cor |
|-------|-------|-----|
| < 150 ms | ELITE EXTREMO | #FFD700 |
| 150–200 ms | ELITE | #00FF44 |
| 200–250 ms | MUITO BOM | #00BFFF |
| 250–300 ms | BOM | #FFFFFF |
| 300–400 ms | ABAIXO DA MÉDIA | #FFA500 |
| > 400 ms | DEVAGAR | #FF4444 |

## Benchmark F1
Pilotos de F1 reagem em 150–250 ms (extinção das 5 luzes ao movimento do carro).
Fonte: Vienna Reaction Apparatus (PMC/Br J Sports Med); reactionf1.com.

## Design System
- Background: #0A0A0A (quase preto)
- Cards/surfaces: #111111 / #0F0F0F
- Acento principal: #00C840 (verde)
- Tipografia: peso 900 para scores grandes, letterSpacing amplo para labels
- Tema forçado: dark

## Como rodar
```bash
cd mobile
npm install
npx expo start --android
```

## Documentos de referência
- `benchmarks_reflexo.docx` — tabela científica de benchmarks por modalidade
- `reflexo_game_design.docx` — GDD completo com mecânicas, UX e base científica (estudo ACTIVE/NIH 2026)

---

## Histórico de implementação

### Grupo 2 — Métricas científicas (2026-04-23)
Branch: `feat/metricas-cientificas`

#### M1 — Controle inibitório no Sequência

**Arquivos modificados:**
- `mobile2/screens/ModoSequencia.tsx` — `SeqSummary` ganhou `noGoErrors: number` e `noGoAccuracy: number`; `computeSummary` calcula ambos
- `mobile2/utils/storage.ts` — `SessionRecord` ganhou `noGoErrors?: number` e `noGoAccuracy?: number` (opcionais para compatibilidade retroativa)
- `mobile2/App.tsx` — `handleSeqComplete` persiste os dois campos no `addSession`
- `mobile2/screens/Resultado.tsx` — `SeqResult` exibe pílula de controle inibitório logo abaixo do `LevelBadge`

**Fórmulas:**
- `noGoErrors = commissions` (taps durante sinal NoGo)
- `noGoAccuracy = Math.round(((totalNoGo - commissions) / totalNoGo) * 100)` — 100% se nenhum NoGo apareceu

**Decisão de design — pílula roxa:**
Cor `#8b5cf6` (roxo) conecta à identidade visual do Modo Sequência (usa roxo em todo o modo: barra de progresso, botão, countdown). A pílula fica hierarquicamente secundária ao RT principal sem competir com ele. Texto: `🧠 Controle inibitório: X% · Y erro(s)`.

---

#### M2 — Separar métricas por modo

**Arquivos modificados:**
- `mobile2/screens/Historico.tsx` — `EvoChart` recebe prop `filter: FilterKey`; escala Y ajustada por filtro; linha de marco de jornada clampada ao range visível; nota "Todos" adicionada; legenda só no filtro Todos
- `mobile2/screens/Perfil.tsx` — card Alvo na seção "POR MODO" exibe linha extra "Choice RT · escala diferente"

**Escalas Y fixas:**
| Filtro | Y min | Y max | Linha de referência |
|--------|-------|-------|---------------------|
| Todos | dinâmica | dinâmica | marco de jornada (se houver) |
| Partida | 150 ms | 500 ms | marco de jornada (se dentro do range) |
| Sequência | 150 ms | 500 ms | marco de jornada (se dentro do range) |
| Alvo | 300 ms | 800 ms | linha verde tracejada "Elite: 420 ms" |

**Decisão de design — linha Elite 420 ms no Alvo:**
O marco de jornada existente é baseado em simple RT (metas do piloto de F1, boxeador, etc.) e não faz sentido para choice RT. O threshold 420 ms é o teto da faixa ELITE no paradigma de choice RT (Balakrishnan et al., 2014), serve como referência aspiracional neutra sem depender da jornada configurada pelo usuário.

**Decisão de design — nota no filtro Todos:**
Em vez de separar fisicamente os eixos Y (gráfico duplo), optou-se por manter o visual único com nota textual discreta. Mais simples e menos confuso para usuários não técnicos.

---

#### M3 — Benchmarks de choice RT para Modo Alvo

**Arquivos modificados:**
- `mobile2/screens/Ciencia.tsx` — `CHOICE_BENCHMARKS` (5 cards), nova subseção "MODO ALVO — ESCALA DE REFERÊNCIA", label "PARTIDA E SEQUÊNCIA — ESCALA DE REFERÊNCIA" nos benchmarks existentes, 2 novas fontes em `SOURCES`
- `mobile2/screens/Resultado.tsx` — `AlvoResult` usa `getChoiceRTLevel(ms)`, `ChoiceScaleBar` (range 280–800 ms) e `ChoiceScaleReference` em vez dos componentes de simple RT; card de contexto compara score com benchmarks de choice RT

**Thresholds de choice RT (getChoiceRTLevel):**
| Faixa | Label | Cor |
|-------|-------|-----|
| ≤ 420 ms | ELITE | #10b981 |
| ≤ 500 ms | MUITO BOM | #3b82f6 |
| ≤ 560 ms | BOM | #06b6d4 |
| ≤ 700 ms | ABAIXO | #f59e0b |
| > 700 ms | DEVAGAR | #ef4444 |

**Decisão de design — threshold 500 ms entre MUITO BOM e BOM:**
A literatura cita 420–500 ms como MUITO BOM e 480–560 ms como BOM — as faixas se sobrepõem em 480–500 ms. Optou-se por 500 ms como fronteira limpa (teto do intervalo MUITO BOM da fonte PMC 2014) em vez de 480 ms, para evitar ambiguidade na classificação e simplificar o `if` em cascata.

---

#### M4 — Sequência na triagem com 3 sinais

**Arquivos modificados:**
- `mobile2/screens/triage/TriageBaseline.tsx` — `generateSeqSignals()` (3 sinais, 25% NoGo independente por sinal); novos refs `seqSignalsRef`, `seqSignalIdxRef`, `seqGoRtsRef`; novo state `seqCurrentSignal`; bloco `seq_go` no `useEffect` seta `signalTime` pós-render e arma timeout 1400 ms; `handleSeqTap` ignora toque em NoGo (aprovado em ajuste pré-execução); instrução atualizada com "Serão 3 sinais."; renders `seq_go` e `seq_jitter` exibem contador "X / 3"; novos estilos `seqSignalCircle` e `seqCounter`

**Decisão de design — contador "X / 3":**
Aparece tanto no jitter (tela preta entre sinais) quanto no sinal ativo, para que o usuário nunca perca a noção de quantos sinais restam. Estilo `modeExtra` discreto (`color: '#4a5a7b'`) para não disputar atenção com o círculo do sinal.

**Lógica de outlier em `computeBaseline` — sem alteração:**
A função descarta o maior de [partida, alvo, seq_avg] e faz média dos 2 menores. Com Sequência agora produzindo uma média interna de até 3 Go RTs (em vez de 1 RT único), o valor já é mais estável e robusto — a comparação de outlier entre os 3 modos continua semanticamente válida. Nenhum ajuste necessário.

**Fallback se todos os 3 sinais forem NoGo:** `seq = 600 ms`. Probabilidade: 0,25³ ≈ 1,6%. O valor 600 ms posiciona o usuário como "Abaixo" na escala de simple RT, evitando um baseline artificialmente bom por ausência de dados, sem bloquear o fluxo.

---

#### Edge cases e pendências identificadas

| Item | Status | Detalhe |
|------|--------|---------|
| `noGoAccuracy` quando nenhum NoGo aparece na sessão | Tratado | Retorna 100% (inibição perfeita por ausência de estímulo) |
| Sessões antigas sem `noGoErrors`/`noGoAccuracy` | Tratado | Campos opcionais (`?`) em `SessionRecord`; `SeqResult` usa os campos do `summary` que sempre os terá |
| Marco de jornada fora do range Y fixo (Partida/Sequência) | Tratado | Linha não é desenhada se `nextMilestoneMs < minV` ou `> maxV` |
| `ChoiceScaleReference` — overlap de descrição nas faixas BOM/MUITO BOM | Aceito | Cada card mostra o range original da literatura (420–500, 480–560); a sobreposição é do dado científico |
| Triagem: usuário que erra todos os Go nos 3 sinais (miss) | Tratado | `seqGoRtsRef` vazio → fallback 600 ms |
| Ciencia.tsx: BENCHMARKS existentes não recebem badge "SUA META" para choice RT | Pendente | `goalBenchmarkName` só mapeia ambições de simple RT; cards de choice RT nunca terão badge "← SUA META". Avaliar em iteração futura se criar ambições de choice RT para o Modo Alvo |

---

### FAB Tab Bar + Tela Conquistas (2026-04-24)
Branch: `feat/fab-tabbar`

#### Arquivos criados
- `mobile2/screens/Conquistas.tsx` — tela placeholder de conquistas com grid 2 colunas; reutiliza lógica de `ACHIEVEMENTS` + `buildUserStats` + `computeStreak` (duplicada localmente, pois `computeStreak` é privada em Perfil.tsx); aceita props `sessions` e `userProfile`

#### Arquivos modificados
- `mobile2/App.tsx` — Tab type, TABS array, imports, content block e tab bar redesenhados (detalhes abaixo)

#### Abordagem do notch (entalhe central)
Sem biblioteca SVG externa. O "entalhe" é uma ilusão óptica pura em React Native: um `<View>` absolutamente posicionado no centro-topo da barra (`top: -20`, `alignSelf: 'center'`) com `width: 76`, `height: 76`, `borderRadius: 38` e `backgroundColor: '#0b1220'` (mesma cor sólida do root do app) "tampa" a barra com a cor do fundo, criando visualmente um recorte circular. Funciona porque o background do app é `#0b1220` sólido e uniforme. `zIndex: 1` no notch, `zIndex: 2` no FAB. O wrapper da barra tem `overflow: 'visible'` para o FAB projetar acima dos seus próprios bounds.

#### Abordagem do gradiente (FAB azul→roxo)
`expo-linear-gradient` não está no projeto. Usado `react-native-svg` (já presente, v15.12.1 — Perfil.tsx já o usa para o avatar). O FAB recebe `<Svg style={StyleSheet.absoluteFillObject}><Defs><LinearGradient id="fabGrad" x1="0" y1="0" x2="1" y2="0"><Stop offset="0" stopColor="#3b82f6" /><Stop offset="1" stopColor="#8b5cf6" /></LinearGradient></Defs><Circle cx={30} cy={30} r={30} fill="url(#fabGrad)" /></Svg>` e o ⚡ é um `<Text>` com `zIndex: 1` sobre o SVG.

#### Integração no state machine (App.tsx)
- `type Tab` ganhou `'conquistas'`
- `TABS` foi dividido em `LEFT_TABS` (`historico`, `ciencia`) e `RIGHT_TABS` (`perfil`, `conquistas`); `jogar` saiu do array e virou o FAB central
- Conquistas **não tem sub-estado `gameScreen`** — é uma tab comum como Perfil e Histórico; `handleTabPress` funciona sem alteração de lógica
- Content block ganhou `{activeTab === 'conquistas' && <Conquistas sessions={sessions} userProfile={userProfile} />}`
- `inGame` e toda a lógica de ocultação da barra permanecem inalterados

---

### Streak + Queimada de Largada no Sequência (2026-04-24)
Branch: `feat/conquistas-v2`

#### Arquivos criados
- `mobile2/utils/streak.ts` — `calculateStreak(sessions): { current, playedToday }` agrupa por dia local via `toLocalMidnight`, suporta streak vivo via ontem (última sessão ontem → streak não quebra até fim do dia de hoje); `streakColor(days)` retorna cor por milestone (neutro→azul→âmbar→vermelho→roxo)

#### Arquivos modificados
- `mobile2/screens/Home.tsx` — bloco streak logo abaixo do header: número grande com cor por milestone, badge "✓ hoje" em verde ou "⚡ jogue hoje" com `Animated.loop` opacity 1.0→0.5→1.0 (1200ms); bloco oculto se `streak === 0`
- `mobile2/screens/ModoSequencia.tsx` — queimada de largada durante estado `'inter'`: overlay ❌ "Antecipou! +150ms" por 600ms, `interTimer` cancelado ao detectar antecipação, jogo retomado via `scheduleNext(pendingScheduleRef)` após overlay; `earlyTapCount` acumulado por sessão; spam detector desabilitado durante `'inter'` (antecipações não contam como spam)
- `mobile2/utils/storage.ts` — `earlyTapCount?: number` adicionado a `SessionRecord`
- `mobile2/App.tsx` — `handleSeqComplete` aplica `earlyTapCount * 150` ao score antes de salvar; campo `earlyTapCount` persistido no `SessionRecord`
- `mobile2/screens/Resultado.tsx` — linha "❌ Antecipações: N × +150ms" abaixo do controle inibitório quando `earlyTapCount > 0`

#### Decisões de design

**Streak vivo via ontem:**
Se a última sessão foi ontem, streak não quebra até fim do dia de hoje. Incentiva jogar sem punir quem ainda não jogou hoje. O `calculateStreak` usa `startDay = playedToday ? todayMs : todayMs - DAY` para determinar de onde contar.

**Penalidade de antecipação = +150ms por ocorrência:**
Valor ≈ RT mínimo humano. Semântica clara (cada antecipação "adiciona um reflexo inteiro ao score"), punitiva sem ser brutal, acumulável. Aplicada em App.tsx sobre o `summary.score` base antes de salvar no `SessionRecord`.

**Spam detector vs. antecipações — sistemas separados:**
Taps durante `'inter'` são antecipações legítimas penalizadas por +150ms. Spam (>3 taps/500ms durante `'signal'`) invalida a sessão. Misturar os dois criaria falsos positivos: usuário que antecipa legitimamente poderia ter sessão invalidada. Solução: spam window só incrementa quando `gameState !== 'inter'`.

**Pausa do jogo durante overlay:**
`interTimer` é cancelado no tap antecipado. Após 600ms, `scheduleNext(pendingScheduleRef.current)` reinicia o ciclo inter→sinal. Sem race condition (timer cancelado antes do resume). `pausedForPenaltyRef` e `pendingScheduleRef` resetados em `startGame()`.

#### Pendências
| Item | Status |
|------|--------|
| Streak validado via ts-node (4 casos), não via dispositivo real | Monitorar em uso |
| Animação de entrada do bloco streak | Pode polir futuramente |
| Antecipação durante `'feedback'` (toca logo após hit/commission) | Ignorada pelo guard `gameState !== 'inter'` — comportamento correto |

---

### Splash + Pós-triagem (2026-04-24)
Branch: `feat/conquistas-v2`

#### Arquivos criados
- `mobile2/screens/Splash.tsx` — splash screen de abertura: letras "REFLEXO" entram em stagger 60ms (translateX −20→0 + opacity 0→1, 200ms/letra); pulse scale 1→1.04→1 em 400ms; scan de luz `#3b82f6` varrendo o nome em 700ms linear com fade-in/out nas bordas (60ms); glow de 3 layers (8/4/2 px, opacidades 0.15/0.4/0.8); subtítulo "velocidade de reação" aparece junto ao pulse; hold 2200ms → `onAnimationComplete`. Total percebido ≈ 4s

#### Arquivos modificados
- `mobile2/App.tsx`:
  - `splashVisible` + `splashOpacity` + `dataReadyRef` + `animDoneRef` + `tryExitSplash` — splash some quando ambos (dados + animação) terminam
  - `Promise.all([loadSessions, loadUserProfile, preloadSounds])` no `useEffect` inicial — carregamento real em paralelo com animação
  - Overlay `absoluteFill` `zIndex: 200` com fade-out 300ms antes de remover do tree
  - `handleTriageComplete`: `setActiveTab('jogar')` + `setGameScreen('home')` + `homeScrollRef.current?.scrollTo({ y: 0 })` — corrige destino pós-triagem
- `mobile2/screens/Home.tsx`:
  - prop `scrollRef?: RefObject<ScrollView | null>` adicionada e anexada ao `ScrollView` raiz

#### Decisões de design

**Splash aguarda dados reais:**
A animação e o carregamento correm em paralelo. O overlay só desaparece quando ambas as promises (animação + dados) são resolvidas — sem flash de tela vazia ou dados faltando na primeira renderização.

**Scan 1 passagem (não 2):**
2 passagens esticariam o total percebido para ~4.8s. 1 passagem mantém fluidez sem arrastar.

**"COMEÇAR A JOGAR" → Home (não Perfil):**
Destino semântico correto: usuário recém-triado deve aterrissar no hub de jogo, não no perfil.

**Home abre no topo via scrollRef:**
Contexto limpo pós-triagem; evita que o usuário veja a página pela metade caso o scroll estivesse em posição intermediária em sessão anterior.

#### Próximos passos
- Polir seção de missões semanais na Home (conteúdo e progressão)
- Validar `benchmarks_reflexo.docx` contra valores de `ambitions.ts`
- Streak: monitorar em uso real (casos ontem/anteontem validados só via unit test)

---

### Home Polish — Missões semanais stateful + EAS Build (2026-04-25)
Branch: `feat/home-polish`

#### Arquivos criados
- `mobile2/eas.json` — perfil `preview` com `buildType: "apk"` para Android

#### Arquivos modificados
- `mobile2/utils/missions.ts` — reescrito com 18 missões em 4 buckets de prioridade (`InProgress > Performance > Consistency > Exploration`); `buildMissionPool` emite todas as missões com progresso ao vivo; `MISSION_META` como tabela estática de fallback; `getCompletedMission(id)` retorna snapshot `done: true` para qualquer ID conhecido; `getWeeklyMissions(sessions, userProfile): Promise<WeeklyMission[]>` — async stateful via AsyncStorage
- `mobile2/utils/storage.ts` — `WeeklySlots`, `loadWeeklySlots()`, `saveWeeklySlots()` com chave `reflexo_weekly_missions_v1`
- `mobile2/screens/Home.tsx` — `useMemo(computeWeeklyMissions)` → `useEffect + useState + getWeeklyMissions`; missões concluídas mostram `✓` com `opacity: 0.5` no item inteiro
- `mobile2/screens/Perfil.tsx` — mesma migração para `getWeeklyMissions` async
- `mobile2/app.json` — `name: "Reflexo"`, `slug: "reflexo-app"`, `android.package: "com.dulks.reflexo"` adicionados para EAS

#### Bug corrigido — missão concluída sumia do slot

**Causa raiz:** em `buildMissionPool`, o guard de cada missão usava a mesma condição que `done` (ex: `if (!hasAlvo100)`). Quando a missão era concluída, o guard falhava, a missão não entrava no pool, `missionMap.get(id)` retornava `undefined` e o slot sumia silenciosamente.

**Fix:** loop explícito na hidratação — tenta `missionMap.get(id)` (progresso ao vivo); se `undefined`, chama `getCompletedMission(id)` que retorna snapshot `done: true` usando `MISSION_META`. Slot sempre renderiza, inclusive para missões cujo guard é a própria condição de conclusão.

#### Decisões de design

**Slots fixados por semana via AsyncStorage:**
Missão concluída fica visível com `✓` em vez de sumir e ser substituída por outra — mantém contexto do usuário durante a semana. Na virada de semana (`weekStart` muda), 3 novos slots são sorteados do pool de missões não-concluídas.

**18 missões em 4 buckets com prioridade:**
`InProgress` (current > 0 e não done) sobe para o topo, garantindo que missões em andamento nunca sejam deslocadas por missões novas. Dentro do mesmo bucket, progresso relativo (`current/target`) desempata.

**`getCompletedMission()` como fallback estático:**
Alternativa considerada: remover todos os guards de `buildMissionPool` e sempre adicionar todas as missões. Descartada por risco de selecionar missões mutuamente exclusivas (ex: `week_sessions` + `week_5_sessions`) no mesmo slot. O fallback estático é cirúrgico e não altera a lógica de seleção.

#### EAS Build
- `eas-cli` v18.8.1 instalado globalmente
- Primeiro APK preview iniciado em `expo.dev/accounts/dulkz/projects/reflexo-app`
- Keystore gerado na nuvem da Expo
- `android.package: com.dulks.reflexo`

#### Conquista pendente a implementar
- **"The Flash" (secret):** Partida com score < 80ms — easter egg para RT fisicamente impossível, só desbloqueável por acidente/bug. Threshold: `< 80ms`

#### Próximos passos
- Testar APK quando build terminar
- Arquétipo dinâmico no Perfil por ambição
- Validar `benchmarks_reflexo.docx` contra valores de `ambitions.ts`
- Atletas de referência com tempos reais (futuro, pós-dados reais de uso)

---

### Sessões pós-APK — UX/Visual + Missões diárias + Metas concluídas (2026-04-26)
Branch: `feat/home-polish`

#### Sessão 1 — 3 bugs críticos pós-APK

**Arquivos modificados:**
- `mobile2/screens/Conquistas.tsx` — categoria com todas as conquistas desbloqueadas não sumia mais: header "✓ Todas conquistadas" não-clicável em vez de `return null`; seção SECRETAS ganha subseção "✓ DESCOBERTAS" com nome/ícone/descrição reais das secretas desbloqueadas
- `mobile2/screens/Resultado.tsx` — `currentBestMs` agora filtra apenas sessões `mode === 'partida'`; `<JourneyProgressCard>` removido de `AlvoResult` e `SeqResult` (comparação de choice RT / inibição com marcos de simple RT não é semanticamente válida)

---

#### Sessão 2 — Reorganização de conquistas

**Arquivo modificado:**
- `mobile2/config/achievements.ts`
  - Removido `todos_arquetipos` (duplicata de `piloto`)
  - Adicionado `the_goat`: completar todas as conquistas não-secretas (auto-referência segura via arrow function)
  - Reclassificações: `sniper3x` épico→raro · `f1level` raro→épico · `sub210` raro→épico · `sub250` médio→difícil
  - Total final: 40 conquistas (8 secretas); distribuição: comum:8 · médio:5 · difícil:7 · raro:7 · épico:7 · lendário:5

---

#### Sessão 3 — UX/Visual (4 ajustes)

**Arquivos modificados:**
- `mobile2/screens/Resultado.tsx`:
  - Label `COMISSÕES` → `ERROS INIBIÇÃO` no stat e `Comissões (NoGo tocado)` → `Erros de inibição (NoGo tocado)` na tabela de resumo do SeqResult
  - `SeqScaleReference`: nova régua própria para Sequência (ELITE <250ms / MUITO BOM <320 / BOM <380 / MÉDIO <450 / ABAIXO <550 / DEVAGAR >550); substitui `ScaleReference` genérico em SeqResult
- `mobile2/screens/Ciencia.tsx` — `freqCard`: linha de contexto (`= N min semanais · menos de X min/dia`), 3 bullets científicos, padding 24→28, `freqRationale` `alignSelf: 'stretch'`
- `mobile2/components/JourneyMap.tsx` — nó baseline: "Seu melhor atual: N ms" quando usuário melhorou; próximo marco: "faltam N ms" em azul inline abaixo da pílula "Sua melhor"

**Decisões de design:**
- Thresholds Sequência maiores que Partida: tarefa cognitivamente mais complexa por design (~25% NoGo), RT naturalmente mais alto
- JourneyCard só no Resultado do Partida: choice RT e inibição não são comparáveis com marcos de simple RT da ambição

---

#### Sessão 4 — Objetivos do dia

**Arquivos criados:**
- `mobile2/utils/dailyMissions.ts` — `getDayStart()` (meia-noite local); pool de 10 missões diárias com progresso ao vivo; `getDailyMissions(sessions, userProfile): Promise<DailyMission[]>` async stateful via AsyncStorage; 2 slots fixados por dia (`dayStart`), reset automático à meia-noite; `daily_early` excluído da seleção se `hour >= 9`; missão concluída permanece no slot com `done: true`

**Arquivos modificados:**
- `mobile2/utils/storage.ts` — `DailySlots` + `loadDailySlots()` / `saveDailySlots()` com chave `reflexo_daily_missions_v1`
- `mobile2/screens/Home.tsx` — bloco "OBJETIVO DO DIA" entre streak e missões semanais; acento teal `#06b6d4` (diferencia do roxo `#5b4fcf` semanal); mini-track só quando `target > 1`

**Decisões de design:**
- `daily_login` sempre `done: true` → nunca selecionado para novos slots (seria imediatamente completo ao abrir)
- `daily_early` excluído da seleção após 9h mas permanece no pool (hidratação de slots existentes)
- Fallback `getCompletedDailyMission(id)` via `DAILY_META` — padrão idêntico ao semanal

---

#### Sessão 5 — Metas concluídas no Perfil + fix Conquistas

**Arquivos modificados:**
- `mobile2/screens/Perfil.tsx` — seção "✓ CONCLUÍDAS" colapsável no final de METAS DE LONGO PRAZO: lista marcos batidos (label + ms atingido), conquista mais recente (nome + descrição, ordenada por data ISO), arquétipos passados (nome + tagline); começa colapsada; `bg #0d1526`, texto `#4a5a7b`, check `#10b981`, tag direita `MARCO/CONQUISTA/ARQUÉTIPO`; sem nova chave AsyncStorage (usa `reflexo_achievements_v1` existente via `loadUnlockedAchievements`)
- `mobile2/screens/Conquistas.tsx` — `SECRET_TOTAL = ACHIEVEMENTS.filter(a => !!a.secret).length` como const de módulo; "? existem" → `${SECRET_TOTAL} existem` no header da seção SECRETAS

**Decisões de design:**
- Seção CONCLUÍDAS só aparece quando `completedCount >= 1` (sem estado vazio desnecessário)
- `SECRET_TOTAL` como const de módulo: calculado uma vez em import, sem recalcular a cada render

#### APK v2
- Build iniciado em `expo.dev/accounts/dulkz/projects/reflexo-app`
- Keystore reutilizado do build anterior (`com.dulks.reflexo`)
- Inclui todas as mudanças das sessões 1–5

---

### Sessões 6–9 — Ciência, Conquistas, Perfil arquétipo dinâmico (2026-04-26)
Branch: `feat/home-polish`

#### Sessão 6 — freqCard: grid animado (revertido) + card SEG/QUA/SEX

**Arquivos modificados:**
- `mobile2/screens/Ciencia.tsx`:
  - `SessionGrid` (10 quadrados animados em stagger) adicionado e depois removido — decorativo sem significado para o usuário
  - Card "FREQUÊNCIA IDEAL DE TREINO" restaurado: 3 círculos verdes (`#10b981`, 48×48px) com labels SEG · QUA · SEX, `rec.mins` min abaixo de cada círculo, nota científica na base ("3 sessões curtas/semana superam 1 sessão longa em retenção de ganho motor."); posicionado entre `freqCard` e seção "PARA COLOCAR EM PERSPECTIVA"

**Decisões de design:**
- SessionGrid removido: quadradinhos decorativos sem significado semântico para o usuário
- Dias SEG/QUA/SEX fixos (não personalizáveis): recomendação científica genérica válida para todos os grupos; personalização adicionaria fricção sem benefício no MVP

---

#### Sessão 7 — fix Conquistas (SECRET_TOTAL)

**Arquivo modificado:**
- `mobile2/screens/Conquistas.tsx` — `SECRET_TOTAL = ACHIEVEMENTS.filter(a => !!a.secret).length` como const de módulo; `"? existem"` → `` `${SECRET_TOTAL} existem` `` no header da seção SECRETAS (atualmente exibe "8 existem")

---

#### Sessão 8 — Arquétipo destino dinâmico no Perfil

**Arquivo modificado:**
- `mobile2/screens/Perfil.tsx`:
  - `DEST_BY_GROUP` (const de módulo): mapeia grupo de ambição para arquétipo destino
    - `elite_sport` → `{ id: 'PILOTO', label: 'O Piloto' }`
    - `populational` → `{ id: 'VELOCISTA', label: 'O Velocista' }`
    - `brain_health` → `{ id: 'RESISTENTE', label: 'O Consistente' }`
  - `destinationArch`, `destinationIdx`, `reachedDestination`, `showDestFooter` como valores derivados
  - Card "PARA VIRAR" ocultado quando `currentArchIdx >= destinationIdx` (usuário já atingiu ou superou o destino da ambição)
  - Footer "🎯 Seu destino: X" (em `ambitionGroupColor`) adicionado ao card quando o destino é mais de 1 passo à frente do próximo arquétipo imediato (evita redundância com o header)

**Decisões de design:**
- `"O Consistente"` como label UI para `brain_health` — o arquétipo interno continua sendo `RESISTENTE`; evita criar novo arquétipo e alterar schema
- Footer só aparece quando `destinationIdx > currentArchIdx + 1`: se o próximo passo já é o destino, o header "PARA VIRAR → [Destino]" é suficiente
- Pré-triagem: `destinationArch === null` → comportamento existente inalterado

#### APK v2
- Build concluído: `expo.dev/artifacts/eas/nkM4mQWLxQRYw5nQfB4HDw.apk`
- Inclui todas as mudanças das sessões 1–5

#### Próximos passos
- Merge `feat/home-polish` → `main`
- Futuro: notificações push, backend/sync, novo modo 5 círculos
- Validar `benchmarks_reflexo.docx` contra `ambitions.ts`

---

### Onboarding 5 telas + redesign confirma ambição + filtro de período no Histórico (2026-04-26)
Branch: `feat/proxima-feature`

#### Arquivos criados
- `mobile2/screens/OnboardingModal.tsx` — onboarding de 5 telas, exibido apenas na primeira abertura do app
  - Tela 1 ciano `#00f5ff`: anel tracejado girando (8s loop) + círculo neon pulsando (scale 1↔1.08, 0.9s) · título "REFLEXO" 52px letterSpacing -2
  - Tela 2 azul `#3b82f6`: 3 barras equalizer animadas (40↔80px, durações 700/1100/850ms com delays 0/150/300ms) · 3 cards horizontais com barra lateral neon (PARTIDA/ALVO/SEQUÊNCIA)
  - Tela 3 roxo `#8b5cf6`: 3 hexágonos concêntricos (r=80/56/32) girando em direções alternadas (14s/10s reverso/18s) com opacity decrescente · stats `17 / # / 40+`
  - Tela 4 âmbar `#f59e0b`: linha journey (156px) com 3 nós (topo pulsando, meio cinza, base alvo concêntrico) · preenchimento amber 0→100% em 1.5s ease-out
  - Tela 5 verde `#10b981`: 2 ondas senoidais (Path SVG) com translateX em loop linear (4s/6.5s) · 3 SciCards (10–15% / ∞ / <5min) · botão CONTINUAR `#10b981` com texto `#0b1220 900`
  - `FlatList horizontal pagingEnabled` com `onMomentumScrollEnd` para tracking; dots de progresso no topo expandem para 22px na cor da tela ativa
  - Gradient de fundo via SVG `LinearGradient` (sem `expo-linear-gradient`); cleanup `Animated.loop().stop()` em todos os `useEffect`

#### Arquivos modificados
- `mobile2/utils/storage.ts` — `loadOnboardingDone()` + `saveOnboardingDone()` com chave `reflexo_onboarding_done_v1` (padrão flag string `'true'`)
- `mobile2/App.tsx`:
  - Import de `loadOnboardingDone` e `OnboardingModal`
  - State `onboardingVisible` + ref `onboardingNeededRef` (definido no `Promise.all` inicial paralelo a sessions/profile/sounds)
  - `tryExitSplash` agora dispara `setOnboardingVisible(true)` no callback do `Animated.timing.start` se `onboardingNeededRef.current === true`
  - `<Modal animationType="fade" statusBarTranslucent>` com `onRequestClose` no-op (back não fecha); `onComplete` → `saveOnboardingDone()` + `setOnboardingVisible(false)`
- `mobile2/screens/triage/TriageAmbitionConfirm.tsx` — redesign completo em 3 zonas verticais
  - Zona 1 (identidade): ícone 72px (lineHeight 84) · nome `28px / 900 / -0.5` · tag do grupo em `GROUP_LABELS[group]` na cor `GROUP_COLOR[group]`
  - Zona 2 (card meta): `#111a2e`, `borderRadius 16`, `padding 20`. Para `finalMetaMs` numérico: número grande 48px na cor do grupo + sufixo `ms` 22px + `description` + linha `POPULATION_CONTEXT[id]` (map local: f1→top1%, boxer→top3%, tennis→top5%, sprinter→top0.1%, top50/10/1→eco do nome). Para `null` (brain): texto "Consistência e evolução contínua" 20px + description. Divisor 1px `#1a2540` · label `PARA CHEGAR LÁ` + texto "Treinos curtos, todo dia. Vamos medir onde você está agora."
  - Zona 3 (rodapé): botão `CONTINUAR` azul (mantido) · hint `Próximo: medimos seu reflexo base` em `#4a5a7b 12px`
  - Layout sem `ScrollView`: `body flex 1 + justifyContent: center + gap 28`
- `mobile2/screens/Historico.tsx` — filtro de período `7d / 30d / Tudo` no gráfico
  - State `useState<PeriodKey>('7d')` (padrão `7d`)
  - `EvoChart` ganha prop `period: PeriodKey`; janela fixa `windowStart = todayStart − 6·DAY` (7d) ou `todayStart − 29·DAY` (30d), `windowEnd = todayStart + DAY`
  - 7d/30d filtram por janela, plotam todas as sessões do período sem cap; `'all'` mantém legacy `slice(0, 20).reverse()`
  - Eixo X 7d: 7 ticks centralizados em cada dia, label = `DAYS_OF_WEEK[d.getDay()]` (Dom..Sáb)
  - Eixo X 30d: 5 ticks (hoje, 7d, 14d, 21d, 28d) com `formatShortDate` exceto rightmost = "hoje"
  - Eixo X 'all': comportamento legado preservado
  - Pílulas acima do gráfico: ativa `#3b82f6` sólido + texto branco; inativa `#111a2e` + `#4a5a7b`
  - Renderiza eixo vazio quando 7d/30d sem sessões; retorna `null` apenas em `'all'` sem dados

#### Decisões de design

**Onboarding gated por flag persistente:**
Modal com `onRequestClose` no-op força conclusão via botão `CONTINUAR` — back não dismisses. Garantia de que os 5 ecrãs são vistos uma única vez, sem possibilidade de dismiss acidental que pulasse o setup educacional.

**Tela 4 do onboarding anima `lineFill` somente quando `visible`:**
`FlatList` mantém todas as 5 telas montadas desde o splash. Sem o gate `if (visible) lineFill.setValue(0); ...start()`, a animação de preenchimento da journey rodaria durante o splash invisível e o usuário chegaria na tela 4 vendo o estado final estático. O gate disparado por `activeIndex === 3` reseta para 0 e replays a animação na chegada.

**Gradient via SVG `LinearGradient` (não `expo-linear-gradient`):**
Padrão já estabelecido no projeto (FAB do tab bar e avatar do Perfil usam react-native-svg para gradientes). Sem dependência nova. Cada `<GradientBg>` usa um `id` único (`g1`...`g5`) para evitar colisão de namespaces SVG.

**`getAmbitionById` em vez de `getAmbition`:**
A spec da tarefa pediu `getAmbition(ambitionId)` mas só `getAmbitionById` existe em `config/ambitions.ts`. `getAmbition` (em `utils/ambition`) é uma função diferente, retorna estrutura distinta. Usei o helper correto e marquei a divergência.

**`GROUP_LABELS` canônicos mantidos:**
Spec sugeriu labels alternativos ("ESPORTE DE ELITE", "SAÚDE & BEM-ESTAR") mas `ambitions.ts` exporta `GROUP_LABELS` com `ELITE DO ESPORTE / POSIÇÃO POPULACIONAL / SAÚDE CEREBRAL`. Manti os canônicos para consistência com Perfil/Conquistas/Ciencia, que já consomem os mesmos labels.

**`POPULATION_CONTEXT` como map local em TriageAmbitionConfirm:**
Alternativa considerada: adicionar campo `populationPercentile` ao schema de `Ambition`. Descartada porque o dado é usado em apenas uma tela. Map cirúrgico no consumidor evita poluir o schema. Valores são estimativas baseadas em `finalMetaMs` (não em `benchmarks_reflexo.docx` validado) — flag para validar depois.

**Janela fixa para 7d/30d (sem compressão):**
Solução para o problema de 2 dias de dados ficarem espremidos na esquerda do gráfico. `tMin`/`tMax` calculados a partir do `todayStart` em vez de `sessionsToPlot[0].date`. Pontos plotados na posição correta do dia; dias sem sessão simplesmente não têm ponto. Eixo Y permanece com escalas fixas existentes (alvo 300–800, partida/sequencia 150–500).

**`'7d'` como padrão:**
Maioria dos usuários joga regularmente — última semana é o range mais relevante. Quem quiser ver evolução de longo prazo troca para `30d` ou `Tudo`.

#### Próximos passos
- Merge `feat/proxima-feature` → `main` quando completar bateria de mudanças
- Continuar redesigns de telas da triagem (TriageBaseline, TriageResult)
- Validar `benchmarks_reflexo.docx` contra `ambitions.ts` (ainda pendente desde Grupo 2)
- RT mínimo no Modo Partida (`<100 ms` descartar — falsa largada não detectada)
- APK v4 quando acumular mais fixes (incluir onboarding + filtro de período)

---

### Modo Radar + Benchmarks calibrados pelo docx (2026-04-26)
Branch: `feat/proxima-feature`

#### Arquivos criados
- `mobile2/screens/ModoRadar.tsx` — novo modo de jogo de localização visual
  - 5 círculos em cruz (1 centro + 4 extremidades), 7 rodadas, timeout `1500 ms`, jitter `1000–3000 ms` entre rodadas
  - Estado: `intro → initial_wait → ready → signal → hit/miss/timeout → próxima rodada`
  - Penalidade `+200 ms` por miss (toque no círculo errado) com overlay vermelho animado (opacity 0→1 em 100 ms, desmonta com o estado de miss); **não aparece em timeout**, só em erro ativo
  - Score final = média dos RTs apenas dos hits + `missCount * 200`
  - `OFFSET` adaptativo via `Dimensions.get('window').width`: `155 px` se largura ≥ 420, senão `130 px` — container 420×420 ou 370×370 garante encaixe em qualquer dispositivo
  - `CIRCLE_SIZE = 110 px`, outline 2px `#1a2a4a` em estado neutro, fill `#f59e0b` quando aceso
  - Cleanup de timers em `useEffect`, `handleTimeoutRef` para evitar stale closures
  - Header com contador `RODADA X / 7` + botão `DESISTIR` no topo direito
  - Dots de progresso (verde hit, vermelho miss/timeout)

#### Arquivos modificados

**Calibração com `benchmarks_reflexo.docx`:**
- `mobile2/config/ambitions.ts` — 3 metas finais corrigidas com dados reais:
  - `boxer`: 230 → **250 ms** (Seleção Brasileira: 240–260 ms, Loturco et al., 2015) + milestones reescalonados
  - `sprinter`: 180 → **160 ms** (velocistas olímpicos: 120–160 ms, PLoS ONE 2018) — comentário "referência auditiva — visual seria ~200 ms"
  - `top50`: 310 → **280 ms** (adulto jovem saudável: 250–300 ms)
- `mobile2/utils/levels.ts` — 2 novos níveis no topo da escala + entrada `radar` em `MODE_COLORS`:
  - `IMPOSSÍVEL` (`maxMs: 50`, `#ff0080`) — "Abaixo de qualquer limite fisiológico humano"
  - `SUPER-HUMANO` (`maxMs: 100`, `#00f5ff`) — "Abaixo do limite de reação visual humana"
  - `radar: { accent: '#f59e0b', bg: 'rgba(245,158,11,0.12)' }` — `ModeKey` auto-extende
- `mobile2/screens/Resultado.tsx` — `ScaleReference.rangeStr` agora desidratado (`< ${lvl.maxMs} ms` derivado em vez de hardcode `'< 150 ms'`); `BENCHMARKS` em Ciencia.tsx ganha 2 entradas no topo (`🚫 Limite fisiológico humano` IMPOSSÍVEL · `👁 Antecipação visual de elite` SUPER-HUMANO)

**Integração Radar:**
- `mobile2/utils/storage.ts` — `SessionRecord` ganha `missCount?: number` (radar only)
- `mobile2/screens/Resultado.tsx` — novo `RadarResult` component modelado em `PartidaResult` (simple RT + ScaleBar + ScaleReference); stats `ACURÁCIA / MELHOR HIT / ACERTOS X/7`; linha "❌ Erros: N × +200 ms" se houver miss; lista de 7 rodadas com ✓/✗/⏱; aliasa `RoundResult` de ModoRadar como `RadarRound` no import
- `mobile2/screens/Home.tsx` — card `MODO RADAR` (📡, âmbar, "Localização visual · 7 rodadas") como 4ª entrada do `MODE_INFO`; nova prop `onStartRadar`; `handlers` Record extendido
- `mobile2/screens/Historico.tsx` — filtro `Radar` nas pílulas; `MODE_LABELS`/`MODE_ICONS` ganham radar (`📡`); plot da série radar no chart "Todos"; Y-scale `150–500` e linha Elite 200 ms também aplicáveis ao filtro radar
- `mobile2/screens/Perfil.tsx` — `keys` array do `modeBreakdown` inclui `'radar'`; cálculo de `bestRadarRt` (espelha `bestAlvoRt`) usado como `displayScore` para mostrar **melhor reflexo individual sem penalty**; 2 linhas extras "Melhor Tempo Reflexo" + "Precisão: X%" em `mc.accent` (âmbar)
- `mobile2/config/archetypes.ts` — `bestScore`/`bestAcc` Records ganham `radar: null`; chip do PILOTO usa "Melhor Tempo Reflexo" em vez de "Melhor RT"
- `mobile2/App.tsx` — `GameScreen` ganha `'radar'` e `'resultado_radar'`; `handleRadarComplete` aplica penalty `+ missCount * 200` antes de salvar `SessionRecord` com `mode: 'radar'`, `accuracy = hits/rounds`, `missCount` se >0

**Renomeação UI "Melhor RT" → "Melhor Tempo Reflexo"** (3 ocorrências, só texto visível):
- `archetypes.ts:149` chip do arquétipo
- `Historico.tsx:516` label do summary card (`MELHOR TEMPO REFLEXO` em caps)
- `Perfil.tsx:821` linha extra do card Alvo

#### Decisões de design

**Penalidade `+200 ms` por miss:**
Valor ≈ RT médio de uma rodada. Errar equivale a "perder uma rodada inteira" — punitiva sem ser brutal, acumulável, semanticamente clara. Aplicada em `handleRadarComplete` sobre o `score` (média das hits) antes de salvar.

**Overlay `+200ms` só no miss, não no timeout:**
Timeout é falta de reação (não-evento); miss é erro ativo (toque no círculo errado). O overlay vermelho com texto reforça a *causa* da penalidade — sem texto, o usuário poderia não associar o flash vermelho ao acréscimo de score. Timeout já tem feedback próprio ("⏱ TIMEOUT") sem necessidade de overlay extra.

**`bestRadarRt` no Perfil mostra melhor reflexo individual, não score penalizado:**
Espelha `bestAlvoRt` — agrega `Math.min(...mSessions.map(s => s.bestTime ?? s.score))` entre sessões. O número grande do card Radar exibe o reflexo mais rápido em qualquer rodada do usuário (sem incluir penalty), label "Melhor Tempo Reflexo" clarifica a semântica. O score penalizado da sessão fica visível no Resultado e no Histórico.

**`OFFSET` adaptativo via `Dimensions`:**
Threshold `< 420 px` cobre iPhone SE (320 pt), Androids pequenos (~360 pt), e qualquer dispositivo borderline. Container 420 × 420 (com `OFFSET=155`) só é usado em telas largas onde cabe sem clipping. Sem isso, círculos esquerda/direita seriam cortados pelas bordas em telas estreitas.

**Níveis `IMPOSSÍVEL`/`SUPER-HUMANO` baseados no docx:**
A escala anterior tratava `<150 ms` como "ELITE EXTREMO" único. O docx mostra que `<100 ms` em reação visual é fisicamente impossível — ocorre apenas por antecipação ou erro de medida. Os 2 novos níveis no topo (`<50 IMPOSSÍVEL`, `50–100 SUPER-HUMANO`) calibram a escala com a literatura, e ELITE EXTREMO passa a ocupar `100–150 ms` (sem mudança no `maxMs:150`, o lower bound efetivo desloca-se automaticamente porque `<100` agora cai em SUPER-HUMANO antes).

**`Record<ModeKey, ...>` exaustivo força integração:**
Adicionar `'radar'` a `MODE_COLORS` propaga `ModeKey = 'partida' | 'alvo' | 'sequencia' | 'radar'` para todo o app. O compilador acusou cada init de Record que faltava entrada — efetivamente um checklist guiado de onde radar precisa ser cidadão de primeira classe (Historico/Perfil/storage/archetypes/Home).

#### Pendências (Etapa 2 do Radar)
- Conquistas específicas (radar_acertos_perfeitos, radar_velocidade, radar_sniper, etc.)
- Missões diárias/semanais para Radar
- Triagem baseline mede também Radar
- Onboarding atualizado mencionando 4º modo

#### Próximos passos
- Etapa 2 Radar (conquistas/missões/triagem)
- Modo Auditivo (futuro)
- Validar restante do `benchmarks_reflexo.docx` contra benchmarks de Ciencia.tsx (boxer 160–220 vs. real 240–260; sprinter 170–200 vs. real 120–160 auditivo)
- APK v4 quando consolidar Etapa 2 + onboarding + filtro de período

---

### Sessão APK v7 — Radar score fix + timing unificado + escala atualizada + triagem automática (2026-04-26)
Branch: `main`

#### Versão atual: APK v7 (próximo build)

#### Correções aplicadas

**Score do Radar — modelo relativo:**
- RT de cada miss agora conta como `rt + 200ms` na média (em vez de penalty agregado pós-média)
- Timeouts excluídos da média (não-evento, sem RT válido)
- Texto resultado: `❌ Erros: N (+200ms avg)` substitui formato antigo

**Timing unificado padrão B nos 4 modos:**
- `signalTime` capturado em `useEffect` pós-commit em todos os modos (Partida, Alvo, Sequência, Radar)
- Garante que o timer só inicia depois do React commitar a mudança visual — elimina viés sistemático onde alguns modos capturavam `signalTime` antes do render

**Outros ajustes:**
- Fade-in de 50ms removido do `ModoPartida` — círculo aparece instantâneo (consistente com os outros modos)
- Gate `suspiciousSpam` removido de `handleSeqComplete` — Sequência sempre salva sessão (spam continua sendo detectado, só não invalida)
- Storage: logging completo nos 10 catches (saves + loads) para diagnóstico em produção

**Escala de referência (`utils/levels.ts`):**
- Novo nível `NA MÉDIA` (300–350 ms)
- Novo nível `MUITO DEVAGAR` (>500 ms)
- `ABAIXO DA MÉDIA` movido para 350–400 ms (era 300–400)
- `IMPOSSÍVEL` / `Limite Fisiológico Humano` removido da tela Ciência (mantido em `levels.ts` como categorização interna, mas não exposto como benchmark de referência aspiracional)

**UX Perfil:**
- Label de arquétipo cortado corrigido — usava `.split(' ')[0]`, agora exibe label completo

**Onboarding tela 2:**
- Atualizado para 4 modos de treino (Radar adicionado como 4º card)
- 4ª barra adicionada ao equalizer animado

**Botão voltar redesenhado nos 4 modos:**
- Compacto 32×28, laranja `#f59e0b`, `borderRadius 8`
- Substitui o botão DESISTIR anterior maior

**Cards "Como jogar" nas telas de intro:**
- Partida, Alvo e Sequência ganham card explicativo substituindo o emoji circle decorativo
- Radar mantém intro própria

**Triagem automática pós-primeira partida:**
- Modal dispara após primeira partida em qualquer ação **exceto** "Jogar Novamente"
- Flags `hasPlayedFirstGame` + `hasSeenTriagePrompt` adicionados ao storage
- Garante que usuário não pula triagem mas também não é interrompido em sequência rápida de jogos

#### Decisões de design

**Score Radar relativo (rt+200 por miss) vs. agregado:**
Modelo anterior somava `missCount * 200` à média no fim. Modelo novo trata cada miss como uma rodada com RT inflado. Vantagem: cada rodada contribui de forma equivalente e linear. O resultado numérico é semanticamente equivalente em sessões com poucos erros, mas o display "+200ms avg" comunica melhor a natureza da penalidade.

**Timeouts excluídos da média:**
Timeout = ausência de evento; sem RT válido para promediar. Incluí-los como "1500ms" inflaria score injustamente. Já estavam refletidos em ACERTOS X/7 e na contagem visível.

**Spam não invalida mais a Sequência:**
Sessão sempre é salva. Antes, spam → sessão descartada → frustração. Spam continua sendo um marcador interno, mas não bloqueia persistência de dados.

**Triagem só dispara fora do "Jogar Novamente":**
Usuário em flow de partidas consecutivas não é interrompido. Modal aparece quando o usuário sai do contexto de jogo (volta para home, abre histórico, etc.) — momento natural para considerar triagem.

#### Pendências para próxima sessão
- Gráfico histórico 7d/30d: eixo X comprimido quando há poucos dados (sessões agrupadas em fração pequena do range)
- Botão "Limpar todos os dados" no Perfil
- Etapa 2 do Radar: missões diárias/semanais, conquistas específicas, arquétipo Quadriatleta, `try_all_modes` contando 4 modos (atualmente 3)

---

### Sessão APK v8/v9 — Bug fixes pós-APK + melhorias UX (2026-04-27)
Branch: `main`

#### Versão atual: APK v9

#### Correções aplicadas

**Unificação Home vs Perfil — scores por modo:**
- `storage.ts` (`getBestByMode`): Alvo e Radar agora usam `s.bestTime ?? s.score` em vez de `s.score` para todos os modos — Home e Perfil exibem o mesmo valor

**bestTime do Alvo corrigido:**
- `App.tsx` (`handleAlvoComplete`): `bestTime` calculado com `hits = results.filter(r => r.correct)` → `Math.min(...hits.map(r => r.rt))`, fallback `score` se todos erraram; `accuracy` reutiliza `hits.length` (sem duplo filter)

**Label explícito na Home:**
- `Home.tsx`: Sub-label abaixo do score nos cards de modo — `"Melhor Tempo Reflexo"` (alvo/radar) ou `"Média RT"` (partida/sequência); wrapper `View` com `flexShrink: 1`; estilo `modeBestSubLabel` 9px `#3a4a6b`

**Label "ABAIXO DA MÉDIA" não-truncado na Home:**
- `Home.tsx`: Removido `.split(' ').slice(0, 2).join(' ')` → `{lvl.label}` direto com `numberOfLines={1}` e `fontSize: 9`

**Badge duplo nas conquistas secretas descobertas:**
- `Conquistas.tsx`: `discoveredSecrets` exibe badge row com gap 4 e `flexWrap: 'wrap'` — primeiro badge `"SECRETA"` (cor `SECRET_COLOR`), segundo badge de raridade (`cfg.label` com `cfg.cor`)

**Total de conquistas unificado:**
- `Conquistas.tsx`: denominador usa `ACHIEVEMENTS.filter(a => !a.secret || a.unlocked(stats) || !!unlockDates[a.id]).length` — mesmo lógica do Perfil (não-secretas + secretas descobertas)

**Conquistas secretas dual-source of truth:**
- `Conquistas.tsx`: `discoveredSecrets` e `lockedSecrets` verificam `a.unlocked(stats) || !!unlockDates[a.id]`; `unlockDates` movido para antes dos `useMemo` que o referenciam (ordem de declaração)

**Avatares recolhíveis no Perfil:**
- `Perfil.tsx`: Seção MEU AVATAR tem header clicável com contador `X/Y desbloqueados` + chevron `▼/▶`; estado inicial recolhido (mostra só avatar ativo); expandido mostra grid completo; 6 estilos novos adicionados

**Botão "Limpar todos os dados":**
- `Perfil.tsx`: Zona de perigo no final do scroll — botão com borda vermelha `#ef4444`, sem fundo; `Alert` de confirmação 2 passos ("Cancelar" / "Limpar tudo" destructive)
- `App.tsx`: `AsyncStorage` importado; `handleClearData` executa `AsyncStorage.clear()` + reset de `sessions`, `userProfile`, tab `'jogar'`, `gameScreen 'home'`, reabre onboarding; prop `onClearData` passada ao `<Perfil>`

#### Pendências para próxima sessão
- Reformulação do gráfico/histórico (melhor score do dia, eixo X, seção de evolução por modo)
- Card "Jornada Completa" → botão que sugere e ativa próxima meta automaticamente
- Etapa 2 do Radar: missões, conquistas, Quadriatleta, `try_all_modes` contando 4 modos

---

### Sessão APK v10/v11 — Sprints 1+2+3: reorg de abas, fluxo de jogo, polish (2026-04-28)
Branch: `main`

#### Versão atual: APK v11 (próximo build)

#### Sprint 1 — Penalidades, escalas, polish (commit `4506c95`)

**Modo Sequência — penalidades expandidas:**
- NoGo errado (commission): +400 ms (era +150 ms)
- Timeout no Go (miss): +400 ms à média
- Antecipação durante `'inter'`: +150 ms × ocorrências (mantido)
- Os 3 cenários agora são distintos e visíveis no resultado

**Linha do tempo (Histórico) — cores por modo:**
- Cada série usa `MODE_COLORS[mode].accent`
- Legenda só aparece no filtro Todos

**Escalas próprias por modo (`utils/levels.ts`):**
- `ALVO_LEVELS` (380/450/520/600/700/850/Inf — choice RT)
- `SEQ_LEVELS` (220/270/320/380/450/550/Inf — Go/NoGo)
- `RADAR_LEVELS` (250/300/350/400/500/600/Inf — localização)
- `getLevelForMode(ms, mode)` faz dispatch
- Resultados, Home e Histórico passam a usar a escala correta por modo

**Modo Radar — 15 rodadas (era 7):**
- `TOTAL_ROUNDS = 15` em `ModoRadar.tsx`
- Mais sessões para extrair tendência confiável

**Impossível/Super-Humano ocultos:**
- `Resultado.tsx` (Partida): `if (lvl.maxMs <= 100 && !isUser) return null`
- `Ciencia.tsx` (BENCHMARKS): cards SUPER-HUMANO/IMPOSSÍVEL escondidos a menos que `bestPartidaRt < 100`
- Decisão: a maioria nunca alcança esses tiers; mostrar polui e confunde

#### Sprint 2 — Fluxo de jogo (commit `097e011`)

**Botão desistir com confirmação (4 modos):**
- Helper `confirmAbort` em cada modo dispara `Alert.alert('Deseja desistir?', 'O progresso desta sessão não será salvo.', [Continuar jogando, Desistir destructive→onBack])`
- Intro mantém `onBack` direto (sem confirmação) — comportamento desejado
- ModoPartida: top bar overlay com `position:'absolute', zIndex: 20` para não ser interceptado pelo `Pressable absoluteFill`
- ModoAlvo: back button na top bar row (linha com `RODADA X / Y`)
- ModoSequencia: back button antes da progress bar
- ModoRadar: troca onPress do botão DESISTIR existente para `confirmAbort`

**READY antes da 1ª rodada (Modo Partida):**
- State `showReady` ativado quando usuário clica `INICIAR` na intro
- Overlay 64px / 900 / `#3b82f6` letterSpacing 6 por 1500 ms; `setTimeout` chama `setShowReady(false); startRound()`
- Aparece só na 1ª rodada — rodadas seguintes seguem o fluxo `'ready' → 'waiting' → 'signal'` normal
- Render condiciona conteúdo de gameplay e o `Pressable` de tap a `!showReady`

**Botão "Jogar novamente" no topo do resultado:**
- Componente `TopReplayButton` (pílula `borderRadius: 999` fundo `#111a2e`, texto `#cbd5e1` 12px/700, ícone `↻`)
- Inserido após o `<View style={styles.hero}>...</View>` em PartidaResult, AlvoResult, SeqResult e RadarResult
- Botão primário no fim do scroll permanece intacto

**Conquistas DESBLOQUEADAS recolhível:**
- `[Conquistas.tsx](mobile2/screens/Conquistas.tsx)` — header acordeão com chevron `▼/▶`, estado inicial `{ unlocked: true }`
- Mesmo padrão visual das outras categorias de raridade (`accordionHeader/Label/Right/Count/Arrow`)
- Cor laranja `#f59e0b` mantida

**Avatar dentro de "Editar Perfil":**
- Seção `MEU AVATAR` separada removida do scroll do Perfil (junto com state `avatarExpanded`)
- Modal renomeado de "EDITAR NOME" → "EDITAR PERFIL" com 2 campos: NOME (TextInput) + AVATAR (grade completa de `AVATARS`)
- `nameModalCard` ganhou `maxHeight: '85%'` + ScrollView interna para acomodar a grade
- Tap em avatar persiste imediatamente (mesmo padrão de antes); botão SALVAR só persiste o nome
- Cell `'initial'` agora usa `nameInput || userProfile.name` como letra (reflete edição em andamento)

#### Sprint 3 — Reestruturação das abas (commit `2d9e294`)

**Aba Conquistas → Jornada (🗺️):**
- `Tab` type: `'conquistas'` → `'jornada'` em `App.tsx`
- LEFT_TABS[0]: `{ key: 'jornada', label: 'Jornada', icon: '🗺️' }`
- Nova tela [`Jornada.tsx`](mobile2/screens/Jornada.tsx) com 2 seções:
  - **MINHA JORNADA**: ambition row + summary line (baseline/meta/marcos) + `<JourneyMap>` cheio com `showYouAreHere` + linha "Próximo: X · faltam Y ms" (CTA pre-triage se necessário)
  - **MISSÕES**: card teal `OBJETIVO DO DIA` (diárias) + card roxo `MISSÃO DA SEMANA` (semanais)
- `Conquistas.tsx` refatorado: exporta `ConquistasContent` (sem ScrollView/root próprios) para uso embutido; `<Conquistas>` default mantém wrapper standalone

**Home limpa:**
- Removido card `OBJETIVO DO DIA`, card `MISSÃO DA SEMANA`, motivCard fixed do rodapé inteiro (mensagem F1 / próximo marco / meta conquistada)
- Removidos imports/states/computeds: `getAmbition`, `getNextMilestone`, `calculateDeltaToNextMilestone`, `getMilestonesState`, `getWeeklyMissions`, `getDailyMissions`, `weeklyMissions`, `dailyMissions`, `currentBestMs`, `f1Gap`, `motivData`
- Mantido: header, streak, 4 mode cards, F1 insight strip, footer

**Perfil clean:**
- Removido bloco `OBJETIVOS DA SEMANA` (state `weeklyMissions` + import `getWeeklyMissions/WeeklyMission`)
- Removido bloco `MINHA JORNADA` inteiro (CTA pre-triage + journey map + ambition row + import `JourneyMap`)
- Mantido: identidade, arquétipo, EVOLUÇÃO chain, METAS DE LONGO PRAZO (próximo marco/conquista/arquétipo + CONCLUÍDAS recolhível), PARA VIRAR, POR MODO, ÚLTIMAS N SESSÕES bar chart, CONQUISTAS summary, ZONA DE PERIGO, modal Editar Perfil

**Histórico — sessões fora, evolução por modo + conquistas:**
- Removido: lista de cards de sessão, filtros de modo (FILTERS, `filter` state, modeCounts), `EvoChart` inteiro (~310 linhas SVG com Polyline/legenda/period pills/milestone line)
- Adicionado: 4 cards expansíveis (`ModeStatsCard`) — um por modo
  - **Recolhido:** ícone + nome + best ms + pílula de nível + trend badge (↑ melhorando / → estável / ↓ piorando, 3% threshold sobre últimas 5 sessões) + chevron
  - **Expandido:** Melhor de sempre, Primeiro vs. atual (com delta), Total de sessões, Última sessão, Melhor dia da semana (menor avg), Dia mais jogado (count), footnote do tipo de score
- Adicionado: seção `CONQUISTAS` no fim, embedando `<ConquistasContent showHeader={false} />`
- `displayScore(s)` helper: alvo/radar usam `bestTime ?? score`, partida/seq usam `score` (consistente com Perfil POR MODO)
- 4 summary cards do topo (Melhor Tempo Reflexo / Mais Jogado / Streak / Total) preservados

#### Correções finais (commit `6e0e4a4`)

**Swipe hint no onboarding:**
- `OnboardingModal.tsx`: state `swipeAnim`, loop infinito 0↔1 (1.8s ciclo)
- Texto "Deslize para continuar →" no rodapé (`position: 'absolute', bottom: 24`)
- Visível apenas em telas 1–4 (`activeIndex < 4`); tela 5 já tem CTA `CONTINUAR`
- Pulsa opacidade 0.45→0.85 + `translateX 0→6` para sugerir movimento
- Cor muda por tela (`SCREEN_COLORS[activeIndex]` — cyan/blue/purple/amber/green)
- `pointerEvents="none"` para não bloquear swipe da FlatList

**Mode picker no FAB ⚡ (App.tsx):**
- State `modePickerVisible` adicionado
- FAB `onPress` ramifica: `if (activeTab === 'jogar' && gameScreen === 'home') setModePickerVisible(true) else handleTabPress('jogar')`
- Bottom sheet (`Modal animationType="slide" transparent`):
  - Overlay `rgba(0,0,0,0.7)` com `justifyContent: 'flex-end'`
  - Sheet `#0f1729`, `borderTopLeftRadius: 24` / `borderTopRightRadius: 24`, handle bar 40×4
  - Header: kicker "ESCOLHA UM MODO" + botão `✕`
  - 4 cards (PARTIDA / ALVO / SEQUÊNCIA / RADAR) com nome em `MODE_COLORS[m.key].accent`, descrição curta, chevron `›`
  - Tap em card: fecha modal + `setActiveTab('jogar')` + `setGameScreen(target)` (vai direto para o modo)
  - Tap no overlay/✕/back: fecha sem ação; tap dentro do sheet absorvido por TouchableOpacity wrapper

#### Decisões de design

**Conquistas movidas de aba dedicada para fim do Histórico:**
A aba dedicada de Conquistas competia com Jornada por espaço de navegação. Conquistas são "consequência" de jogar; Jornada é "para onde estou indo". Histórico já é o lar de "onde estive" — conquistas se encaixam semanticamente lá. Refatorando `ConquistasContent` em vez de duplicar, ambas as visões compartilham a mesma lógica.

**Gráfico SVG → cards expansíveis:**
O `EvoChart` mostrava 4 modos em escalas conflitantes; choice RT (alvo, ~400+ ms) e simple RT (partida/seq, ~200 ms) não comparavam bem na mesma série. Cards por modo dão a cada modo seu próprio espaço com escala correta, label correto, trend dedicado — mais informativo, menos ruído.

**Trend baseado em últimas 5 sessões com threshold 3%:**
3% é alto o suficiente para filtrar variação natural sessão-a-sessão (RT de uma pessoa varia ~2-3% por dia) e baixo o suficiente para captar melhora consistente em poucas sessões. Janela de 5 sessões equilibra responsividade (não exige mês para mostrar tendência) com estabilidade (não muda a cada sessão isolada).

**FAB com comportamento contextual:**
Antes, FAB sempre voltava para Home. Estando na Home, era no-op. Agora, na Home, FAB é "ataque rápido" — escolhe modo sem precisar rolar até o card. Em outras abas, mantém o comportamento de "voltar para Home" (esperado para botão de ação central).

**Bottom sheet vs. fullscreen modal:**
Bottom sheet preserva contexto visual (usuário ainda vê a Home atrás, sabe que pode fechar e estará no mesmo lugar). Fullscreen seria visualmente mais agressivo para uma escolha rápida de 4 opções.

**Swipe hint só em telas 1–4 do onboarding:**
Tela 5 tem CTA "CONTINUAR" próprio (botão grande verde). Mostrar "Deslize" lá seria redundante e contradiz a ação esperada (tap no botão).

#### Pendências para próxima sessão
- 3 modos de dificuldade (Fácil / Médio / Difícil) — futuro
- Versão em inglês — futuro
- Avaliar poluição visual após uso real do app reformulado (Sprints 2+3 enxugaram bastante; ver se ainda há excessos)
- Ícones novos do Claude Design (substituir emojis nas tabs/conquistas/missões por ícones consistentes)
- Build APK v11 com todas as mudanças desta sessão

---

### Sessão Ícones (2026-04-30)
Branch: `main`

- SVGs exportados do Claude Design para `mobile2/assets/logo/` (app-icon, mark-amber, mark-blue, mark-mono)
- `app-icon.svg` convertido para PNG 1024×1024 via sharp (uso local, não commitado no package.json)
- `assets/icon.png` e `assets/adaptive-icon.png` atualizados com o novo ícone oficial
- `app.json`: `adaptiveIcon.backgroundColor` corrigido `#ffffff` → `#0A0F1E` (alinha com fundo do SVG)
- Commit: `44969d4`
- Próximo: ícones de navegação nas tabs (substituir emojis por SVGs de `assets/logo/../icons/nav/`)
