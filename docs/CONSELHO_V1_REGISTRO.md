# Reflexo App — Registro da Sessão do Conselho
## Segunda Sessão Formal · Pré-Lançamento · 24 Mai 2026

---

## Contexto

Segunda sessão formal do conselho consultivo avaliando o Reflexo App antes do lançamento na Play Store. A primeira sessão (nota 4.0) resultou em redesign aprovado com nota 7.6. Esta sessão avaliou o app implementado com o design aprovado.

**Nota alvo:** 9.0/10  
**Nota do conselho:** 8.3/10 → projeção com correções implementadas: 9.1–9.3

---

## O Conselho

| # | Especialista | Área | Nota |
|---|-------------|------|------|
| E1 | UX/UI Mobile | Usabilidade e fluxos | 8.5 |
| E2 | Design Systems | Consistência visual e identidade | 8.0 |
| E3 | Growth e Retenção | Engajamento e loops de produto | 7.8 |
| E4 | Acessibilidade | Inclusão e clareza | 7.9 |
| E5 | Produto e Estratégia | Posicionamento e diferenciação | 8.6 |

---

## Decisões Tomadas

### Energia e Monetização
**Decisão: Ocultar completamente (Opção B)**  
Raciocínio: sistema de energia só faz sentido se limitante no número de partidas com opção de pagar. Sem isso, melhor ocultar tudo. Código permanece intacto para ativação futura com `MONETIZATION_ENABLED = true`.

### Ícones de Arquétipo
**Decisão: Adiar para Fase 2**  
Os ícones atuais são básicos, mas o momento certo para upgrade é o lançamento do ranking — vira feature comunicável ("novos visuais de arquétipo") em vez de correção silenciosa. Skins e coroas do ranking darão contexto de status aos arquétipos.

### Tour de Onboarding Sobreposto
**Decisão: Não implementar**  
App é autoexplicativo para o loop principal. OB1-OB4 já cobre o primeiro contato. Tour adicionaria atrito no momento de maior motivação. Se pós-lançamento os dados mostrarem usuários travando em alguma tela específica, reconsiderar com evidência real.

### Conquistas — Reframing "4/36"
**Decisão: Manter como está**  
O sistema tem desbloqueios não-lineares — mostrar "próxima: Triatleta" seria enganoso porque o usuário pode desbloquear outra conquista antes. O número total serve como âncora de profundidade do sistema.

---

## 5 Correções Implementadas

### 1. Pluralização do streak (`cdb4ced`)
**Problema:** "1 dias seguidos" — sempre plural  
**Solução:** i18next `_one`/`_other` (mesmo padrão já usado no projeto)  
**Arquivos:** `screens/Home.tsx`, `locales/pt.json`, `locales/en.json`

### 2. Ocultar energia e tickets da UI (`84cbadb`)
**Problema:** "993/5 ⚡" nos cards de modo; "ENERGIA GANHA", "TICKET DOURADO" nas missões  
**Solução:** Envolver todos os elementos visuais de monetização em `{MONETIZATION_ENABLED && (...)}`  
**Arquivos:** `screens/Home.tsx`, `screens/Missoes.tsx`  
**Lógica intacta:** `config/monetization.ts`, `utils/energy.ts`, dados em AsyncStorage — não tocados

### 3. Tab bar espaçamento (`bfbecd2`)
**Problema:** Item ativo com container inflado vs. inativos sem container — assimetria visual  
**Solução:** Container interno idêntico em todos os estados (mesmos padding/dimensões). Só cor muda: ativo = `#00E5CC18` + ciano; inativo = transparente + cinza  
**Arquivos:** `App.tsx`

### 4. Limpar dados — discreto + confirmação dupla (`2eced60`)
**Problema:** Botão vermelho proeminente sem confirmação — risco de perda de dados acidental  
**Solução:** Visual discreto (texto cinza, sem borda). Dois Alerts sequenciais obrigatórios antes de executar  
**Arquivos:** `screens/Perfil.tsx`, `locales/pt.json`, `locales/en.json`

### 5. Formas no Modo Alvo (`5b077b0`)
**Problema:** 4 posições diferenciadas só por cor — inacessível para daltônicos  
**Solução:** Formas distintas por posição + prompt "TOQUE O [FORMA]"  

| Posição | Forma | Cor |
|---------|-------|-----|
| TL | Círculo | Azul |
| TR | Triângulo | Laranja |
| BL | Quadrado | Roxo |
| BR | Hexágono | Verde |

**Arquivos:** `components/TargetShape.tsx` (novo), `screens/ModoAlvo.tsx`, `components/ModeTutorial.tsx`, `locales/pt.json`, `locales/en.json`

---

## Padrões Técnicos Estabelecidos

### Commits com acentos/aspas no PowerShell
Usar `git commit -F` com arquivo temporário em vez de `-m`:
```powershell
# Escrever mensagem em arquivo
# Commitar via -F
git commit -F .git\COMMIT_MSG_TMP.txt
Remove-Item .git\COMMIT_MSG_TMP.txt -Force
```

### Validação antes de cada commit
```powershell
cd C:\reflexo-app\mobile2
npx tsc --noEmit  # deve retornar TSC EXIT: 0
python -c "import json; json.load(open('locales/pt.json',encoding='utf-8')); json.load(open('locales/en.json',encoding='utf-8')); print('JSON OK')"
```

### Flags de monetização
```typescript
// config/monetization.ts
MONETIZATION_ENABLED = false  // v1.0.0 launch
// Toda UI de energia/tickets condicional a esta flag
// Lógica de negócio intacta independente da flag
```

---

## Informações do Projeto

- **Repositório:** https://github.com/dulkz/reflexo-app
- **Diretório local:** `C:\reflexo-app\mobile2\`
- **Branch v1.0.0:** `feat/goal-redesign-final`
- **APK v1.0.0:** https://expo.dev/artifacts/eas/tNuxreJyUSAZR8hdHvbg6Q.apk
- **Stack:** React Native + Expo SDK 54 + TypeScript + i18next

---

## Próxima Sessão do Conselho (Fase 2)

Temas previstos:
1. Economia de monetização — energia 3/dia, missões diárias, Tickets Dourados
2. Página de assinatura e fluxo de paywall
3. Backend Supabase — arquitetura para ranking global e amigos
4. Upgrade visual de arquétipos junto com lançamento do ranking
