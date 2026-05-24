# CHECKPOINT 10 — Correções visuais e UX

Branch: feat/goal-redesign-final · tsc --noEmit = 0 erros

## 1. Tab bar (App.tsx)
- Padding vertical/horizontal dos itens aumentado: `tabItemCard` paddingVertical 6→10, paddingHorizontal +16, altura 54→60, minWidth 72→84, gap 3→5, borderRadius 12→14.
- `tabBar` paddingTop 6→10 + paddingHorizontal 8; `tabBtn` paddingVertical 2→4.
- Labels mais legíveis: `tabLabel` fontSize 10→12, fontWeight 600→700, cor #4a5a7b→#7a8aa0, letterSpacing 0.5→0.3.

## 2. Tutorial Modo Partida (components/ModeTutorial.tsx)
- `PartidaTutorial` migrado de layout `row` (círculo + bloco-legenda com título "PARTIDA" duplicado) para layout `col` único — mesmo padrão do `AlvoTutorial`: visual centralizado no topo + uma descrição centralizada abaixo.
- Removida a duplicação do título do modo (o título/ícone já vêm da tela). Fim dos "dois cards sobrepostos".

## 3. Botão voltar padronizado (screens/ModoRadar.tsx)
- Radar em jogo usava um botão "DESISTIR" (texto) no canto direito — único modo divergente.
- Trocado pelo botão de seta `←` padrão (borda âmbar, 32×28) no canto esquerdo, igual a Partida/Alvo/Sequência. Round counter centralizado + spacer à direita (mesmo layout in-game do Alvo).

## 4. Histórico por modo no Perfil (screens/Historico.tsx)
- Cada card de modo agora mostra DOIS valores lado a lado, sempre visíveis sem expandir:
  - **melhor absoluto** (rodada/hit individual mais rápido)
  - **melhor média** (melhor score de sessão)
- Bloco de dois stats com divisor; rótulos novos em i18n: `history.stats.absLabel` / `history.stats.avgBestLabel` (pt+en).

## 5. Conquistas secretas (screens/Conquistas.tsx)
- Bug: nas secretas descobertas, badge SECRET e badge de raridade usavam `position:absolute` no mesmo canto → sobrepunham.
- Correção: o badge SECRET **substitui** o de raridade (um único badge no topo-direito). Sem sobreposição.
