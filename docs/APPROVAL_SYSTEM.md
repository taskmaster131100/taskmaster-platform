# Sistema de Aprovações PRO

## Visão Geral

Sistema completo de aprovações com RACI, SLA, Freeze Window e Auditoria implementado para o TaskMaster.

## Funcionalidades Implementadas

### 1. Modelagem de Dados

#### Tabelas Criadas:

**organizations**
- Gerenciamento multi-tenant
- Configurações por organização

**user_organizations**
- Relação usuário-organização
- Roles: admin, manager, member, viewer

**tasks**
- Tarefas com suporte a aprovação
- Workstreams: conteudo, shows, logistica, estrategia, geral
- Status incluindo pending_approval, approved

**approval_rules**
- Regras de aprovação por workstream e task_type
- required_roles: papéis necessários para aprovar
- sla_hours: prazo em horas para aprovação
- freeze_window_days: período de bloqueio antes do deadline

**task_approvals**
- Solicitações de aprovação
- Status: pending, approved, rejected, escalated, cancelled
- SLA deadline tracking
- Snapshot do estado da tarefa

**approval_history**
- Trilha de auditoria completa
- Ações: requested, approved, rejected, escalated, commented, cancelled
- Snapshots e comentários

### 2. Serviço de Aprovações (approvalService.ts)

#### Principais Funções:

- `requestApproval()` - Solicitar aprovação com regras automáticas
- `approveApproval()` - Aprovar com validação de freeze window
- `rejectApproval()` - Rejeitar (comentário obrigatório)
- `escalateApproval()` - Escalar aprovação
- `getApprovalHistory()` - Histórico completo
- `getPendingApprovals()` - Aprovações pendentes
- `getOverduePendingApprovals()` - Aprovações com SLA vencido
- `checkAndEscalateOverdue()` - Escalonamento automático

#### Recursos:

- **SLA Tracking**: Monitora prazos e calcula status (safe, warning, critical, expired)
- **Freeze Window**: Bloqueia mudanças próximo ao deadline
- **Snapshots**: Mantém histórico do estado da tarefa
- **Escalation**: Automática quando SLA expira

### 3. Interface de Usuário

#### ApprovalsDrawer (Melhorado)

- Lista de aprovações pendentes
- Indicadores visuais de SLA:
  - Verde: safe (>12h)
  - Amarelo: warning (4-12h)
  - Laranja: critical (<4h)
  - Vermelho: expired (vencido)
- Badge de Freeze Window ativo
- Área de comentário (obrigatório para rejeição)
- Timeline de histórico com ações e comentários
- Snapshot da solicitação
- Botões Aprovar/Rejeitar com confirmação

#### TaskCard (Integrado)

- Indica tarefas que requerem aprovação
- Mostra status da aprovação
- Badge de Freeze Window quando ativo
- Contador de SLA
- Botão "Solicitar Aprovação"

### 4. Regras de Aprovação Pré-configuradas

Cada organização recebe automaticamente:

1. **Master Final (Conteúdo)**
   - Roles: A&R, Produtor Musical
   - SLA: 48h
   - Freeze: 7 dias

2. **Capa Final (Conteúdo)**
   - Roles: Diretor de Arte, Marketing
   - SLA: 24h
   - Freeze: 5 dias

3. **Rider Técnico (Shows)**
   - Roles: Produtor de Shows, Diretor Técnico
   - SLA: 72h
   - Freeze: 10 dias

4. **Orçamento (Logística)**
   - Roles: Financeiro, Gerente de Projeto
   - SLA: 24h
   - Freeze: 3 dias

### 5. Segurança (RLS)

Todas as tabelas possuem Row Level Security:
- Usuários só veem dados da própria organização
- Histórico é append-only
- Políticas específicas por role (admin, manager)

### 6. Feature Flags

Sistema oculta automaticamente:
- ❌ Billing (VITE_FEATURE_BILLING=false)
- ❌ Subscriptions (VITE_FEATURE_SUBSCRIPTIONS=false)
- ❌ Ownership (VITE_FEATURE_OWNERSHIP=false)

Componentes afetados:
- PricingPlans.tsx
- SubscriptionManagement.tsx
- BillingHistory.tsx
- CheckoutPage.tsx

## Fluxo de Trabalho

### 1. Criação de Tarefa
```typescript
// Criar tarefa com requires_approval=true
task = {
  title: "Aprovar master final",
  workstream: "conteudo",
  task_type: "master_final",
  requires_approval: true,
  deadline: "2025-11-01"
}
```

### 2. Solicitação de Aprovação
```typescript
await approvalService.requestApproval(
  taskId,
  orgId,
  userId,
  taskSnapshot
);
// - Busca regra automática
// - Calcula SLA deadline
// - Verifica freeze window
// - Cria registro de approval
// - Adiciona ao histórico
// - Atualiza status da tarefa
```

### 3. Aprovação/Rejeição
```typescript
// Aprovar
await approvalService.approveApproval(
  approvalId,
  userId,
  comment
);

// Rejeitar (comentário obrigatório)
await approvalService.rejectApproval(
  approvalId,
  userId,
  comment
);
```

### 4. Escalonamento Automático
```typescript
// Executar periodicamente (cron/worker)
await approvalService.checkAndEscalateOverdue(orgId);
```

## Critérios de Aceite (Cumpridos)

✅ Criar tarefa → solicitar aprovação
✅ Receber notificação (estrutura pronta)
✅ Aprovar/rejeitar com comentário
✅ Histórico completo com snapshot
✅ Bloqueios respeitados no freeze window
✅ SLA tracking com indicadores visuais
✅ Escalonamento automático
✅ Trilha de auditoria completa
✅ RLS em todas as tabelas
✅ Feature flags para ocultar billing

## Próximos Passos Recomendados

1. **Notificações**
   - Integrar com WhatsApp para approval_requested
   - Alertas de SLA próximo do vencimento
   - Notificações de escalonamento

2. **Dashboard de Aprovações**
   - Métricas: tempo médio de aprovação
   - SLA compliance rate
   - Gargalos por workstream

3. **Aprovações Múltiplas**
   - Suporte a múltiplos aprovadores
   - Aprovação sequencial vs paralela
   - Quórum (X de Y aprovadores)

4. **Automações**
   - Auto-aprovação baseada em critérios
   - Delegação de aprovação
   - Templates de comentários

5. **Relatórios**
   - Exportar histórico
   - Compliance reports
   - Audit trail completo

## Uso da API

```typescript
import { approvalService } from './services/approvalService';

// Listar pendentes
const pending = await approvalService.getPendingApprovals(orgId);

// Solicitar aprovação
await approvalService.requestApproval(taskId, orgId, userId, snapshot);

// Aprovar
await approvalService.approveApproval(approvalId, userId, "LGTM!");

// Rejeitar
await approvalService.rejectApproval(approvalId, userId, "Precisa ajustes");

// Ver histórico
const history = await approvalService.getApprovalHistory(approvalId);

// Verificar SLA
const status = approvalService.getSlaStatus(slaDeadline);
const remaining = approvalService.formatSlaRemaining(slaDeadline);
```

## Banco de Dados

Migration: `create_approval_system_complete.sql`

Índices otimizados para:
- Busca por organização
- Busca por status
- Tracking de SLA vencido
- Histórico por approval/task

## Conclusão

Sistema completo de aprovações implementado com todas as funcionalidades solicitadas. Pronto para uso em produção com segurança, auditoria e performance otimizada.
