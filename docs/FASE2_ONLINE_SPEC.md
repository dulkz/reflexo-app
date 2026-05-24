# Reflexo App — Fase 2: Sistema Online
## Especificação Técnica · Decisões do Conselho · Mai 2026

---

## Contexto e Visão

O objetivo da Fase 2 é transformar o Reflexo de um app de treino solo em uma comunidade competitiva ao vivo. A aba Global permite que qualquer usuário abra o app, veja um ranking em tempo real, e compare sua performance com todos os usuários ou apenas seus amigos.

**Visão do produto:** meu amigo, na casa dele, abre o app → clica em Global → vê o ranking ao vivo com todos os usuários ou apenas amigos → encontra minha posição → clica no meu card → vê meu perfil público.

---

## Decisões de Produto (imutáveis)

### Métrica de ranking
**Tempo médio de todas as sessões do modo — sempre.**
Nunca melhor tempo absoluto. Razão: melhor tempo pode ser obtido por antecipação acidental ou uma sessão isolada de sorte. Tempo médio representa performance consistente e real, é impossível de "trapacear".

### Elegibilidade para o ranking
Mínimo de **3 sessões completas** no modo para aparecer no ranking público. Evita que um usuário com 1 sessão apareça acima de usuários com histórico real.

### Navegação
**4 tabs:** Início · Global · Missões · Perfil
- Global em segundo lugar (posição de destaque após Início)
- Ícone: globo 🌐
- Container uniforme mantido (mesmo padrão da tab bar atual)

### Migração de dados locais
**Opção A — migrar no primeiro login.**
Quando o usuário faz login pela primeira vez, os dados locais (sessões, conquistas, arquétipo) sobem automaticamente para o Supabase. O usuário nunca percebe a migração — o histórico simplesmente está lá.
- Dados de teste pré-lançamento (do autor) serão descartados manualmente antes da publicação na Play Store
- Qualquer usuário real que jogar antes de criar conta não perde nada ao fazer login depois

### Ranking de amigos
Mesmo ranking, mesmo filtro — não são telas separadas. Toggle "Todos / Amigos" na tela Global filtra o mesmo ranking. Sistema de amigos via **código de convite de 6 dígitos**.

### Coroas
- 👑 Coroa dourada: top 1 de cada modo
- Coroa prata: top 2
- Coroa bronze: top 3
- Visíveis no card público do usuário e futuramente no card de compartilhamento

---

## Arquitetura Backend

### Stack
- **Supabase** (PostgreSQL + Auth + Realtime)
- Realtime nativo via WebSocket — ranking atualiza ao vivo sem polling
- Auth: Google OAuth + email/senha

### Tabelas

```sql
-- Perfis públicos
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  username text UNIQUE NOT NULL,
  archetype text,
  pinned_achievements jsonb DEFAULT '[]',  -- max 3 conquistas fixadas
  created_at timestamptz DEFAULT now()
);

-- Sessões de jogo
CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  mode text NOT NULL CHECK (mode IN ('partida', 'radar', 'sequencia', 'alvo')),
  avg_rt integer NOT NULL,          -- tempo médio da sessão em ms
  rounds_completed integer NOT NULL,
  played_at timestamptz DEFAULT now()
);

-- View materializada para ranking (recalculada a cada nova sessão)
CREATE MATERIALIZED VIEW rankings AS
SELECT
  user_id,
  mode,
  ROUND(AVG(avg_rt))::integer AS avg_rt_all_sessions,
  COUNT(*) AS session_count,
  RANK() OVER (PARTITION BY mode ORDER BY AVG(avg_rt) ASC) AS rank_position
FROM sessions
GROUP BY user_id, mode
HAVING COUNT(*) >= 3  -- mínimo 3 sessões para aparecer
WITH DATA;

-- Amizades
CREATE TABLE friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  invite_code text UNIQUE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, friend_id)
);
```

### Row Level Security (RLS)
```sql
-- profiles: público para leitura, privado para escrita
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_public_read" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_own_write" ON profiles FOR ALL USING (auth.uid() = id);

-- sessions: usuário só vê e escreve as próprias
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_own" ON sessions FOR ALL USING (auth.uid() = user_id);

-- friendships: usuário vê as próprias
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "friendships_own" ON friendships FOR ALL
  USING (auth.uid() = user_id OR auth.uid() = friend_id);
```

---

## Tela Global — Estrutura

```
GLOBAL
├── Toggle: [Todos] [Amigos]
├── Seletor de modo: Partida | Radar | Sequência | Alvo
├── Label: "Tempo médio · Top 100"
├── Lista de ranking
│   ├── Posição + nome + arquétipo + conquistas fixadas
│   ├── Tempo médio em ms
│   ├── Usuário atual sempre destacado em ciano
│   └── Coroa para top 3
└── Clique no usuário → Card público
    ├── Avatar + username + arquétipo
    ├── Conquistas fixadas (max 3)
    └── Melhores médias por modo
```

---

## Fluxo de Autenticação

1. Primeiro abrir do app após update com login → tela de boas-vindas ao ranking
2. Opções: "Entrar com Google" ou "Criar conta com email"
3. Após login: escolha de username público (único, sem espaços, max 20 chars)
4. Migração silenciosa dos dados locais para Supabase
5. App continua normalmente — login não bloqueia uso offline

**Importante:** o app deve funcionar 100% offline sem login. Login é opcional para acessar a aba Global. As outras 3 tabs (Início, Missões, Perfil) continuam funcionando sem autenticação.

---

## Fases de Entrega

### Fase 2A — Fundação (estimativa: 1-2 semanas)
- [ ] Criar projeto Supabase
- [ ] Configurar tabelas + RLS
- [ ] Implementar auth (Google + email) no app
- [ ] Username na primeira abertura após login
- [ ] Migração de dados locais no primeiro login
- [ ] Sessões passam a subir para Supabase após login
- [ ] Aba Global na nav bar (estado: "ranking em breve")

### Fase 2B — Ranking Global (estimativa: 1 semana)
- [ ] Tela Global completa com ranking por modo
- [ ] Filtro Todos/Amigos
- [ ] Realtime ativo
- [ ] Destaque do usuário na posição
- [ ] Coroas para top 3
- [ ] Card público ao clicar no usuário

### Fase 2C — Amigos (estimativa: 1 semana)
- [ ] Sistema de convite por código de 6 dígitos
- [ ] Filtro "Amigos" funcional
- [ ] Notificação quando amigo supera seu score

### Fase 2D — Monetização (estimativa: 1-2 semanas)
- [ ] MONETIZATION_ENABLED = true
- [ ] Energia 3/dia + missões diárias
- [ ] Tickets Dourados
- [ ] Skins de arquétipo via Tickets
- [ ] Coroas visíveis no card público

### Fase 3 — PVP Assíncrono
- [ ] Desafio de score: "Bata meu Xms no Modo Partida"
- [ ] Adversário recebe notificação, joga quando quiser
- [ ] Sem WebSocket — backend simples de desafios

---

## Regras de Negócio Imutáveis

1. **Métrica sempre = tempo médio** — nunca melhor absoluto
2. **Mínimo 3 sessões** para aparecer no ranking
3. **Offline-first** — app funciona sem internet, sincroniza quando conecta
4. **Login opcional** — apenas aba Global requer autenticação
5. **Username público único** — escolhido no primeiro login, pode ser alterado (com cooldown de 30 dias)
6. **Dados locais migram no login** — usuário nunca perde histórico

---

## Informações Técnicas

- Repositório: https://github.com/dulkz/reflexo-app
- Diretório backend: `C:\reflexo-app\backend\`
- Branch para Fase 2: a definir (sugestão: `feat/online-ranking`)
- Supabase: projeto a criar em supabase.com (conta: a definir)
