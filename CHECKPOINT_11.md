# CHECKPOINT 11 — Ordem e desbloqueio de modos

Branch: feat/goal-redesign-final · tsc --noEmit = 0 erros

## 1. Nova ordem dos modos: Partida → Radar → Sequência → Alvo
Reordenado em todas as listas de modos:
- `screens/Home.tsx` — `MODE_INFO`
- `screens/Perfil.tsx` — `modeBreakdown` (POR MODO)
- `screens/Historico.tsx` — `HistoricoModeCards` + contagem por modo
- `screens/OnboardingModal.tsx` — tela "modos disponíveis" (intro)
- Splash não possui lista de modos (apenas animação do nome) → sem alteração.

## 2. Desbloqueio progressivo
Regra (cadeia `MODE_UNLOCK_ORDER`):
- **Partida** — sempre desbloqueado
- **Radar** — após 1 sessão completa de Partida
- **Sequência** — após 1 sessão completa de Radar
- **Alvo** — após 1 sessão completa de Sequência

### Persistência (utils/storage.ts)
- `computeModeUnlocks(sessions)` deriva o estado das sessões (fonte da verdade).
- `loadModeUnlocks()` / `persistModeUnlocks()` leem/gravam flags `mode_unlocked_{modeKey}` no AsyncStorage.
- `previousModeInChain(mode)` → modo pré-requisito.
- Chaves `mode_unlocked_*` adicionadas a `USER_DATA_KEYS` (resetam em "Limpar dados").

### App.tsx
- Estado `modeUnlocks` carregado no boot (derivado ∪ persistido) e persistido.
- Em `addSession`: detecta modos recém-desbloqueados (prev=false → novo=true), persiste e enfileira toast.
- `tryStartMode` ignora modos bloqueados (salvaguarda).
- Toast "MODO DESBLOQUEADO!" com ícone do modo + **haptic Success** + animação spring, enfileirado atrás dos toasts de evolução/conquista/marco.

### Home.tsx
- Cards bloqueados: ícone esmaecido + cadeado + "Complete [modo anterior] para desbloquear", card não-clicável (não inicia o modo).
- Novos textos i18n: `home.unlockHint`, `home.modeUnlockedTitle`, `home.tapToContinue` (pt+en).
