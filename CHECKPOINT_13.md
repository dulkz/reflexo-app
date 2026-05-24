# CHECKPOINT 13 — Benchmarks da Ciência

Branch: feat/goal-redesign-final · tsc --noEmit = 0 erros

## 1. Documento localizado
`C:\reflexo-app\benchmarks_reflexo.docx` encontrado e lido (extração do `word/document.xml`).
Valores conferidos contra a "Tabela de Benchmarks Científicos" (fontes peer-reviewed citadas).

## 2. Correções aplicadas (screens/Ciencia.tsx + locales)
Escala PARTIDA (`BENCHMARK_STATIC` + `science.benchmarks` pt/en), agora 7 entradas:

| Benchmark | Antes | Depois | Fonte (docx) |
|---|---|---|---|
| Antecipação visual de elite | 50–100 ms | 50–100 ms (mantido) | McLeod 1987 · Caprioli 2023 |
| **Velocista olímpico (auditivo)** | — (novo) | **120–160 ms** | Shahshahani et al., 2018 · PLoS ONE · IAAF |
| Piloto de F1 de ponta | 150–250 ms | 150–250 ms (mantido) | Vienna Reaction Apparatus (Neuhaus, PMC) |
| **Velocista olímpico (visual)** | 170–200 ms | **170–200 ms** | Lipps et al., 2011 · Sprint start |
| **Boxeador olímpico** | 160–220 ms | **240–260 ms** | Loturco et al., 2015 · J. Athletic Enhancement |
| Tenista ATP | 200–250 ms | 200–250 ms | Caprioli et al., 2023 · SCITEPRESS |
| Adulto saudável (25–45) | 200–300 ms | **250–270 ms** | Backyard Brains · Mental Chronometry |

### Mudanças explícitas do enunciado
- **Boxeador olímpico → 240–260 ms (visual)**: era 160–220 ms. Corrigido conforme docx (reação de escolha visual, Seleção Brasileira). Nível ajustado ELITE → MUITO BOM.
- **Velocista separado em auditivo e visual**:
  - auditivo **120–160 ms** (reação ao tiro de partida, IAAF/PLoS ONE 2018) — nível ELITE EXTREMO.
  - visual **170–200 ms** (sprint start research, Lipps 2011) — nível ELITE.

### Outras
- Adulto médio corrigido para 250–270 ms (docx: humano médio adulto jovem, reação simples visual).
- `originalPtNames` (matching do realce "← sua meta") atualizado para a nova ordem; meta "Velocista olímpico" (160ms) realça a faixa auditiva.

## 3. Fontes
Todos os benchmarks (partida + choice RT) têm fonte/referência citada no card; lista completa em `SOURCES` + seção FONTES. ✔
