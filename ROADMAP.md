# Roadmap — Reflexo App

## Visão geral
App de treino de reflexo e tempo de reação. Atualmente local (AsyncStorage). Próximas fases introduzem social, competição e monetização.

## Fase 1 — Polimento (concluída)
- [x] Escalas próprias por modo
- [x] Penalidades corretas no Modo Sequência
- [x] Sistema de Energia (UX + simulação)
- [x] Ícones SVG e avatares
- [x] Aba Jornada com meta e missões
- [x] Substituir emojis restantes (arquétipos, conquistas, missões já em SVG;
      pictogramas coloridos 🧠/❌/⚠️/⚡-NoGo removidos ou unificados ao glifo ✕/✗)
- [x] Versão em inglês (i18n PT/EN completo)
- [ ] Ícone launcher final

### Redesign aprovado pelo conselho (concluído — feat/goal-redesign-final)
- [x] GRUPO 1 — bugs críticos (splash, missões, jornada, resultado por rodada,
      rodadas por modo, 6 arquétipos no Perfil)
- [x] GRUPO 2 — bugs de arquitetura (streak unificado, timing Sequência, Radar
      nos arquétipos)
- [x] GRUPO 3 — intro 5 telas + onboarding ativo OB1–OB4
- [x] GRUPO 4 — design novo das telas (Home, Missões, Perfil, Resultado, aberturas
      e estados de erro dos 4 modos)
- [x] GRUPO 5 — animação de evolução de arquétipo (takeover full-screen)
- [x] GRUPO 6 — housekeeping (emojis, ROADMAP, CLAUDE.md, VERSAO_FINAL.md)
- Pendências conhecidas: ver VERSAO_FINAL.md

## Fase 2 — Social e Ranking

### 2.1 Ranking Global
- Leaderboard por modo (Partida, Alvo, Sequência, Radar)
- Filtros: hoje / esta semana / todos os tempos
- Exibe: posição, nome, avatar, score, nível
- Usuário vê onde está no ranking global

### 2.2 Ranking com Amigos
- Adicionar amigos por código único ou username
- Leaderboard privado só com amigos
- Notificação push quando amigo bate seu recorde
  - Ex: "João te superou no Modo Partida! 247ms vs 251ms"

### 2.3 PvP (Player vs Player)
- Desafio direto entre dois jogadores
- Assíncrono: cada um joga no seu tempo, resultado comparado
- Síncrono (futuro): ambos jogam ao mesmo tempo
- Vencedor recebe badge/troféu temporário

### Arquitetura necessária para Fase 2
**Backend: Supabase** (recomendado)
- Gratuito até 500MB / 2 projetos
- Integração nativa com React Native
- Auth (login com Google/Apple/email)
- PostgreSQL como banco de dados
- Realtime para rankings ao vivo
- Row Level Security para dados privados

**Tabelas necessárias:**
- users (id, username, avatar_id, created_at)
- scores (user_id, mode, score, best_time, accuracy, date)
- friendships (user_id, friend_id, status)
- challenges (challenger_id, challenged_id, mode, status, scores)

**Fluxo de implementação:**
1. Criar projeto no Supabase
2. Configurar auth (Google + Apple)
3. Migrar scores locais para nuvem ao fazer login
4. Implementar leaderboard global
5. Implementar sistema de amigos
6. Implementar PvP assíncrono

## Fase 3 — Monetização
- [x] Modelo definido em MONETIZACAO.md
- [ ] Sistema de Energia ativo (Google Play Billing)
- [ ] Google AdMob integrado
- [ ] Publicar na Play Store

## Fase 4 — Expansão
- Versão iOS (App Store)
- Versão em inglês
- Torneios semanais com ranking especial
- Modo time (equipes competindo entre si)
- Integração com wearables (Apple Watch, Wear OS)
- 3 modos de dificuldade (Fácil/Médio/Difícil)

## Decisões técnicas registradas
- Backend: Supabase (PostgreSQL + Auth + Realtime)
- Ranking: scores salvos localmente primeiro, sincronizados na nuvem ao fazer login
- PvP: assíncrono primeiro (mais simples), síncrono depois
- Auth: opcional no início — usuário pode jogar sem conta, cria conta para ranking
- Migração: ao criar conta, histórico local é enviado para nuvem automaticamente
