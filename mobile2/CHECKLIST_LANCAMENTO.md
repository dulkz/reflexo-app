---
title: CHECKLIST DE LANÇAMENTO — Reflexo App
project: Reflexo App
generated: 2026-05-28
fontes: PROGRESS.md · AUDITORIA_02_PRE_LAUNCH.md · LAUNCH_INFO.md
objetivo: documento de referência de lançamento (este e futuros projetos)
legenda: "✅ Concluído · ⏳ Em andamento · ⬜ Pendente"
---

# CHECKLIST DE LANÇAMENTO — Reflexo App

Documento de referência consolidando o ciclo de lançamento do Reflexo na App Store
(e, em paralelo, na Play Store). Organizado em três fases temporais —
**Pré-lançamento**, **Atual** e **Pós-lançamento** — e, dentro de cada fase, por
categoria: **Técnico · Loja · Marketing · Produto · Infraestrutura**.

> **Identidade:** Reflexo · `com.dulks.reflexo` · scheme `reflexo` · versão `1.0.0` (tag git `v2.0.0-dev`)
> **App Store Connect:** "Reflexo: Train Your Brain" · ascAppId `6773148534` · Team ID `3Q4F2AZHDM`
> **Stack:** React Native 0.81.5 · Expo SDK 54 · TypeScript 5.9 (strict) · Supabase · AsyncStorage

---

## PRÉ-LANÇAMENTO (o que fizemos antes do submit)

Tudo o que foi resolvido até a submissão para revisão da Apple. Reflete o fechamento
dos 7 bloqueadores críticos (C1–C7) e dos itens moderados (M1–M6) da auditoria.

### Técnico
- ✅ **TypeScript `tsc --noEmit` passa com zero erros** — sem `: any`, `@ts-ignore` ou `TODO/FIXME`.
- ✅ **`ios.bundleIdentifier` configurado** — `com.dulks.reflexo` em `app.json` (C2).
- ✅ **Profile `production` no `eas.json`** — Android `app-bundle` (AAB) + bloco `ios` (C1).
- ✅ **Peer dependency `expo-asset` instalada** — `~12.0.13`, listada em plugins (C3).
- ✅ **`expo-localization` alinhada ao SDK 54** — corrigida para `~17.0.8` (C4).
- ✅ **Permissões de áudio removidas** — `android.permissions: []` (commit `7a3e542`) (C5).
- ✅ **Reset de senha completo** — `NewPassword.tsx` + handler `PASSWORD_RECOVERY` (M1).
  - *Obs.:* teste ponta-a-ponta em device real com PKCE ainda recomendado.
- ✅ **Deep link troca code por sessão** — `exchangeCodeForSession` + `flowType: 'pkce'` (M4).
- ✅ **Auth com tratamento de erro de rede** — `isNetworkError()` + alerts traduzidos (M2).
- ✅ **Log que vazava o `code` do PKCE removido** — apenas mensagens genéricas (M5).
- ✅ **i18n PT/EN nas telas públicas** — Auth, GlobalScreen e demais (M6); locales com 914 linhas cada.
- ✅ **`ITSAppUsesNonExemptEncryption: false`** — evita prompt de export compliance a cada build.
- ✅ **Paywall / UI de IAP desativados** — commit `3bfb60c` (App.tsx + SemEnergia.tsx).
  - *Obs.:* mitiga risco de rejeição Apple §3.1.1 (IAP simulado). Código de monetização preservado intacto.

### Loja
- ✅ **App Store Connect criado** — "Reflexo: Train Your Brain", ascAppId `6773148534`.
- ✅ **Bundle ID registrado no Apple Developer** — `com.dulks.reflexo`, Team ID `3Q4F2AZHDM`.
- ✅ **Metadados PT preenchidos** — subtítulo, descrição, palavras-chave, texto promocional, copyright, URL de suporte.
- ✅ **Categorias** — Saúde e fitness (primária) + Jogos (secundária).
- ✅ **Preço** — Grátis em 175 países.
- ✅ **Privacy nutrition label** — e-mail, ID de usuário, conteúdos de jogos declarados.
- ✅ **Conta de revisão configurada** — `reflexoapp@gmail.com`.
- ✅ **Dispositivo médico regulamentado declarado** — cobre risco §5.2.3 (não promete benefício médico).
- ✅ **Ícone 1024×1024 confirmado.**
- ✅ **App-Specific Password Apple criada** — destravou o login EAS para o build de produção.

### Marketing
- ✅ **Descrições da loja escritas** — PT e EN (curta 80 chars + longa 4000 chars).
- ✅ **Frames de marketing** — 8 screenshots PT + 8 EN (`reflexo_store_frames.html` / `_EN.html`).
- ✅ **Screenshots iOS 6.5" PT (6/6)** — carregados no ASC.
- ✅ **Screenshots iPad PT + EN** — geradas e carregadas (2064×2752px).

### Produto
- ✅ **4 modos de jogo** — Partida, Radar, Sequência, Alvo (padrão consistente, isolados).
- ✅ **Sistema de arquétipos, missões (diárias + semanais), conquistas e avatares.**
- ✅ **Ranking global online** — view `ranking` com `min(avg_rt)`, `HAVING count(*) >= 3`, realtime, modal de perfil.
- ✅ **Modo convidado + onboarding + triagem + desbloqueio progressivo de modos.**
- ✅ **Decisão: app 100% gratuito no lançamento** — `MONETIZATION_ENABLED=false` permanente por ora.
  - *Obs.:* código de monetização preservado para projetos futuros.

### Infraestrutura
- ✅ **Supabase configurado** — tabelas `profiles`/`sessions`/`friendships`, view `ranking`, RLS policies.
- ✅ **RLS policies versionadas** — `supabase/migrations/0008_rls_policies_documentation.sql` (C7).
- ✅ **Migrations versionadas** — `0001`…`0008`.
- ✅ **EAS configurado** — Starter ($19/mês), projectId `38fbd96b-…`, profiles preview/production.
- ✅ **GitHub Actions** — `build-android.yml` (push main + manual) e `build-ios.yml` (manual).
- ✅ **Política de privacidade publicada** — GitHub Pages `https://dulkz.github.io/reflexo-app/mobile2/PRIVACY_POLICY` (C6).
- ✅ **Certificado de distribuição iOS** — serial `5E29…`, válido até 2027-05-28; Provisioning Profile `7SNZKNBUJJ`.

---

## ATUAL (estado hoje — submetido para revisão Apple)

Snapshot de **2026-05-28**. O app foi submetido para revisão da Apple às **22:57 (Brasília)**.
A AUDITORIA_02 foi escrita mais cedo no mesmo dia (capturou o estado *antes* do build);
os itens abaixo refletem o estado mais recente.

### Loja
- ⏳ **App submetido para revisão Apple** — aguardando análise (até 48h na fila + ~7 dias de revisão típica).
  - *Obs.:* submetido às 22:57 de 28/05. Build `1.0.0 (2)`.
- ✅ **Build iOS de produção gerado e submetido** — build final v2 `f21ffc47-2172-447f-9526-be60a2f1ca66`.
  - *Obs.:* IPA `…vU7XA8SPeCh5v9cxseKRuA.ipa`; submission `8a50c0fa-…`. (Build v1 anterior às correções de paywall: `cf878882-…`.)
- ✅ **Screenshots iOS EN carregados no ASC.**
- ⬜ **Confirmar Apple Developer Account totalmente ativada** — pagamento confirmado em 25/05; checar status final.
- ⬜ **Classificação etária (questionário ASC)** — não confirmada explicitamente; provável 4+ ou 9+.

### Técnico
- ✅ **Correções de paywall buildadas antes do submit** — build v2 com `3bfb60c`.
- ⬜ **`version` no `app.json` (`1.0.0`) ≠ tag git (`v2.0.0-dev`)** — alinhar antes de novas releases.
  - *Obs.:* `versionCode`/`buildNumber` é remoto via EAS (`appVersionSource: remote`).

### Infraestrutura
- ⬜ **Site URL do Supabase ainda é `exp://localhost:8081`** — trocar para `reflexo://auth-callback` antes de validar reset de senha em produção. **[VERIFICAR NO DASHBOARD]**
  - *Obs.:* Redirect URLs já incluem `reflexo://auth-callback` e `exp://localhost:8081/--/auth-callback`.

### Loja — Play Store (em paralelo, ainda não submetida)
- ⬜ **Google Play Console** — aguardando aprovação de identidade + taxa única **US$ 25**.
- ⬜ **AAB Android de produção** — `eas build --platform android --profile production` (CI hoje só faz APK preview).
- ⬜ **`mobile2/google-service-account.json`** — ausente; `eas.json` referencia. Criar Service Account no Google Cloud + ligar à Play Console.
- ⬜ **Screenshots Play Store PT + EN** — HTML frames prontos; renderizar em PNG e enviar na console.
- ⬜ **Classificação de conteúdo (questionário Play Console).**

---

## PÓS-LANÇAMENTO (o que fazer após aprovação)

Trabalho que destrava ou ganha prioridade depois da aprovação na App Store. Inclui o
caminho completo da Play Store, dívidas de qualidade de produto (M3/M8/M9/M10) e débito técnico.

### Loja / Marketing
- ⬜ **Concluir submissão Play Store** — pagar US$ 25, gerar AAB, criar `google-service-account.json`, enviar screenshots PT+EN, responder classificação de conteúdo.
- ⬜ **TestFlight beta interno** — validar auth/jogo/ranking em device real (recomendado também antes do submit público, se houver nova build).
- ⬜ **Revisar copy PT/EN** — não prometer benefício médico ("brain training") para evitar atrito §4.0 / §5.2.3 na Apple.

### Produto (qualidade — não bloqueiam, decididos pós-lançamento)
- ⬜ **M3 — Anti-cheat de ranking** — `avg_rt` é client-defined (`syncSession.ts`); validar plausibilidade server-side (trigger Postgres ou Edge Function).
- ⬜ **M9 — Namespacing de sessões locais por usuário** — logout+login de outra conta no mesmo aparelho migra sessões alheias. Chaves `reflexo_sessions_{userId}_v2`.
- ⬜ **M8 — Debounce no realtime global** — `GlobalScreen` escuta `*` em `sessions`; custo de banda escala com a base. Filtrar por modo / debounce.
- ⬜ **M10 — Testes automatizados** — hoje só `tsc` cobre regressões. Suíte unitária para `utils/` (energy, storage, streak, missions); Jest/RNTL/E2E.
- ⬜ **Reavaliar monetização** — reativar paywall/IAP com billing real quando decidido (código preservado).

### Técnico (débito)
- ⬜ **Gatear `console.*` com `if (__DEV__)`** — 6 arquivos ainda logam em produção.
- ⬜ **Esconder emojis remanescentes** — 👑🥈🥉🌐 (GlobalScreen), ⚡🕛👑 (SemEnergia) → migrar para SVG.
- ⬜ **Cobertura de acessibilidade nas telas centrais** — Home, Perfil, Missoes, Modos, Resultado sem `accessibilityLabel`.
- ⬜ **Refatorar god components** — `App.tsx` (1182), `Perfil.tsx` (1310), `Resultado.tsx` (1080) em hooks/subcomponentes.
- ⬜ **i18n completo** — milestone labels de ambições, `progress()` de conquistas, `ambitions.ts`, `ARCHETYPE_NAMES`.
- ⬜ **`tsconfig` mais estrito** — `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`.
- ⬜ **Migrar `splash` para plugin `expo-splash-screen`** e `userInterfaceStyle` para `"dark"`.
- ⬜ **Mover `screens/applestore/` e `screens/playstore/`** para `mobile2/marketing/` (estão em `screens/` por engano).

### Infraestrutura
- ⬜ **Sentry / Crashlytics** — captura de crash em produção (hoje cego a crashes pós-release).
- ⬜ **Adotar Supabase CLI** — migrations executáveis em vez de SQL-documentação aplicada manualmente.
- ⬜ **Upgrade Supabase Free → Pro ($25/mês)** — considerar antes de tração real.
- ⬜ **Otimizar CI EAS** — trocar `push: main` por `workflow_dispatch` ou disparo só em tags `v*` (economia de créditos Starter).
- ⬜ **Próxima auditoria** — após o primeiro build iOS de produção e a primeira semana pós-aprovação.

---

*Gerado a partir de PROGRESS.md, AUDITORIA_02_PRE_LAUNCH.md e LAUNCH_INFO.md em 2026-05-28.*
*Mantenha este checklist como template de referência para os próximos lançamentos.*
