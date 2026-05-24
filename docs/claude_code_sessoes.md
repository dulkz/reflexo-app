# Gestão de sessões no Claude Code — Reflexo

Guia rápido para manter qualidade em sessões longas e fazer transições limpas entre sessões.

\---

## 1\. Sinais de que a sessão está ficando longa demais

**Técnicos:**

* Aviso explícito de "context getting long" ou similar
* Sugestões de `/compact` ou `/clear`
* Respostas visivelmente mais lentas para começar

**Comportamentais (mais úteis na prática):**

* Esquece decisões estabelecidas cedo na sessão
* Repete trabalho (lê arquivo duas vezes, refaz mudança já feita)
* Respostas ficam mais genéricas e menos específicas ao código
* Referencia arquivos com caminho errado
* Faz perguntas sobre coisas já combinadas

**Regra:** 2 ou mais sinais → hora de cortar.

\---

## 2\. Regra de decisão por tipo de tarefa

|Tipo de trabalho|Fechar sessão a cada|
|-|-|
|Tarefas pequenas e isoladas|5–8 tarefas|
|Features médias (uma tela, um componente)|2–3 features|
|Prompts grandes (como Prompt A e B)|**1 prompt = 1 sessão**|

Não conte mensagens. Conte unidades de trabalho concluídas.

\---

## 3\. Abertura de sessão

**Primeira mensagem da sessão:**

> Leia o `CLAUDE.md` na íntegra, especialmente a seção "Histórico de implementação". Vamos continuar o projeto Reflexo. Hoje a tarefa é \[descrever tarefa / colar prompt].

**Quando for colar prompt grande (Prompt A, B, etc):**

> Leia o `CLAUDE.md`. Vou te passar um prompt grande. Quero que você leia o prompt inteiro, faça um plano de implementação, e me mostre o plano antes de executar.

Depois cola o prompt inteiro. Aprova o plano antes de ele começar a codar.

\---

## 4\. Encerramento de sessão

Antes de fechar, sempre rodar os três passos abaixo.

### 4.1. Resumo estruturado no CLAUDE.md

> Antes de encerrarmos, escreve um resumo do que foi implementado nesta sessão no formato:
> (a) arquivos criados
> (b) arquivos modificados
> (c) decisões de design tomadas que não estavam no prompt original
> (d) coisas que ficaram pendentes ou precisam de atenção futura
> (e) convenções ou padrões estabelecidos que devem ser mantidos em sessões seguintes
>
> Salva isso em `C:\\reflexo-app\\CLAUDE.md` na seção "Histórico de implementação".

### 4.2. Verificação de estado

> Roda `git status` e me mostra tudo que está modificado mas não commitado. Confirma que o TypeScript check passa.

### 4.3. Commit de fechamento

Commit manual ou peça ao Claude Code para fazer, com mensagem descritiva:

```
feat: triagem e mapa de jornada (Prompt A)
```

\---

## 5\. Fluxo recomendado para os Prompts A e B

**Sessão 1 — Prompt A:**

1. Abre Claude Code novo
2. Cola mensagem de abertura (seção 3)
3. Cola Prompt A inteiro
4. Aprova o plano que ele propõe
5. Deixa executar
6. No fim: roda os 3 passos de encerramento (seção 4)
7. Commit, fecha sessão

**Entre sessões (opcional):**

* Testa o fluxo no Expo Go
* Anota problemas encontrados (não corrige na sessão antiga)

**Sessão 2 — Prompt B:**

1. Abre Claude Code novo
2. Cola mensagem de abertura, mencionando que Prompt A já foi executado
3. Cola Prompt B inteiro
4. Mesma dinâmica

\---

## 6\. Princípio geral

**Cortar cedo e retomar bem é menos custoso do que teimar numa sessão ruim.**

Código gerado em sessão degradada costuma ser inconsistente e dá mais trabalho de refatorar depois do que simplesmente abrir sessão nova com contexto bem preservado via `CLAUDE.md`.

