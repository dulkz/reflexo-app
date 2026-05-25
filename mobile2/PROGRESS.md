# Reflexo App — Progress Log

## v1.0.0 — Fase 1 (branch: feat/goal-redesign-final) ✅
Branch finalizada e estável.
- App completo offline com 4 modos de jogo (Partida, Radar, Sequência, Alvo)
- Sistema de arquétipos, missões, conquistas
- Design system: bg #0A0F1E, ciano #00E5CC, Bebas Neue, DM Sans, Space Mono
- Onboarding, Perfil, Histórico, Ciência

---

## Fase 2 — Sistema Online / Ranking (branch: feat/online-ranking) ✅
**Milestone atingido em: 2026-05-24**
**Último commit: 7effb38**

### O que foi implementado

#### Infraestrutura
- Supabase configurado (projeto: ouqneluwoyscvlvckywj.supabase.co)
- Tabelas: profiles, sessions, friendships
- View: ranking (user_id, username, archetype, mode, avg_rt_global, session_count, rank_position)
- RLS policies: sessions_own_insert, sessions_own_read, sessions_public_ranking
- Permissions: GRANT SELECT/INSERT para authenticated nas tabelas e view
- Constraint: UNIQUE (user_id, played_at, mode) para idempotência do upsert
- Migrations versionadas: supabase/migrations/0001 e 0002

#### Autenticação
- Tela Auth.tsx: login / cadastro / recuperação de senha
- Fluxo: Splash → verifica sessão → AuthScreen ou AppInner
- Modo convidado: "Continuar sem conta" (AsyncStorage flag reflexo_guest)
- RootGate em App.tsx gerencia sessão Supabase em tempo real
- Logout em Perfil.tsx: limpa sessão, flag convidado e flag de migração

#### Aba Global
- 4ª tab na nav bar: Início · Global · Missões · Perfil
- Ícone globo SVG inline, i18n pt/en
- GlobalScreen completa: seletor de 4 modos, FlatList com pull-to-refresh
- Usuário logado destacado em ciano com coroa para top 3
- Realtime via Supabase (escuta tabela sessions)
- Guest wall: "Faça login para ver o ranking global"

#### Sincronização
- syncSession.ts: fire-and-forget após cada jogo (upsert idempotente)
- migrateLocalSessions.ts: migração one-shot no primeiro SIGNED_IN
- Reset de flag no logout para permitir re-migração limpa
- Fontes customizadas carregadas: BebasNeue, DM Sans, Space Mono

### Commits da Fase 2
- 1905d80: feat: integração Supabase — cliente e dependências
- 33ec2cf: feat: fluxo de auth — splash sempre primeiro, modo convidado, gate de sessão
- 8a805a6: feat: adiciona aba Global na nav bar (placeholder)
- aad9dff: feat: GlobalScreen completa — ranking ao vivo, seletor de modo, realtime
- f6eaad0: fix: query ranking usa avg_rt_global e rank_position; instala e carrega fontes
- 0e5ddff: feat: sync oportunista de sessões com Supabase após cada jogo
- e429772: fix: corrige colunas do insert sessions para schema real do Supabase
- 56919b8: feat: migração one-shot de sessões locais para Supabase no primeiro login
- 3b62b1c: feat: botão de logout em Perfil + reset flag de migração
- d630a21: fix: upsert para evitar duplicatas na re-migração; limpa flag convidado no logout
- 0d0fbb8: fix: limpa estado guest no SIGNED_OUT
- 7effb38: chore: versiona migrations Supabase aplicadas manualmente

### Pendências / Próximos passos
- [x] Card de perfil público — PR #3 mergeado (ecff601)
- [x] Popular campo accuracy real — PR #2 mergeado (5bf0fb2)
- [x] Abrir PR feat/online-ranking → main — PR #1 mergeado (dc4fe27)
- [x] Deep link para confirmação de email — PR #5 mergeado (ee43a14)
- [ ] Normalizar indentação GlobalScreen.tsx (cosmético)

### Configurações de ambiente (não versionadas)
- Credenciais Supabase em mobile2/.env (ignorado pelo git)
- Supabase URL Configuration: Site URL = exp://localhost:8081

---

## Pós-Fase 2 — melhorias incrementais (branch: main)
**Última atualização: 2026-05-24**

- PR #2 (5bf0fb2): accuracy real populada no sync (alvo, radar, sequência)
- PR #3 (ecff601): card de perfil público no ranking (modal com posição, tempo médio, partidas)
- README.md criado com visão geral do projeto
- PR #4 (9163536): README.md criado
- PR #5 (ee43a14): deep link de auth (scheme reflexo, expo-linking, handler cold start)
- PR #11 (e76f715): fixes pos-teste — trigger auto-perfil, ranking min(avg_rt), tutorial ciano, aviso email cadastro
- PR #12 (d2db96f): preparacao iOS — bundleIdentifier, permissions, eas profiles, expo-localization fix
- PR #13 (26b6dc3): pendencias auditoria — RLS versionada, deep link exchangeCodeForSession, tela de reset de senha
- PR #14 (d925120): auth sem internet — mensagem de erro amigavel
- PR #15 (69d5afa): i18n Auth e GlobalScreen — secoes auth e global nos locales
- PR #16 (7a77cf3): expo-asset peer dep corrigido + acessibilidade basica (9 elementos)
- PR #17 (802f706): i18n NewPassword.tsx e GlobalScreen.viewProfile
- PR #18 (f2a3590): fix username salvo apos confirmacao de email via AsyncStorage
- PR #19 (4437aa4): i18n logout e nomes de arquetipos em EN (perfil em formacao adiado)

---

## Próximos passos — Produção
**Atualizado em: 2026-05-24**

### Pronto para fazer
- [x] Rebuild nativo com EAS — feito (EAS Starter $19/mês contratado)
- [x] Gerar APK standalone — feito (https://expo.dev/artifacts/eas/rWzKBbW52c94Yr13tYbCL5.apk)
- [x] ios.bundleIdentifier configurado — PR #12
- [x] Permissões desnecessárias removidas — PR #12
- [x] expo-localization versão corrigida — PR #12
- [ ] Testar deep link no APK: confirmação de email + reset de senha
- [ ] Se deep link não fechar sessão automaticamente: adicionar supabase.auth.exchangeCodeForSession(url) no handler de App.tsx (lib/linking.ts já está pronto)
- [ ] Testar ranking com múltiplos usuários reais
- [ ] Publicar na Play Store / App Store

### Configurações de produção pendentes
- Site URL do Supabase: trocar exp://localhost:8081 para reflexo://auth-callback antes de publicar nas lojas
- Variáveis de ambiente: garantir que .env está configurado no ambiente de build do EAS

### Notas técnicas
- EAS projectId já configurado no app.json: 38fbd96b-f8a7-4bdd-9d91-39c30c716345
- Package Android: com.dulks.reflexo
- Scheme: reflexo
- Supabase Redirect URLs configurados: reflexo://auth-callback e exp://localhost:8081/--/auth-callback

### Status atual do build (2026-05-25)
- Limite de builds EAS free atingido — reseta em 2026-06-01
- GitHub Actions configurado e funcionando (PR #10, workflow build-android.yml)
- Quando o limite resetar, o próximo push na main vai disparar o build automaticamente
- APK ficará disponível em: https://expo.dev/accounts/dulkz/projects/reflexo-app/builds

### Para retomar em 2026-06-01
1. Verificar se o splash gate fix foi buildado (PR #9 — fix/splash-gate-fallbacks)
2. Fazer um push vazio para disparar o workflow:
   git commit --allow-empty -m "ci: trigger build apos reset do limite EAS"
   git push origin main
3. Acompanhar em: https://github.com/dulkz/reflexo-app/actions
4. Instalar o APK gerado no celular e executar o checklist de validação

### Checklist de validação do APK
- [ ] App abre sem travar no splash
- [ ] Criar conta nova → email de confirmação chega
- [ ] Link do email abre o app (deep link reflexo://)
- [ ] Login com conta confirmada funciona
- [ ] Continuar sem conta funciona
- [ ] Logout volta para tela de auth
- [ ] Jogar uma partida completa
- [ ] Sessão aparece no ranking Global
- [ ] Card de perfil abre ao tocar no nome
- [ ] Reset de senha: email chega e link abre o app

---

## Checklist pré-lançamento lojas
**Atualizado em: 2026-05-25**

### Play Store (Android) — quase pronto
- [x] APK gerado e testado
- [x] package: com.dulks.reflexo
- [x] Permissões revisadas
- [x] Ícone 1024x1024
- [ ] Gerar AAB (production): eas build --platform android --profile production
- [ ] Conta Google Play Console ($25 único)
- [ ] Screenshots (mínimo 2, máximo 8)
- [ ] Descrição do app (curta e longa)
- [ ] Política de privacidade publicada em URL pública
- [ ] Classificação de conteúdo (questionário no Play Console)

### App Store (iOS) — configurado, aguardando conta
- [x] bundleIdentifier: com.dulks.reflexo
- [x] scheme: reflexo (deep link)
- [x] eas.json profile preview-ios e production configurados
- [x] GitHub Actions build-ios.yml criado
- [ ] Apple Developer Account ($99/ano) — https://developer.apple.com/programs/enroll/
- [ ] Após conta: eas build --platform ios --profile preview-ios
- [ ] Preencher appleId/ascAppId/appleTeamId no eas.json
- [ ] Screenshots iPhone e iPad
- [ ] Preencher email em PRIVACY_POLICY.md
- [ ] Política de privacidade publicada em URL pública

### Pendências técnicas (da auditoria)
- [x] Reset de senha — tela de nova senha (updateUser) — PR #13
- [x] Deep link — exchangeCodeForSession no handler + flowType pkce — PR #13
- [x] RLS policies — versionadas em migrations/0008 — PR #13
- [x] Auth sem internet — mensagem de erro amigavel — PR #14
- [x] expo-asset peer dep — verificar se causa crash em produção — PR #16
- [x] i18n — Auth.tsx e GlobalScreen.tsx (PT hardcoded) — PR #15
- [x] Acessibilidade — accessibilityLabel nos elementos principais — PR #16

> Nota PR #13: o reset de senha precisa de teste em build/device real (depende
> da Redirect URL reflexo://auth-callback no dashboard Supabase e do fluxo PKCE
> no mesmo aparelho). RLS já estava ativa no dashboard; a migration 0008 apenas
> versiona/documenta as policies para reprodução em ambiente limpo.
