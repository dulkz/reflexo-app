# Reflexo App

App de velocidade de reação com ranking global online.

## Stack
- React Native + Expo SDK 54 (TypeScript)
- Supabase (auth, banco, realtime)
- AsyncStorage (offline-first)

## Design System
- Background: #0A0F1E
- Primário: #00E5CC
- Fontes: Bebas Neue · DM Sans · Space Mono

## Modos de jogo
| Modo | Descrição |
|------|-----------|
| Partida | Tempo de reação puro — média dos 5 melhores |
| Radar | Acertar alvos em movimento |
| Sequência | No-go / go com análise de fadiga |
| Alvo | Precisão e velocidade combinadas |

## Funcionalidades
- 4 modos de jogo offline-first
- Sistema de arquétipos e evolução
- Missões e conquistas
- Ranking global ao vivo (Supabase Realtime)
- Autenticação opcional (login, cadastro, modo convidado)
- Sincronização de sessões no login
- Card de perfil público no ranking

## Estrutura
```
mobile2/
├── screens/          # Telas (Home, GlobalScreen, Perfil, Auth, modos...)
├── utils/            # storage, syncSession, migrateLocalSessions, levels...
├── assets/           # ícones SVG, fontes
├── lib/              # supabase.ts
├── supabase/
│   └── migrations/   # SQL versionado (aplicado manualmente no dashboard)
├── locales/          # pt.json, en.json
└── PROGRESS.md       # histórico de desenvolvimento
```

## Desenvolvimento local
```bash
cd mobile2
npx expo start            # rede local
npx expo start --tunnel   # acesso externo (teste com amigos)
```

## Próximos passos
- Deep link para confirmação de email (produção)
- Gerar APK standalone
- Publicar na Play Store / App Store

## Fase 1 — v1.0.0
Branch: feat/goal-redesign-final (finalizada)

## Fase 2 — Sistema online
Branch: feat/online-ranking (mergeada em main — PR #1)
Ver PROGRESS.md para histórico completo.
