# CHECKPOINT 7 — Navegação: 3 tabs

Branch: `feat/goal-redesign-final` · `npx tsc --noEmit` = 0 erros

## Objetivo
Refatorar a navegação de 5 tabs (Jornada · Ciência · FAB · Histórico · Perfil) para
3 tabs: **Início · Missões · Perfil**. FAB laranja removido por completo.

## O que foi feito

### App.tsx — navegação
- `type Tab` reduzido de `'jogar' | 'historico' | 'ciencia' | 'perfil' | 'jornada'`
  para `'jogar' | 'missoes' | 'perfil'`.
- Removidos `LEFT_TABS`/`RIGHT_TABS`/`fabSpacer` → novo array `TABS` (3 itens) com
  labels via i18n (`nav.home`, `nav.missoes`, `nav.perfil`) e ícones `ICONS.nav.*`.
- **FAB laranja removido completamente**: botão flutuante, `fabContainer`, `fabSpacer`,
  `FAB_SIZE`, `TAB_BAR_HEIGHT` e todos os estilos `fab*`.
- **Mode picker bottom sheet removido** (só era acionado pelo FAB): modal + estado
  `modePickerVisible` + estilos `modePicker*`. Os modos continuam acessíveis pelos
  cards da Home, que já disparam cada modo.
- Tab bar reescrita com `justifyContent: 'space-around'` para 3 colunas iguais.
- Import `MODE_COLORS` removido (só era usado no mode picker).

### Tab Missões — `screens/Missoes.tsx` (novo)
Conteúdo de missões extraído de Jornada.tsx + dailyMissions.ts/missions.ts:
- **Meta pessoal no topo** (banner roxo; CTA de triagem se ainda não triado).
- **Missões do dia** — cada missão exibe que concede **Energia** (chip teal `+1 ENERGIA`
  → `ENERGIA GANHA` quando concluída + hint no cabeçalho do card).
- **Missões semanais** — cada missão exibe que concede **Ticket Dourado** (chip âmbar
  `TICKET DOURADO` → `TICKET GANHO` + hint no cabeçalho).
- Card de lore "por que treinar com intervalos" e estado vazio preservados.
- Novos ícones de recompensa em `assets/icons.ts` → `REWARD_ICONS` (`energy`, `ticket`).
- Nota: as recompensas são exibidas (camada visual do redesign). A concessão efetiva de
  energia/tickets ao concluir uma missão (com estado de "resgate" persistido) fica como
  mecânica futura — não há sistema de tickets nem evento de claim hoje.

### Tab Perfil — incorporação das telas extintas
`Perfil.tsx` virou o hub, sem perder nada:
- **MINHA JORNADA (mapa + meta)** incorporada de Jornada.tsx — banner de ambição +
  `<JourneyMap>` completo (`showYouAreHere`, `hideCompletionCard` quando tudo batido);
  CTA de triagem quando não triado. Inserida logo após o card de arquétipo.
- **HISTÓRICO — evolução por modo** incorporado: seção colapsável que renderiza
  `<HistoricoModeCards>` (cards por modo com tendência/melhor dia/etc.).
- **CONQUISTAS**: o card-resumo agora expande a lista completa inline
  (`<ConquistasContent showHeader={false} />`) em vez de navegar para uma tab.
- **CIÊNCIA** incorporada: seção colapsável que renderiza `<CienciaContent showTitle={false} />`.
- Tudo o que o Perfil já tinha (identidade, arquétipo, timeline de 6 arquétipos, metas de
  longo prazo, PARA VIRAR, por modo, gráfico, zona de perigo) foi mantido.

### Refatorações de reuso (sem deletar telas)
- `Ciencia.tsx` → exporta `CienciaContent({ showTitle? })`; `Ciencia` (default) o embrulha
  num `ScrollView`. Continua sendo uma tela válida, apenas não é mais tab.
- `Historico.tsx` → exporta `HistoricoModeCards({ sessions })`; `Historico` (default)
  reutiliza esse componente. Continua válido, apenas não é mais tab.
- `Jornada.tsx` mantido intacto (não deletado), apenas não é mais importado pela navegação.

### i18n
- `pt.json` / `en.json`: novos blocos `nav` (home/missoes/perfil) e `missoes`
  (title + hints + labels de recompensa de energia/ticket), em PT e EN.

## Verificação
- `npx tsc --noEmit` → **0 erros**.
