# Monetização — Reflexo App

## Status atual
Feature flag: `MONETIZATION_ENABLED = false`
Sistema implementado mas desabilitado. Em modo teste, compras simulam adição de energia sem cobrança real.

## Modelo de energia

### Regras
- 5 energias por modo por dia (Partida, Alvo, Sequência, Radar — independentes)
- Energia reseta à meia-noite (baseada na data do dispositivo)
- Primeiros 3 dias após instalação: energia ilimitada (período de graça)
- Energia armazenada em chave separada do AsyncStorage — NÃO é apagada pelo "Limpar todos os dados"
- Limitação vale para todos os perfis (casual, competitivo) — perfil não influencia energia

## Pacotes disponíveis

### Energia avulsa (microtransação)
| Pacote | Energias | Preço |
|--------|----------|-------|
| Pequeno | 10 | R$ 2,99 |
| Médio | 30 | R$ 6,99 |

### Premium (assinatura)
| Plano | Preço | Equivalente/mês |
|-------|-------|-----------------|
| Mensal | R$ 4,99/mês | R$ 4,99 |
| Anual | R$ 34,99/ano | R$ 2,99 |

**Benefícios Premium:**
- Energia ilimitada em todos os modos
- Sem anúncios
- Badge exclusivo no perfil

### Remover anúncios
- R$ 1,99 — compra única permanente

## Anúncios

### Regras
- Aparecem apenas entre sessões, NUNCA durante o jogo
- Frequência: 1 a cada 3 partidas
- Duração: 5-10 segundos, pulável
- Plataforma: Google AdMob
- Usuários Premium e quem pagou R$ 1,99 não veem anúncios

## Implementação técnica

### Feature flag
```javascript
// config/monetization.ts
export const MONETIZATION_ENABLED = false

// false → energia infinita, sem anúncios, compras simuladas
// true  → sistema completo ativo (requer Google Play Billing configurado)
```

### Modo teste (MONETIZATION_ENABLED = false)
- Energia nunca acaba — jogador pode jogar sem limitação
- Tela de "sem energia" aparece normalmente para validar UX
- Ao clicar em comprar → energia adicionada instantaneamente sem cobrança
- Anúncios não aparecem

### Modo produção (MONETIZATION_ENABLED = true)
- Energia limitada conforme regras acima
- Compras processadas via Google Play Billing
- Anúncios via Google AdMob
- Requer publicação na Play Store para funcionar

### Chaves AsyncStorage
- `reflexo_energy_v1` — energia atual por modo + timestamp do dia
- NÃO incluída no AsyncStorage.clear() do "Limpar todos os dados"

## Roadmap de implementação

### Fase 1 — UX e simulação (próxima sprint)
- [ ] Tela de energia por modo (contador + barra)
- [ ] Tela de "sem energia" com opções de compra
- [ ] Simulação de compra em modo teste
- [ ] Lógica de reset diário
- [ ] Proteção contra reset via "Limpar dados"
- [ ] Período de graça 3 dias

### Fase 2 — Produção
- [ ] Integrar Google Play Billing
- [ ] Configurar produtos no Google Play Console
- [ ] Integrar Google AdMob
- [ ] Ativar MONETIZATION_ENABLED = true
- [ ] Publicar na Play Store

## Decisões de produto
- Perfil do usuário NÃO influencia energia — todos têm as mesmas 5 por modo
- "Limpar todos os dados" NÃO reseta energia — evita hack de energia infinita
- Período de graça de 3 dias — usuário cria hábito antes da limitação
- Anúncios nunca interrompem partidas — preserva experiência de jogo
- Compra única de R$ 1,99 para remover anúncios — acessível e justo
