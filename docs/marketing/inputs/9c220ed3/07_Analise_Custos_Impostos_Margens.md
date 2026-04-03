# TaskMaster — Análise Completa de Custos, Impostos e Margens

**Documento Financeiro | Fevereiro 2026**
**LLC em Connecticut — Marcos Menezes**

---

## 1. Estrutura de Custos por Utilizador/Mês

### 1.1 Custos Operacionais (Variáveis)

| Componente | Custo/Utilizador/Mês |
|------------|---------------------|
| OpenAI (GPT-4o) | US$ 3,20 |
| Hospedagem (Vercel + Supabase) | US$ 0,70 |
| Suporte (WhatsApp API) | US$ 0,40 |
| Storage (S3) | US$ 0,15 |
| Monitoramento/Analytics | US$ 0,10 |
| E-mail (transacional) | US$ 0,08 |
| **Subtotal (sem Stripe)** | **US$ 4,63** |

O Stripe cobra **2,9% + US$ 0,30** por transação, variando conforme o plano.

### 1.2 Comissões (23% sobre receita)

| Comissão | % |
|----------|---|
| Afiliado | 14% |
| Gerente (Manager) | 6% |
| Pós-venda/Revenda | 3% |
| **Total** | **23%** |

### 1.3 Impostos — LLC Connecticut

| Imposto | Taxa | Incide sobre |
|---------|------|-------------|
| **SaaS Sales Tax (B2B)** | 1% | Receita (cobrado do cliente) |
| **Self-Employment Tax** | 15,3% | Lucro (12,4% SS + 2,9% Medicare) |
| **Federal Income Tax** | ~22% efetivo | Lucro (após dedução de metade do SE Tax) |

> **Nota:** LLC em CT é "pass-through" — o lucro passa para a declaração pessoal. CT não cobra state income tax adicional sobre LLC pass-through, mas existe o PET (Pass-Through Entity Tax) de 6,99% opcional com crédito fiscal.

---

## 2. Custo por Plano — Detalhamento Completo

### 2.1 Plano Starter (US$ 49/mês)

| Item | Valor | % da Receita |
|------|-------|-------------|
| Receita | $49,00 | 100% |
| Sales Tax CT (1%) | -$0,49 | 1,0% |
| OpenAI | -$3,20 | 6,5% |
| Stripe (2,9% + $0,30) | -$1,72 | 3,5% |
| Hospedagem + outros | -$1,43 | 2,9% |
| **Comissões (23%)** | **-$11,27** | **23,0%** |
| ├─ Afiliado (14%) | -$6,86 | — |
| ├─ Gerente (6%) | -$2,94 | — |
| └─ Pós-venda (3%) | -$1,47 | — |
| **Lucro antes impostos** | **$30,89** | **63,0%** |
| Self-Employment Tax | -$4,73 | 9,6% |
| Federal Income Tax | -$6,28 | 12,8% |
| **LUCRO LÍQUIDO** | **$19,88** | **40,6%** |

### 2.2 Plano Pro (US$ 80/mês)

| Item | Valor | % da Receita |
|------|-------|-------------|
| Receita | $80,00 | 100% |
| Sales Tax CT (1%) | -$0,80 | 1,0% |
| OpenAI | -$3,20 | 4,0% |
| Stripe (2,9% + $0,30) | -$2,62 | 3,3% |
| Hospedagem + outros | -$1,43 | 1,8% |
| **Comissões (23%)** | **-$18,40** | **23,0%** |
| **Lucro antes impostos** | **$53,55** | **66,9%** |
| Self-Employment Tax | -$8,19 | 10,2% |
| Federal Income Tax | -$10,88 | 13,6% |
| **LUCRO LÍQUIDO** | **$34,48** | **43,1%** |

### 2.3 Plano Professional (US$ 99/mês)

| Item | Valor | % da Receita |
|------|-------|-------------|
| Receita | $99,00 | 100% |
| Sales Tax CT (1%) | -$0,99 | 1,0% |
| OpenAI | -$3,20 | 3,2% |
| Stripe (2,9% + $0,30) | -$3,17 | 3,2% |
| Hospedagem + outros | -$1,43 | 1,4% |
| **Comissões (23%)** | **-$22,77** | **23,0%** |
| **Lucro antes impostos** | **$67,44** | **68,1%** |
| Self-Employment Tax | -$10,32 | 10,4% |
| Federal Income Tax | -$13,71 | 13,8% |
| **LUCRO LÍQUIDO** | **$43,41** | **43,8%** |

---

## 3. Resumo — Lucro por Utilizador por Plano

| Plano | Receita | Custos + Comissões | Impostos | Lucro Líquido | Margem |
|-------|---------|-------------------|----------|--------------|--------|
| **Starter** | $49,00 | -$18,11 | -$11,01 | **$19,88** | **40,6%** |
| **Pro** | $80,00 | -$26,45 | -$19,07 | **$34,48** | **43,1%** |
| **Professional** | $99,00 | -$31,56 | -$24,03 | **$43,41** | **43,8%** |

---

## 4. Simulação por Escala — Mix Real (55% Starter, 35% Pro, 10% Professional)

### 4.1 — 100 Utilizadores

| Métrica | Valor |
|---------|-------|
| **Receita mensal** | $6.485 |
| Custos operacionais | -$681 |
| Comissões (23%) | -$1.492 |
| **Custos fixos** | **-$8.500** |
| Sales Tax | -$65 |
| **Resultado** | **-$4.252 (PREJUÍZO)** |

> **Com 100 utilizadores a empresa opera no vermelho.** Os custos fixos ($8.500/mês) são maiores que a margem de contribuição. O breakeven está em ~**290 utilizadores**.

### 4.2 — 1.000 Utilizadores

| Métrica | Valor |
|---------|-------|
| **Receita mensal** | $64.850 |
| Custos operacionais | -$6.811 |
| Comissões (23%) | -$14.916 |
| Custos fixos | -$20.100 |
| Sales Tax | -$649 |
| Lucro antes impostos | $22.375 |
| Self-Employment Tax | -$3.423 |
| Federal Income Tax | -$4.546 |
| **LUCRO LÍQUIDO MENSAL** | **$14.406** |
| **LUCRO LÍQUIDO ANUAL** | **$172.871** |
| **Lucro por utilizador** | **$14,41/mês** |
| **Margem líquida** | **22,2%** |

### 4.3 — 5.000 Utilizadores

| Métrica | Valor |
|---------|-------|
| **Receita mensal** | $324.250 |
| Custos operacionais | -$34.053 |
| Comissões (23%) | -$74.578 |
| Custos fixos | -$40.400 |
| Sales Tax | -$3.243 |
| Lucro antes impostos | $171.977 |
| Self-Employment Tax | -$26.312 |
| Federal Income Tax | -$34.941 |
| **LUCRO LÍQUIDO MENSAL** | **$110.724** |
| **LUCRO LÍQUIDO ANUAL** | **$1.328.685** |
| **Lucro por utilizador** | **$22,14/mês** |
| **Margem líquida** | **34,1%** |

---

## 5. Quadro Comparativo — Escala vs. Margem

| Escala | Receita/Mês | Lucro/Mês | Lucro/Ano | Margem | Lucro/User |
|--------|------------|----------|----------|--------|-----------|
| **100** | $6.485 | -$4.252 | -$51.030 | -65,6% | -$42,52 |
| **290** (breakeven) | ~$18.800 | ~$0 | ~$0 | 0% | $0 |
| **1.000** | $64.850 | $14.406 | $172.871 | 22,2% | $14,41 |
| **2.500** | $162.125 | $56.000 | $672.000 | 28,0% | $22,40 |
| **5.000** | $324.250 | $110.724 | $1.328.685 | 34,1% | $22,14 |
| **10.000** | $648.500 | $250.000+ | $3.000.000+ | 38%+ | $25+ |

---

## 6. Onde Vai Cada Dólar (ARPU Médio $64,85)

| Destino | Valor | % |
|---------|-------|---|
| **Comissões** (afiliado + gerente + pós-venda) | $14,92 | 23,0% |
| **Impostos** (SE Tax + Federal) | $7,97 | 12,3% |
| **OpenAI** | $3,20 | 4,9% |
| **Stripe** | $2,18 | 3,4% |
| **Hospedagem + Infra** | $0,70 | 1,1% |
| **Outros operacionais** | $0,73 | 1,1% |
| **Sales Tax** | $0,65 | 1,0% |
| **Custos fixos rateados** (1.000 users) | $20,10 | 31,0% |
| **LUCRO LÍQUIDO** | **$14,41** | **22,2%** |

> **Com 5.000 utilizadores**, os custos fixos rateados caem para $8,08/user e o lucro sobe para **$22,14/user (34,1%)**.

---

## 7. Observações Importantes

1. **As comissões (23%) são o maior custo** — maior que impostos e operacional juntos. Se nem todos os clientes vierem por afiliado/gerente, a margem real será maior.

2. **O breakeven está em ~290 utilizadores** — a meta de 600 clientes em 60 dias garante que a empresa é lucrativa desde o mês 2.

3. **A margem escala com volume** — de 22% (1.000 users) para 34% (5.000 users) porque os custos fixos diluem-se.

4. **Self-Employment Tax é significativo** (15,3%) — considerar converter para S-Corp election após lucros consistentes para reduzir SE Tax (pagar salário razoável e distribuir o resto como dividendo).

5. **CT SaaS Sales Tax B2B é apenas 1%** — muito favorável. Se vender para consumidores finais (B2C), sobe para 6,35%.

6. **Consultar um CPA** para otimizar: S-Corp election, PET de CT, deduções de home office, equipamento, viagens, etc.

---

## 8. Referências

- IRS Self-Employment Tax: https://www.irs.gov/businesses/small-businesses-self-employed/self-employment-tax-social-security-and-medicare-taxes
- Connecticut SaaS Sales Tax: https://www.anrok.com/saas-sales-tax-by-state/connecticut
- Federal Tax Brackets 2026: https://taxfoundation.org/data/all/federal/2026-tax-brackets/
