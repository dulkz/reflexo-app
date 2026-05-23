# CHECKPOINT 4 — GRUPO 4 (Design novo) — COMPLETO

Branch: feat/goal-redesign-final
Data: 2026-05-23
TypeScript: npx tsc --noEmit → 0 erros (validado após cada sub-item)

Status: COMPLETO — todos os itens do grupo concluídos e commitados. As 3 telas
grandes restantes (Resultado, Missões, Perfil) receberam o polimento visual nesta
sessão (commits f84633b, d221311, 2c15ec7).

## Concluído nesta sessão (commitado)

### 1. Estados de erro nos 4 gameplays — commit 44c3570
Specs exatas do reflexo-estados-erro.html / CLAUDE.md:
- Partida (toque antecipado): flash vermelho 0.14/200ms + shake do círculo de erro
  ±6px/400ms + Haptics Impact.Medium; círculo vermelho com ✕.
- Alvo (círculo errado): flash 0.14/200ms + shake só do círculo errado +
  Notification.Error; ring vermelho + ✕; demais círculos esmaecem.
- Sequência (NoGo tocado): flash intenso 0.20/250ms + shake da TELA INTEIRA
  ±8px/500ms + Notification.Error + 2º pulso leve 200ms depois.
- Radar (círculo errado): flash 0.14/200ms + shake do círculo errado +
  Notification.Error; alvo correto revelado esmaecido (âmbar).
- Novos: utils/haptics.ts (expo-haptics 15.0.8 instalado p/ SDK 54),
  utils/animations.ts (shake espelhando os keyframes CSS).

### 2. Abertura unificada dos 4 modos — commit 4a78936
reflexo-gameplay-redesign.html (parte 1 — telas de abertura):
- Padrão único: ícone SVG do modo (ICONS.modes.*) em círculo tintado + título na
  cor do modo + subtítulo + card "Como jogar" tintado na cor do modo + botão
  INICIAR. Corrige o card verde fora-de-marca da Partida (agora azul).
- Cor-âncora: Partida azul, Alvo ciano, Sequência roxo, Radar âmbar.

### 3. Home redesign — commit ca1e87a
reflexo-home-v2.html:
- CTA "TREINAR AGORA" verde dominante no topo (→ onStartPartida).
- Card de arquétipo na Home (identidade): atual + próximo + barra de progresso +
  dica do 1º critério não cumprido (buildUserStats/ARCHETYPES). Toque → Perfil.
- Streak vira pill compacta âmbar; stats 2-col (melhor reflexo / sessões).
- Insight F1 restilizado como lore roxo (neurociência contextual).
- Deviation justificada: mantidos os mode cards funcionais (badges de
  energia/grace, nível, melhor tempo) em vez do scroll horizontal do mock, para
  não perder informação de paywall. Props/handlers/lógica intactos.

## Já presente / verificado (requisito funcional do grupo já atendido)

- Resultado — tempo individual de cada rodada JÁ é renderizado nos 4 modos:
  PartidaResult (result.allRounds + times.map + nota de descarte), AlvoResult e
  RadarResult (result.roundList + map), SeqResult (result.timeline + trials.map).
  → O item funcional "tempo individual por rodada" está OK. Falta só o polimento
  visual seguindo reflexo-pos-partida.html.
- Perfil — timeline de 6 arquétipos JÁ existe: ARCHETYPE_CHAIN (EXPLORADOR→PILOTO)
  renderizada com ícones + conectores, card do arquétipo, evidence chips,
  progresso %, arquétipos passados e "destino". → Falta só o polimento visual
  seguindo reflexo-perfil.html.
- Missões — cartões com progresso X/Y JÁ renderizam em Jornada.tsx. → Falta o
  polimento visual (barras de progresso + CTA inline) seguindo reflexo-missoes.html.

## Polimento visual das 3 telas — concluído nesta sessão

### 4a. Resultado — commit f84633b (reflexo-pos-partida.html)
- Lista de rodadas do Alvo com penalidade DISCRIMINADA: tempo real + pílula
  "+150" + total; timeouts identificados separadamente do toque errado.
- Números de rodada maiores (fontWeight 900, 20px) com unidade "ms" sutil.
- Nota explicativa da penalidade no topo da lista; cards/espaçamento refinados.
- Sem alteração no cálculo de score/penalidade. +1 chave i18n result.alvoPenaltyNote.

### 4b. Missões/Jornada — commit d221311 (reflexo-missoes.html)
- Banner de meta roxo no topo das missões (meta + distância em ms + editar→triage).
- Rótulos "Hoje" / "Semana" acima dos cards diário/semanal.
- Card de lore roxo no fim (neuroplasticidade · intervalos de 48h).
- +6 chaves i18n journey.*; lógica de missões preservada.

### 4c. Perfil — commit 2c15ec7 (reflexo-perfil.html)
- Timeline de arquétipos redesenhada (nó+conector): círculos done(✓)/active(◉)/
  locked(○) + conectores; cor ativa = cor do arquétipo atual.
- Card de arquétipo: barra de accent no topo + indicador "próximo →".
- +1 chave i18n profile.nextShort. Detecção/progresso de arquétipo intactos.

Decisão de paleta: as 3 telas seguiram a paleta navy já estabelecida no app
(#0b1220 / #111a2e / #10b981 / #8b5cf6 / MODE_COLORS), usada na Home redesenhada,
em vez dos hex exatos dos mocks — coerência visual entre telas. Estrutura/layout
seguiram os mocks HTML.

## Próximo — GRUPO 5 (Animação de evolução de arquétipo) — EM ANDAMENTO
reflexo-arquetipo-evolucao.html — modal disparado quando o arquétipo muda
(flash branco + Haptics.Heavy → avatar scale → nome letra-a-letra → partículas
→ contador XP → CTA). Os utils/haptics.ts e utils/animations.ts criados aqui já
servem de base.
