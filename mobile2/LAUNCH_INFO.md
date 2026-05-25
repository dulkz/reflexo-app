# Reflexo App — Informações de Lançamento

## Identidade do App
- Nome: Reflexo
- Slug: reflexo-app
- Package Android: com.dulks.reflexo
- Bundle ID iOS: com.dulks.reflexo
- Scheme: reflexo
- Versão atual: 1.0.0 (versionCode 1)

## Contas e Serviços

### Expo / EAS
- Conta: dulkz
- Plano: Starter ($19/mês)
- Project ID: 38fbd96b-f8a7-4bdd-9d91-39c30c716345
- Dashboard: https://expo.dev/accounts/dulkz/projects/reflexo-app

### Supabase
- Projeto: Reflexo App
- URL: https://ouqneluwoyscvlvckywj.supabase.co
- Plano: Free (considerar upgrade para Pro $25/mês antes do lançamento)
- Dashboard: https://supabase.com/dashboard/project/ouqneluwoyscvlvckywj

### GitHub
- Repositório: https://github.com/dulkz/reflexo-app
- Visibilidade: Público
- Branch principal: main
- Tag atual: v2.0.0-dev

### GitHub Pages (Política de Privacidade)
- URL: https://dulkz.github.io/reflexo-app/mobile2/PRIVACY_POLICY
- Fonte: mobile2/PRIVACY_POLICY.md (branch main)

## Contato do App
- Email: reflexoapp@gmail.com

## URLs Importantes
- Política de Privacidade: https://dulkz.github.io/reflexo-app/mobile2/PRIVACY_POLICY
- Repositório: https://github.com/dulkz/reflexo-app
- EAS Builds: https://expo.dev/accounts/dulkz/projects/reflexo-app/builds
- GitHub Actions: https://github.com/dulkz/reflexo-app/actions

## Lojas

### Google Play Store
- Status: pendente ($25 único)
- Package: com.dulks.reflexo
- Link cadastro: https://play.google.com/console/signup
- Service Account Key: ./google-service-account.json (criar após conta)

### Apple App Store
- Status: pendente ($99/ano)
- Bundle ID: com.dulks.reflexo
- Link cadastro: https://developer.apple.com/programs/enroll/
- appleId: PREENCHER após conta
- ascAppId: PREENCHER após conta
- appleTeamId: PREENCHER após conta

## Builds

### Android APK (preview)
- Último build: https://expo.dev/artifacts/eas/rWzKBbW52c94Yr13tYbCL5.apk
- Comando: eas build --platform android --profile preview

### Android AAB (produção — Play Store)
- Comando: eas build --platform android --profile production
- Status: ainda não gerado

### iOS (App Store)
- Comando: eas build --platform ios --profile preview-ios
- Status: aguardando Apple Developer Account

## Credenciais (NÃO versionar — estão no .env)
- EXPO_PUBLIC_SUPABASE_URL
- EXPO_PUBLIC_SUPABASE_ANON_KEY
- Configuradas também como secrets no GitHub Actions e no EAS

## Redirect URLs configuradas no Supabase
- reflexo://auth-callback
- exp://localhost:8081/--/auth-callback
