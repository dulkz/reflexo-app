# Auditoria Técnica Pré-Lançamento — Reflexo App

**Data:** 2026-05-25
**Modo:** Somente leitura (zero edições, zero commits)
**Repositório:** `C:\reflexo-app` · **Projeto:** `mobile2/`
**Stack:** React Native 0.81.5 + Expo SDK 54 · TypeScript 5.9 (strict) · Supabase · AsyncStorage
**Branch/Tag auditada:** `main` @ `v2.0.0-dev`
**Auditor:** Claude Code (Opus 4.7)

> ⚠️ **Aviso de escopo:** auditoria estática + ferramentas (tsc, npm audit, expo-doctor, leitura
> de código e migrations). **Não** foi possível inspecionar o estado real do dashboard Supabase
> (RLS habilitada? policies?), nem rodar um build EAS, nem testar em device. Itens que dependem
> dessas verificações estão marcados com **[VERIFICAR NO DASHBOARD]** ou **[VERIFICAR EM BUILD]**.

---

## 1. Executive Summary

O Reflexo está **tecnicamente sólido como código** (TypeScript strict com **0 erros** de `tsc`,
nenhum `any` explícito, nenhum `TODO/FIXME`, tratamento de erro consistente nos utilitários,
arquitetura offline-first bem desenhada). Porém **não está pronto para submissão às lojas** sem
resolver um conjunto de bloqueadores de **configuração e operação**, não de lógica.

Os bloqueadores não estão no jogo em si — estão na **embalagem**: falta o profile de build de
produção (`eas.json` só tem `preview`/APK), falta `bundleIdentifier` iOS, falta política de
privacidade, há uma **permissão de microfone declarada e nunca usada**, uma **dependência peer
ausente** (`expo-asset`) que pode causar crash em build standalone, e as **RLS policies do
Supabase não estão versionadas** (risco de integridade/privacidade do ranking).

Em funcionalidades, o offline-first e o ranking estão corretos e bem implementados, mas há duas
lacunas reais: **reset de senha não tem tela para definir a nova senha** (o fluxo está
exposto na UI mas não se completa) e o **deep link de auth não troca o code por sessão**.

**Veredito:** pronto para **beta fechado via APK** hoje. Para **lojas públicas**, estimo
**1–2 semanas** de trabalho de configuração/operação (não de reescrita de código) para fechar os
bloqueadores listados na seção 2.

### Score por bloco

| Bloco | Tema | Score | Comentário |
|------:|------|:-----:|------------|
| 1 | Código & qualidade técnica | **7.5 / 10** | tsc limpo, sem `any`, sem TODO; pesa o log de URL de auth e auth sem `catch`. |
| 2 | Arquitetura & dependências | **6.0 / 10** | Estrutura clara, mas `App.tsx`/`Perfil.tsx` gigantes; `expo-doctor` 3 falhas; `eas.json` incompleto. |
| 3 | Funcionalidades & regras de negócio | **6.5 / 10** | Offline-first e ranking corretos; reset de senha incompleto; ranking burlável; RLS não versionada. |
| 4 | UX/UI & design | **6.5 / 10** | Design system consistente, i18n amplo; mas acessibilidade quase ausente e Auth/Global sem i18n. |
| 5 | Infraestrutura & operações | **5.0 / 10** | CI Android existe; faltam profile prod/iOS, privacidade, RLS versionada, backups, testes. |
| **Geral** | | **≈ 6.3 / 10** | Sólido como código; imaturo como produto publicável. |

---

## 2. Checklist de itens CRÍTICOS antes do lançamento

Marque cada item antes de submeter às lojas:

- [ ] **Adicionar `ios.bundleIdentifier`** em `app.json` (ex.: `com.dulks.reflexo`). Sem isso, nenhum build iOS/App Store é possível.
- [ ] **Criar profile `production` no `eas.json`** (Android AAB + iOS). O atual só tem `preview` (APK) — não serve para Play Store nem App Store.
- [ ] **Instalar peer dependency `expo-asset`** (`npx expo install expo-asset`). `expo-doctor` avisa: "Your app may crash outside of Expo Go without this dependency."
- [ ] **Corrigir `expo-localization`** — instalado `55.0.13`, SDK 54 espera `~17.0.8` (major mismatch). Rodar `npx expo install --check`.
- [ ] **Remover permissão `RECORD_AUDIO` / `MODIFY_AUDIO_SETTINGS`** do `app.json` — o app só toca áudio, nunca grava (confirmado em `utils/sfx.ts`). Microfone não usado = justificativa obrigatória na Data Safety e risco de rejeição.
- [ ] **Publicar política de privacidade** (URL pública) — obrigatória nas duas lojas: o app coleta e-mail/auth e declara permissão de microfone.
- [ ] **[VERIFICAR NO DASHBOARD] Confirmar RLS habilitada + policies** nas tabelas `sessions` e `profiles`. As migrations só têm `GRANT`, nenhuma policy. Sem policy de `user_id = auth.uid()`, qualquer usuário autenticado pode ler/inserir sessões de terceiros.
- [ ] **Completar o fluxo de reset de senha** — não existe tela para digitar a nova senha (nenhum `updateUser` no código) nem troca de code por sessão no deep link.
- [ ] **[VERIFICAR NO DASHBOARD] Whitelistar `reflexo://auth-callback`** em Authentication → URL Configuration (produção). Migration `0004` só documenta o passo manual.
- [ ] **Criar conta Apple Developer ($99/ano)** e **Google Play Console (US$25, uma vez)** — pré-requisitos não cobertos pelo plano EAS.
- [ ] **Decidir sobre monetização** — `MONETIZATION_ENABLED = false`: a UI mostra preços (R$ 2,99 etc.) mas as compras são simuladas (test mode). Esconder/ajustar antes de publicar para não confundir/infringir política.

---

## 3. BLOCO 1 — Código e qualidade técnica · **7.5/10**

### 1.1 TypeScript

- **`npx tsc --noEmit` → exit 0. Zero erros, zero warnings.** ✅ Excelente.
- `tsconfig.json` estende `expo/tsconfig.base` com `"strict": true`. Não há flags extras (`noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`) — recomendável ligar para pegar código morto automaticamente.
- **Nenhum `any` explícito** em todo o código (`: any` → 0 ocorrências). ✅
- Asserções `as <Tipo>`: ~48 ocorrências em 32 arquivos, mas são **narrowings controlados** (ex.: `mode as GameScreen` em `App.tsx`, `as const` em configs). Nenhum `@ts-ignore`/`@ts-expect-error`/`@ts-nocheck`. ✅
- Arquivos críticos bem tipados: `lib/supabase.ts`, `utils/syncSession.ts`, `utils/migrateLocalSessions.ts`, `utils/storage.ts` (interface `SessionRecord` rica), `types/user.ts` (`UserProfile`), `screens/GlobalScreen.tsx` (`RankingEntry`).

### 1.2 Qualidade do código

- **`console.*`: 29 ocorrências em 7 arquivos.** A maioria é defensiva (catch de `storage.ts` ×17, `energy.ts` ×4, `syncSession.ts` ×2). Aceitável, mas **deveria ser gateada com `if (__DEV__)`** para não poluir logcat em produção.
  - ⚠️ **`App.tsx:144` — `console.log('[DeepLink] auth-callback recebido:', url)`** loga a URL completa do callback de auth, que em PKCE/implicit **contém o `code`/token**. Isso vaza credencial para os logs do dispositivo. **Remover.** (ver também Bloco 3.1)
  - `utils/migrateLocalSessions.ts:49` — `console.log` de contagem de sessões migradas (benigno, mas gatear).
- **`TODO`/`FIXME`/`HACK`/`XXX`: 0 ocorrências.** ✅ Código limpo de marcadores pendentes.
- **Código morto / imports não usados:** `tsc` strict passa limpo; com `strict` ligado, imports não usados não geram erro (precisaria `noUnusedLocals`). Inspeção manual dos arquivos centrais não encontrou funções órfãs relevantes. `utils/migrateLocalSessions.ts:56 resetMigrationFlag` é usado em `Perfil.tsx:224` ✅.
- **Tratamento de erros:**
  - Utilitários: **muito bom** — todo `storage.ts`/`energy.ts`/`sfx.ts` usa `try/catch` com fallback seguro; `syncSession`/`migrateLocalSessions` são fire-and-forget documentados que nunca lançam.
  - ⚠️ **`screens/Auth.tsx:22-72` — `handleSubmit` tem `try/finally` SEM `catch`.** Se `signInWithPassword`/`signUp`/`resetPasswordForEmail` **lançar** (ex.: sem internet), o erro não é tratado: o `finally` só desliga o loading e a rejeição vira unhandled. O usuário vê o spinner parar **sem mensagem**. (ver Bloco 3.1, edge case "sem internet no login").

### 1.3 Segurança

- **Credenciais:** nenhuma URL/key/token hardcoded fora do `.env`. `lib/supabase.ts:5-6` lê de `process.env.EXPO_PUBLIC_*`. ✅
- **`.env` no `.gitignore`:** ✅ — ignorado pelo `.gitignore` **raiz** (`C:\reflexo-app\.gitignore:22 → .env`), confirmado por `git check-ignore -v .env`. **`.env` não está rastreado** (`git ls-files` não retorna). Observação: o `.gitignore` local de `mobile2/` **não** lista `.env` (só `.env*.local`); funciona pelo arquivo raiz, mas conviria duplicar a regra em `mobile2/.gitignore` por robustez.
- **Dados sensíveis logados:** ver `App.tsx:144` (URL de auth com token) — **principal achado de segurança deste bloco.**
- **AsyncStorage** armazena (chaves em `utils/storage.ts` e `utils/energy.ts`): sessões de jogo, conquistas, missões diárias/semanais, perfil do usuário (`reflexo_user_profile_v1` — nome, ambição, faixa etária, baseline), flags de onboarding/triagem, flags de desbloqueio de modo, energia, data de instalação, flag de convidado (`reflexo_guest`), flags de migração por usuário. **Nada de senha/token de auth** é gravado manualmente — o token de sessão Supabase é gerenciado pelo próprio SDK em AsyncStorage (`lib/supabase.ts:10`). AsyncStorage **não é criptografado**; os dados aqui são de baixa sensibilidade (scores, perfil de jogo), aceitável. O token de auth em AsyncStorage é o padrão do supabase-js e aceitável para o modelo de ameaça de um app de jogo.
- **RLS policies nas migrations:** ❌ **NÃO documentadas.** `0002_ranking_permissions.sql` só concede `GRANT INSERT/SELECT ON sessions TO authenticated` e `GRANT SELECT ON ranking`. **Nenhuma policy `CREATE POLICY ... USING (auth.uid() = user_id)`.** Como `syncSession.ts:16` define `user_id` no payload do cliente, sem RLS adequada um usuário autenticado pode inserir sessões para qualquer `user_id` e ler todas. **[VERIFICAR NO DASHBOARD]** se RLS está habilitada e com policies — se estiver, falta versioná-la; se não estiver, é falha de segurança. (ver Bloco 5.1)
- **Anon key no bundle (`EXPO_PUBLIC_SUPABASE_ANON_KEY`):** **esperado e correto** — a anon key é pública por design no Supabase. O risco real é **depender da RLS** para proteção: com a anon/authenticated key exposta, **toda a segurança recai sobre as RLS policies**. Documentar isso como premissa operacional.

### 1.4 Performance

- **Re-renders:** `App.tsx` é um componente único grande (1139 linhas) com muitos `useState` e vários `useEffect`/`useRef` para animações. Os handlers usam `useCallback` com deps corretas; toasts/animações usam `useNativeDriver: true` ✅. Risco baixo, mas a centralização de estado em `AppInner` faz qualquer mudança re-renderizar a árvore inteira de telas montadas — aceitável dado o tamanho do app, mas é o candidato nº 1 a refatorar (ver Bloco 2.1).
- **FlatList:** apenas 2 no app — `GlobalScreen.tsx:243` (**tem `keyExtractor`** ✅, lista limitada a 50 itens, sem necessidade de `getItemLayout`) e `OnboardingModal.tsx:369` (pager horizontal de poucas telas). As demais listas (Histórico, Conquistas, Missões, Perfil) usam `ScrollView + map` — aceitável dado o volume pequeno (cap de 200 sessões locais).
- **Assets:** `icon.png`/`adaptive-icon.png` 1024×1024 (~31KB cada), `splash-icon.png` 1284×2778 (~88KB), sons `.wav` somam ~145KB. Tudo enxuto. Ícones SVG inline em `assets/icons.ts` (38KB de strings). ✅
- **Bundle size:** **a expectativa de "< 10MB APK" no briefing é irrealista para Expo/RN** — um APK Expo bare gira em **25–60MB** (Hermes + RN runtime + Expo modules). Com **AAB** (Play Store) o usuário baixa um split menor (~15–30MB). Recomendo medir o APK real do primeiro build EAS e usar AAB para reduzir o tamanho percebido.

---

## 4. BLOCO 2 — Arquitetura e estrutura · **6.0/10**

### 2.1 Organização

Estrutura de pastas (limpa e idiomática):
```
mobile2/
├── App.tsx              # state machine (RootGate + AppInner)
├── index.ts, i18n.ts
├── lib/                 # supabase.ts, linking.ts
├── screens/             # telas + onboarding/ + triage/
├── components/          # JourneyMap, LevelBadge, ModeTutorial, TargetShape
├── config/              # archetypes, achievements, ambitions, avatars, monetization
├── utils/               # storage, energy, syncSession, migrateLocalSessions, streak, ...
├── locales/             # pt.json, en.json
├── types/               # user.ts
├── assets/              # icons.ts (SVG), sounds/, logo/, PNGs
├── supabase/migrations/ # 0001..0006 (SQL documentado, aplicado manual no dashboard)
└── scripts/             # generateSounds.js
```
- **Separação de responsabilidades:** boa na camada `utils/`/`lib/`/`config/` (lógica de negócio isolada da UI). **Fraca nas telas:** lógica de negócio mistura-se com UI dentro dos componentes (ex.: detecção de conquistas/evolução/desbloqueio toda dentro de `App.tsx addSession`).
- **Arquivos > 500 linhas** (candidatos a divisão):
  | Arquivo | Linhas |
  |---|---:|
  | `screens/Perfil.tsx` | **1409** |
  | `screens/Resultado.tsx` | **1183** |
  | `App.tsx` | **1139** |
  | `config/achievements.ts` | 681 (dados — ok) |
  | `screens/OnboardingModal.tsx` | 673 |
  | `screens/triage/TriageBaseline.tsx` | 670 |
  | `screens/Home.tsx` | 626 |
  | `screens/Ciencia.tsx` | 588 |
  | `screens/Jornada.tsx` | 569 |
  | `screens/Conquistas.tsx` | 559 |
  - `App.tsx` é um **god component**: faz auth gate, deep link, energia, navegação, detecção de conquistas/evolução/milestone/desbloqueio e renderização de toasts. Recomendo extrair: hooks `useAuthGate`, `useSessionTracking`/`useAchievements`, e um `<ToastLayer/>`.
- **Nomenclatura:** consistente — componentes `PascalCase`, utilitários `camelCase`, chaves de storage `snake_case` com sufixo `_v1` (versionamento de schema local — boa prática). ✅

### 2.2 Dependências

- **`npm audit`: 14 vulnerabilidades moderate (0 high/critical).** **Todas transitivas do toolchain Expo/build-time** (`postcss`, `brace-expansion`, `uuid`←`xcode`, `ws`, `@expo/config-plugins`, `@expo/metro-config`, `@expo/cli`). **Não vão para o bundle de produção.** Corrigir exigiria `expo@56` (breaking). **Risco real baixo;** documentar e reavaliar no upgrade de SDK.
- **`npx expo-doctor`: 15/18 checks passaram, 3 falharam:**
  1. ❌ **Peer dependency ausente: `expo-asset`** (requerida por `expo-audio`). *"Your app may crash outside of Expo Go without this dependency."* → **risco de crash em build standalone.** Corrigir: `npx expo install expo-asset`. **(BLOQUEADOR — ver Bloco 6.1)**
  2. ❌ **Dependências duplicadas:** `expo-asset` (55.0.16 vs 12.0.12) e `expo-constants` (18.0.13 ×2 vs 55.0.15). Native modules duplicados → possíveis erros de build. Deduplicar.
  3. ❌ **Versão fora do esperado pelo SDK:** `expo-localization` instalado **55.0.13**, SDK 54 espera **`~17.0.8`** (**major mismatch**); `expo` 54.0.33 vs `~54.0.34` (patch). O `package.json:22` fixa `"expo-localization": "^55.0.13"` (com `^`, divergindo do padrão `~` dos demais). **(BLOQUEADOR/ALTO — risco de incompatibilidade nativa)**
- **`npm outdated`:** só updates minor/patch dentro do SDK 54 disponíveis — `expo` 54.0.34, `@supabase/supabase-js` 2.106.2, `i18next` 26.2.0, `react-i18next` 17.0.8, `expo-localization` 55.0.15. Coluna "Latest" mostra versões SDK 56 (upgrade breaking, fora de escopo de lançamento).
- **Dependências não utilizadas:** não detectadas — todas as deps de runtime são usadas (supabase, async-storage, svg, haptics, audio, linking, localization, i18next, fonts, safe-area, url-polyfill). `devDependencies`: `sharp` é usada por `scripts/generateSounds.js`/geração de assets.

### 2.3 Configurações

- **`app.json`:**
  - ✅ `name`, `slug`, `version` (1.0.0), `scheme: reflexo`, `orientation: portrait`, `icon`, `splash`, `android.package: com.dulks.reflexo`, `extra.eas.projectId`, `owner`.
  - ❌ **Falta `ios.bundleIdentifier`** — `ios` só tem `supportsTablet: true`. **Bloqueador para qualquer build iOS.**
  - ⚠️ **`version: "1.0.0"`** diverge da tag `v2.0.0-dev`. Definir a versão real antes de publicar.
  - ⚠️ **`splash` no topo é o formato legado** — SDK 54 recomenda o plugin `expo-splash-screen`. Funciona, mas é deprecated.
  - ⚠️ `userInterfaceStyle: "light"` num app de tema escuro (#0A0F1E) — inofensivo, mas inconsistente; considerar `"dark"` ou `"automatic"`.
  - ⚠️ `permissions: [RECORD_AUDIO, MODIFY_AUDIO_SETTINGS]` — **não usadas** (ver Bloco 5.4).
  - `newArchEnabled: true` (New Architecture/Fabric ligado) — todas as deps nativas suportam, mas **[VERIFICAR EM BUILD]** estabilidade no primeiro build de produção.
  - Sem `expo-updates`/`runtimeVersion` (sem OTA) — ok para v1.
- **`eas.json`:** ❌ **Incompleto.** Só existe o profile `preview` (`android.buildType: apk`). **Faltam `production` (AAB Android + iOS) e `development`.** `appVersionSource: remote`, `cli >= 16` ✅. **Bloqueador para lojas.**
- **`metro.config.js`:** ✅ A correção `config.resolver.unstable_enablePackageExports = false` está **documentada** com comentário explicando o motivo (Hermes não suporta `import()` dinâmico do ESM do supabase-js 2.x). Boa prática.
- **`tsconfig.json`:** `strict: true` ✅. Minimalista — considerar `noUnusedLocals`/`noUnusedParameters`.

---

## 5. BLOCO 3 — Funcionalidades e regras de negócio · **6.5/10**

### 3.1 Fluxo de autenticação

- **Estados (RootGate em `App.tsx:97-186`):** `splash → (session | guest) ? AppInner : AuthScreen`.
  - **Logado:** `supabase.auth.getSession()` retorna sessão → `AppInner isGuest={false}`.
  - **Convidado:** flag `reflexo_guest === 'true'` no AsyncStorage → `AppInner isGuest={true}` (ranking bloqueado).
  - **Não-logado:** sem sessão e sem flag → `AuthScreen`.
  - Restauração paralela de sessão+flag na inicialização (`App.tsx:111-120`) com `.catch` e **timeout de segurança de 8s** (`App.tsx:160-166`) ✅.
  - `onAuthStateChange` reage a `SIGNED_IN` (dispara migração one-shot) e `SIGNED_OUT` (zera guest em memória) ✅.
- **Logout (`Perfil.tsx:224-226`):** `resetMigrationFlag(user.id)` → `AsyncStorage.removeItem('reflexo_guest')` → `supabase.auth.signOut()`. Limpa os estados certos de sessão/guest/migração. ✅ **Não** chama `clearUserData()` — sessões locais permanecem (by design, offline-first).
  - ⚠️ **Risco em device compartilhado:** as sessões locais **não são namespaced por usuário**. Como o logout reseta a flag de migração e a primeira login de qualquer usuário migra **todas** as sessões locais, **as sessões do usuário A acabam migradas para a conta do usuário B** no mesmo aparelho. Privacidade/integridade — moderado (baixo impacto em uso single-user típico).
- **Deep link (`scheme: reflexo`, `lib/linking.ts`):**
  - ❌ **O handler em `App.tsx:137-157` só faz `console.log(url)` — não chama `exchangeCodeForSession`** e o cliente está com `detectSessionInUrl: false` (`lib/supabase.ts:13`). O comentário assume que `onAuthStateChange` dispara `SIGNED_IN` sozinho, o que **não acontece** nessa configuração.
  - **Confirmação de e-mail:** funciona mesmo assim — o link de confirmação é verificado **server-side** pelo Supabase antes do redirect; o usuário confirma e depois faz login com senha (o app instrui isso em `Auth.tsx:63-67`). ✅
  - ❌ **Reset de senha: não se completa.** Não há `updateUser({ password })` em lugar nenhum (grep → 0 ocorrências) e nenhuma tela para digitar a nova senha. O `AuthScreen` modo `reset` só **envia** o e-mail (`Auth.tsx:26-36`). Ao clicar no link, o app abre, loga a URL e... nada. **Funcionalidade exposta na UI ("Esqueci minha senha") mas inoperante.** (Bloco 6.2)
- **Edge cases não tratados:**
  - ❌ **Sem internet no login/cadastro:** `Auth.tsx handleSubmit` não tem `catch` → sem feedback ao usuário (ver Bloco 1.2).
  - **Token expirado:** `autoRefreshToken: true` + `persistSession: true` (`lib/supabase.ts:11-12`) cuidam do refresh ✅.
  - **Validação de input:** só `if (!email)`/`if (!password)`; sem validação de formato de e-mail nem força de senha no cliente (Supabase valida min 6 server-side e retorna erro). Aceitável.

### 3.2 Sincronização com Supabase

- **Caminho de uma sessão:** jogo → handler (`handlePartidaComplete`/`handleAlvoComplete`/...) → `addSession()` (`App.tsx:330`) → `saveSession()` local (AsyncStorage) → **se logado**, `syncSessionToSupabase(session, userId)` fire-and-forget (`App.tsx:342-346`) → `supabase.from('sessions').upsert(...)`. ✅ Bem desenhado: salva local primeiro, sync é oportunista e nunca bloqueia.
- **Migração one-shot (`utils/migrateLocalSessions.ts`):** flag `reflexo_migration_done_{userId}` ✅; só migra se ainda não migrou; em erro **não** marca como feito (re-tenta no próximo login) ✅; upsert em lote com `ignoreDuplicates`. Lógica correta.
- **Constraint UNIQUE:** `0001_sessions_unique_constraint.sql` → `UNIQUE (user_id, played_at, mode)`, e o upsert usa `onConflict: 'user_id,played_at,mode'` em `syncSession.ts:23` e `migrateLocalSessions.ts:37`. **Coerente e idempotente.** ✅
- **Falha silenciosa:** sync e migração são **fire-and-forget sem retry** (documentado). Se o Supabase recusar (ex.: RLS), o erro vira `console.warn` e a sessão **nunca** chega ao servidor — sem fila de re-tentativa além do "próximo login" para a migração. Para o ranking, uma sessão perdida = não conta. Aceitável para v1, mas é a fonte nº 1 de "minha sessão não apareceu no ranking".

### 3.3 Ranking

- **View `ranking` (`0006_ranking_view_min_avg_rt.sql`):** ✅ usa **`round(min(s.avg_rt))`** (melhor tempo médio, corrigido no PR #11), **`HAVING count(*) >= 3`** (mínimo de 3 sessões), `rank() OVER (PARTITION BY mode ORDER BY min(avg_rt))`. Junta `profiles` para `username`/`archetype`/`pinned_achievements`. Regra de negócio correta.
- **Consumo no cliente (`GlobalScreen.tsx:61-66`):** `select(...).eq('mode', m).order('avg_rt_global').limit(50)`. ✅ `FlatList` com `keyExtractor` por `user_id`.
- **Realtime (`GlobalScreen.tsx:94-103`):** canal `ranking-realtime` escuta `postgres_changes` `event: '*'` na tabela **`sessions`** e faz re-fetch silencioso. **Funciona**, porém ⚠️ **escuta TODAS as mudanças globais de `sessions`** — cada insert de qualquer usuário dispara re-fetch em todos os clientes conectados. Custo de banda/quota cresce com a base (ver Bloco 5.1). Considerar debounce ou escutar só a `view`/filtro por modo.
- **Degradação graciosa (Supabase fora do ar):** `fetchRanking` tem `try/catch` → loga e mantém lista vazia → `ListEmptyComponent` "Nenhum resultado ainda" (`GlobalScreen.tsx:257-263`). ⚠️ **Não distingue "sem dados" de "erro/offline"** — usuário offline vê a mesma mensagem de lista vazia. UX melhorável (mensagem de erro/retry).
- ⚠️ **Integridade do ranking (cheating):** o `avg_rt` é **definido pelo cliente** no payload do upsert (`syncSession.ts:18`). Mesmo **com** RLS `user_id = auth.uid()`, um usuário pode submeter `avg_rt` arbitrário (ex.: 1ms) para a própria conta e dominar o ranking. **Não há validação server-side de plausibilidade.** Risco real de manipulação do ranking público. (Bloco 6.2)

### 3.4 Offline-first

- **100% offline:** jogo, histórico, missões, conquistas, perfil, energia, desbloqueio de modos — **tudo roda só com AsyncStorage** (`utils/storage.ts`, `energy.ts`, `missions.ts`, `dailyMissions.ts`, `userProfile.ts`). ✅ Forte ponto do app.
- **Cap de 200 sessões:** ✅ `storage.ts:40` → `JSON.stringify(all.slice(0, 200))`. Mantém as 200 mais recentes (unshift no topo). Observação: o **servidor não tem pruning** — acumula todas as sessões para sempre (ver Bloco 5.1 crescimento de DB).
- **O que falha silenciosamente sem internet:**
  - Ranking (aba Global) — lista vazia.
  - Sync de sessões — fica só local até o próximo momento online (sem fila de retry ativa).
  - Login/cadastro/reset — sem feedback de erro (Bloco 1.2/3.1).
  - **Nada disso quebra o core loop** (jogar) — degradação aceitável.

---

## 6. BLOCO 4 — UX/UI e Design · **6.5/10**

### 4.1 Design System

- **Cores:** consistentes com o sistema aprovado — `#0A0F1E` (bg), `#00E5CC` (accent), cards `#0D1530`/`#1E2D4A`, cores por modo. Verificado em `Auth.tsx`, `GlobalScreen.tsx`, telas. ✅
- **Fontes:** `BebasNeue_400Regular`, `DMSans_400Regular`, `DMSans_500Medium`, `SpaceMono_400Regular` carregadas centralmente via `useFonts` em `RootGate` (`App.tsx:102-107`), com splash segurando até `fontsLoaded` ✅. Usadas em todas as telas.
- **i18n:** **amplo — 662 chamadas `t()` em 28 arquivos.** `locales/pt.json` e `en.json` (785 linhas cada) com namespaces `common`, `home`, `modes`, `energy`, etc. ✅
  - ❌ **`screens/Auth.tsx` e `screens/GlobalScreen.tsx` têm 0 chamadas `t()`** — strings 100% **hardcoded em português** ('Erro ao entrar', 'GLOBAL', 'Faça login para ver o ranking', 'Nenhum resultado ainda', 'TEMPO MÉDIO', etc.). Usuários em inglês veem essas telas em PT. **Lacuna de i18n a fechar.**
- **Telas pequenas/grandes:** uso de `react-native-safe-area-context` (`useSafeAreaInsets`) ✅; layouts com `flex`/`ScrollView`/`KeyboardAvoidingView` (`Auth.tsx:77-84`). **[VERIFICAR EM DEVICE]** não há evidência de teste específico em iPhone SE (~375px) nem tablet; `app.json ios.supportsTablet: true` mas o layout é portrait-only — revisar em telas grandes.

### 4.2 Acessibilidade — **ponto fraco**

- ❌ **`accessibilityLabel`/`accessibilityRole`/`accessible`: apenas 2 ocorrências, todas em `components/ModeTutorial.tsx`.** O resto do app (botões `TouchableOpacity`, ícones SVG, abas de navegação, cards de ranking) **não tem rótulos de acessibilidade.** Leitores de tela (TalkBack/VoiceOver) não conseguem descrever a UI. Lacuna significativa.
- **Contraste:** ciano `#00E5CC` sobre `#0A0F1E` → ratio ≈ **11:1** (excelente, passa WCAG AAA). Mas textos secundários `#4A5568`/`#7A8BAA` sobre `#0A0F1E`/`#0D1530` ficam em ~**3–4:1** — abaixo de AA (4.5:1) para texto pequeno. Revisar labels pequenos (ex.: `GlobalScreen` `statLabel` #4A5568 fontSize 9).
- **Tamanhos de toque:** a tab bar considera o mínimo (`App.tsx:1034` comenta "minHeight 44 garante área de toque ≥ 44×44pt") ✅. Mas vários `TouchableOpacity` menores (chips de modo, botões "voltar" textuais `←`) podem ficar < 44px — **[VERIFICAR EM DEVICE]**.
- **Ícones de bandeira como botão de idioma** (`Home.tsx:188/195`, `Perfil.tsx:475/482`) sem `accessibilityLabel`.

### 4.3 Navegação e fluxos

- **Fluxos mapeados:** Splash → (Auth | Guest) → Onboarding (1ª vez) → Home (4 abas: Jogar/Global/Missões/Perfil) → modo de jogo → Resultado → (triagem após 1º jogo). Evolução de arquétipo e desbloqueio progressivo de modos via toasts enfileirados (`App.tsx:273-284`). State machine clara (`activeTab` + `gameScreen`).
- **Dead ends:** não encontrados nos fluxos principais; botão "voltar" presente nas telas de modo (`ModoPartida/Alvo/Radar/Sequencia` usam `← `). Guest na aba Global vê wall com CTA implícito de login.
- **Estados de loading:** ✅ `ActivityIndicator` em `Auth.tsx` (botão) e `GlobalScreen.tsx` (lista + RefreshControl). Sync/save são fire-and-forget (sem spinner, por design).
- ⚠️ **Emojis remanescentes** (apesar do GRUPO 6 marcar "substituir emojis por SVG" como concluído): `GlobalScreen.tsx:30` 👑🥈🥉 (coroas/medalhas), `:115` 🌐 (globo); bandeiras 🇧🇷🇺🇸 em `Home.tsx`/`Perfil.tsx`; ⚡/🕛 em `SemEnergia.tsx`. As bandeiras são defensáveis (seletor de idioma); coroas/globo no Global são leftovers. Cosmético.

---

## 7. BLOCO 5 — Infraestrutura e operações · **5.0/10**

### 5.1 Supabase

- **Plano atual:** **[VERIFICAR NO DASHBOARD]** — presumido **Free tier**.
- **Limites Free (valores atuais aproximados — confirmar no dashboard, mudam com frequência):** ~500 MB de banco, ~5 GB de egress/mês, ~1 GB de storage, 50.000 MAU, ~200 conexões realtime concorrentes, **sem backups automáticos**, e **o projeto é pausado após ~7 dias de inatividade**. *(O briefing citou "2GB bandwidth/50MB storage" — provavelmente desatualizado; usar o dashboard como fonte.)*
- **Backups:** ❌ **Free não tem backup automático.** Para um app com dados de usuário (ranking, perfis), **isso por si só justifica o Pro** ($25/mês, backups diários 7 dias) antes de um lançamento sério.
- **Crescimento de DB:** cada linha de `sessions` é pequena (~150–200 B). Estimativa: 10.000 usuários × 100 sessões ≈ 1M linhas ≈ **~200 MB** — dentro de 500 MB, mas **sem pruning server-side** o crescimento é ilimitado no tempo. Planejar retenção/agregação.
- **Realtime:** o canal global em `sessions` (Bloco 3.3) pode estourar **mensagens realtime** e banda em escala. Mitigar com debounce/filtro.
- **RLS policies por tabela:** ❌ **Não versionadas.** As migrations (`supabase/migrations/0001..0006`) são **notas de "aplicado manualmente no dashboard"** — **o schema das tabelas `sessions` e `profiles`, o `ENABLE ROW LEVEL SECURITY` e as policies NÃO estão no repositório.** Riscos: (1) **[VERIFICAR NO DASHBOARD]** se RLS está realmente ativa; (2) ambiente não reproduzível a partir do código; (3) sem rastro de auditoria de quem pode ler/escrever o quê. **Recomendação forte:** migrar para Supabase CLI com migrations executáveis e policies versionadas.
  - Tabelas inferidas: `sessions` (user_id, mode, avg_rt, rounds_completed, accuracy, played_at) e `profiles` (id, username, archetype, pinned_achievements). Trigger `handle_new_user` (`0005`) cria profile no signup (`security definer`, `on conflict do nothing`) ✅.

### 5.2 Expo / EAS

- **Plano atual:** **EAS Starter ($19/mês)** — informado no briefing.
- **Cobertura iOS:** EAS **builda iOS na nuvem** (não precisa de Mac), **mas** exige **conta Apple Developer ($99/ano)** para assinar/distribuir — **não incluída no EAS**. Hoje **falta o profile iOS no `eas.json` e o `bundleIdentifier` no `app.json`** (Bloco 2.3) — iOS não é buildável no estado atual.
- **GitHub Actions:** ✅ `.github/workflows/build-android.yml` — dispara em push para `main` + manual, usa `expo/expo-github-action`, injeta secrets (`EXPO_TOKEN`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`), roda `eas build --platform android --profile preview`.
  - ⚠️ **Builda `preview` (APK), não produção (AAB).** Não produz artefato de Play Store.
  - ⚠️ **Dispara em todo push para `main`** → consome créditos/fila de build do Starter rapidamente. Considerar trocar para `workflow_dispatch`/tags.
  - Sem job de iOS.

### 5.3 Git e versionamento

- **`.gitignore`:** ✅ cobre `node_modules`, `.expo/`, `dist/`, `web-build/`, `*.jks/*.p8/*.p12/*.key` (segredos de assinatura), `*.pem`. `.env` coberto pelo `.gitignore` raiz (Bloco 1.3).
- **Branches/commits:** convenção `fix:`/`feat:`/`chore:` seguida (histórico recente coerente). `main` é o branch de produção; tag **`v2.0.0-dev` aponta para o HEAD** (`e26e50a`) ✅ — mas a `version` do `app.json` ainda é `1.0.0` (alinhar).
- ❌ **Zero testes automatizados.** `devDependencies` só tem `typescript`, `sharp`, `@types/react` — **sem Jest, sem React Native Testing Library, sem E2E.** Cobertura 0%. A garantia de qualidade hoje é só `tsc` + teste manual. Para um app com lógica de scoring/energia/ranking, recomendo ao menos testes unitários de `utils/` (levels, energy, storage, streak, missions).

### 5.4 Preparação para as lojas

- **App Store (iOS):** ❌ falta `ios.bundleIdentifier`; ❌ falta profile iOS no `eas.json`; ❌ falta conta Apple Developer. Ícone 1024×1024 ✅ **porém `icon.png` tem canal alpha** — a App Store rejeita ícone com transparência; o Expo normalmente achata o alpha no processamento, mas **[VERIFICAR EM BUILD]**.
- **Play Store (Android):** `package: com.dulks.reflexo` ✅; `versionCode`/`versionName` gerenciados via `appVersionSource: remote` (EAS) ✅; **mas o pipeline gera APK, não AAB** (Play Store exige AAB).
- **Ícones:** `icon.png` 1024×1024 ✅, `adaptive-icon.png` 1024×1024 ✅, `favicon.png` 48×48 ✅.
- **Splash:** `splash-icon.png` 1284×2778 ✅ (formato legado — Bloco 2.3).
- ❌ **Permissões declaradas vs usadas:** `app.json` declara `RECORD_AUDIO` + `MODIFY_AUDIO_SETTINGS`, mas `utils/sfx.ts` **só reproduz** áudio (`createAudioPlayer`, `setAudioModeAsync`, `play`) — **nenhuma API de gravação** (`useAudioRecorder`/`prepareToRecord`/etc. → 0 ocorrências). `RECORD_AUDIO` vem por padrão do `expo-audio`; precisa ser **suprimida** (config do plugin `expo-audio` com `microphonePermission: false`, ou ajustar `android.permissions`). **Microfone não usado dispara declaração de Data Safety e pode causar rejeição/desconfiança.**
- ❌ **Política de privacidade:** não existe URL no projeto. **Obrigatória nas duas lojas** (coleta e-mail/auth; declara microfone). Necessário antes de submeter.
- **Data Safety / App Privacy:** preencher declarando: e-mail e dados de uso (sessões/ranking) coletados; sem rastreamento de terceiros (não há SDK de ads/analytics no `package.json`).

---

## 8. BLOCO 6 — Riscos e recomendações

### 6.1 Riscos CRÍTICOS (bloqueadores de lançamento)

| # | Risco | Evidência | Impacto |
|---|-------|-----------|---------|
| C1 | **Sem profile de build de produção** (só `preview`/APK) | `eas.json` | Impossível gerar AAB/iOS para as lojas |
| C2 | **Sem `ios.bundleIdentifier`** | `app.json:16-18` | Impossível buildar/submeter iOS |
| C3 | **Peer dep `expo-asset` ausente** | `expo-doctor` | *"may crash outside of Expo Go"* — crash em standalone |
| C4 | **`expo-localization` major mismatch** (55.0.13 vs ~17.0.8) | `expo-doctor`, `package.json:22` | Incompatibilidade nativa com SDK 54 |
| C5 | **Permissão `RECORD_AUDIO` não usada** | `app.json:28`, `utils/sfx.ts` | Rejeição/atrito na Play Store; Data Safety |
| C6 | **Sem política de privacidade** | ausente no projeto | Rejeição nas duas lojas |
| C7 | **RLS não versionada / não confirmada** | `supabase/migrations/0002` (só GRANTs) | **[VERIFICAR]** Se inativa: qualquer user lê/insere sessões/perfis alheios |

> **Perda de dados / crash em produção:** C3 (crash standalone), C4 (incompatibilidade nativa) e o
> **risco de migração cross-user em device compartilhado** (Bloco 3.1) são os candidatos a
> incidente em produção. **Sem backups no Supabase Free** (Bloco 5.1) agrava qualquer perda.

### 6.2 Riscos MODERADOS (degradam experiência, não bloqueiam)

| # | Risco | Evidência |
|---|-------|-----------|
| M1 | **Reset de senha não se completa** (sem tela de nova senha / sem `updateUser`) | `Auth.tsx`, `App.tsx:137-157` |
| M2 | **Erro de auth sem internet não é mostrado** (sem `catch`) | `Auth.tsx:22-72` |
| M3 | **Ranking burlável** — `avg_rt` definido pelo cliente, sem validação server-side | `syncSession.ts:18` |
| M4 | **Deep link de auth não troca code por sessão** (`detectSessionInUrl:false` + só `console.log`) | `App.tsx:144`, `lib/supabase.ts:13` |
| M5 | **Log da URL de auth** (vaza code/token em logcat) | `App.tsx:144` |
| M6 | **Auth e GlobalScreen sem i18n** (PT hardcoded) | 0 `t()` nesses arquivos |
| M7 | **Acessibilidade quase ausente** (2 `accessibilityLabel` no app inteiro) | grep |
| M8 | **Realtime global em `sessions`** (banda/quota em escala) | `GlobalScreen.tsx:94-103` |
| M9 | **Migração cross-user em device compartilhado** | `Perfil.tsx:224` + `migrateLocalSessions.ts` |
| M10 | **Sem testes automatizados** (0% cobertura) | `package.json` |

### 6.3 Riscos BAIXOS (nice-to-have / versões futuras)

- 14 vulnerabilidades `npm audit` moderate (toolchain/build-time, fora do bundle).
- Updates minor/patch pendentes (expo 54.0.34, supabase 2.106.2, i18next, etc.).
- `console.*` deveriam ser gateados com `__DEV__`.
- `App.tsx`/`Perfil.tsx`/`Resultado.tsx` > 1000 linhas — refatorar em hooks/componentes.
- Emojis leftover (coroas/globo no Global).
- `splash` no formato legado (migrar para plugin `expo-splash-screen`).
- `version` do `app.json` (1.0.0) ≠ tag (v2.0.0-dev).
- `icon.png` com canal alpha (verificar achatamento no build iOS).
- Reset diário de energia usa hora local do device (manipulável por relógio; impacto baixo com monetização off).
- `userInterfaceStyle: light` num app de tema escuro.
- `tsconfig` sem `noUnusedLocals/noUnusedParameters`.

### 6.4 Custos operacionais estimados

> Valores em USD/BRL aproximados (2026); confirmar nos dashboards. Câmbio ilustrativo.

**Custos fixos para publicar (independente de usuários):**

| Item | Custo | Observação |
|------|-------|------------|
| Apple Developer Program | **US$ 99 / ano** | Obrigatório para App Store (não incluso no EAS) |
| Google Play Console | **US$ 25 (uma vez)** | Taxa única de registro |
| EAS Starter | **US$ 19 / mês** | Já contratado — builds Android+iOS na nuvem |

**Custo mensal por cenário de crescimento:**

| Usuários (MAU) | Supabase | EAS | Total/mês* | Quando mudar |
|---------------:|----------|-----|-----------:|--------------|
| ~100 (beta) | Free ($0)** | Starter $19 | **~$19** | Free aguenta, mas **sem backup** e **pausa por inatividade** |
| ~1.000 | **Pro $25** | Starter $19 | **~$44** | Subir para Pro **antes do lançamento** (backups + sem pausa) |
| ~10.000 | Pro $25 (+ add-ons se egress/realtime estourar) | Starter $19 | **~$44–80** | Monitorar egress/realtime; otimizar o canal realtime global (M8) |

\* Sem contar Apple ($99/ano ≈ $8/mês amortizado) nem eventual gateway de pagamento quando ativar monetização.
\** **Recomendo NÃO lançar publicamente em Free** por causa da ausência de backups e da pausa por inatividade.

**Monetização:** atualmente **desativada** (`config/monetization.ts`: `MONETIZATION_ENABLED=false`, `PREMIUM_ACTIVE=false`). Compras caem em "test mode" e concedem energia grátis (`SemEnergia.tsx:53-90`). **Sem receita prevista** até integrar Google Play Billing / StoreKit. Quando ativar, as lojas retêm ~15–30%.

---

## 9. Roadmap de melhorias pós-lançamento

**Sprint 0 — Bloqueadores (pré-lançamento, ~1–2 semanas):** itens C1–C7 da seção 6.1 + checklist da seção 2.

**Sprint 1 — Robustez de auth & dados (M1, M2, M4, M5, M9):**
- Implementar tela de definição de nova senha + `exchangeCodeForSession`/`updateUser` no deep link.
- Adicionar `catch` com feedback em `Auth.handleSubmit`.
- Remover o `console.log` da URL de auth; gatear todos os `console.*` com `__DEV__`.
- Namespaced de sessões locais por usuário (ou limpar local no logout) para evitar migração cross-user.

**Sprint 2 — Integridade & infra (M3, M8, RLS):**
- Versionar schema + RLS via Supabase CLI; policies `auth.uid() = user_id`.
- Validação server-side de plausibilidade do `avg_rt` (Edge Function/constraint) contra cheating.
- Debounce/filtro no realtime do ranking; retenção/pruning de `sessions`.

**Sprint 3 — Qualidade & alcance (M6, M7, M10):**
- i18n de `Auth.tsx` e `GlobalScreen.tsx`.
- Camada de acessibilidade (`accessibilityLabel`/`Role` em toques e ícones; revisar contraste de labels pequenos).
- Suíte de testes unitários para `utils/` (levels, energy, storage, streak, missions) + smoke tests de navegação.

**Sprint 4 — Manutenção & produto:**
- Refatorar `App.tsx`/`Perfil.tsx`/`Resultado.tsx` em hooks/subcomponentes.
- Migrar splash para plugin `expo-splash-screen`; alinhar versão; deduplicar deps; atualizar minors.
- Integrar billing real quando ativar monetização.

---

## Anexo — Comandos executados

```
npx tsc --noEmit            → exit 0 (zero erros)
npm audit                   → 14 moderate (toolchain Expo, build-time)
npm outdated                → só minors/patches dentro do SDK 54
npx expo-doctor             → 15/18 ok; falham: peer expo-asset, duplicatas, versões (expo-localization)
git ls-files / check-ignore → .env não rastreado e ignorado (raiz)
sharp metadata (ícones)     → icon/adaptive 1024×1024 (com alpha); splash 1284×2778
greps: console.* (29), TODO/FIXME (0), : any (0), accessibility (2), t()/useTranslation (662), MONETIZATION (gates ok)
```

*Fim da auditoria. Documento gerado em modo somente-leitura — nenhum arquivo de código foi alterado.*
