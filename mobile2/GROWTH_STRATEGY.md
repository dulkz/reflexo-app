---
title: GROWTH STRATEGY — Reflexo App
project: Reflexo App
generated: 2026-05-28
status: documento vivo — revisar a cada marco (30/90/180 dias)
escopo: posicionamento, ASO, aquisição, retenção, roadmap, impacto, métricas, aprendizados
nota_de_honestidade: números de mercado abaixo são benchmarks de indústria (ordem de
  grandeza), não promessas. Onde digo "típico/benchmark", trate como faixa a validar
  com os dados reais do Supabase, não como meta contratual.
---

# GROWTH STRATEGY — Reflexo App

> **Produto:** app de treino de reflexo / tempo de reação com base científica.
> **Stack:** React Native + Expo · Supabase · iOS + Android.
> **Modelo:** gratuito no lançamento; código de IAP preservado para reativação futura.
> **Missão:** reflexo melhor = saúde melhor — para jovens e idosos.
> **Núcleo do produto hoje:** 4 modos (Partida, Radar, Sequência, Alvo), arquétipos,
> missões diárias + semanais, conquistas, avatares, streak, ranking global, modo convidado.

Este documento é uma referência estratégica de longo prazo. É deliberadamente honesto
sobre o que ainda não sabemos: muitas decisões aqui dependem de dados pós-lançamento
(retenção real, CPI real, taxa de conversão de loja). Cada seção marca o que é
**fundamentado** vs **hipótese a validar**.

---

## 1. POSICIONAMENTO

### 1.1 Proposta de valor única (PVU)

A maioria dos apps de "brain training" (Lumosity, Peak, Elevate, CogniFit) vende um
pacote amplo e difuso de "jogos cognitivos" e cobra assinatura cara. O Reflexo é o
oposto: **uma métrica, medida com rigor, treinável e comparável.**

> **PVU:** *"Descubra e melhore seu tempo de reação real — a métrica que liga
> performance esportiva, segurança e saúde cognitiva ao longo da vida."*

Diferenciais defensáveis:
- **Foco, não dispersão.** Reflexo/tempo de reação é uma medida concreta (ms), não uma
  pontuação abstrata e proprietária. Isso é honesto e verificável pelo usuário.
- **Ciência real, sem promessa médica.** O app mede e treina; não promete curar nem
  prevenir doença (importante para conformidade Apple §5.2.3 e credibilidade).
- **Gratuito de verdade no lançamento.** Concorrentes escondem quase tudo atrás de paywall;
  o Reflexo entrega o loop completo de graça — vantagem de aquisição enorme.
- **Comparação social honesta.** Ranking global por modo dá um "porquê voltar" que apps
  de treino solitário não têm.
- **Amplitude de público real.** O mesmo core loop serve um gamer de 18 e um aposentado
  de 70 — poucos produtos cobrem essa faixa com uma só mecânica.

### 1.2 Concorrência — leitura honesta

| Concorrente | Força | Brecha que o Reflexo explora |
|---|---|---|
| Lumosity / Peak / Elevate | Marca forte, conteúdo amplo | Caros, genéricos, "pontuação" opaca; pouco foco em reação pura |
| Human Benchmark (web) | Referência em teste de reação | Web-first, sem progressão/gamificação/retenção; não é app de hábito |
| Apps de e-sports/aim trainer (ex.: Aim Lab) | Profundos para gamers | Nicho gamer puro; intimidam não-gamers; nada para 40+/idosos |
| Apps de saúde cognitiva clínica | Credibilidade médica | Clínicos, sem graça, sem loop diário leve |

O espaço vazio: **um app leve, bonito, gratuito, científico e que serve do gamer ao idoso**
com uma única métrica clara. É aí que o Reflexo se planta.

### 1.3 Segmentos + personas

**A. Gamers competitivos (16–30)**
- *Persona — "Léo, 21, FPS ranqueado":* quer aim/reação mensurável, odeia placebo, vive de
  leaderboard. Compartilha print de score. Sensível a "isso é treino real?".
- *Gancho:* ranking global, modos Alvo/Radar, comparação por ms, linguagem de e-sport.

**B. Atletas e esportistas (18–40)**
- *Persona — "Marina, 28, vôlei amador":* reação importa em quadra; treina o corpo, quer
  treinar o "tempo". Disciplinada, gosta de streak e progresso.
- *Gancho:* "treino invisível" que complementa o físico; missões; evolução de arquétipo.

**C. Adultos 40+ preocupados com performance cognitiva**
- *Persona — "Paulo, 47, executivo":* percebe que "não é tão rápido quanto era", quer um
  sinal objetivo e um hábito leve de 3 min/dia. Pagaria por algo sério.
- *Gancho:* baseline + tendência ao longo do tempo; enquadramento de saúde cognitiva; calma.

**D. Idosos ativos (60+)**
- *Persona — "Dona Helena, 68":* curiosa, usa o celular com filhos por perto, valoriza algo
  que "faz bem para a cabeça". Sensível a UX confusa, fontes pequenas, emojis demais.
- *Gancho:* modo de baixa pressão, alvos grandes, sem punição, linguagem acolhedora.
  **(Requer a "Versão para idosos" do roadmap — §5.4.)**

**E. Curiosos / virais (qualquer idade)**
- *Persona — "quem viu um Reel de 'teste seu reflexo'":* baixa por curiosidade, fica se
  o primeiro teste for divertido e compartilhável.
- *Gancho:* teste de 30s sem cadastro (modo convidado), resultado compartilhável.

### 1.4 Mensagem central por segmento

| Segmento | Mensagem |
|---|---|
| Gamers | *"Seu aim começa no cérebro. Meça e treine sua reação em ms."* |
| Atletas | *"O treino que o corpo não vê. Reaja mais rápido em quadra."* |
| Adultos 40+ | *"Acompanhe a velocidade do seu cérebro. 3 minutos por dia."* |
| Idosos | *"Mantenha a mente ágil, no seu ritmo. Sem pressa, sem pressão."* |
| Curiosos | *"Quão rápido você é? Descubra em 30 segundos."* |

---

## 2. ASO — APP STORE OPTIMIZATION

ASO é o canal orgânico de maior alavancagem para um app gratuito sem orçamento de mídia.
Princípio-guia: **o título e o subtítulo carregam o maior peso de ranqueamento na Apple;
as palavras-chave do campo de 100 caracteres não devem repetir o que já está no título.**

### 2.1 Título e subtítulo

Limites Apple: **Título ≤ 30 chars**, **Subtítulo ≤ 30 chars**. (Google Play: título ≤ 30,
descrição curta ≤ 80.)

**PT**
- Título: `Reflexo: Teste de Reação` (24) — alternativa: `Reflexo: Treino Cerebral` (24)
- Subtítulo: `Tempo de reação e foco` (22)

**EN**
- Título: `Reflexo: Reaction Trainer` (25)
- Subtítulo: `Test & boost reaction time` (26)

*Racional:* "reação"/"reaction" + "tempo"/"time" + "treino"/"trainer" cobrem as buscas mais
prováveis sem prometer benefício médico. "Brain"/"cerebral" amplia para o público 40+.

### 2.2 Palavras-chave (campo Apple ≤ 100 chars, sem espaços após vírgula, sem repetir título)

**PT (~99 chars):**
`reacao,agilidade,foco,reflexos,cerebro,memoria,atencao,jogo,treino,gamer,esporte,velocidade,mente`

**EN (~98 chars):**
`reaction,agility,focus,reflex,brain,memory,attention,speed,game,trainer,esports,sport,cognitive`

Priorização por segmento (alta intenção → cauda longa):
- **Gamers:** `gamer, esports, aim, reflex, speed`
- **Atletas:** `sport, agility, speed, training`
- **40+/cognitivo:** `brain, memory, attention, cognitive, focus`
- **Genérico/descoberta:** `reaction, game, mind, quick`

*Tática:* não desperdiçar caracteres com palavras já no título/subtítulo (a Apple indexa as
duas fontes juntas). Iterar a cada ciclo com base em impressões por palavra (App Analytics).

### 2.3 Screenshots que convertem

Os **2 primeiros** screenshots decidem ~80% da conversão (a maioria não desliza). Ordem
sugerida (formato com legenda grande no topo, app embaixo — já temos os frames):

1. **Hook + número** — "Quão rápido você reage?" com um resultado em ms em destaque. Vende a métrica.
2. **Os 4 modos** — colagem mostrando variedade (Partida/Radar/Sequência/Alvo). Vende profundidade.
3. **Ranking global** — "Compare-se com o mundo". Vende competição/social.
4. **Progresso/arquétipo** — evolução ao longo do tempo. Vende retenção/propósito.
5. **Missões & conquistas** — "Um motivo para voltar todo dia". Vende hábito.
6. **Para todas as idades** — enquadramento de saúde cognitiva (importante para 40+/idosos).

*Localizar PT e EN* (já temos ambos). Testar variações da posição 1 quando o A/B de
Product Page Optimization estiver disponível no ASC.

### 2.4 Descrição otimizada para conversão

Estrutura (a Apple indexa pouco a descrição para ranqueamento, mas ela converte):
1. **Primeira linha = promessa** (aparece sem "ler mais"): *"Descubra seu tempo de reação real e treine para ficar mais rápido."*
2. **Bloco de benefícios em bullets** — variedade (4 modos), ciência, ranking, grátis.
3. **Prova/segmentos** — "Usado por gamers, atletas e quem quer manter a mente ágil."
4. **Como funciona** — 3 passos curtos (teste → treine → acompanhe).
5. **Transparência** — "100% jogável de graça. Funciona offline."
6. **Disclaimer honesto** — não é dispositivo médico; é treino e diversão.

### 2.5 Estratégia de avaliações e reviews

Reviews são o segundo maior fator de conversão depois dos screenshots.
- **Prompt no momento certo:** pedir avaliação (`StoreReview` do Expo) **após um pico de
  satisfação** — ex.: bater recorde pessoal, completar streak de 7, desbloquear arquétipo.
  Nunca no onboarding nem após erro.
- **Limite de frequência:** a Apple já limita a 3 prompts/ano; respeitar e só disparar em
  momentos positivos.
- **Loop de feedback negativo:** antes do prompt da loja, oferecer "Como está sua
  experiência?" — se positivo → loja; se negativo → canal de feedback (e-mail
  `reflexoapp@gmail.com`). Evita reviews de 1 estrela públicas evitáveis.
- **Responder reviews** (especialmente negativas) — sinal de cuidado e converte leitores.
- **Meta inicial:** ≥ 4,5★ com volume crescente. Qualidade > quantidade no começo.

---

## 3. AQUISIÇÃO DE USUÁRIOS

Filosofia: **gratuito + compartilhável + orgânico primeiro.** Pago só quando houver retenção
provada (senão é furar balde). Validar retenção D1/D7 antes de comprar tráfego.

### 3.1 Canais orgânicos (custo zero)

- **Conteúdo viral curto (Reels/TikTok/Shorts):** o teste de reação é nativamente
  compartilhável. Formato "Tente bater meu tempo" / "Adivinha o reflexo do meu pai de 60".
  Postar com frequência; é a maior alavanca barata para um app deste tipo.
- **Resultado compartilhável no app:** botão "compartilhar meu tempo" gera card bonito →
  loop viral orgânico. *(Feature de roadmap se ainda não existir.)*
- **Comunidades:** Reddit (r/gaming, r/pcmasterrace para aim; r/braintraining), Discords de
  e-sports, grupos de corrida/esporte amador no Facebook/WhatsApp.
- **ASO** (§2) — descoberta passiva contínua.
- **Product Hunt / lançamento em comunidades de apps** — pico inicial + early adopters.
- **SEO de conteúdo** (§3.4) — tráfego de cauda longa para "como melhorar tempo de reação".

### 3.2 Canais pagos (quando ativar)

Pré-requisitos antes de gastar R$1: D1 ≥ ~35–40% e D7 ≥ ~12–18% (benchmarks de games casual;
validar com nossos dados). Sem isso, pago não escala.
- **Apple Search Ads** — maior intenção possível (usuário já busca "reaction trainer"). Começar
  por aqui: barato no começo, mensurável, casa com a estratégia de ASO.
- **TikTok/Reels Ads** — amplificar os criativos orgânicos que já performaram (não criar do zero).
- **Princípio de unit economics:** só escalar quando **LTV > CAC** com folga. Como o app é
  grátis hoje, "LTV" inicialmente é proxy (retenção/engajamento/potencial futuro de IAP),
  não receita — ser honesto sobre isso e não comprar tráfego caro contra receita zero.

### 3.3 Parcerias estratégicas

- **Academias e estúdios** — reação como parte do treino funcional; QR code no balcão,
  desafio entre alunos. Baixo custo, alta relevância para o segmento atleta.
- **Clínicas / fisioterapia / fonoaudiologia / neuro** — *com extrema cautela e sem alegação
  médica.* Posicionar como ferramenta de engajamento/acompanhamento, não diagnóstico.
- **Esportes (clubes amadores, e-sports, tênis/vôlei/automobilismo)** — reação é narrativa
  natural; patrocínio de desafio/leaderboard de equipe.
- **Universidades/laboratórios de cognição** — parceria de pesquisa (§6.3): credibilidade +
  conteúdo + acesso a dados agregados (com consentimento).
- **Casas de repouso / programas de envelhecimento ativo** — para o segmento idoso, depois da
  versão adaptada (§5.4).

### 3.4 Conteúdo educativo como aquisição

Constrói autoridade, alimenta SEO e gera criativos:
- Artigos/posts: "O que é tempo de reação", "Reação cai com a idade? O que a ciência diz",
  "Como atletas treinam reação", "Reação vs reflexo — a diferença".
- Vídeos curtos com mini-fatos científicos (cada um vira criativo de aquisição).
- Newsletter leve para usuários que opt-in — reengajamento + comunidade.
- Reaproveitar tudo em PT e EN.

---

## 4. RETENÇÃO E ENGAJAMENTO

### 4.1 Sistema atual — diagnóstico honesto

O que **já existe** e é forte:
- **Missões diárias (2 slots) + semanais (3 slots)** — motor de "volte amanhã" bem construído
  (shuffle, slots fixos por dia/semana, priorização por bucket).
- **Streak** — alimenta missões e conquistas; gatilho clássico de hábito.
- **Arquétipos (6 níveis em cadeia)** — narrativa de evolução com critérios objetivos.
- **Conquistas + avatares (18)** — coleção e status.
- **Ranking global** — comparação social, realtime.
- **Desbloqueio progressivo de modos** — senso de progressão guiada.
- **Triagem pós-1º jogo** — bom para qualificar e personalizar cedo.

O que **pode melhorar** (oportunidades):
- **Sem push notifications hoje** → a maior alavanca de retenção não está ligada (§4.2).
- **Streak sem proteção** → perder a sequência por 1 dia desmotiva; considerar "streak freeze".
- **Ranking burlável (M3)** → mina a confiança no social; resolver server-side fortalece a retenção competitiva.
- **Sem reengajamento de churned** → e-mail/push de "seu reflexo está te esperando".
- **Onboarding → primeiro "aha"** → garantir que o usuário veja o número de reação dele em < 60s.
- **Compartilhamento** → loop social ainda não fecha sem botão de share nativo.

### 4.2 Estratégia de notificações push

(Requer integração — ver roadmap. Hoje não há push; é a prioridade #1 de retenção.)
Princípio: **relevância > frequência.** Push genérico mata desinstalação.
- **Lembrete de hábito** (personalizado pelo horário de jogo do usuário): "Seu treino de 3 min
  está pronto." 1x/dia, no horário em que ele costuma jogar.
- **Proteção de streak:** "Faltam X horas para manter sua sequência de N dias." (alta conversão)
- **Social/competição:** "Alguém passou você no ranking de Alvo." (só para quem optou pelo social)
- **Conquista próxima:** "Você está a 1 partida de desbloquear [arquétipo]."
- **Reengajamento (churned):** após 3/7/14 dias inativo, com mensagem que evolui (curiosidade → fato científico → "sentimos sua falta").
- **Higiene:** opt-in claro, cap de frequência, deep link direto para a ação, respeitar fuso e quiet hours.

### 4.3 Ciclo de vida do usuário

| Fase | Objetivo | Táticas |
|---|---|---|
| **Dia 1 (ativação)** | Chegar ao primeiro número de reação em < 60s | Modo convidado, onboarding curto, primeiro teste sem fricção, "aha" = ver o ms |
| **Semana 1 (hábito)** | Formar o loop diário | Push de hábito, missões diárias, primeira streak, desbloqueio do 2º modo, primeiro recorde pessoal |
| **Mês 1 (investimento)** | Criar identidade no app | Arquétipo definido, entrada no ranking, conquistas acumuladas, conta criada (sai do guest), prompt de review num pico |
| **Mês 3 (lealdade)** | Tornar-se parte da rotina + advogado | Tendência de progresso visível, desafios sazonais, comunidade, compartilhamento, considerar features premium |

KPIs por fase: ativação = % que vê o 1º resultado; hábito = D7 + streak médio; investimento =
% guest→conta + D30; lealdade = D90 + sessões/semana + indicações.

---

## 5. ROADMAP DE PRODUTO

Priorização sugerida: **(0) Push + share + anti-cheat** (destravam retenção e viralidade) →
**(1) Versão idosos + Apple Health** (ampliam público e propósito) → **(2) Novos modos +
sazonais + social** → **(3) Wearables + pesquisa**.

### 5.1 Novos modos de jogo (com justificativa científica)

- **Reação a estímulo auditivo / multimodal** — tempo de reação auditivo difere do visual;
  treinar ambos é mais transferível para esporte/direção. Justificativa: processamento
  sensorial multimodal.
- **Go/No-Go (inibição)** — reagir só ao estímulo certo, segurar nos errados. Mede **controle
  inibitório** (função executiva), não só velocidade bruta — muito relevante para 40+/cognitivo.
- **Reação de escolha (choice reaction)** — múltiplos estímulos → múltiplas respostas. Lei de
  Hick: tempo cresce com o número de opções; ótimo para gamers/atletas.
- **Periferia / visão periférica** — alvos nas bordas; relevante para esportes de campo e direção.
- **Sob fadiga/pressão** — séries longas medindo queda de performance; narrativa de "resistência mental".

### 5.2 Missões sazonais e desafios especiais

- **Eventos temáticos** (Ano Novo "reflexo do ano", Copa/Olimpíada, Halloween) com recompensas
  cosméticas exclusivas → picos de reengajamento.
- **Desafios semanais globais** — meta coletiva ou competição com leaderboard temporário.
- **Streak challenges** — "30 dias de reação" com marco comemorativo.
- **Duelos 1v1 assíncronos** — desafiar amigo por link (também canal de aquisição viral).

### 5.3 Comunidade e social

- **Compartilhamento de resultado** (card bonito) — fecha o loop viral. **Prioridade alta.**
- **Amigos / friendships** — a tabela já existe no Supabase; ativar leaderboard de amigos.
- **Equipes/clãs** — para gamers e academias.
- **Perfil público** (já há modal) — evoluir para página compartilhável.

### 5.4 Versão para idosos (UX adaptada)

Não é um app separado — é um **modo/tema acessível** dentro do mesmo app:
- Fontes maiores, alvos maiores, contraste reforçado, menos elementos por tela.
- **Zero punição** — sem energia/limites, sem "game over" agressivo; reforço positivo.
- Linguagem acolhedora e calma (sem gíria de e-sport, sem emojis em excesso).
- Ritmo mais lento, instruções faladas/legíveis, sessões curtas.
- Acessibilidade real (VoiceOver/TalkBack) — hoje incompleta (débito conhecido).
- Enquadramento: "manter a mente ágil", acompanhamento de tendência simples.

Este segmento é, possivelmente, o de maior **propósito** e menor concorrência direta.

### 5.5 Integrações futuras

- **Apple Health / Google Fit** — registrar sessões/tendência como dado de bem-estar
  cognitivo. Reforça o enquadramento de saúde e a descoberta via apps de saúde.
- **Wearables (Apple Watch / Wear OS)** — micro-testes de reação no pulso; reação tátil/háptica.
- **HealthKit como fonte de contexto** — correlacionar reação com sono/atividade (com consentimento) — narrativa poderosa e diferenciada.

---

## 6. IMPACTO E PROPÓSITO

### 6.1 Reflexo como métrica de saúde cognitiva

Tempo de reação é uma das medidas comportamentais mais simples e robustas de
**velocidade de processamento** — uma dimensão central da cognição. É objetivo (ms),
sensível a treino, sono, fadiga e idade, e fácil de medir longitudinalmente. Isso torna o
Reflexo um "termômetro" leve que o usuário pode acompanhar ao longo de anos.

### 6.2 Base científica (honesta, sem overclaim)

- **Neuroplasticidade:** o cérebro se adapta com prática; treino direcionado pode melhorar
  desempenho na tarefa treinada. *Cautela:* a literatura de "brain training" é debatida quanto
  à **transferência** para a vida cotidiana — não prometer ganhos genéricos de inteligência.
- **Tempo de reação e idade:** em geral a velocidade de processamento declina gradualmente com
  a idade; manter-se cognitiva e fisicamente ativo está associado a melhor função — *associação,
  não prova causal via app.*
- **Tempo de reação e longevidade:** há estudos epidemiológicos associando tempo de reação a
  desfechos de saúde a longo prazo. Tratar como **motivação**, nunca como alegação de que o app
  prolonga a vida.
- **Regra de ouro de comunicação:** medir e treinar reação = **sim**; curar/prevenir doença =
  **nunca**. Isso protege a marca, os usuários e a conformidade nas lojas.

### 6.3 Potencial de parcerias com pesquisa/saúde

- Laboratórios de cognição/envelhecimento — dados agregados anônimos (com consentimento) viram
  pesquisa + credibilidade + PR.
- Programas de envelhecimento ativo e reabilitação — como ferramenta de engajamento.
- Sempre com aprovação ética, consentimento explícito e privacidade by design.

### 6.4 Como medir impacto real na vida dos usuários

- **Tendência individual** — o usuário melhora seu próprio ms ao longo de semanas?
- **Aderência** — quem mantém o hábito relata benefício percebido? (pesquisas in-app leves)
- **Histórias** — depoimentos qualitativos (atleta, idoso, gamer) — impacto humano, não só métrica.
- **Estudos coorte** (parcerias) — o único caminho honesto para afirmar impacto real.

---

## 7. MÉTRICAS DE SUCESSO

> Benchmarks abaixo são faixas de indústria para games casual/saúde — **validar com os dados
> reais**. Não são metas garantidas.

### 7.1 KPIs por fase

**Lançamento (0–30 dias) — validar product-market fit do loop**
- Ativação (% que chega ao 1º resultado): meta **> 80%**.
- **D1** retenção: faixa saudável **35–45%**.
- **D7** retenção: faixa saudável **12–20%**.
- Crash-free sessions: **> 99%** (requer Sentry/Crashlytics — §infra).
- Avaliação na loja: **≥ 4,5★**.

**Crescimento (30–120 dias) — provar retenção e loops**
- **D30** retenção: **6–10%+**.
- Streak médio e % com push ativado.
- K-factor / share rate (viralidade) — quantos convites por usuário ativo.
- % guest → conta criada.
- CPI no Apple Search Ads (quando ligado) vs proxy de LTV.

**Escala (120+ dias) — eficiência e profundidade**
- **D90/D180** retenção.
- Sessões/usuário/semana e tempo até hábito.
- LTV real (se/quando IAP reativar) vs CAC.
- Mix de canais e custo por usuário retido.

### 7.2 O que medir no Supabase

A tabela `sessions` já é o coração analítico. Instrumentar/queries:
- **DAU/WAU/MAU** e razão DAU/MAU (stickiness) a partir de `sessions.played_at` + `user_id`.
- **Curvas de retenção D1/D7/D30** por coorte de primeira sessão.
- **Funil de ativação:** instalou → 1º jogo → conta → 2º dia.
- **Distribuição de `avg_rt` por modo** (e detectar outliers implausíveis — também serve de anti-cheat, M3).
- **Engajamento por modo** — quais modos retêm mais.
- **Streak e missões** — taxa de conclusão.
- **Guest vs registrado** — diferença de retenção.
- *Cuidado de custo:* o realtime global atual (M8) escala mal; medir não deve sobrecarregar o plano.
- *Privacidade:* métricas agregadas e anônimas; respeitar a política de privacidade declarada.

### 7.3 Marcos 30 / 90 / 180 dias

- **30 dias:** loja nas duas plataformas, push ligado, ≥4,5★, D1/D7 dentro da faixa, primeiros 1k usuários, pelo menos 1 criativo orgânico com tração.
- **90 dias:** D30 saudável, share loop ativo, anti-cheat de ranking, primeira parceria-piloto, decisão fundamentada sobre ligar Apple Search Ads.
- **180 dias:** versão idosos + Apple Health, base retida crescente, primeiro estudo/parceria de pesquisa encaminhado, decisão de monetização baseada em dados reais.

---

## 8. APRENDIZADOS PARA PROJETOS FUTUROS

### 8.1 O que fizemos bem

- **Offline-first com sync oportunista** — o core loop nunca depende de rede; sync é
  fire-and-forget. Excelente para UX e robustez.
- **Disciplina técnica** — TypeScript strict, zero `any`/`TODO`, camadas separadas
  (`lib`/`utils`/`config`/`screens`), AsyncStorage versionado (`_v1`).
- **Migrations versionadas + RLS documentada** — schema reproduzível e seguro.
- **Auditorias formais antes do submit** — pegaram 7 bloqueadores críticos e organizaram o lançamento.
- **Decisão corajosa de lançar 100% grátis** preservando o código de monetização — reduz risco
  de rejeição Apple §3.1.1 e maximiza aquisição, sem queimar trabalho futuro.
- **i18n PT/EN desde cedo** — dobra o mercado endereçável sem retrabalho.
- **Documentação viva** (PROGRESS, AUDITORIA, LAUNCH_INFO, CHECKLIST) — memória de projeto real.

### 8.2 O que faríamos diferente

- **Observabilidade desde o dia 1** — sem Sentry/Crashlytics, voamos cegos pós-release. Deveria
  ser pré-requisito de submit, não débito.
- **Push notifications no MVP** — é a maior alavanca de retenção; deixá-la para depois custa coortes.
- **Anti-cheat de ranking antes do social público** — feature social sem integridade nasce frágil.
- **Acessibilidade como requisito, não débito** — especialmente dado o público idoso da missão.
- **Evitar god components** (`App.tsx` 1182, `Perfil.tsx` 1310) — refatorar cedo é mais barato.
- **Testes automatizados mínimos** — `tsc` não pega regressão de lógica; um punhado de testes de
  `utils/` (energy, streak, missions) daria rede de segurança barata.
- **Marketing/assets fora de `screens/`** — separar código de artefatos de loja desde o início.
- **Alinhar versão (`app.json` vs tag git)** — pequenas inconsistências viram confusão na loja.

### 8.3 Template de processo para próximos apps

Sequência reutilizável, destilada deste projeto:

1. **Validação (semana 0):** uma métrica/valor central claro; protótipo do "aha" em < 60s.
2. **Fundação técnica:** Expo + Supabase, TS strict, offline-first, i18n, AsyncStorage versionado,
   **observabilidade e push desde o início**.
3. **Core loop jogável grátis** antes de qualquer monetização; código de IAP isolado por flag.
4. **Backend seguro:** RLS + migrations versionadas (Supabase CLI), anti-abuso desde o social.
5. **Gamificação de retenção:** missões + streak (com proteção) + progressão + social honesto.
6. **Pré-lançamento:** auditoria formal (técnico/loja/produto/infra), checklist binário de
   bloqueadores, política de privacidade pública, conformidade de loja.
7. **ASO antes do pago:** título/subtítulo/keywords/screenshots localizados; reviews em picos.
8. **Lançar grátis, medir, então decidir** mídia paga e monetização **com dados reais**.
9. **Documentação viva** (progress, auditoria, launch info, growth) como memória de projeto.
10. **Marcos 30/90/180** com KPIs honestos e revisão deste documento a cada marco.

---

*Documento estratégico vivo. Gerado em 2026-05-28 a partir do estado real do produto
(PROGRESS.md, AUDITORIA_02_PRE_LAUNCH.md, LAUNCH_INFO.md). Revisar a cada marco.*
*Princípio editorial: rico, detalhado e honesto — benchmarks são faixas a validar, não promessas;
ciência motiva, mas o app mede e treina, não cura.*
