# Reflexo App — v1.0.0 Release Notes

**Data:** 24 de maio de 2026  
**Branch:** `feat/goal-redesign-final`  
**APK:** https://expo.dev/artifacts/eas/tNuxreJyUSAZR8hdHvbg6Q.apk  
**GitHub:** https://github.com/dulkz/reflexo-app

---

## O que é o Reflexo App

App mobile de treinamento de tempo de reação visual, benchmarked contra atletas de elite (pilotos F1, boxeadores, tenistas). React Native + Expo SDK 54, TypeScript, Android-first.

---

## Stack

- React Native + Expo SDK 54
- TypeScript strict (`tsc --noEmit` = 0 erros)
- i18n PT/EN completo (i18next)
- CI/GitHub Actions a cada commit
- EAS Build (Android APK)

---

## Features v1.0.0

### Navegação
- 3 tabs: Início · Missões · Perfil
- Design system: Bebas Neue + DM Sans + Space Mono
- Background `#0A0F1E`, ciano `#00E5CC`

### Onboarding (OB1–OB4)
- OB1: mini-jogo de 3 toques captura o primeiro RT real do usuário
- OB2: resultado com contexto vs. média humana
- OB3: revelação do arquétipo baseado na performance real
- OB4: escolha de meta que personaliza missões da semana

### 4 Modos de Jogo
| Modo | Descrição | Rodadas |
|------|-----------|---------|
| Partida | Reação simples visual, best-5-of-7 | 7 |
| Radar | Localização visual, 5 círculos em cruz | 15 |
| Sequência | Go/NoGo 75%/25% aleatório, controle inibitório | 15 |
| Alvo | Choice RT, 4 formas em posições fixas | 10 |

**Modo Alvo — mapeamento de formas:**
- TL: Círculo · Azul
- TR: Triângulo · Laranja
- BL: Quadrado · Roxo
- BR: Hexágono · Verde

### Desbloqueio Progressivo
Partida → Radar → Sequência → Alvo  
Cada modo desbloqueia após 1 sessão completa do anterior.

### Sistema de Arquétipos
6 arquétipos com critérios baseados em performance real:  
`EXPLORADOR → EM EVOLUÇÃO → RESISTENTE → ATIRADOR → VELOCISTA → PILOTO`

### Conquistas e Progressão
- 44 conquistas com raridades (Comum, Difícil, Raro, Épico, Lendário)
- Conquistas secretas com visual de cadeado
- Missões diárias e semanais
- Histórico com gráfico de sessões + cards por modo

### Monetização
- `MONETIZATION_ENABLED = false` no lançamento
- Energia infinita para todos, experiência completa gratuita
- Sistema de energia/tickets oculto da UI (código intacto para ativação futura)

---

## Commits da v1.0.0 (sessão final pré-lançamento)

| Commit | Descrição |
|--------|-----------|
| `cdb4ced` | fix: pluralização do streak na Home (1 dia seguido / 2 dias seguidos) |
| `84cbadb` | fix: ocultar energia e tickets da UI quando MONETIZATION_ENABLED=false |
| `bfbecd2` | fix: distribuição uniforme da tab bar inferior (container idêntico ativo/inativo, cor-only) |
| `2eced60` | fix: botão limpar dados discreto + confirmação em duas etapas |
| `5b077b0` | feat: formas por posição no Modo Alvo (círculo/triângulo/quadrado/hexágono) + acessibilidade daltonismo |

---

## Roadmap Fase 2 (pós-lançamento)

- [ ] Backend Supabase — ranking global e amigos
- [ ] Sistema de energia (3/dia + missões diárias) — `MONETIZATION_ENABLED = true`
- [ ] Tickets Dourados e página de assinatura
- [ ] Modo PVP
- [ ] Skins e coroas para top do ranking
- [ ] Ícones de arquétipo expressivos (upgrade visual)
- [ ] Card de compartilhamento de resultado (aquisição orgânica)
- [ ] iOS (após Android estável)
- [ ] Light mode nativo
