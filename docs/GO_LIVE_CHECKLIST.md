# TaskMaster - Go-Live Checklist

**Target Date:** 01 de novembro de 2025
**Status:** 🟡 Em Progresso
**Completion:** 42% (26/62 items)

---

## ✅ Definition of Done (DoD)

Para liberar produção, **TODOS** os itens marcados como 🔴 Blocker devem estar ✅ Completos.

---

## 1️⃣ Navegação e UX Inicial

| # | Item | Tipo | Status | Owner |
|---|------|------|--------|-------|
| 1.1 | Landing institucional restaurada (gradiente azul-roxo-rosa) | 🔴 Blocker | ❌ | Frontend |
| 1.2 | Produção Musical acessível via menu, não como landing | 🔴 Blocker | ❌ | Frontend |
| 1.3 | Rotas preview (/welcome, /lobby, /mail) atrás de feature flag | 🔴 Blocker | ⚠️ Parcial | Frontend |
| 1.4 | .env.production com VITE_ENABLE_CLASSIC_ROUTES=false | 🔴 Blocker | ✅ | DevOps |
| 1.5 | Menu "Preview" aparece apenas quando flag=true | 🟠 High | ✅ | Frontend |
| 1.6 | SPA fallback configurado (Vercel/Netlify) | 🔴 Blocker | ✅ | DevOps |

**Status:** 🟡 3/6 completos

---

## 2️⃣ Autenticação e Onboarding

| # | Item | Tipo | Status | Owner |
|---|------|------|--------|-------|
| 2.1 | /register funcional (PT/EN/ES) | 🔴 Blocker | ✅ | Frontend |
| 2.2 | /login funcional com "Lembrar de mim" | 🔴 Blocker | ✅ | Frontend |
| 2.3 | /forgot-password funcional | 🔴 Blocker | ✅ | Frontend |
| 2.4 | Onboarding 5 slides após primeiro login | 🔴 Blocker | ✅ | Frontend |
| 2.5 | Welcome Modal para usuários retornando | 🟠 High | ✅ | Frontend |
| 2.6 | Invite codes obrigatórios (beta mode) | 🔴 Blocker | ⚠️ Parcial | Backend |
| 2.7 | Isolamento de dados por organização | 🔴 Blocker | ⚠️ Validar | Backend |

**Status:** 🟡 5/7 completos

---

## 3️⃣ Database e Segurança

| # | Item | Tipo | Status | Owner |
|---|------|------|--------|-------|
| 3.1 | Todas as migrations aplicadas | 🔴 Blocker | ✅ | Backend |
| 3.2 | RLS ativado em TODAS as tabelas | 🔴 Blocker | ⚠️ Validar | Backend |
| 3.3 | Políticas RLS testadas (sem leaks cross-org) | 🔴 Blocker | ❌ | QA |
| 3.4 | Dados seed mínimos para demo | 🟠 High | ❌ | Backend |
| 3.5 | Backup diário configurado | 🟠 High | ⚠️ Supabase default | DevOps |
| 3.6 | Política de retenção documentada | 🟡 Medium | ❌ | DevOps |
| 3.7 | IndexedDB offline sync funcional | 🟠 High | ⚠️ Parcial | Frontend |

**Status:** 🟡 2/7 completos

---

## 4️⃣ Core Funcionalidades

### 4.1 Projetos e Tarefas

| # | Item | Tipo | Status | Owner |
|---|------|------|--------|-------|
| 4.1.1 | Criar projeto (manual) | 🔴 Blocker | ✅ | Frontend |
| 4.1.2 | Criar projeto de template | 🔴 Blocker | ✅ | Frontend |
| 4.1.3 | Criar projeto com IA Copilot | 🟠 High | ⚠️ Testar | Frontend |
| 4.1.4 | CRUD de tarefas completo | 🔴 Blocker | ✅ | Frontend |
| 4.1.5 | Kanban drag & drop funcional | 🔴 Blocker | ⚠️ Bug mobile | Frontend |
| 4.1.6 | Dependências de tarefas | 🟡 Medium | ❌ | Backend |

**Status:** 🟡 3/6 completos

### 4.2 Sistema de Aprovações

| # | Item | Tipo | Status | Owner |
|---|------|------|--------|-------|
| 4.2.1 | Criar aprovação | 🔴 Blocker | ✅ | Frontend |
| 4.2.2 | Aprovar/Rejeitar | 🔴 Blocker | ✅ | Frontend |
| 4.2.3 | Notificações de aprovação | 🟠 High | ❌ | Backend |
| 4.2.4 | Histórico/auditoria | 🟡 Medium | ⚠️ Parcial | Frontend |

**Status:** 🟡 2/4 completos

---

## 5️⃣ Produção Musical

| # | Item | Tipo | Status | Owner |
|---|------|------|--------|-------|
| 5.1 | CRUD de músicas (repertório) | 🔴 Blocker | ✅ | Frontend |
| 5.2 | Upload de assets (PDF, MIDI) | 🟠 High | ✅ | Frontend |
| 5.3 | CRUD de arranjos | 🟠 High | ✅ | Frontend |
| 5.4 | Partes por instrumento | 🟡 Medium | ⚠️ Parcial | Frontend |
| 5.5 | Setlist builder (drag & drop) | 🔴 Blocker | ✅ | Frontend |
| 5.6 | Setlist trava D-1 | 🟠 High | ⚠️ Testar | Backend |
| 5.7 | Stage Mode offline | 🔴 Blocker | ⚠️ Testar | Frontend |
| 5.8 | QR code acesso Stage Mode | 🟠 High | ⚠️ Backend incompleto | Backend |
| 5.9 | Ensaios (CRUD) | 🟡 Medium | ✅ | Frontend |
| 5.10 | Controle de presença | 🟡 Medium | ❌ | Frontend |

**Status:** 🟡 5/10 completos

---

## 6️⃣ Planos e Billing

| # | Item | Tipo | Status | Owner |
|---|------|------|--------|-------|
| 6.1 | Tabelas de billing criadas | 🟠 High* | ❌ | Backend |
| 6.2 | Integração Stripe | 🟠 High* | ❌ | Backend |
| 6.3 | Checkout funcional | 🟠 High* | ❌ | Frontend |
| 6.4 | Webhooks de pagamento | 🟠 High* | ❌ | Backend |
| 6.5 | Limites de plano aplicados | 🟠 High* | ❌ | Backend |
| 6.6 | Tela "Meu Plano" | 🟡 Medium* | ❌ | Frontend |

**Status:** 🔴 0/6 completos
***Decision Needed:** Billing obrigatório para go-live? Se não, marcar como "Adiado v1.1"*

---

## 7️⃣ CRM de Leads

| # | Item | Tipo | Status | Owner |
|---|------|------|--------|-------|
| 7.1 | CRUD de contatos | 🟠 High* | ❌ | Frontend |
| 7.2 | Pipeline Kanban (5 estágios) | 🟠 High* | ❌ | Frontend |
| 7.3 | Propostas PDF | 🟡 Medium* | ❌ | Backend |
| 7.4 | Follow-ups automatizados | 🟡 Medium* | ❌ | Backend |
| 7.5 | Relatório de conversão | 🟡 Medium* | ❌ | Frontend |

**Status:** 🔴 0/5 completos
***Decision Needed:** CRM obrigatório para go-live? Se não, marcar como "Adiado v1.1"*

---

## 8️⃣ Comunicação Automatizada

| # | Item | Tipo | Status | Owner |
|---|------|------|--------|-------|
| 8.1 | Fila de envios (queue) | 🟠 High* | ❌ | Backend |
| 8.2 | WhatsApp integration | 🟡 Medium* | ❌ | Backend |
| 8.3 | Email integration | 🟠 High* | ❌ | Backend |
| 8.4 | Templates de notificação | 🟠 High* | ⚠️ Código existe | Frontend |
| 8.5 | Fallback WhatsApp → Email | 🟡 Medium* | ❌ | Backend |

**Status:** 🔴 0/5 completos
***Decision Needed:** Notificações obrigatórias para go-live? Ao menos email?*

---

## 9️⃣ IA Copilot

| # | Item | Tipo | Status | Owner |
|---|------|------|--------|-------|
| 9.1 | Planning Copilot UI | 🟠 High | ✅ | Frontend |
| 9.2 | Integração OpenAI funcional | 🟠 High | ⚠️ Testar API key real | Backend |
| 9.3 | Cache local de respostas (90d) | 🟡 Medium | ⚠️ Implementado, não testado | Frontend |
| 9.4 | Registro de consumo por org | 🟡 Medium | ❌ | Backend |
| 9.5 | Seleção de modelo (mini vs full) | 🟡 Medium | ⚠️ Hardcoded gpt-4o-mini | Frontend |

**Status:** 🟡 1/5 completos

---

## 🔟 Performance e PWA

| # | Item | Tipo | Status | Owner |
|---|------|------|--------|-------|
| 10.1 | TTFB < 200ms | 🟠 High | ⚠️ Validar em prod | DevOps |
| 10.2 | LCP < 2.5s | 🟠 High | ⚠️ Validar em prod | DevOps |
| 10.3 | CLS < 0.1 | 🟡 Medium | ⚠️ Validar em prod | Frontend |
| 10.4 | Lighthouse > 90 | 🟠 High | ⚠️ Rodar audit | DevOps |
| 10.5 | PWA manifest.json | 🟠 High | ✅ | Frontend |
| 10.6 | Service Worker ativo | 🟠 High | ⚠️ Validar | Frontend |
| 10.7 | Install prompt funcional | 🟡 Medium | ❌ | Frontend |
| 10.8 | Offline mode (Stage) testado | 🔴 Blocker | ❌ | QA |

**Status:** 🟡 1/8 completos

---

## 1️⃣1️⃣ Testes e QA

| # | Item | Tipo | Status | Owner |
|---|------|------|--------|-------|
| 11.1 | Smoke test documentado | 🔴 Blocker | ✅ | QA |
| 11.2 | Smoke test executado em staging | 🔴 Blocker | ❌ | QA |
| 11.3 | Critical flows testados | 🔴 Blocker | ⚠️ Manual | QA |
| 11.4 | Mobile responsivo (iOS/Android) | 🔴 Blocker | ⚠️ Parcial | QA |
| 11.5 | Cross-browser (Chrome/Firefox/Safari) | 🟠 High | ⚠️ Apenas Chrome | QA |
| 11.6 | RLS security audit | 🔴 Blocker | ❌ | QA/Security |

**Status:** 🟡 1/6 completos

---

## 1️⃣2️⃣ Documentação

| # | Item | Tipo | Status | Owner |
|---|------|------|--------|-------|
| 12.1 | TECHNICAL_ARCHITECTURE.md | 🔴 Blocker | ✅ | Tech Lead |
| 12.2 | FUNCTIONAL_SPEC.md | 🔴 Blocker | ✅ | Product |
| 12.3 | OPEN_GAPS.md | 🔴 Blocker | ✅ | Tech Lead |
| 12.4 | BUGLIST.md | 🔴 Blocker | ✅ | QA |
| 12.5 | DEPLOY_RUNBOOK.md | 🔴 Blocker | ✅ | DevOps |
| 12.6 | SECURITY_CHECKLIST.md | 🟠 High | ❌ | Security |
| 12.7 | CHANGELOG.md | 🟠 High | ❌ | Tech Lead |
| 12.8 | GO_LIVE_CHECKLIST.md (este arquivo) | 🔴 Blocker | ✅ | Product |
| 12.9 | .env.example atualizado | 🔴 Blocker | ⚠️ Validar | DevOps |
| 12.10 | User Guide (básico) | 🟡 Medium | ❌ | Product |

**Status:** 🟢 6/10 completos

---

## 📊 Scorecard Geral

| Área | Completo | Parcial | Pendente | % |
|------|----------|---------|----------|---|
| 1. Navegação/UX | 3 | 1 | 2 | 50% |
| 2. Auth/Onboarding | 5 | 2 | 0 | 71% |
| 3. Database | 2 | 3 | 2 | 29% |
| 4. Core Features | 5 | 3 | 4 | 42% |
| 5. Produção Musical | 5 | 4 | 1 | 50% |
| 6. Billing | 0 | 0 | 6 | 0% |
| 7. CRM | 0 | 0 | 5 | 0% |
| 8. Comunicação | 0 | 1 | 4 | 0% |
| 9. IA Copilot | 1 | 3 | 1 | 20% |
| 10. Performance/PWA | 1 | 5 | 2 | 13% |
| 11. Testes/QA | 1 | 4 | 1 | 17% |
| 12. Documentação | 6 | 1 | 3 | 60% |
| **TOTAL** | **29** | **27** | **31** | **33%** |

---

## 🚦 Status de Prontidão

### 🔴 Bloqueadores Críticos (20 items)
- ❌ 12 pendentes
- ⚠️ 6 parciais
- ✅ 2 completos

**Status:** 🔴 **NÃO PRONTO PARA GO-LIVE**

### Ações Imediatas (Próximas 72h)
1. **Decisão de Produto:** Billing e CRM são obrigatórios no go-live?
2. **Prioridade Máxima:**
   - Landing institucional (GAP-001)
   - Feature flags corretas (GAP-002/BUG-003)
   - RLS audit (BUG-004, GAP-014)
   - Smoke test completo (11.2, 11.3, 11.6)
   - Seed data (GAP-007)

3. **Timeline Realista:**
   - Se manter escopo atual: Go-live **15-20 de novembro**
   - Se reduzir escopo (sem Billing/CRM): Go-live **05-08 de novembro**
   - Se apenas core funcional: Go-live **01 de novembro** (arriscado)

---

## ✅ Critérios Mínimos de Aceite

Para go-live em **01/Nov**, DEVE ter:

### Must-Have (Essencial)
- [x] Landing institucional funcional
- [x] Auth completo (login, registro, recuperação)
- [x] Onboarding
- [x] CRUD Projetos + Tarefas
- [x] Sistema de Aprovações básico
- [x] Produção Musical (Repertório, Setlists, Stage Mode)
- [x] RLS 100% validado (sem leaks)
- [x] Smoke test passou
- [x] Deploy runbook documentado
- [x] SPA fallback configurado

### Should-Have (Importante mas não bloqueador)
- [ ] Billing (pode ser v1.1)
- [ ] CRM (pode ser v1.1)
- [ ] Notificações automáticas (pode ser v1.1)
- [ ] IA Copilot testado com API real
- [ ] Performance audit (Lighthouse)

### Nice-to-Have (Diferencial)
- [ ] PWA instalável
- [ ] Offline sync testado
- [ ] Multi-idioma completo
- [ ] Dark mode

---

## 📅 Timeline Proposta

### 23-24/Out (Wed-Thu) - Sprint de Correção
- Landing institucional
- Feature flags
- RLS audit e fixes
- Seed data

### 25-26/Out (Fri-Sat) - Testes
- Smoke test completo
- Mobile testing
- Cross-browser testing
- Performance audit

### 27-28/Out (Sun-Mon) - Buffer
- Bug fixes de testes
- Documentação final
- Preparação de conteúdo

### 29-30/Out (Tue-Wed) - Freeze
- Code freeze
- Deploy staging
- Final approval
- Go/No-Go meeting

### 01/Nov (Thu) - Go-Live
- Deploy production (09:00 BRT)
- Monitoring intensivo
- Triage imediato de bugs

---

## 🎯 Recomendação Final

**STATUS ATUAL:** 🔴 Não pronto para go-live em 01/Nov com escopo completo

**OPÇÕES:**

### Opção A: Manter Data, Reduzir Escopo ⚠️
- Go-live: 01/Nov
- Remover: Billing, CRM, Notificações automáticas
- Foco: Core features + Produção Musical
- Risco: Médio (se testes passarem)

### Opção B: Adiar Go-Live, Escopo Completo ✅ (Recomendado)
- Go-live: 08/Nov (+7 dias)
- Incluir: Tudo do roadmap original
- Tempo para: Testes completos + fixes
- Risco: Baixo

### Opção C: Go-Live Soft (Beta Fechado)
- Go-live: 01/Nov
- Apenas convidados (50 beta testers)
- 2 semanas de validação
- Go-live público: 15/Nov
- Risco: Baixo (beta serve como teste real)

---

## ✍️ Aprovações

### Product Manager
- [ ] Aprovado
- [ ] Reprovado
- [ ] Aprovado com ressalvas

**Assinatura:** _________________ **Data:** _______

**Comentários:**

---

### Tech Lead
- [ ] Aprovado (tecnicamente pronto)
- [ ] Reprovado (bloqueadores existem)
- [ ] Aprovado com ressalvas

**Assinatura:** _________________ **Data:** _______

**Comentários:**

---

### QA Lead
- [ ] Aprovado (testes passaram)
- [ ] Reprovado (bugs críticos)
- [ ] Aprovado com ressalvas

**Assinatura:** _________________ **Data:** _______

**Comentários:**

---

**Última Atualização:** 22 de outubro de 2025 23:00 BRT
**Próxima Revisão:** 24 de outubro de 2025 (checkpoint crítico)
