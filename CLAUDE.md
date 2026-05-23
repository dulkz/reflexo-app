# Reflexo App — Contexto do Projeto

## Visão Geral
App mobile de treinamento de tempo de reação visual, benchmarked contra atletas de elite (pilotos F1, boxeadores, tenistas). React Native + Expo SDK 54, TypeScript, Android-first.

Diretório real: C:\reflexo-app\
App principal: mobile2/ (TypeScript — NUNCA usar mobile/)
Branch de trabalho: feat/goal-redesign-final
GitHub: dulkz/reflexo-app

## Estado Final (2026-05-23)
Redesign do conselho CONCLUÍDO — GRUPOS 1 a 6 implementados e commitados em
feat/goal-redesign-final. tsc --noEmit = 0 erros. Detalhes do que foi entregue,
pendências conhecidas e próximos passos em VERSAO_FINAL.md. Checkpoints por grupo:
CHECKPOINT_1..5.md. O checklist abaixo está todo marcado como referência histórica.

---

## Regras de Trabalho Autônomo

1. Sempre trabalhar em C:\reflexo-app\mobile2\
2. Nunca tocar em C:\reflexo-app\mobile\ ou C:\Users\Dulks\Desktop\HQ\ClaudioIA\Reflexo-App\ — cópias antigas
3. Commit após cada grupo concluído com mensagem descritiva
4. Formato: fix: / feat: / chore:
5. Rodar npx tsc --noEmit antes de cada commit — zero erros obrigatório
6. Ao atingir ~75% de contexto: criar SESSAO_HANDOFF.md, commitar, parar — próxima sessão lê esse arquivo primeiro
7. Não parar para confirmar ações de baixo risco — avançar sempre
8. Só parar em: conflito de arquitetura grave, ou arquivo de referência inexistente
9. Após cada GRUPO concluído: criar CHECKPOINT_X.md descrevendo o que foi feito, commitar

---

## Stack Técnica

- React Native + Expo SDK 54, TypeScript strict
- Navegação: state machine em App.tsx (sem React Navigation — activeTab + gameScreen)
- Storage: AsyncStorage via utils/storage.ts
- i18n: i18next + react-i18next (PT/EN implementado)
- SVG: react-native-svg
- Haptics: expo-haptics

---

## Estrutura mobile2/

App.tsx — state machine principal
screens/: Home, Perfil, Historico, Jornada, Conquistas, Ciencia, Resultado, Splash, OnboardingModal, SemEnergia, ModoPartida, ModoAlvo, ModoSequencia, ModoRadar, triage/
config/: archetypes.ts, achievements.ts, ambitions.ts, avatars.ts, monetization.ts
utils/: levels.ts, streak.ts, storage.ts, energy.ts, missions.ts, dailyMissions.ts, userProfile.ts, ambition.ts, sfx.ts
components/: JourneyMap.tsx, LevelBadge.tsx

---

## Design Aprovado pelo Conselho

Referências visuais em: C:\reflexo-app\design\reference\

Design System:
- Fonte display: Bebas Neue
- Fonte body: DM Sans
- Fonte mono: Space Mono
- Background: #0A0F1E
- Accent principal: #00E5CC (ciano)
- Accent secundário: #5B4FCF (roxo)
- Partida: #3B82F6 | Alvo: #00E5CC | Sequência: #8B5CF6 | Radar: #F59E0B

Arquivos HTML de referência (todos em design/reference/):
- reflexo-home-v2.html — Home redesign
- reflexo-missoes.html — Missões redesign
- reflexo-perfil.html — Perfil redesign
- reflexo-pos-partida.html — Resultado redesign
- reflexo-estados-erro.html — Estados de erro por modo
- reflexo-arquetipo-evolucao.html — Animação de evolução (PRIORIDADE MÁXIMA)
- reflexo-intro-onboard.html — Intro 5 telas + Onboarding OB1-OB4 (NOVO)
- reflexo-gameplay-redesign.html — Gameplay 4 modos redesenhados

---

## Checklist /goal — Versão Final

### GRUPO 1 — Bugs críticos (fazer primeiro)
- [x] Splash: restaurar animação com nome Reflexo + barra horizontal animada
- [x] Missões de arquétipo: 2-3 missões simultâneas com progresso X/Y visível
- [x] Jornada: tela criar seu perfil / onde quer chegar acessível e funcional
- [x] Resultado: mostrar tempo individual de cada rodada além do score final
- [x] Rodadas por modo: Partida=7, Alvo=10, Sequência=10, Radar=15 — verificar e corrigir
- [x] Arquétipos: 6 completos (EXPLORADOR→PILOTO) visíveis em timeline no Perfil
- [x] Criar CHECKPOINT_1.md e commitar ao terminar este grupo

### GRUPO 2 — Bugs de arquitetura
- [x] Streak duplicado: remover inline do App.tsx, usar sempre utils/streak.calculateStreak
- [x] ModoSequencia: círculo some lentamente — corrigir timing do feedback visual
- [x] Radar nos arquétipos: adicionar como 4º modo em detectArchetypeId e targetCriteria
- [x] Criar CHECKPOINT_2.md e commitar ao terminar este grupo

### GRUPO 3 — Intro + Onboarding novo (aprovado pelo conselho)
Referência: reflexo-intro-onboard.html

PARTE 1 — Intro (5 telas splash):
- [x] T1: manter visual atual, mover botão navegação para zona inferior (era no topo — affordance failure)
- [x] T2: substituir por tela de ciência/dados (por que funciona — antes do como)
- [x] T3: substituir tela com # quebrado por revelação do arquétipo O Explorador com avatar SVG
- [x] T4: meta pessoal (copy atual está bom)
- [x] T5: modos disponíveis (mais compacta)
- [x] Adicionar botão Pular no top-right em todas as telas
- [x] Botão de navegação: Próximo → explícito na zona inferior, não gesto de deslize

PARTE 2 — Onboarding oficial (após COMEÇAR — fluxo OB1 a OB4):
- [x] OB1: mini-jogo de reflexo — 3 toques, sem rodadas, captura primeiro ms do usuário
- [x] OB2: resultado real com contexto (ex: 284ms — acima da média humana) + lore snippet
- [x] OB3: revelação do arquétipo baseado na performance real + preview do próximo arquétipo
- [x] OB4: escolha de meta com 4 opções que personalizam missões da semana
- [x] Fluxo total: 90-120 segundos, usuário entra na Home com número + identidade + objetivo
- [x] Criar CHECKPOINT_3.md e commitar ao terminar este grupo

### GRUPO 4 — Design novo (aplicar sobre mobile2/ preservando toda lógica)
Referências: reflexo-home-v2.html, reflexo-missoes.html, reflexo-perfil.html, reflexo-pos-partida.html, reflexo-gameplay-redesign.html

- [x] Home — seguir reflexo-home-v2.html
- [x] Missões — seguir reflexo-missoes.html
- [x] Perfil — seguir reflexo-perfil.html com timeline de 6 arquétipos
- [x] Resultado — seguir reflexo-pos-partida.html com tempos individuais por rodada
- [x] Gameplays — seguir reflexo-gameplay-redesign.html para abertura dos 4 modos
- [x] Estados de erro nos 4 gameplays (seguir reflexo-estados-erro.html):
  Partida: flash vermelho opacity 0.14/200ms + shake círculo ±6px/400ms + Haptics Impact.Medium
  Alvo: flash 0.14/200ms + shake círculo errado ±6px/400ms + Notification.Error
  Sequência: flash 0.20/250ms + shake TELA INTEIRA ±8px/500ms + Notification.Error + pulso 200ms depois
  Radar: flash 0.14/200ms + shake círculo errado ±6px/400ms + Notification.Error
- [x] Criar CHECKPOINT_4.md e commitar ao terminar este grupo

### GRUPO 5 — Animação de arquétipo (prioridade máxima do conselho)
Referência: reflexo-arquetipo-evolucao.html

- [x] Implementar tela/modal de evolução disparado quando arquétipo muda
- [x] Frame 1 (60ms): flash branco + Haptics.Heavy
- [x] Frame 2 (300ms): avatar scale 0→1.05→1 com easing
- [x] Frame 3 (200ms): nome do arquétipo letra a letra + Haptics.Medium
- [x] Frame 4 (600ms): partículas explodindo do avatar + Haptics.Success
- [x] Frame 5 (400ms): contador XP animado
- [x] Frame 6: CTA Continuar fade in
- [x] Criar CHECKPOINT_5.md e commitar ao terminar este grupo

### GRUPO 6 — Housekeeping final
- [x] Substituir emojis restantes por SVG inline
- [x] Atualizar ROADMAP.md tiscando todos os itens concluídos
- [x] Atualizar este CLAUDE.md com estado final real
- [x] Commit final: feat: versão final — design conselho + onboarding + funcionalidades completas
- [x] Criar VERSAO_FINAL.md com: o que foi implementado, o que ficou pendente, bugs conhecidos, próximos passos recomendados

---

## Mecânicas de Jogo (canônico — não alterar sem justificativa)

Partida: 7 rodadas, descarta 2 piores, score = média das 5 melhores. Jitter 1000-4000ms. Queimada +300ms.
Alvo: 10 rodadas, choice RT por cor, grid 2x2, prompt TOQUE O [COR]. Toque errado +200ms. Timeout 1500ms.
Sequência: 15 rodadas, Go/NoGo, 75% Go, 25% NoGo vermelho. Antecipado +150ms. NoGo tocado +200ms + haptic duplo.
Radar: 15 rodadas, 5 círculos em cruz, 1 acende por rodada. Toque errado +200ms. Timeout 1500ms.

---

## Sistema de Arquétipos (canônico — não alterar sem justificativa)

EXPLORADOR: entrada — qualquer performance
EM_EVOLUÇÃO: 3+ sessões completadas
RESISTENTE: sem fadiga em 5 sessões de Sequência
ATIRADOR: precisão >= 95% no Alvo
VELOCISTA: Partida < 220ms
PILOTO: Partida < 200ms + todos os modos jogados (incluindo Radar)

Missões para evoluir: 2-3 simultâneas com progresso X/Y visível ao usuário.

---

## Branches

- main — estável, protegido
- feat/goal-redesign-final — branch ativa de trabalho
- pre-goal-backup — snapshot local pré-redesign
- origin/backup/pre-goal-redesign — snapshot remoto pré-redesign
