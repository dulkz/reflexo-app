# CHECKPOINT 9 — Correções pontuais

Branch: `feat/goal-redesign-final` · `npx tsc --noEmit` = 0 erros

## 1. Modo Sequência — 10 → 15 sinais
- `ModoSequencia.tsx`: `TOTAL_SIGNALS = 10` → `15`.
- Proporção 25% NoGo aleatório **mantida** (`buildSequence()` usa 25% independente por
  sinal, primeiro sempre Go — inalterado, apenas mais sinais).
- Descrições atualizadas (Home + intro), PT e EN:
  - `modes.sequencia.desc`: "20 sinais…" → "15 sinais…"
  - `sequence.subtitle`: "20 sinais…" → "15 sinais…"
  - (o texto antigo dizia "20" enquanto o código fazia 10 — agora código e texto = 15)
- Tutorial de Sequência não cita número de sinais ("25% são armadilhas"), então não
  precisou de ajuste.

## 2. Energia infinita para assinantes (∞)
- `config/monetization.ts`: novo `PREMIUM_ACTIVE = false` (derivar do billing real no futuro).
- `utils/energy.ts`: helper `hasInfiniteEnergy()`; `hasEnergy()` retorna `true` se premium.
- `App.tsx` `tryStartMode`: premium (ou graça) = `unlimited` → não consome energia e
  sempre libera o modo.
- `screens/Home.tsx`: badge de energia mostra **∞** (`home.energyInfinite`) em vez do
  contador numérico quando `hasInfiniteEnergy()`.
- i18n `home.energyInfinite` = "⚡ ∞" (PT/EN).
- Com `PREMIUM_ACTIVE = false` (padrão), nada muda em produção; basta ligar a flag.

## 3. Texto do Alvo
- O texto exato "Veja qual círculo está aceso em ciano" **não existia** mais em `mobile2`
  (foi reescrito em passes anteriores). Apliquei a nova redação canônica onde a descrição
  do Alvo aparece:
  - `target.howToText` (PT): "Leia a cor indicada e toque no círculo correto. Toque errado
    = +150ms de penalidade."
  - `target.howToText` (EN): "Read the indicated color and tap the correct circle. Wrong
    tap = +150ms penalty."

## 4. Outros textos desatualizados
- "20 sinais" do Sequência corrigido (ver item 1).
- **Penalidade do Alvo unificada em +150ms**: o código real usa `ERROR_PENALTY = 150`.
  O tutorial do Grupo 8 citava "+200ms" (seguindo o texto literal da spec, que diverge do
  código). Corrigido `tutorial.alvo.text` para **+150ms** (PT/EN) para refletir o jogo real
  e ficar consistente com `target.howToText`. Não alterei a mecânica (Grupo 9 não pediu
  mudança de penalidade; só correção de texto).

## Verificação
- `npx tsc --noEmit` → **0 erros**.
- `locales/pt.json` e `locales/en.json` validados (`JSON.parse` OK).
- Nenhum "20 sinais"/"20 signals" remanescente.
