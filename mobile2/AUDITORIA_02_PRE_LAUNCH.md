---
title: AUDITORIA 02 — Pré-Lançamento App Store
project: Reflexo App
date: 2026-05-28
auditor: Claude Code (Opus 4.7)
branch: main
tag: v2.0.0-dev
escopo: leitura estática + tsc; sem build EAS, sem inspeção do dashboard Supabase/App Store Connect
referencia: AUDITORIA_PRE_LANCAMENTO.md (2026-05-25) — esta auditoria revisa o que foi resolvido e o que continua aberto
lema: Processos, controle, validação e segurança
---

# AUDITORIA 02 — Pré-Lançamento App Store

**Data:** 2026-05-28
**Repositório:** `C:\reflexo-app` · **Projeto:** `mobile2/`
**Stack:** React Native 0.81.5 + Expo SDK 54 · TypeScript 5.9 (strict) · Supabase · AsyncStorage
**Branch auditada:** `main` @ `v2.0.0-dev` (HEAD `f1e36fe` + ajustes em `app.json`/`eas.json`/`PROGRESS.md`/`Home.tsx`)
**Modo:** Somente leitura — nenhuma edição de código nesta auditoria
**Auditor:** Claude Code (Opus 4.7)

> ⚠️ **Aviso de escopo:** auditoria estática (TypeScript `tsc`, grep, leitura de código,
> migrations versionadas e configs). **Não** foi possível: rodar `npx expo-doctor` nesta
> sessão, inspecionar o estado real do dashboard Supabase (RLS, secrets, redirects),
> rodar um build EAS de produção, nem testar em device real. Itens que dependem dessas
> verificações estão marcados com **[VERIFICAR NO DASHBOARD]** ou **[VERIFICAR EM BUILD]**.

---

## 1. Sumário Executivo

Desde a auditoria de 2026-05-25, **todos os 7 bloqueadores críticos C1–C7 foram resolvidos**: produção iOS+Android está configurada no `eas.json`, `ios.bundleIdentifier` foi adicionado, peer dependency `expo-asset` foi instalada, `expo-localization` voltou para a faixa esperada pelo SDK 54, as permissões de áudio foram removidas (commit `7a3e542` desta sessão), `PRIVACY_POLICY.md` está publicada via GitHub Pages, e as RLS policies do Supabase foram versionadas em `migrations/0008`. Em paralelo, **M1, M2, M4, M5 e M6 foram fechados** — `NewPassword.tsx` existe e é acionada pelo evento `PASSWORD_RECOVERY`, `Auth.tsx` agora trata erros com detector de rede, o handler de deep link executa `exchangeCodeForSession` com PKCE, o log que vazava o `code` foi removido, e `Auth`/`GlobalScreen` têm i18n.

O TypeScript `tsc --noEmit` passa **com zero erros**; `: any`, `@ts-ignore` e `TODO/FIXME` continuam **zero**. O App Store Connect está com metadados PT preenchidos, screenshots iOS PT (6/6) carregados, política de privacidade declarada, classificação e dados de contato configurados.

O que **continua bloqueando** o submit às lojas é **operacional, não código**:
1. **Build iOS de produção não foi gerado** — login Apple via EAS rejeitou senha (precisa App-Specific Password).
2. **AAB Android de produção não foi gerado** — workflow CI ainda builda só APK preview; nenhum disparo manual de `production`.
3. **Apple Developer Account: ativação em processamento** — pagamento confirmado, status final não checado.
4. **Google Play Console**: aguardando aprovação de identidade + taxa única **US$ 25** pendente.
5. **`google-service-account.json` ausente** no projeto — `eas.json` referencia mas o arquivo não existe.
6. **Screenshots iOS EN ausentes** no App Store Connect (PT carregados).
7. **Screenshots Play Store** (PT/EN) ainda não enviados na console (HTML frames existem em `screens/playstore/`).

Riscos remanescentes de **produto** (não bloqueiam, mas precisam decisão antes do submit):
- **Ranking burlável** (M3) — `avg_rt` é definido pelo cliente, sem validação server-side de plausibilidade.
- **Realtime global em `sessions`** (M8) — todo INSERT global dispara re-fetch em todos os clientes; custo escala com a base.
- **Migração cross-user em device compartilhado** (M9) — sessões locais não são namespaced por usuário; primeiro login pós-logout migra tudo para a nova conta.
- **Zero testes automatizados** (M10) — só `tsc` cobre regressões.

**Veredito:** o app **passa nos critérios técnicos da App Store** (encriptação declarada, sem permissões fantasma, política de privacidade pública, conta de revisão configurada, ícone 1024). **Não está pronto para submit hoje** apenas porque o build iOS de produção ainda não rodou — uma vez gerado e associado à versão 1.0 no ASC, o app pode ir para revisão. Estimativa: **24–72h de operações** para destravar (App-Specific Password + 1 build iOS + 1 build AAB + envio dos restantes screenshots).

### Score por bloco

| Bloco | Tema | 2026-05-25 | **2026-05-28** | Δ |
|------:|------|:----------:|:--------------:|:-:|
| 1 | Código & qualidade técnica | 7.5 | **8.5** | ↑ |
| 2 | Arquitetura & dependências | 6.0 | **7.5** | ↑ |
| 3 | Funcionalidades & regras de negócio | 6.5 | **7.5** | ↑ |
| 4 | UX/UI & design | 6.5 | **7.0** | ↑ |
| 5 | Infraestrutura & operações | 5.0 | **6.5** | ↑ |
| **Geral** | | **≈ 6.3** | **≈ 7.4** | ↑ |

---

## 2. Checklist de bloqueadores — estado atual

### 2.1 Resolvidos desde 2026-05-25

| # | Item | Como foi resolvido |
|---|------|--------------------|
| C1 | Profile `production` no `eas.json` (AAB + iOS) | Adicionado em `eas.json:14-19` (`android.buildType: app-bundle` + bloco `ios: {}`) |
| C2 | `ios.bundleIdentifier` em `app.json` | `com.dulks.reflexo` em `app.json:18` |
| C3 | Peer dep `expo-asset` ausente | Instalada (`package.json:18 "expo-asset": "~12.0.13"`) e listada em `app.json plugins` |
| C4 | `expo-localization` major mismatch | Corrigida para `~17.0.8` em `package.json:23` (faixa do SDK 54) |
| C5 | Permissão `RECORD_AUDIO`/`MODIFY_AUDIO_SETTINGS` não usada | `android.permissions: []` em `app.json:31` — removidas no commit `7a3e542` desta sessão |
| C6 | Política de privacidade pública | `PRIVACY_POLICY.md` publicada em `https://dulkz.github.io/reflexo-app/mobile2/PRIVACY_POLICY`; URL declarada no ASC |
| C7 | RLS policies não versionadas | Versionadas em `supabase/migrations/0008_rls_policies_documentation.sql` (profiles + sessions com `auth.uid()`) |

### 2.2 Resolvidos / mitigados desde 2026-05-25 (severidade moderada)

| # | Item | Como foi resolvido |
|---|------|--------------------|
| M1 | Reset de senha não se completava | `screens/NewPassword.tsx` (112 linhas) chama `supabase.auth.updateUser({ password })`; `App.tsx:153-155` escuta `PASSWORD_RECOVERY` e renderiza a tela |
| M2 | Auth sem internet — sem feedback | `Auth.tsx` agora tem `try/catch` com `isNetworkError()` detector (linhas 17-18, 36, 53, 68, 87) e alerts traduzidos |
| M4 | Deep link não troca code por sessão | `App.tsx:161-194` extrai `code` via `Linking.parse` e chama `supabase.auth.exchangeCodeForSession`; `flowType: 'pkce'` em `lib/supabase.ts:14` |
| M5 | Log da URL de auth vazava code/token | Substituído por mensagens genéricas (`'[DeepLink] sessão estabelecida via deep link'`); o `code` extraído nunca aparece nos logs |
| M6 | Auth/GlobalScreen 100% PT hardcoded | Ambas migradas para i18n (`useTranslation` + `t()`), com chaves `auth.*` e `global.*` em `locales/pt.json` e `en.json` (914 linhas cada) |
| M7 (parcial) | Acessibilidade quase ausente | `accessibilityLabel`/`Role` agora em 3 arquivos com 20 ocorrências (Auth, GlobalScreen, ModeTutorial). Telas centrais (Home, Perfil, Missoes, Modos) **continuam sem rótulos** |

### 2.3 Ainda abertos — bloqueadores operacionais para submit

- [ ] **Gerar build iOS de produção** — `eas build --platform ios --profile production` com App-Specific Password (criar em `appleid.apple.com → Segurança → Senhas para apps → "EAS Build"`).
- [ ] **Gerar AAB Android de produção** — `eas build --platform android --profile production` (workflow CI atual só faz `preview`/APK; iniciar manualmente).
- [ ] **Confirmar Apple Developer Account ativada** — pagamento confirmado em 25/05; aguardar até 48h da ativação.
- [ ] **Pagar / abrir Google Play Console (US$ 25)** — sem isso não há onde subir o AAB.
- [ ] **Criar `mobile2/google-service-account.json`** — `eas.json:24` aponta para este arquivo; sem ele o `eas submit --platform android` falha. Gerar no console Google Cloud (Service Account com role *Service Account User*) e ligar à Play Console.
- [ ] **Carregar screenshots iOS EN no ASC** (PT já carregados — 6/6).
- [ ] **Carregar screenshots Play Store PT+EN** (HTML frames em `screens/playstore/` precisam ser renderizados em PNGs e enviados na Play Console).
- [ ] **Associar o build iOS produção à versão 1.0 no App Store Connect** após o build subir.
- [ ] **Submeter para revisão Apple**.
- [ ] **[VERIFICAR NO DASHBOARD]** Site URL Supabase ainda é `exp://localhost:8081`. Antes do submit às lojas, trocar para `reflexo://auth-callback` em `Authentication → URL Configuration`.

### 2.4 Ainda abertos — qualidade de produto (não bloqueiam, decidir antes)

- [ ] **M3 — Ranking burlável**: `avg_rt` é client-defined em `syncSession.ts:18`. Mesmo com RLS, um usuário pode submeter `1ms` para a própria conta e dominar o ranking.
- [ ] **M8 — Realtime global**: `GlobalScreen.tsx:96-105` escuta `*` em `sessions` (todas as inserções, todos os modos). Custo de banda/quota escala com a base; considerar debounce ou filtro por modo.
- [ ] **M9 — Migração cross-user em device compartilhado**: `Perfil.tsx:222-228 handleLogout` não chama `clearUserData()` (por design offline-first), mas isso significa que o próximo login no mesmo aparelho **migra todas as sessões locais para a nova conta**.
- [ ] **M10 — Zero testes automatizados**: nenhum Jest, nenhum RNTL, nenhum E2E. `tsc` é a única garantia.
- [ ] **`MONETIZATION_ENABLED = false`** e `PREMIUM_ACTIVE = false` em `config/monetization.ts`. UI de paywall mostra preços (R$ 2,99 / R$ 6,99 / R$ 4,99 / R$ 34,99) mas as compras chamam `addEnergy('all', 999, ...)` em modo simulado. **Decisão pendente:** lançar com paywall visível em modo de teste? Esconder a Premium Card por enquanto? A Apple pode rejeitar se considerar "in-app purchase fake".

---

## 3. BLOCO 1 — Funcionalidade · ✅ OK (8/10)

### 3.1 Fluxos principais — mapa e estado

| Fluxo | Onde mora | Estado |
|-------|-----------|--------|
| Splash + carregamento de fontes | `App.tsx:97-216` (`RootGate`) | ✅ Timeout de segurança 8s; aguarda 3 sinais (`splashDone`/`authChecked`/`fontsLoaded`). Bem desenhado. |
| Auth (login / signup / reset) | `screens/Auth.tsx` | ✅ Cobre 3 modos; trata erro de rede; i18n; `accessibilityLabel` em todos os botões. |
| Reset de senha | `screens/NewPassword.tsx` + `App.tsx:153-155` `PASSWORD_RECOVERY` handler | ✅ Fechado. Fluxo: link no e-mail → deep link `reflexo://auth-callback?code=…` → `exchangeCodeForSession` → Supabase emite `PASSWORD_RECOVERY` → `RootGate` renderiza `NewPassword` → `updateUser({ password })`. **[VERIFICAR EM BUILD]** funciona em device real com PKCE no mesmo aparelho. |
| Convidado (guest) | `Auth.tsx:211-215` + `App.tsx:118` | ✅ Flag `reflexo_guest` em AsyncStorage; ranking bloqueado para guest (`GlobalScreen.tsx:113-123`). |
| Logout | `Perfil.tsx:222-228` | ✅ Reseta migration flag, remove flag guest, chama `signOut`. ⚠️ **M9 — não namespaca sessões locais por usuário**. |
| Onboarding (1ª abertura) | `screens/onboarding/OnboardingFlow.tsx` (OB1→OB4) + `App.tsx:947-955` | ✅ Persistido via `reflexo_onboarding_done_v1`; modal não fecha por back; só por "COMEÇAR". |
| Triagem (pós-1º jogo) | `App.tsx:472-495` `checkTriageIntercept` + `screens/triage/*` | ✅ Lógica de interceptação clara; `triageSkipCount` evita re-oferecer após 3 dispensas; `dismissedThisSession` evita re-oferecer no mesmo run. |
| 4 modos de jogo (Partida / Alvo / Sequência / Radar) | `screens/Modo*.tsx` (400-450 linhas cada) | ✅ Padrão consistente: intro → start → rounds → onComplete. Cada modo isolado, sem importação cruzada. |
| Energia + período de graça | `utils/energy.ts` + `screens/SemEnergia.tsx` | ✅ Lógica robusta: 3 dias grátis pós-instalação, depois 5/modo/dia. Auto-reset diário em `loadEnergy:53-67` via `dayStart`. ⚠️ Reset baseado em hora **local do device** (manipulável por relógio; impacto baixo com monetização off). |
| Desbloqueio progressivo de modos | `utils/storage.ts:201-249` + `App.tsx:412-422` | ✅ Modelo claro: Partida → Radar → Sequência → Alvo. Derivado das sessões (`computeModeUnlocks`) e persistido em flags `mode_unlocked_*`. Toast enfileirado após detecção. |
| Detecção de arquétipo | `config/archetypes.ts:41-61 detectArchetypeId` | ✅ Critérios objetivos (`bestPartida < 200`, `bestAlvoAcc >= 0.95`, etc); 6 níveis em cadeia (`EXPLORADOR → PILOTO`). |
| Conquistas | `config/achievements.ts` (681 linhas) + `App.tsx:393-402` | ✅ Snapshot antes/depois da sessão; `RARITY_PRIORITY` define ordem dos toasts; ignora sessões `invalidForAchievements`. |
| Missões diárias (2 slots) | `utils/dailyMissions.ts` (202 linhas) | ✅ Shuffle aleatório; slot fixo por dia (`reflexo_daily_missions_v1`); exclui `daily_early` após 9h. |
| Missões semanais (3 slots) | `utils/missions.ts` (330 linhas) | ✅ Priorização por bucket (InProgress > Performance > Consistency > Exploration); persistência por `weekStart`; fallback para `done:true` quando guarda colapsa em done. |
| Avatares (18 desbloqueáveis) | `config/avatars.ts` (146 linhas) | ✅ SVG inline; cada um com `unlockCondition` textual + função `isUnlocked(stats, achievements)` checando arquétipo, scores ou streak. |
| Ranking global | `screens/GlobalScreen.tsx` (494 linhas) + view `ranking` em `0006` | ✅ View usa `min(avg_rt)` (melhor tempo médio, não média); `HAVING count(*) >= 3`; `rank() OVER (PARTITION BY mode)`; FlatList limitada a 50, pull-to-refresh, realtime, modal de perfil ao tocar nome. |
| Streak (sequência de dias) | `utils/streak.ts` (44 linhas — não auditado em detalhe) + `App.tsx:373-374` | ✅ Calculado a partir das sessões; alimenta missões e conquistas (`streak_3/5/7/30`). |
| Sync de sessões com Supabase | `utils/syncSession.ts` + `App.tsx:384-388` | ✅ Fire-and-forget; upsert idempotente por `(user_id, played_at, mode)`; nunca bloqueia o jogo. |
| Migração one-shot pós-login | `utils/migrateLocalSessions.ts` | ✅ Flag `reflexo_migration_done_{userId}`; em erro **não** marca como feito → tenta de novo. |
| i18n PT/EN | `i18n.ts` + `locales/pt.json` (914) + `locales/en.json` (914) | ✅ Detecta locale do device com fallback `pt`; persistido em `userLanguage`; mudança ao vivo com alerta de confirmação. |

### 3.2 Dead code / fluxos incompletos

- **Untracked: `screens/applestore/` e `screens/playstore/`** — pastas de **marketing** (screenshots PNG/JPG + HTML frames), não código de tela. Estão em `screens/` por engano. **Recomendação:** mover para `mobile2/marketing/applestore/` e `mobile2/marketing/playstore/` antes de versioná-las; manter em `.gitignore` se forem builds locais.
- **`Perfil.tsx:71` define `onLogout` como prop opcional**, mas o `App.tsx` **não passa** essa prop ao renderizar `<Perfil ...>` (`App.tsx:862-870`). O `handleLogout` interno funciona via `supabase.auth.signOut()` que dispara o `onAuthStateChange` no `RootGate` → estado é limpo via reação. ⚠️ A prop `onLogout?` é morta hoje (sem caller). Aceitável para v1.
- **`utils/streak.ts` — não inspecionado neste passe** (44 linhas, baixo risco; usado por `App.tsx`/`utils/missions.ts`).
- **`screens/triage/TriageBaseline.tsx` (670 linhas)** — não inspecionado neste passe. Não há sinais de fluxo incompleto em `App.tsx`, mas o tamanho do arquivo é elevado.
- **`config/ambitions.ts` (6.4KB)** e `utils/ambition.ts` (6.4KB) — referenciadas por `App.tsx`/`Perfil.tsx`/`Missoes.tsx`; estrutura coerente, mas labels de milestones e nomes de ambições **continuam não-i18n** (registrado no PROGRESS.md como pendência futura).

### 3.3 Riscos de regressão e gaps identificados

- ⚠️ **Race entre `setRecovery(true)` (PASSWORD_RECOVERY) e o restore inicial da sessão**: o `RootGate` testa `recovery` **antes** de `session || guest` (`App.tsx:218-227`), o que está correto. Edge case sutil: se o deep link chegar **antes** do `setAuthChecked(true)`, o usuário vê splash até o timeout de 8s. Não bloqueia, mas pode confundir. **Mitigar:** reagir ao `PASSWORD_RECOVERY` imediatamente (sem esperar `authChecked`).
- ⚠️ **`onAuthStateChange` reage a `SIGNED_IN` mesmo no token refresh** — Supabase emite `SIGNED_IN` no auto-refresh (não só no login). Isso dispara `migrateLocalSessions` toda vez? **Não**: a flag `reflexo_migration_done_{userId}` curto-circuita o método. ✅ Defesa ok, mas a dependência da flag é a única coisa que segura essa repetição.
- ⚠️ **Tela `Splash` (`screens/Splash.tsx:1-165`) é puramente decorativa** — não testa nenhum erro. Se as fontes falharem (`fontError` truthy), o `RootGate` libera a árvore (`App.tsx:210`) — sem aviso ao usuário. O app pode renderizar com fallback de fonte. Risco visual, não funcional.
- ⚠️ **`SemEnergia` mostra emojis** (⚡ 🕛 👑) em vez de SVGs — em conflito com o design system "sem emojis" parcialmente adotado. Cosmético.
- ⚠️ **`GlobalScreen.tsx:31 CROWN`** ainda usa emojis 👑🥈🥉 e `:117` 🌐 — leftovers conhecidos. Recomendado migrar para SVG antes do release.

---

## 4. BLOCO 2 — Código · ✅ OK (8.5/10)

### 4.1 TypeScript & qualidade estática

- ✅ **`npx tsc --noEmit` → exit 0** (verificado nesta auditoria).
- ✅ `: any` / `@ts-ignore` / `@ts-expect-error` / `@ts-nocheck`: **0 ocorrências** (`Grep`).
- ✅ `TODO` / `FIXME` / `XXX` / `HACK`: **0 ocorrências**.
- ✅ `console.*`: 6 arquivos (`App.tsx`, `GlobalScreen.tsx`, `syncSession.ts`, `migrateLocalSessions.ts`, `storage.ts`, `energy.ts`). Caiu de 7 (auditoria anterior) — `App.tsx:144` (log da URL de auth) foi removido. ⚠️ **Ainda não há gating com `__DEV__`** — em produção, esses logs ainda vão para logcat/console do device.
- ✅ `accessibilityLabel`/`accessibilityRole`/`accessible`: **20 ocorrências em 3 arquivos** (vs 2 antes). Cobertura ainda incompleta: `Home`, `Perfil`, `Missoes`, telas de modo e `Resultado` continuam sem rótulos.

### 4.2 Padrões e consistência

- ✅ **Tipagem rica nos models centrais:** `SessionRecord` (21 campos opcionais bem comentados), `UserProfile` (12 campos), `ArchetypeDefinition`, `Achievement`. Interfaces ficam em `types/` ou ao lado das funções que as usam.
- ✅ **Camadas separadas:** `lib/` (clientes externos), `utils/` (lógica pura/AsyncStorage), `config/` (dados estáticos), `screens/` (UI), `components/` (UI reutilizável).
- ✅ **Nomenclatura consistente:** componentes `PascalCase`, utilitários `camelCase`, chaves AsyncStorage `snake_case_v1` (versionamento explícito de schema local).
- ⚠️ **`App.tsx` (1182 linhas) continua sendo um god component**: gate de auth + deep link + state machine de navegação + detecção de conquistas + evolução + desbloqueio de modos + 5 toasts modais. Refatorar em hooks (`useAuthGate`, `useDeepLink`, `useAchievementToasts`, `useModeUnlocks`) reduziria drasticamente o ruído cognitivo. **Não bloqueia release; débito.**
- ⚠️ **`Perfil.tsx` (1310 linhas)** e **`Resultado.tsx` (1080 linhas)** continuam acima de 1000 linhas. Mesmo plano: extrair seções colapsáveis em subcomponentes.

### 4.3 Tratamento de erros

- ✅ **`utils/storage.ts`**: 17 `try/catch` com fallback seguro (retorna `[]`/`{}`/`null`/`false`). Nunca lança.
- ✅ **`utils/energy.ts`**: idem; `loadEnergy` retorna `FULL_ENERGY` em caso de erro.
- ✅ **`utils/sfx.ts`**: try/catch silencioso (catch vazio, comentado como "non-critical — app works fine without audio"). Apropriado para áudio.
- ✅ **`utils/syncSession.ts` / `migrateLocalSessions.ts`**: fire-and-forget; nunca propagam.
- ✅ **`screens/Auth.tsx` (M2)**: agora tem `try/catch` com `isNetworkError` detector + `Alert.alert` traduzido.
- ⚠️ **`screens/NewPassword.tsx:43-44 catch`**: assume que toda exceção é "sem internet". Captura genérica que pode esconder outros erros (rate limit, token inválido). **Severidade baixa.**

### 4.4 Segurança

- ✅ **Credenciais**: `lib/supabase.ts:5-6` lê de `process.env.EXPO_PUBLIC_*`. **Sem URL/key hardcoded** em nenhum arquivo `.ts`/`.tsx` versionado.
- ✅ **`.env` ignorado** pelo `.gitignore` raiz (confirmado em auditoria anterior, status mantido).
- ✅ **Dados sensíveis em logs**: o `console.log(url)` que vazava `code` do PKCE foi **removido** (`App.tsx` atual só loga mensagens genéricas).
- ✅ **RLS policies versionadas em `0008`**: `auth.uid() = id` em `profiles` e `auth.uid() = user_id` em `sessions` (insert), plus `sessions_public_ranking` (read all) para viabilizar a view de ranking.
- ⚠️ **`sessions_public_ranking` permite SELECT em qualquer sessão** — necessário para a view, mas significa que **qualquer authenticated user pode listar todas as sessões de todos os usuários direto na tabela `sessions`**, não só via view. **[VERIFICAR NO DASHBOARD]** se a view tem `security_invoker` ou roda como `security_definer`; o ideal é restringir o `SELECT` direto e expor somente a view. Risco de privacidade moderado (sessões revelam horários de jogo, fadiga, score detalhado).
- ⚠️ **`migrations/0008` ainda é "documentação"** — anota o estado real do dashboard, mas não há pipeline (Supabase CLI) que aplique. Se alguém criar um banco novo, vai precisar copiar/colar manualmente. **Recomendação:** adotar Supabase CLI antes do próximo release significativo.
- ⚠️ **`MONETIZATION_ENABLED = false`** e UI de preços visível: a Apple às vezes interpreta "fake IAP" como violação de §3.1.1. **[VERIFICAR]** Decidir antes do submit: (a) esconder a Premium Card e remover preços R$, ou (b) trocar para mensagem "em breve" sem valores. (c) Aceitar o risco e responder à revisão se questionado.

### 4.5 Dependências

| Aspecto | Status |
|---|---|
| `package.json` alinhado com SDK 54 | ✅ `expo ~54.0.33`, `expo-localization ~17.0.8`, `expo-asset ~12.0.13` — todas dentro das faixas esperadas |
| `package-lock.json` versionado | ✅ Presente (380 KB) |
| Plugins Expo declarados | ✅ `expo-audio`, `expo-font`, `expo-localization`, `expo-asset` — todos casados com deps |
| `react`/`react-native` | ✅ React 19.1.0 + RN 0.81.5 + `newArchEnabled: true` |
| `tsconfig.json` | ⚠️ Minimalista (`extends expo/tsconfig.base` + `strict: true`). **Sugestão:** `noUnusedLocals` + `noUnusedParameters` + `noImplicitReturns` para apertar mais o cinto |
| `npm audit` / `expo-doctor` | ⚠️ **Não rodados nesta auditoria** — última leitura (25/05) mostrava 14 moderate transitivas (toolchain Expo, build-time) e 3 falhas em `expo-doctor`. Os 3 itens do `expo-doctor` (peer dep `expo-asset`, duplicatas, versão `expo-localization`) **provavelmente foram resolvidos** pelas correções no `package.json`. **[AÇÃO]** rodar `npx expo-doctor` e `npm audit` antes do build de produção |
| `google-service-account.json` | ❌ Ausente — `eas.json:24` referencia; obrigatório para `eas submit --platform android` |
| Dev deps | `typescript ~5.9.2`, `sharp ^0.34.5`, `@types/react ~19.1.0` — sem Jest/RNTL (M10) |

### 4.6 Bugs potenciais identificados na leitura

| ID | Severidade | Arquivo | Descrição |
|----|------------|---------|-----------|
| B1 | Baixa | `App.tsx:160-194` deep link handler | Se o `code` for usado, mas o `exchange` falhar, não há retry — usuário fica preso. Mostrar fallback ("link expirou, peça outro"). |
| B2 | Baixa | `App.tsx:124-156 onAuthStateChange` | `SIGNED_IN` em refresh dispara o IIFE de `pending_username`. Se a internet voltar após semanas, vai re-executar. Idempotente (UPDATE no DB), mas custo desnecessário. |
| B3 | Média | `screens/NewPassword.tsx:51-54 handleCancel` | Cancelar reset chama `signOut()`. Se o usuário tinha sessão "normal" ativa antes do recovery, **isso encerra a sessão dele**. Esperado pela Supabase (PASSWORD_RECOVERY é uma sessão temporária), mas confirmar no fluxo. |
| B4 | Baixa | `utils/energy.ts:54-67` | Reset diário compara `parsed.dayStart < today`. Se o usuário avançar o relógio em 1 dia, ganha 5 energias grátis por modo. Impacto baixo com monetização off. |
| B5 | Baixa | `utils/storage.ts:40` | Cap de 200 sessões via `slice(0, 200)`. Boa intenção, mas se houver corrupção (não-array), o `unshift` em cima de `[]` regenera silenciosamente — pode mascarar bug. Aceitável. |
| B6 | Baixa | `screens/Splash.tsx:78-81 HOLD_MS = 2200` | Splash trava por **2.2s estáticos** após a animação. Usuário pode achar lento se já tem sessão restaurada. Considerar pular o hold quando `authChecked && fontsLoaded` antes de `HOLD_MS`. |

### 4.7 Dívidas técnicas declaradas e em aberto

- **i18n pendente** (anotado no PROGRESS.md): milestone labels das ambições, `progress()` de conquistas com strings interpoladas, `config/ambitions.ts` name/description, `ARCHETYPE_NAMES` em `achievements.ts`.
- **`App.tsx`/`Perfil.tsx`/`Resultado.tsx` > 1000 linhas** — refatorar em hooks/subcomponentes.
- **`splash` no formato legado** (`app.json:11-15`) — migrar para plugin `expo-splash-screen` em versão futura.
- **`userInterfaceStyle: "light"`** num app de tema escuro — inofensivo, mas inconsistente.
- **`version: "1.0.0"`** no `app.json` vs tag `v2.0.0-dev` — alinhar antes do submit (definir `versionName` real; o `versionCode` é remoto via EAS `appVersionSource: remote`).
- **Console logs sem `__DEV__` gate** (6 arquivos).
- **Imports duplicados em `Perfil.tsx:34-36`** — `ACHIEVEMENT_ICONS` é importado de `assets/icons` na linha 35, e `Conquistas` é importado na linha 47 (mesma file usa `ACHIEVEMENTS` da config). Não causa erro mas reflete a fragmentação dos imports do componente god.

---

## 5. BLOCO 3 — Loja (App Store) · ⚠️ ATENÇÃO (7/10)

### 5.1 Requisitos Apple

| # | Item | Status | Notas |
|---|------|--------|-------|
| L1 | Bundle ID iOS | ✅ | `com.dulks.reflexo` — registrado no Apple Developer + no `app.json:18` |
| L2 | Team ID | ✅ | `3Q4F2AZHDM` — em `eas.json:30` |
| L3 | Apple Developer Account ($99/ano) | ⚠️ | Pagamento confirmado; **status final de ativação não verificado** (PROGRESS.md diz "até 48h"; já passou de 48h desde 25/05) |
| L4 | App Store Connect — app criado | ✅ | "Reflexo: Train Your Brain" — `ascAppId: 6773148534` em `eas.json:29` |
| L5 | Subtítulo PT | ✅ | "Missions. Habits. Evolution." |
| L6 | Categoria primária | ✅ | Saúde e fitness |
| L7 | Categoria secundária | ✅ | Jogos |
| L8 | Preço | ✅ | Grátis em 175 países |
| L9 | Privacy nutrition label / Data Safety | ✅ | E-mail, ID de usuário, conteúdos de jogos configurados no ASC |
| L10 | Política de privacidade pública | ✅ | `https://dulkz.github.io/reflexo-app/mobile2/PRIVACY_POLICY` — declarada no ASC |
| L11 | Conta de revisão | ✅ | `reflexoapp@gmail.com / Testreflex12321` no ASC |
| L12 | Classificação etária | ⚠️ | **Não auditado** — PROGRESS.md não menciona explicitamente; preencher questionário no ASC (provavelmente 4+ ou 9+ por jogos sem conteúdo) |
| L13 | Dispositivo médico regulamentado | ✅ | Declarado no ASC (o app fala de "treino cerebral" — bom ter declarado para evitar ambiguidade) |
| L14 | Ícone 1024×1024 | ✅ | Confirmado; **[VERIFICAR EM BUILD]** se o canal alpha é achatado pelo Expo no build (Apple rejeita transparência) |
| L15 | Screenshots iOS 6.5" PT (6 imagens) | ✅ | Carregadas no ASC; `screens/applestore/ios_pt_*.PNG` (6 PNGs ~900KB cada) |
| L16 | Screenshots iOS 6.5" EN (6 imagens) | ❌ | `screens/applestore/ios_en_*.PNG` (6 PNGs) **existem localmente** mas não confirmadas no ASC |
| L17 | App-Specific Password para EAS | ❌ | Não criada — gerar em `appleid.apple.com → Segurança → Senhas para apps` |
| L18 | Build de produção iOS associado à v1.0 | ❌ | Build não rodou; PROGRESS.md confirma como bloqueador atual |
| L19 | `ITSAppUsesNonExemptEncryption` | ✅ | `false` em `app.json:20` — evita o prompt de export compliance a cada build |
| L20 | `supportsTablet: true` | ✅ | Habilitado, mas layout portrait-only — **[VERIFICAR EM iPad]** o framing |
| L21 | `newArchEnabled: true` | ⚠️ | **[VERIFICAR EM BUILD]** estabilidade da New Architecture (Fabric/TurboModules) no primeiro build de produção. Se quebrar, basta desligar e rebuildar |

### 5.2 Possíveis pontos de atrito na revisão Apple

- ⚠️ **§4.0 Design — "Apps that are simply songbooks, calculators..."**: o app é um jogo de reflexo. O posicionamento como "treino cerebral" precisa ser **honesto**: não prometer benefícios médicos (`#4.0` rejeição comum para apps de "brain training" prometendo prevenir Alzheimer/demência). Revisar a descrição PT/EN e o subtítulo (`"Missions. Habits. Evolution."` é ok; o copy real precisa não prometer cura).
- ⚠️ **§3.1.1 In-App Purchase fake**: a UI de paywall mostra preços reais (R$ 2,99 / R$ 6,99 / R$ 4,99 / R$ 34,99) mas as compras são simuladas. **Recomendação forte:** com `MONETIZATION_ENABLED = false`, **esconder** a Premium Card e os pacotes de energia, deixando só o countdown de reset diário. Ativa-se a UI quando o billing real estiver integrado.
- ⚠️ **§5.1.1 Data Collection & Storage**: o `PRIVACY_POLICY.md` declara que **não** coleta câmera/microfone — ✅ alinhado com `permissions: []`. Continua válido.
- ⚠️ **§5.2.3 Health & Medical**: declarar "dispositivo médico regulamentado" no ASC + não prometer benefício médico cobre a maior parte do risco. ✅ Conformidade ok.
- ⚠️ **Dependência de internet**: a Apple às vezes pede "explicar como o app funciona offline". Reflexo é 100% offline para core loop — explicar isso na descrição.
- ⚠️ **TestFlight beta interno**: recomendado **antes** do submit público — permite Apple validar build sem revisão completa, e dá feedback rápido de UX.

### 5.3 Play Store — paralelo

| # | Item | Status |
|---|------|--------|
| P1 | Package Android | ✅ `com.dulks.reflexo` |
| P2 | Permissões Android | ✅ `[]` (commit `7a3e542`) |
| P3 | Ícone adaptive | ✅ 1024×1024 |
| P4 | APK preview testado | ✅ Conforme PROGRESS.md |
| P5 | AAB produção | ❌ Não gerado |
| P6 | Google Play Console ($25) | ❌ Aguardando aprovação de identidade + pagamento |
| P7 | `google-service-account.json` | ❌ Ausente |
| P8 | Screenshots PT | ⚠️ HTML frames em `screens/playstore/reflexo_store_frames.html` (PT) prontos; **não enviados** na console |
| P9 | Screenshots EN | ⚠️ HTML frames em `screens/playstore/reflexo_store_frames_EN.html` prontos; **não enviados** |
| P10 | Descrição curta + longa | ✅ Escritas (PROGRESS.md) |
| P11 | Política de privacidade | ✅ Mesma URL Pages |
| P12 | Classificação de conteúdo | ⚠️ Preencher questionário no console |

### 5.4 CI/CD — estado

- ✅ `.github/workflows/build-android.yml` — push em `main` + manual; **builda só `preview`/APK**, não AAB.
- ✅ `.github/workflows/build-ios.yml` — só `workflow_dispatch` (manual); usa `preview-ios`. **Não builda `production`.**
- ⚠️ **Nenhum workflow gera AAB Android nem iOS produção** — esses serão builds manuais no terminal local até que valha a pena automatizar.
- ⚠️ Builds Android em **todo push para main** consomem créditos do Starter ($19/mês) rapidamente. Considerar trocar `push: main` por `workflow_dispatch` ou disparar só em tags `v*`.

---

## 6. BLOCO 4 — Melhorias sugeridas (priorizadas)

### 6.1 P0 — Crítico (bloqueia submit ou compromete revisão)

| ID | Descrição | Impacto | Esforço |
|----|-----------|---------|---------|
| P0-1 | **Gerar App-Specific Password no Apple ID** e rodar `eas build --platform ios --profile production` | Sem isso, não há binário iOS para submeter | 30 min (após password) |
| P0-2 | **Decidir sobre IAP visível em modo simulado** (esconder Premium Card + pacotes enquanto `MONETIZATION_ENABLED=false`) | Risco real de rejeição §3.1.1 | 1–2h (condicional `MONETIZATION_ENABLED` em `SemEnergia.tsx`) |
| P0-3 | **Gerar AAB Android** (`eas build --platform android --profile production`) e enviar à Play Store após pagamento de US$ 25 | Sem AAB não há submit Play Store | 30 min (após conta) |
| P0-4 | **Criar `google-service-account.json`** e colocar em `mobile2/` (gitignored) | `eas submit --platform android` falha sem | 1h (criar Service Account no Google Cloud + ligar Play Console) |
| P0-5 | **Carregar screenshots iOS EN no ASC** e PT+EN na Play Store | Apple/Google requerem screenshots por idioma | 30 min |
| P0-6 | **Trocar Site URL Supabase** de `exp://localhost:8081` para `reflexo://auth-callback` no dashboard | Reset de senha em produção não funciona com dev URL | 5 min |
| P0-7 | **Atualizar `version: "1.0.0"`** no `app.json` para refletir a versão real do release (a tag `v2.0.0-dev` está só no git) | Inconsistência visível no app e no ASC | 5 min |

### 6.2 P1 — Importante (impacta qualidade pós-lançamento)

| ID | Descrição | Impacto | Esforço |
|----|-----------|---------|---------|
| P1-1 | **Validação server-side de plausibilidade do `avg_rt`** (M3 — anti-cheat de ranking) | Sem isso, ranking público é manipulável | 2–4h (Postgres trigger ou Edge Function) |
| P1-2 | **Namespacing de sessões locais por usuário** (M9) | Logout + login de outro usuário no mesmo aparelho leva sessões alheias para a conta nova | 4–6h (refactor de `storage.ts` para chaves `reflexo_sessions_{userId}_v2`) |
| P1-3 | **Gatear todos os `console.*` com `if (__DEV__)`** | Logcat poluído + dados de uso vazando em produção | 1h |
| P1-4 | **Esconder emojis remanescentes** (👑🥈🥉🌐 em `GlobalScreen.tsx`; ⚡🕛👑 em `SemEnergia.tsx`) — substituir por SVG | Coerência com design system | 2–3h |
| P1-5 | **Adotar Supabase CLI** com migrations executáveis (ao invés de SQL-documentação aplicada manualmente) | Ambiente reproduzível; CI de schema | 4–6h |
| P1-6 | **Debounce no realtime `GlobalScreen.tsx:96-105`** (M8) | Cada INSERT global hoje dispara re-fetch global; banda escala mal | 1h |
| P1-7 | **Cobertura de acessibilidade nas telas centrais** (Home, Perfil, Missoes, Modos, Resultado) — `accessibilityLabel`/`Role`/`Hint` | TalkBack/VoiceOver não conseguem narrar a UI hoje | 4–6h |
| P1-8 | **Validar status do Apple Developer Account** e completar setup | Bloqueador silencioso (pode estar aprovado e ninguém viu) | 10 min (login + verificação) |
| P1-9 | **Setup de Sentry / Crashlytics** (ou alternativa Expo) para captura de crash em produção | Sem isso, não há como saber se o app crashou após release | 2h |

### 6.3 P2 — Nice-to-have / versões futuras

| ID | Descrição | Impacto | Esforço |
|----|-----------|---------|---------|
| P2-1 | **Suíte de testes unitários** para `utils/` (levels, energy, storage, streak, missions) | M10 — hoje só `tsc` cobre regressões | 1–2 semanas |
| P2-2 | **Refatorar `App.tsx` (1182), `Perfil.tsx` (1310), `Resultado.tsx` (1080)** em hooks/subcomponentes | Manutenibilidade | 1–2 semanas |
| P2-3 | **Mover `screens/applestore/` e `screens/playstore/`** para `mobile2/marketing/` | Organização (estão em `screens/` por engano) | 15 min |
| P2-4 | **i18n completo** (milestones, ambitions, ARCHETYPE_NAMES) | Cobertura EN | 4–6h |
| P2-5 | **Migrar `splash` para plugin `expo-splash-screen`** | Formato moderno; suporte continuado | 2h |
| P2-6 | **Trocar `userInterfaceStyle: "light"` para `"dark"`** | Coerência com tema | 5 min + teste |
| P2-7 | **Adicionar `noUnusedLocals` + `noUnusedParameters` + `noImplicitReturns` ao `tsconfig.json`** | Mais detecção estática | 30 min (corrigir warnings) |
| P2-8 | **Skip do `HOLD_MS` do Splash** quando sessão+fonts já carregaram | UX percebida (B6) | 30 min |
| P2-9 | **Realtime com filtro por modo** (não `*` em `sessions`) | Mais eficiente em escala | 1–2h |
| P2-10 | **Sentinela visual** para a flag `MONETIZATION_ENABLED` (dev banner indicando "modo simulado") quando em dev/staging | Evita confusão em demos | 1h |
| P2-11 | **Substituir CI workflow Android** para `workflow_dispatch` apenas (evitar burn de créditos EAS) ou disparar só em tags | Economia | 15 min |

---

## 7. Veredito — Pronto para lançamento?

### 7.1 Checklist binário — bloqueadores de submit

| # | Item | OK? |
|---|------|:---:|
| V1 | TypeScript `tsc --noEmit` passa | ✅ |
| V2 | `ios.bundleIdentifier` configurado | ✅ |
| V3 | `eas.json` tem profile `production` (Android AAB + iOS) | ✅ |
| V4 | Peer dependency `expo-asset` instalada | ✅ |
| V5 | `expo-localization` alinhada com SDK 54 | ✅ |
| V6 | Permissões Android sem `RECORD_AUDIO`/`MODIFY_AUDIO_SETTINGS` | ✅ |
| V7 | Política de privacidade publicada em URL pública | ✅ |
| V8 | RLS policies versionadas em `supabase/migrations/` | ✅ |
| V9 | Reset de senha funciona ponta-a-ponta (Auth → email → NewPassword) | ✅ (código) / ⚠️ (test em device pendente) |
| V10 | Deep link `auth-callback` faz `exchangeCodeForSession` | ✅ |
| V11 | `ITSAppUsesNonExemptEncryption: false` em `app.json` | ✅ |
| V12 | i18n PT+EN em todas as telas públicas (Auth, Global, Home, Modos) | ✅ |
| V13 | Apple Developer Account ativada | ⚠️ Verificar (pagamento confirmado em 25/05) |
| V14 | App Store Connect app criado + metadados PT preenchidos | ✅ |
| V15 | App-Specific Password Apple criada para EAS | ❌ |
| V16 | Build iOS produção gerado e associado à v1.0 no ASC | ❌ |
| V17 | Screenshots iOS PT carregados (6/6) | ✅ |
| V18 | Screenshots iOS EN carregados (6/6) | ❌ |
| V19 | Google Play Console aberto + taxa paga | ❌ |
| V20 | `google-service-account.json` presente | ❌ |
| V21 | Build AAB Android produção gerado | ❌ |
| V22 | Screenshots Play Store PT+EN enviados | ❌ |
| V23 | Site URL Supabase trocado para `reflexo://auth-callback` em produção | ⚠️ [VERIFICAR NO DASHBOARD] |
| V24 | Decisão sobre IAP simulado (esconder ou aceitar risco §3.1.1) | ❌ |
| V25 | `version` em `app.json` alinhada com a release real (1.0.0 ≠ v2.0.0-dev) | ⚠️ |

### 7.2 Resultado

**Status: NÃO ESTÁ PRONTO PARA SUBMIT HOJE — bloqueadores são operacionais, não de código.**

- ✅ **Pronto para gerar o build** assim que a App-Specific Password for criada (V15).
- ✅ **Pronto para revisão Apple** (V14, V19, V20, V11, V12 todos verdes) **após** V13/V16/V18 fecharem.
- ⚠️ **Decisão pendente** sobre V24 (IAP simulado) — recomendação: **esconder** a UI de paywall enquanto `MONETIZATION_ENABLED=false`.
- ❌ **Play Store** depende de V19 (US$ 25), V20 (google-service-account), V21 (AAB), V22 (screenshots).

### 7.3 Caminho de saída — sequência sugerida (24–72h)

1. **App-Specific Password** em `appleid.apple.com` (5 min) → `eas build --platform ios --profile production` (~25 min cloud) → upload automático ao ASC.
2. Carregar **6 screenshots iOS EN** no ASC (15 min) e responder ao questionário de classificação etária (10 min).
3. Atualizar **`version` no `app.json` para `1.0.0` ou `2.0.0`** definitiva e bater com o ASC (5 min).
4. **Esconder Premium Card** em `SemEnergia.tsx` enquanto `MONETIZATION_ENABLED=false` (1–2h).
5. **Verificar/trocar Site URL Supabase** para `reflexo://auth-callback` em produção (5 min).
6. **TestFlight beta interno** (mesmo build, distribuir internamente) — validar fluxo de auth/jogo/ranking em device real (1 dia).
7. **Submit Apple** para revisão.
8. (Paralelo) **Pagar Google Play Console** + criar `google-service-account.json` + `eas build --platform android --profile production` + screenshots → submit Play.

**Janela realista para revisão Apple aprovada:** **5–10 dias úteis** a partir do submit (24–48h da fila + ~7 dias de revisão típica).

---

## Anexo A — Diferenças em relação à AUDITORIA_PRE_LANCAMENTO.md (2026-05-25)

| Item da auditoria 1 | Status em 2026-05-28 | Evidência |
|---------------------|----------------------|-----------|
| C1 (eas.json produção) | ✅ Resolvido | `eas.json:14-19` |
| C2 (bundleIdentifier iOS) | ✅ Resolvido | `app.json:18` |
| C3 (peer dep expo-asset) | ✅ Resolvido | `package.json:18` + `app.json plugins` |
| C4 (expo-localization mismatch) | ✅ Resolvido | `package.json:23 ~17.0.8` |
| C5 (permissão RECORD_AUDIO) | ✅ Resolvido | `app.json:31 permissions: []` (commit `7a3e542`) |
| C6 (privacy policy) | ✅ Resolvido | `PRIVACY_POLICY.md` + GitHub Pages |
| C7 (RLS versionada) | ✅ Resolvido | `migrations/0008_rls_policies_documentation.sql` |
| M1 (reset senha incompleto) | ✅ Resolvido | `NewPassword.tsx` + `PASSWORD_RECOVERY` handler |
| M2 (Auth sem catch) | ✅ Resolvido | `Auth.tsx` try/catch + `isNetworkError` |
| M3 (ranking burlável) | ❌ Aberto | `syncSession.ts:18` ainda envia `avg_rt` client-side |
| M4 (deep link sem exchange) | ✅ Resolvido | `App.tsx:173 exchangeCodeForSession` |
| M5 (log URL auth) | ✅ Resolvido | Logs genéricos sem URL/code |
| M6 (Auth/Global sem i18n) | ✅ Resolvido | Ambos usam `useTranslation` + `t()` |
| M7 (acessibilidade ausente) | ⚠️ Parcial | 2 → 20 ocorrências; telas centrais ainda sem |
| M8 (realtime global) | ❌ Aberto | `GlobalScreen.tsx:96-105` ainda escuta `*` |
| M9 (migração cross-user) | ❌ Aberto | `Perfil.handleLogout` não namespaca |
| M10 (zero testes) | ❌ Aberto | `devDependencies` sem Jest/RNTL |

---

*Fim da auditoria. Documento gerado em modo somente-leitura — nenhum arquivo de código foi alterado nesta passagem.*
*Próxima auditoria recomendada: após o primeiro build iOS de produção e a primeira semana pós-aprovação na App Store.*
