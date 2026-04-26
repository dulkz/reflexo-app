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
