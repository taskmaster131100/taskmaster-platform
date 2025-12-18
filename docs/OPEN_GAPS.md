# TaskMaster - Gaps Abertos (Open Gaps)

**Data:** 22 de outubro de 2025
**Status:** Pré Go-Live (Target: 01 de novembro)

---

## 📊 Resumo Executivo

| Severidade | Quantidade | Críticos para Go-Live |
|------------|------------|----------------------|
| 🔴 Crítica | 8 | 8 |
| 🟠 Alta | 15 | 10 |
| 🟡 Média | 23 | 5 |
| 🟢 Baixa | 12 | 0 |
| **Total** | **58** | **23** |

**Status:** ⚠️ 23 gaps críticos/altos devem ser resolvidos antes do go-live

---

## 🔴 GAPS CRÍTICOS (Bloqueadores de Go-Live)

### GAP-001: Landing Page Institucional Ausente
- **Área:** UX/Navegação
- **Severidade:** 🔴 Crítica
- **Status:** ❌ Pendente
- **Impacto:** Usuários novos não veem identidade da marca
- **Descrição:**
  - Atualmente `src/main.tsx` carrega `App-Music.tsx` como padrão
  - Produção Musical está como landing inicial (incorreto)
  - Falta tela institucional com gradiente azul-roxo-rosa, logo e narrativa
- **Proposta:**
  - Criar/restaurar landing institucional como `src/App-Landing.tsx`
  - Mudar `main.tsx` para carregar landing como default
  - Produção Musical deve ser acessada via menu lateral
- **Esforço:** 4-6 horas
- **Owner:** Frontend Dev

### GAP-002: Feature Flag VITE_ENABLE_CLASSIC_ROUTES Não Funciona
- **Área:** Configuração
- **Severidade:** 🔴 Crítica
- **Status:** ⚠️ Parcialmente implementado
- **Impacto:** Rotas de preview sempre visíveis/acessíveis
- **Descrição:**
  - Flag está em `.env` mas não em `.env.production`
  - `src/main.tsx` usa HashRouter quando flag=true (correto)
  - Mas rotas `/welcome`, `/lobby`, `/mail` devem estar escondidas em prod
- **Proposta:**
  - Adicionar `VITE_ENABLE_CLASSIC_ROUTES=false` em `.env.production`
  - Remover rotas do `App.tsx` quando flag=false
  - Remover seção "Preview" do menu quando flag=false
- **Esforço:** 1-2 horas
- **Owner:** Frontend Dev

### GAP-003: Sistema de Billing Não Implementado
- **Área:** Financeiro/Monetização
- **Severidade:** 🔴 Crítica (se go-live com cobrança)
- **Status:** ❌ Não implementado
- **Impacto:** Impossível cobrar usuários
- **Descrição:**
  - Tabelas `subscriptions`, `plans`, `invoices` não existem
  - Sem integração com Stripe/Paddle
  - Sem tela de checkout
  - Sem webhook de pagamento
  - Feature flag `VITE_FEATURE_BILLING=false`
- **Proposta:**
  - **Opção A (Go-Live):** Manter beta gratuito, adiar billing pós-launch
  - **Opção B (Implementar):**
    - Criar migration com tabelas de billing
    - Integrar Stripe Checkout
    - Implementar webhooks
    - Criar tela "Meu Plano"
- **Esforço:**
  - Opção A: 0 horas (documentar decisão)
  - Opção B: 20-30 horas
- **Owner:** Backend Dev + Product Manager
- **Decisão Necessária:** ⚠️ Definir até 24/out

### GAP-004: Limites de Plano Não Aplicados
- **Área:** Lógica de Negócio
- **Severidade:** 🔴 Crítica
- **Status:** ❌ Não implementado
- **Impacto:** Usuários podem ultrapassar limites sem bloqueio
- **Descrição:**
  - Planos definidos (Individual, Studio, Enterprise) mas não enforced
  - Sem validação de:
    - Número máximo de artistas
    - Número máximo de projetos
    - Storage usado
    - Créditos de IA
- **Proposta:**
  - Criar tabela `organization_limits` com campos:
    - max_artists, max_projects, max_storage_gb, max_ai_credits
  - Middleware de validação em criação de artista/projeto
  - UI mostrando uso vs. limite ("3 de 10 artistas")
  - Bloqueio suave com modal "Upgrade plano"
- **Esforço:** 6-8 horas
- **Owner:** Backend Dev

### GAP-005: Notificações WhatsApp/Email Não Funcionam
- **Área:** Comunicação
- **Severidade:** 🔴 Crítica
- **Status:** ❌ Não implementado
- **Impacto:** Automações de comunicação não operam
- **Descrição:**
  - Templates definidos no código mas sem envio real
  - Sem integração com Twilio/WhatsApp Business API
  - Sem integração com SendGrid/Email
  - Fila de envios não implementada
  - Follow-ups de CRM não automatizados
- **Proposta:**
  - **Opção A (MVP):** Apenas email via SMTP
  - **Opção B (Completo):** WhatsApp + Email + Fila
  - Criar Edge Functions:
    - `send-notification` (dispatcher)
    - `process-whatsapp-queue`
    - `process-email-queue`
  - Implementar retry logic (3 tentativas)
- **Esforço:**
  - Opção A: 4-6 horas
  - Opção B: 12-16 horas
- **Owner:** Backend Dev
- **Decisão Necessária:** ⚠️ Definir até 24/out

### GAP-006: CRM Leads Não Implementado
- **Área:** CRM
- **Severidade:** 🔴 Crítica (se funcionalidade prometida)
- **Status:** ❌ Não implementado
- **Impacto:** Feature anunciada mas não disponível
- **Descrição:**
  - Sem tabelas `leads`, `proposals`, `activities`
  - Sem UI de CRM
  - Sem pipeline de vendas
  - Sem geração de propostas PDF
  - Sem relatório de conversão
- **Proposta:**
  - **Opção A:** Remover CRM do roadmap de go-live, lançar em v1.1
  - **Opção B:** Implementar MVP:
    - CRUD de leads
    - Pipeline Kanban (5 estágios)
    - Proposta básica (template texto)
    - Relatório simples
- **Esforço:**
  - Opção A: 0 horas (comunicar mudança)
  - Opção B: 16-20 horas
- **Owner:** Product Manager + Frontend Dev
- **Decisão Necessária:** ⚠️ Definir até 24/out

### GAP-007: Dados Seed para Teste Ausentes
- **Área:** Database
- **Severidade:** 🔴 Crítica
- **Status:** ❌ Não implementado
- **Impacto:** Ambiente de demo vazio, dificulta testes
- **Descrição:**
  - Sem script de seed para popular:
    - 1 organização de exemplo
    - 2-3 artistas
    - 5 projetos (vários status)
    - 20 tarefas
    - 2 setlists
    - 10 músicas
    - Templates de pipeline
- **Proposta:**
  - Criar `supabase/seed.sql` com dados realistas
  - Script idempotente (pode rodar múltiplas vezes)
  - Dados em PT-BR
- **Esforço:** 3-4 horas
- **Owner:** Backend Dev

### GAP-008: Testes E2E/Smoke Não Existem
- **Área:** QA
- **Severidade:** 🔴 Crítica
- **Status:** ❌ Não implementado
- **Impacto:** Deploys sem validação automatizada
- **Descrição:**
  - Sem suite de testes
  - Sem CI/CD pipeline
  - Sem smoke test pós-deploy
  - Deploys são "hope and pray"
- **Proposta:**
  - **MVP:** Smoke test manual documentado (checklist)
  - **Ideal:** Playwright E2E básico:
    - Login → Create Project → Create Task → Logout
  - CI: GitHub Actions rodando testes em cada PR
- **Esforço:**
  - MVP: 2 horas (documentação)
  - Ideal: 8-12 horas (setup + testes)
- **Owner:** QA/DevOps

---

## 🟠 GAPS ALTA PRIORIDADE

### GAP-009: Financeiro (Receitas/Despesas) Sem UI
- **Área:** Financeiro
- **Severidade:** 🟠 Alta
- **Status:** ⚠️ Tabelas existem, sem UI
- **Proposta:** Criar páginas básicas de CRUD
- **Esforço:** 6-8 horas

### GAP-010: Aprovações Musicais Não Conectadas
- **Área:** Produção Musical
- **Severidade:** 🟠 Alta
- **Status:** ⚠️ Tabela existe, lógica incompleta
- **Proposta:** Integrar approval workflow com arranjos
- **Esforço:** 4-6 horas

### GAP-011: Convites de Organização Não Funcionam
- **Área:** Autenticação
- **Severidade:** 🟠 Alta
- **Status:** ⚠️ Tabela `invite_codes` existe, fluxo incompleto
- **Proposta:** Implementar geração + validação + associação
- **Esforço:** 4-5 horas

### GAP-012: Sincronização Offline Não Testada
- **Área:** Offline/PWA
- **Severidade:** 🟠 Alta
- **Status:** ⚠️ IndexedDB implementado, sync não testado
- **Proposta:** Testar extensivamente conflitos e merge
- **Esforço:** 6-8 horas

### GAP-013: QR Code de Stage Mode Não Gera Tokens
- **Área:** Produção Musical
- **Severidade:** 🟠 Alta
- **Status:** ⚠️ UI existe, backend incompleto
- **Proposta:** Implementar geração de tokens + validação
- **Esforço:** 3-4 horas

### GAP-014: Auditoria (Audit Logs) Não Implementada
- **Área:** Segurança/Compliance
- **Severidade:** 🟠 Alta
- **Status:** ❌ Não implementado
- **Proposta:** Criar tabela + triggers para logar ações críticas
- **Esforço:** 5-6 horas

### GAP-015: Backup Automático Não Configurado
- **Área:** Infra/Database
- **Severidade:** 🟠 Alta
- **Status:** ❌ Supabase tem backup padrão, mas sem política documentada
- **Proposta:** Documentar política + configurar retenção
- **Esforço:** 1-2 horas

### GAP-016: Monitoramento de Erros Não Configurado
- **Área:** Observabilidade
- **Severidade:** 🟠 Alta
- **Status:** ❌ Sem Sentry/LogRocket
- **Proposta:** Integrar Sentry (frontend + edge functions)
- **Esforço:** 2-3 horas

### GAP-017: Documentos Técnicos (Stage Plot) Apenas Upload
- **Área:** Produção Musical
- **Severidade:** 🟠 Alta
- **Status:** ⚠️ Upload funciona, sem visualização/edição
- **Proposta:** Viewer inline de PDFs
- **Esforço:** 3-4 horas

### GAP-018: Músicos Sem Perfil Próprio
- **Área:** Produção Musical
- **Severidade:** 🟠 Alta
- **Status:** ⚠️ Tabela `musician_profiles` existe, sem UI
- **Proposta:** Página de perfil do músico (preferências, transposição)
- **Esforço:** 4-5 horas

### GAP-019: Multi-Idioma Incompleto
- **Área:** i18n
- **Severidade:** 🟠 Alta
- **Status:** ⚠️ Suporte estrutural existe, traduções incompletas
- **Proposta:** Completar traduções PT + adicionar EN/ES básico
- **Esforço:** 8-10 horas

### GAP-020: Relatórios/KPIs Apenas Mockup
- **Área:** Analytics
- **Severidade:** 🟠 Alta
- **Status:** ⚠️ UI placeholder, sem queries reais
- **Proposta:** Implementar queries + gráficos reais
- **Esforço:** 10-12 horas

### GAP-021: Planning Copilot (IA) Não Testado em Produção
- **Área:** IA
- **Severidade:** 🟠 Alta
- **Status:** ⚠️ Código existe, sem testes com chave real
- **Proposta:** Testar com OpenAI API key válida + cache
- **Esforço:** 3-4 horas

### GAP-022: Rate Limiting Não Implementado
- **Área:** Segurança/Performance
- **Severidade:** 🟠 Alta
- **Status:** ❌ Sem proteção contra abuso
- **Proposta:** Implementar rate limit (100 req/min por usuário)
- **Esforço:** 4-5 horas

### GAP-023: Configurações de Notificação Não Salvam
- **Área:** Preferências
- **Severidade:** 🟠 Alta
- **Status:** ⚠️ UI existe, sem persistência
- **Proposta:** Salvar preferências em `user_preferences` table
- **Esforço:** 2-3 horas

---

## 🟡 GAPS MÉDIA PRIORIDADE

### GAP-024: Busca Global Não Funciona
- **Área:** UX
- **Severidade:** 🟡 Média
- **Proposta:** Implementar busca full-text (projetos, tarefas, músicas)
- **Esforço:** 5-6 horas

### GAP-025: Filtros Avançados Limitados
- **Área:** UX
- **Proposta:** Adicionar filtros por data, tags, status em todas as listas
- **Esforço:** 4-5 horas

### GAP-026: Drag & Drop Nem Sempre Funciona
- **Área:** Bug/UX
- **Proposta:** Debugar @hello-pangea/dnd em mobile
- **Esforço:** 2-3 horas

### GAP-027: Anexos Sem Limite de Tamanho
- **Área:** Storage
- **Proposta:** Limitar upload (10MB por arquivo, 1GB por org)
- **Esforço:** 2-3 horas

### GAP-028: Versionamento de Arranjos Confuso
- **Área:** Produção Musical
- **Proposta:** Melhorar UI de diff entre versões
- **Esforço:** 4-5 horas

### GAP-029: Ensaios Sem Check-in GPS
- **Área:** Produção Musical
- **Proposta:** Implementar geolocation para marcar presença
- **Esforço:** 3-4 horas

### GAP-030: Setlist Sem Estatísticas de Duração
- **Área:** Produção Musical
- **Proposta:** Calcular e exibir duração total + por música
- **Esforço:** 2-3 horas

### GAP-031: Stage Mode Sem Scroll Automático
- **Área:** Produção Musical
- **Proposta:** Adicionar scroll automático de letra (karaoke-style)
- **Esforço:** 4-5 horas

### GAP-032: Notificações Push Não Implementadas
- **Área:** Notificações
- **Proposta:** Web Push Notifications (Service Worker)
- **Esforço:** 5-6 horas

### GAP-033: Export de Dados Incompleto
- **Área:** Compliance/LGPD
- **Proposta:** Permitir export completo de dados do usuário
- **Esforço:** 4-5 horas

### GAP-034: Termos de Uso e Privacidade Ausentes
- **Área:** Legal
- **Proposta:** Adicionar páginas /terms e /privacy
- **Esforço:** 1-2 horas (+ revisão jurídica)

### GAP-035: Onboarding Não Traduzido
- **Área:** i18n
- **Proposta:** Traduzir slides de onboarding para EN/ES
- **Esforço:** 2 horas

### GAP-036: Welcome Modal Aparece Toda Vez
- **Área:** Bug
- **Proposta:** Limitar a 1x por dia (já implementado, validar)
- **Esforço:** 1 hora

### GAP-037: Animações de Transição Ausentes
- **Área:** UX/Polish
- **Proposta:** Adicionar transições suaves entre páginas
- **Esforço:** 3-4 horas

### GAP-038: Dark Mode Não Implementado
- **Área:** UX
- **Proposta:** Tema dark (exceto Stage Mode que já é dark)
- **Esforço:** 6-8 horas

### GAP-039: Atalhos de Teclado Não Existem
- **Área:** UX/Produtividade
- **Proposta:** Hotkeys (Ctrl+K busca, Ctrl+N novo, etc.)
- **Esforço:** 4-5 horas

### GAP-040: Comentários em Tarefas Não Implementados
- **Área:** Colaboração
- **Proposta:** Sistema de comentários + mentions
- **Esforço:** 6-8 horas

### GAP-041: Timeline de Projeto Não Visual
- **Área:** Projetos
- **Proposta:** Gantt chart ou timeline visual
- **Esforço:** 8-10 horas

### GAP-042: Integrações com Google Calendar Placeholder
- **Área:** Integrações
- **Proposta:** Sync real com Google Calendar
- **Esforço:** 10-12 horas

### GAP-043: Templates de Email Não Customizáveis
- **Área:** Comunicação
- **Proposta:** Editor de templates (drag & drop)
- **Esforço:** 12-15 horas

### GAP-044: Dashboard Não Personalizável
- **Área:** UX
- **Proposta:** Widgets arrastavéis (drag & drop dashboard)
- **Esforço:** 10-12 horas

### GAP-045: Sem Modo Apresentação
- **Área:** Produção Musical
- **Proposta:** Modo fullscreen para apresentar setlist (TV/projetor)
- **Esforço:** 3-4 horas

### GAP-046: Histórico de Alterações Não Visível
- **Área:** Auditoria
- **Proposta:** Activity feed por projeto/tarefa
- **Esforço:** 5-6 horas

---

## 🟢 GAPS BAIXA PRIORIDADE

### GAP-047: Logo da Organização Não Aparece em Todos os Lugares
- **Área:** Branding
- **Esforço:** 1-2 horas

### GAP-048: Favicon Não Customizado
- **Área:** Branding
- **Esforço:** 30 min

### GAP-049: Meta Tags SEO Incompletas
- **Área:** SEO
- **Esforço:** 1 hora

### GAP-050: Sitemap.xml Estático
- **Área:** SEO
- **Proposta:** Gerar dinamicamente
- **Esforço:** 2-3 horas

### GAP-051: Sem Página 404 Customizada
- **Área:** UX
- **Esforço:** 1 hora

### GAP-052: Loading States Inconsistentes
- **Área:** UX
- **Proposta:** Padronizar spinners/skeletons
- **Esforço:** 2-3 horas

### GAP-053: Empty States Genéricos
- **Área:** UX
- **Proposta:** Melhorar ilustrações e mensagens
- **Esforço:** 3-4 horas

### GAP-054: Tooltips Faltando
- **Área:** UX
- **Proposta:** Adicionar em ícones/botões
- **Esforço:** 2-3 horas

### GAP-055: Sem Tour Guiado Pós-Onboarding
- **Área:** UX
- **Proposta:** Tour interativo (highlight features)
- **Esforço:** 6-8 horas

### GAP-056: Ícones Misturados (Lucide + Custom)
- **Área:** Design System
- **Proposta:** Padronizar apenas Lucide
- **Esforço:** 2 horas

### GAP-057: Cores Não Seguem Design System
- **Área:** Design System
- **Proposta:** Auditoria de cores + padronização
- **Esforço:** 4-5 horas

### GAP-058: Espaçamento Inconsistente
- **Área:** Design System
- **Proposta:** Aplicar Tailwind spacing system (8px)
- **Esforço:** 3-4 horas

---

## 📋 Plano de Ação (Priorização para Go-Live)

### ✅ Deve Resolver Antes de Go-Live (23 gaps)
- GAP-001 a GAP-008 (Críticos)
- GAP-009 a GAP-023 (Altos prioritários)

### ⏳ Pode Adiar para v1.1 (35 gaps)
- GAP-024 a GAP-058 (Médios e Baixos)

---

## 📊 Estimativa de Esforço Total

| Prioridade | Total de Horas | Dias (8h/dia) |
|------------|----------------|---------------|
| Críticos | 58-86 horas | 7-11 dias |
| Altos | 78-94 horas | 10-12 dias |
| Médios | 110-135 horas | 14-17 dias |
| Baixos | 25-32 horas | 3-4 dias |
| **TOTAL** | **271-347 horas** | **34-43 dias** |

**Para Go-Live (Críticos + Altos):** 136-180 horas = **17-23 dias de dev**

---

## 🎯 Recomendações

1. **Decisões Urgentes (24/out):**
   - Billing: grátis ou pago no go-live?
   - CRM: v1.0 ou v1.1?
   - Notificações: apenas email ou WhatsApp também?

2. **Foco Imediato:**
   - GAP-001 (Landing)
   - GAP-002 (Feature flags)
   - GAP-007 (Seed data)
   - GAP-008 (Smoke tests)

3. **Paralelize:**
   - Time 1: Frontend (GAP-001, GAP-002)
   - Time 2: Backend (GAP-003, GAP-004, GAP-005)
   - Time 3: QA (GAP-007, GAP-008)

4. **Comunicar:**
   - Atualizar roadmap público
   - Informar beta testers sobre features adiadas
   - Preparar FAQ sobre limitações da v1.0

---

**Última Atualização:** 22 de outubro de 2025
**Próxima Revisão:** 25 de outubro (checkpoint pré go-live)
