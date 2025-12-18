# TaskMaster Pro - Playbooks Operacionais

## Guia Completo de Funcionalidades Enterprise

**Versão:** 2.0
**Data:** 21 de outubro de 2025
**Status:** Implementado e Documentado

---

## 📋 Índice

1. [Automation Rules (No-Code)](#1-automation-rules-no-code)
2. [Calendário Unificado & Gantt](#2-calendário-unificado--gantt)
3. [Approval Inbox](#3-approval-inbox)
4. [Financeiro Pro](#4-financeiro-pro)
5. [CRM de Shows](#5-crm-de-shows)
6. [Jurídico/Contratos](#6-jurídicocontratos)
7. [DAM (Digital Asset Manager)](#7-dam-digital-asset-manager)
8. [Ops Review Semanal](#8-ops-review-semanal)
9. [Perfis & Permissões](#9-perfis--permissões)
10. [Ajuda in-app & Templates](#10-ajuda-in-app--templates)
11. [PWA/Offline - Hardening](#11-pwaoffline---hardening)
12. [Telemetria & Auditoria](#12-telemetria--auditoria)

---

## 1. Automation Rules (No-Code)

### **Visão Geral**
Sistema de automação sem código que permite criar regras de negócio customizadas baseadas em triggers, condições e ações.

### **Rota:** `/automations`

### **Triggers Disponíveis**
- `task_due`: Tarefa próxima do vencimento
- `approval_pending`: Aprovação aguardando há X dias
- `setlist_locked`: Setlist travado (D-1)
- `project_over_budget`: Projeto estourou orçamento

### **Actions Disponíveis**
- `sendWhatsApp`: Enviar mensagem WhatsApp
- `sendEmail`: Enviar e-mail
- `createTask`: Criar tarefa automática
- `addTag`: Adicionar tag à entidade
- `lockSetlist`: Travar setlist
- `preCacheStageMode`: Pré-cachear modo palco

### **Exemplo: Setlist Travado → WhatsApp + Pré-cache**

```javascript
{
  "name": "Setlist Travado - Notificar Músicos",
  "trigger_type": "setlist_locked",
  "trigger_config": {
    "hours_before": 24
  },
  "conditions": [
    {
      "field": "setlist.status",
      "operator": "equals",
      "value": "locked"
    }
  ],
  "actions": [
    {
      "type": "sendWhatsApp",
      "config": {
        "template": "setlist_locked",
        "recipients": "musicians",
        "message": "🔒 Setlist {{setlist.title}} travado! Baixe para offline: {{link}}"
      }
    },
    {
      "type": "preCacheStageMode",
      "config": {
        "setlist_id": "{{setlist.id}}",
        "include_assets": true
      }
    }
  ],
  "is_active": true,
  "priority": 10
}
```

### **Log de Execução**
Todas as execuções são registradas em `automation_runs`:
- Dados do trigger
- Ações executadas
- Status (success/failed/partial)
- Tempo de execução
- Mensagem de erro (se houver)

### **Aceite**
✅ Regra criada via interface
✅ Setlist travado dispara automação
✅ WhatsApp enviado + cache iniciado
✅ Log registrado em `automation_runs`

---

## 2. Calendário Unificado & Gantt

### **Visão Geral**
Calendário organizacional com todas as tarefas, eventos e marcos. Visualização Gantt com cálculo de caminho crítico.

### **Rota:** `/calendar` e `/gantt`

### **Calendário Unificado**

**Funcionalidades:**
- Visualização mensal/semanal/diária
- Filtros por projeto, artista, departamento
- Drag & drop de tarefas (altera `due_date`)
- Sincronização com Google Calendar
- Cores por tipo de evento

**Tipos de Evento:**
- Tarefas do projeto
- Shows e eventos
- Ensaios
- Reuniões
- Deadlines de aprovação
- Lançamentos

**Drag & Drop:**
```javascript
function onTaskDrop(task, newDate) {
  // Atualiza due_date
  await updateTask(task.id, { due_date: newDate });

  // Verifica dependências
  const dependents = await getDependent Tasks(task.id);

  // Ajusta tarefas dependentes
  for (const dep of dependents) {
    const newDepDate = addDays(newDate, dep.offset);
    await updateTask(dep.id, { due_date: newDepDate });
  }

  // Log de auditoria
  await logAudit({
    action: 'task_rescheduled',
    reason: 'Calendar drag-and-drop',
    changes: { old_date: task.due_date, new_date: newDate }
  });
}
```

### **Gantt Chart**

**Funcionalidades:**
- Timeline por projeto
- Dependências visuais (setas)
- Caminho crítico destacado (vermelho)
- Barra de progresso por tarefa
- Marcos do projeto (diamantes)

**Cálculo de Caminho Crítico:**
```javascript
function calculateCriticalPath(project) {
  // 1. Build task graph
  const graph = buildTaskGraph(project.tasks);

  // 2. Calculate earliest start/finish
  const forward = forwardPass(graph);

  // 3. Calculate latest start/finish
  const backward = backwardPass(graph);

  // 4. Identify critical tasks (slack = 0)
  const critical = graph.tasks.filter(task => {
    const slack = backward[task.id].latest - forward[task.id].earliest;
    return slack === 0;
  });

  return {
    path: critical,
    duration: forward.projectEnd - forward.projectStart,
    slack_by_task: calculateSlack(forward, backward)
  };
}
```

**Detecção de Atrasos em Cadeia:**
```javascript
function detectDelayImpact(task, newDueDate) {
  const original = task.due_date;
  const delay = daysBetween(original, newDueDate);

  if (delay <= 0) return { affected: [], risk: 'none' };

  // Find all dependent tasks
  const affected = [];
  const queue = [task.id];
  const visited = new Set();

  while (queue.length > 0) {
    const current = queue.shift();
    if (visited.has(current)) continue;
    visited.add(current);

    const dependents = getDependentTasks(current);
    affected.push(...dependents);
    queue.push(...dependents.map(t => t.id));
  }

  // Calculate risk level
  const criticalAffected = affected.filter(t => t.isCritical);
  const risk = criticalAffected.length > 0 ? 'high' :
               affected.length > 3 ? 'medium' : 'low';

  return { affected, delay, risk };
}
```

### **Aceite**
✅ Mover tarefa no calendário atualiza `due_date`
✅ Tarefas dependentes ajustadas automaticamente
✅ Gantt mostra dependências visualmente
✅ Caminho crítico destacado em vermelho
✅ Atraso propaga pela cadeia corretamente

---

## 3. Approval Inbox

### **Visão Geral**
Caixa de entrada unificada para todas as aprovações pendentes com ações rápidas de 1 clique.

### **Rota:** `/approvals/inbox`

### **Tipos de Aprovação**
- Arranjos musicais
- Tarefas críticas
- Setlists
- Orçamentos
- Contratos
- Ativos de mídia

### **Ações Rápidas**
- ✅ **Aprovar**: Aprovação imediata
- ❌ **Rejeitar**: Rejeição com motivo
- ⚙️ **Ajustar**: Solicitar mudanças
- 👤 **Delegar**: Transferir para outro aprovador

### **Interface**

```typescript
interface ApprovalInboxItem {
  id: string;
  type: 'arrangement' | 'task' | 'setlist' | 'budget' | 'contract' | 'asset';
  entity_id: string;
  entity_name: string;
  submitted_by: User;
  submitted_at: string;
  sla_hours: number;
  sla_expires_at: string;
  priority: 'urgent' | 'high' | 'normal';
  status: 'pending' | 'reviewing';
  comments: Comment[];
  preview_url?: string;
  changes?: any;
}
```

### **Fluxo de Aprovação Rápida**

```typescript
async function quickApprove(itemId: string, action: 'approve' | 'reject' | 'adjust' | 'delegate') {
  const item = await getApprovalItem(itemId);

  switch (action) {
    case 'approve':
      await updateEntity(item.entity_type, item.entity_id, {
        status: 'approved',
        approved_by: currentUser.id,
        approved_at: now()
      });

      await notifySubmitter({
        type: 'approval_granted',
        entity: item.entity_name,
        approver: currentUser.name
      });

      // Desbloqueia tarefas dependentes
      await unlockDependentTasks(item.entity_id);
      break;

    case 'reject':
      const reason = await promptReason();
      await updateEntity(item.entity_type, item.entity_id, {
        status: 'rejected',
        rejected_by: currentUser.id,
        rejected_at: now(),
        rejection_reason: reason
      });

      await notifySubmitter({
        type: 'approval_rejected',
        entity: item.entity_name,
        reason: reason
      });
      break;

    case 'adjust':
      const changes = await promptChanges();
      await createAdjustmentRequest(item.entity_id, changes);
      await notifySubmitter({
        type: 'changes_requested',
        changes: changes
      });
      break;

    case 'delegate':
      const newApprover = await selectApprover();
      await updateApproval(itemId, {
        reviewer_id: newApprover.id
      });
      await notifyNewApprover(newApprover, item);
      break;
  }

  // Log de auditoria
  await logAudit({
    action: `approval_${action}`,
    entity_type: item.entity_type,
    entity_id: item.entity_id,
    reason: `Quick action from inbox`
  });
}
```

### **Histórico Completo**

```typescript
interface ApprovalHistory {
  approval_id: string;
  events: Array<{
    timestamp: string;
    user: User;
    action: string;
    comment?: string;
    changes?: any;
  }>;
  total_time_to_approve: number; // minutes
  escalations: number;
}
```

### **Aceite**
✅ Inbox mostra todas as aprovações pendentes
✅ Aprovar em 1 clique funciona
✅ Rejeitar solicita motivo obrigatório
✅ Histórico completo disponível
✅ SLA visível e alertas quando próximo de expirar

---

## 4. Financeiro Pro

### **Visão Geral**
Sistema financeiro completo com DRE, centro de custos, importação de CSV e alertas de anomalia.

### **Rota:** `/financeiro`

### **DRE (Demonstrativo de Resultado)**

**Por Projeto:**
```sql
SELECT
  p.name AS projeto,
  SUM(CASE WHEN ft.category = 'revenue' THEN ft.amount ELSE 0 END) AS receita,
  SUM(CASE WHEN ft.category = 'expense' THEN ft.amount ELSE 0 END) AS despesa,
  SUM(ft.amount) AS resultado,
  p.budget,
  ((SUM(ft.amount) / p.budget) * 100) AS performance_pct
FROM financial_transactions ft
JOIN projects p ON p.id = ft.project_id
WHERE ft.status = 'approved'
  AND ft.organization_id = :org_id
GROUP BY p.id, p.name, p.budget;
```

**Por Artista:**
```sql
SELECT
  a.name AS artista,
  SUM(CASE WHEN ft.category = 'revenue' THEN ft.amount ELSE 0 END) AS receita_total,
  SUM(CASE WHEN ft.category = 'royalty' THEN ft.amount ELSE 0 END) AS royalties,
  SUM(CASE WHEN ft.category = 'expense' THEN ft.amount ELSE 0 END) AS despesas,
  SUM(ft.amount) AS lucro_liquido
FROM financial_transactions ft
JOIN artists a ON a.id = ft.artist_id
WHERE ft.organization_id = :org_id
GROUP BY a.id, a.name;
```

### **Centro de Custos**

```typescript
interface CostCenter {
  id: string;
  name: string;
  code: string; // Ex: CC-001, CC-002
  description: string;
  budget_annual: number;
  parent_id?: string; // Hierarquia
  allocation_rules: {
    projects: string[]; // IDs de projetos vinculados
    percentage?: number; // Rateio automático
  };
}
```

**Rateio Automático:**
```typescript
function allocateExpense(expense: Transaction, rules: AllocationRule[]) {
  const allocated = [];

  for (const rule of rules) {
    const amount = expense.amount * (rule.percentage / 100);

    allocated.push({
      cost_center_id: rule.cost_center_id,
      amount: amount,
      percentage: rule.percentage
    });
  }

  return allocated;
}
```

### **Importador CSV**

**Formato Esperado:**
```csv
data,descricao,categoria,valor,metodo_pagamento,numero_nota
2025-01-15,Studio de gravacao,expense,-5000.00,pix,NF-12345
2025-01-20,Show em Sao Paulo,revenue,15000.00,transferencia,NF-12346
2025-01-25,Royalties Spotify,royalty,2340.50,deposito,REL-202501
```

**Mapeamento Salvo:**
```typescript
interface CSVMapping {
  id: string;
  name: string;
  column_map: {
    date: string; // Nome da coluna de data
    description: string;
    category: string;
    amount: string;
    payment_method?: string;
    invoice_number?: string;
  };
  transformations: {
    date_format: string; // 'YYYY-MM-DD', 'DD/MM/YYYY'
    amount_multiplier: number; // -1 para inverter sinal
    category_mapping: Record<string, string>;
  };
}
```

**Detecção de Anomalias (Z-Score):**
```typescript
function detectAnomalies(transactions: Transaction[]) {
  // Calcula média e desvio padrão por categoria
  const stats = calculateStatsByCategory(transactions);

  const anomalies = [];

  for (const tx of transactions) {
    const categoryStats = stats[tx.category];
    const zScore = (tx.amount - categoryStats.mean) / categoryStats.stdDev;

    // Alerta se variação > 2.5 sigma
    if (Math.abs(zScore) > 2.5) {
      anomalies.push({
        transaction: tx,
        z_score: zScore,
        severity: Math.abs(zScore) > 3 ? 'high' : 'medium',
        expected_range: {
          min: categoryStats.mean - (2.5 * categoryStats.stdDev),
          max: categoryStats.mean + (2.5 * categoryStats.stdDev)
        }
      });
    }
  }

  return anomalies;
}
```

### **Aceite**
✅ Subir CSV real com 50+ transações
✅ Ver DRE projetado × realizado por projeto
✅ Centro de custos com rateio automático
✅ Alertas quando variação > 2.5σ
✅ Mapeamento salvo para reutilização

---

## 5. CRM de Shows

### **Visão Geral**
CRM completo para gestão comercial de shows com pipeline de vendas, propostas automáticas e follow-ups.

### **Rota:** `/crm`

### **Pipeline de Vendas**

**Estágios:**
1. **Lead**: Contato inicial identificado
2. **Contacted**: Primeiro contato realizado
3. **Proposal Sent**: Proposta enviada
4. **Negotiating**: Negociação ativa
5. **Won**: Venda fechada
6. **Lost**: Perdido (com motivo)

**Deal Object:**
```typescript
interface CRMDeal {
  id: string;
  contact_id: string;
  artist_id: string;
  title: string; // Ex: "Show em São Paulo - Festival XYZ"
  stage: 'lead' | 'contacted' | 'proposal_sent' | 'negotiating' | 'won' | 'lost';
  value: number;
  probability: number; // 0-100
  expected_close_date: string;
  event_date: string;
  venue: string;
  proposal_sent_at?: string;
  last_followup_at?: string;
  next_followup_at?: string;
  notes: string;
  loss_reason?: string;
}
```

### **Propostas em 1 Clique**

**Template de Proposta:**
```typescript
interface ProposalTemplate {
  name: string;
  type: 'show' | 'festival' | 'corporate';
  sections: Array<{
    title: string;
    content: string; // Com variáveis: {{artist_name}}, {{date}}, {{value}}
  }>;
  variables: {
    artist_name: string;
    show_date: string;
    venue_name: string;
    value: number;
    cachê_format: string; // 'R$ 50.000,00'
    technical_requirements: string[];
    hospitality: string[];
  };
}
```

**Geração Automática:**
```typescript
async function generateProposal(dealId: string, templateId: string) {
  const deal = await getDeal(dealId);
  const template = await getTemplate(templateId);
  const artist = await getArtist(deal.artist_id);
  const contact = await getContact(deal.contact_id);

  // Substitui variáveis
  const variables = {
    artist_name: artist.name,
    show_date: formatDate(deal.event_date),
    venue_name: deal.venue,
    value: deal.value,
    cachê_format: formatCurrency(deal.value),
    technical_requirements: artist.technical_rider,
    hospitality: artist.hospitality_rider
  };

  const content = replaceVariables(template.content, variables);

  // Gera PDF
  const pdf = await generatePDF(content, {
    header: template.header,
    footer: template.footer,
    watermark: 'PROPOSTA COMERCIAL'
  });

  // Salva e envia
  const proposal = await saveProposal({
    deal_id: dealId,
    template_id: templateId,
    pdf_url: pdf.url,
    sent_at: now()
  });

  await sendProposalEmail(contact.email, proposal);

  // Atualiza deal
  await updateDeal(dealId, {
    stage: 'proposal_sent',
    proposal_sent_at: now(),
    next_followup_at: addDays(now(), 2) // Follow-up D+2
  });

  return proposal;
}
```

### **Follow-ups Automáticos**

**Regra D+2 e D+7:**
```typescript
// Automation Rule
{
  "name": "Follow-up D+2 - Proposta sem resposta",
  "trigger_type": "proposal_no_response",
  "trigger_config": {
    "days_after": 2
  },
  "conditions": [
    {
      "field": "deal.stage",
      "operator": "equals",
      "value": "proposal_sent"
    },
    {
      "field": "deal.last_followup_at",
      "operator": "is_null"
    }
  ],
  "actions": [
    {
      "type": "sendEmail",
      "config": {
        "template": "followup_d2",
        "subject": "Acompanhamento - Proposta {{deal.title}}"
      }
    },
    {
      "type": "createTask",
      "config": {
        "title": "Follow-up telefônico - {{deal.title}}",
        "assigned_to": "{{deal.owner}}"
      }
    }
  ]
}
```

### **Histórico de Interações**

```typescript
interface ContactInteraction {
  id: string;
  contact_id: string;
  type: 'call' | 'email' | 'meeting' | 'whatsapp';
  direction: 'inbound' | 'outbound';
  subject: string;
  notes: string;
  outcome: string; // 'positive', 'neutral', 'negative', 'no_answer'
  next_action?: string;
  created_by: string;
  created_at: string;
}
```

### **Aceite**
✅ Criar lead de show
✅ Mover pelo pipeline (drag-and-drop)
✅ Gerar proposta PDF em 1 clique
✅ Follow-up D+2 enviado automaticamente
✅ Histórico completo de interações salvo

---

## 6. Jurídico/Contratos

### **Visão Geral**
Sistema completo de gestão de contratos com templates, aceite digital e versionamento.

### **Rota:** `/juridico`

### **Templates com Variáveis**

```typescript
interface ContractTemplate {
  name: string;
  type: 'show' | 'artist' | 'service' | 'venue' | 'sponsor';
  content: string; // Markdown com variáveis
  variables: Array<{
    name: string;
    type: 'text' | 'number' | 'date' | 'currency';
    required: boolean;
    default_value?: any;
  }>;
  clauses: Array<{
    id: string;
    title: string;
    content: string;
    optional: boolean;
  }>;
}
```

**Exemplo de Template:**
```markdown
# CONTRATO DE SHOW

Entre **{{artist_name}}** (CONTRATADO) e **{{promoter_name}}** (CONTRATANTE)

## 1. OBJETO
O presente contrato tem como objeto a apresentação musical do artista {{artist_name}}
no evento {{event_name}}, a realizar-se em {{event_date}} no local {{venue_name}}.

## 2. VALOR
O CONTRATANTE pagará ao CONTRATADO o valor de **{{cachê}}** ({{cachê_extenso}}).

## 3. FORMA DE PAGAMENTO
{{payment_terms}}

## 4. RIDER TÉCNICO
{{technical_rider}}

## 5. HOSPEDAGEM E TRANSPORTE
{{hospitality_terms}}

...
```

### **Aceite Digital**

**Fluxo de Assinatura:**
```typescript
async function requestSignature(contractId: string, signers: Array<{ name, email, role }>) {
  const contract = await getContract(contractId);

  for (const signer of signers) {
    const token = generateSecureToken();
    const signatureLink = `${BASE_URL}/sign/${token}`;

    await createSignatureRequest({
      contract_id: contractId,
      signer_name: signer.name,
      signer_email: signer.email,
      signer_role: signer.role,
      token: token,
      expires_at: addDays(now(), 7),
      status: 'pending'
    });

    await sendSignatureEmail(signer.email, {
      contract_title: contract.title,
      link: signatureLink,
      expires_in: '7 dias'
    });
  }

  await updateContract(contractId, { status: 'pending' });
}
```

**Página de Assinatura:**
```typescript
async function signContract(token: string, ipAddress: string, userAgent: string) {
  const signature = await getSignatureByToken(token);

  // Valida
  if (signature.status !== 'pending') {
    throw new Error('Assinatura já processada');
  }
  if (signature.expires_at < now()) {
    throw new Error('Link de assinatura expirado');
  }

  // Registra assinatura
  await updateSignature(signature.id, {
    status: 'signed',
    signed_at: now(),
    ip_address: ipAddress,
    user_agent: userAgent
  });

  // Verifica se todos assinaram
  const allSignatures = await getContractSignatures(signature.contract_id);
  const allSigned = allSignatures.every(s => s.status === 'signed');

  if (allSigned) {
    await updateContract(signature.contract_id, {
      status: 'signed',
      signed_at: now()
    });

    // Desbloqueia tarefas dependentes
    await unlockTasksWaitingForContract(signature.contract_id);

    // Notifica todas as partes
    await notifyAllParties(signature.contract_id, 'contract_fully_signed');
  }

  // Log de auditoria
  await logAudit({
    action: 'contract_signed',
    entity_type: 'contract',
    entity_id: signature.contract_id,
    details: {
      signer: signature.signer_name,
      ip: ipAddress,
      timestamp: now()
    }
  });
}
```

### **Versionamento**

```typescript
interface ContractVersion {
  id: string;
  contract_id: string;
  version: number;
  parent_version_id?: string;
  changes: Array<{
    clause_id: string;
    type: 'added' | 'modified' | 'removed';
    old_content?: string;
    new_content: string;
  }>;
  reason: string;
  created_by: string;
  created_at: string;
}
```

**Comparador de Cláusulas:**
```typescript
function compareVersions(v1: Contract, v2: Contract) {
  const diff = {
    added: [],
    modified: [],
    removed: []
  };

  // Identifica mudanças
  for (const clause of v2.clauses) {
    const oldClause = v1.clauses.find(c => c.id === clause.id);

    if (!oldClause) {
      diff.added.push(clause);
    } else if (oldClause.content !== clause.content) {
      diff.modified.push({
        clause_id: clause.id,
        old: oldClause.content,
        new: clause.content,
        diff: diffLines(oldClause.content, clause.content)
      });
    }
  }

  for (const clause of v1.clauses) {
    if (!v2.clauses.find(c => c.id === clause.id)) {
      diff.removed.push(clause);
    }
  }

  return diff;
}
```

### **Aceite**
✅ Criar contrato a partir de template
✅ Gerar link de assinatura com token
✅ Coletar aceite com IP e timestamp
✅ Tarefa travada até status "signed"
✅ Comparador visual entre versões

---

## 7. DAM (Digital Asset Manager)

### **Visão Geral**
Sistema leve de gestão de ativos digitais com pastas, watermark opcional e links com expiração.

### **Rota:** `/assets`

### **Estrutura de Pastas**

```typescript
interface AssetFolder {
  path: string; // '/artista/ana-carol/fotos/2025'
  name: string;
  parent_path: string;
  permissions: {
    view: string[]; // roles que podem ver
    upload: string[]; // roles que podem fazer upload
    download: string[]; // roles que podem baixar
  };
}
```

### **Upload com Metadados**

```typescript
async function uploadAsset(file: File, metadata: {
  artist_id?: string;
  project_id?: string;
  folder_path: string;
  tags?: string[];
  description?: string;
}) {
  // Upload para Supabase Storage
  const url = await supabase.storage
    .from('media-assets')
    .upload(`${metadata.folder_path}/${file.name}`, file);

  // Extrai metadados do arquivo
  const fileMetadata = await extractMetadata(file);

  // Gera thumbnail (imagens/vídeos)
  let thumbnailUrl;
  if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
    thumbnailUrl = await generateThumbnail(file);
  }

  // Salva no banco
  const asset = await createAsset({
    organization_id: currentOrg.id,
    artist_id: metadata.artist_id,
    project_id: metadata.project_id,
    folder_path: metadata.folder_path,
    filename: file.name,
    file_type: getFileType(file.type),
    mime_type: file.type,
    size_bytes: file.size,
    url: url,
    thumbnail_url: thumbnailUrl,
    width: fileMetadata.width,
    height: fileMetadata.height,
    duration_seconds: fileMetadata.duration,
    tags: metadata.tags || [],
    description: metadata.description,
    uploaded_by: currentUser.id
  });

  return asset;
}
```

### **Watermark Opcional**

```typescript
async function applyWatermark(assetId: string, watermarkConfig: {
  text: string;
  position: 'center' | 'bottom-right' | 'diagonal';
  opacity: number; // 0-100
  size: number; // pontos
}) {
  const asset = await getAsset(assetId);

  // Processa imagem
  const watermarked = await processImage(asset.url, {
    watermark: {
      text: watermarkConfig.text,
      position: watermarkConfig.position,
      opacity: watermarkConfig.opacity / 100,
      fontSize: watermarkConfig.size,
      color: '#FFFFFF'
    }
  });

  // Salva versão com watermark
  const watermarkedUrl = await uploadProcessedImage(watermarked);

  await updateAsset(assetId, {
    watermarked_url: watermarkedUrl
  });

  return watermarkedUrl;
}
```

### **Links com Expiração**

```typescript
async function createShareLink(assetId: string, options: {
  expires_in_days?: number;
  max_downloads?: number;
  password?: string;
}) {
  const token = generateSecureToken();
  const expiresAt = options.expires_in_days
    ? addDays(now(), options.expires_in_days)
    : null;

  const link = await createAssetShareLink({
    asset_id: assetId,
    token: token,
    expires_at: expiresAt,
    max_downloads: options.max_downloads,
    password_hash: options.password ? hashPassword(options.password) : null,
    created_by: currentUser.id
  });

  const shareUrl = `${BASE_URL}/share/${token}`;

  return {
    url: shareUrl,
    expires_at: expiresAt,
    max_downloads: options.max_downloads
  };
}
```

**Download com Registro:**
```typescript
async function downloadSharedAsset(token: string, password?: string) {
  const shareLink = await getShareLinkByToken(token);

  // Validações
  if (shareLink.expires_at && shareLink.expires_at < now()) {
    throw new Error('Link expirado');
  }
  if (shareLink.max_downloads && shareLink.download_count >= shareLink.max_downloads) {
    throw new Error('Limite de downloads atingido');
  }
  if (shareLink.password_hash && !verifyPassword(password, shareLink.password_hash)) {
    throw new Error('Senha incorreta');
  }

  // Incrementa contador
  await incrementDownloadCount(shareLink.id);

  // Registra download
  await logAssetDownload({
    asset_id: shareLink.asset_id,
    share_link_id: shareLink.id,
    downloaded_at: now(),
    ip_address: getClientIP()
  });

  // Retorna asset
  const asset = await getAsset(shareLink.asset_id);
  return asset.url;
}
```

### **Aceite**
✅ Upload de imagem/vídeo com tags
✅ Organização em pastas hierárquicas
✅ Gerar link com expiração de 7 dias
✅ Compartilhar e registrar downloads
✅ Aplicar watermark opcional

---

## 8. Ops Review Semanal

### **Visão Geral**
Job automático que gera relatório operacional toda segunda-feira às 09:00 e envia para stakeholders.

### **Rota:** Job agendado (Supabase Edge Function)

### **Sumário Gerado**

```typescript
interface WeeklyOpsSummary {
  week: {
    start_date: string;
    end_date: string;
  };
  risks: Array<{
    type: 'deadline' | 'budget' | 'dependency' | 'approval';
    severity: 'high' | 'medium' | 'low';
    description: string;
    affected_projects: string[];
    recommended_action: string;
  }>;
  deadlines: Array<{
    project: string;
    task: string;
    due_date: string;
    days_remaining: number;
    responsible: string;
    status: 'on_track' | 'at_risk' | 'overdue';
  }>;
  budgets: Array<{
    project: string;
    budget: number;
    spent: number;
    remaining: number;
    utilization_pct: number;
    status: 'healthy' | 'warning' | 'over_budget';
  }>;
  pending_by_user: Record<string, Array<{
    type: 'task' | 'approval' | 'follow_up';
    title: string;
    priority: string;
    due_date: string;
  }>>;
  highlights: {
    completed_projects: number;
    completed_tasks: number;
    shows_this_week: Array<{
      artist: string;
      date: string;
      venue: string;
    }>;
    releases_this_week: Array<{
      artist: string;
      release_name: string;
      date: string;
    }>;
  };
}
```

### **Geração Automática**

```typescript
// Supabase Edge Function: weekly-ops-review
async function generateWeeklyOpsReview(organizationId: string) {
  const weekStart = startOfWeek(now());
  const weekEnd = endOfWeek(now());

  // Coleta dados
  const [risks, deadlines, budgets, pending] = await Promise.all([
    analyzeRisks(organizationId, weekStart, weekEnd),
    getUpcomingDeadlines(organizationId, 7),
    analyzeBudgets(organizationId),
    getPendingByUser(organizationId)
  ]);

  const summary: WeeklyOpsSummary = {
    week: { start_date: weekStart, end_date: weekEnd },
    risks,
    deadlines,
    budgets,
    pending_by_user: pending,
    highlights: await getHighlights(organizationId, weekStart, weekEnd)
  };

  // Salva relatório
  const report = await saveWeeklyReport({
    organization_id: organizationId,
    week_start_date: weekStart,
    week_end_date: weekEnd,
    summary: summary
  });

  // Envia notificações
  const recipients = await getOpsReviewRecipients(organizationId);

  for (const recipient of recipients) {
    await sendOpsReviewEmail(recipient.email, summary);

    if (recipient.wants_whatsapp) {
      await sendOpsReviewWhatsApp(recipient.phone, formatSummaryForWhatsApp(summary));
    }
  }

  await updateReport(report.id, {
    sent_at: now(),
    recipients: recipients.map(r => r.email)
  });

  return report;
}
```

**Análise de Riscos:**
```typescript
async function analyzeRisks(orgId: string, startDate: string, endDate: string) {
  const risks = [];

  // Risco: Prazo crítico
  const criticalDeadlines = await query(`
    SELECT p.name, t.title, t.due_date, t.assigned_to
    FROM tasks t
    JOIN projects p ON p.id = t.project_id
    WHERE t.organization_id = $1
      AND t.status != 'completed'
      AND t.due_date BETWEEN $2 AND $3
      AND t.is_critical = true
  `, [orgId, now(), addDays(now(), 7)]);

  if (criticalDeadlines.length > 0) {
    risks.push({
      type: 'deadline',
      severity: 'high',
      description: `${criticalDeadlines.length} tarefas críticas vencem nos próximos 7 dias`,
      affected_projects: [...new Set(criticalDeadlines.map(d => d.name))],
      recommended_action: 'Revisar prioridades e realocar recursos se necessário'
    });
  }

  // Risco: Orçamento estourado
  const overBudgetProjects = await query(`
    SELECT p.name, p.budget, SUM(ft.amount) AS spent
    FROM projects p
    LEFT JOIN financial_transactions ft ON ft.project_id = p.id
    WHERE p.organization_id = $1
      AND p.status = 'active'
    GROUP BY p.id, p.name, p.budget
    HAVING SUM(ft.amount) > p.budget * 0.95
  `, [orgId]);

  if (overBudgetProjects.length > 0) {
    risks.push({
      type: 'budget',
      severity: 'high',
      description: `${overBudgetProjects.length} projetos com orçamento > 95% utilizado`,
      affected_projects: overBudgetProjects.map(p => p.name),
      recommended_action: 'Revisar custos e ajustar escopo ou solicitar aditivo'
    });
  }

  // Risco: Aprovações atrasadas
  const overdueApprovals = await query(`
    SELECT entity_type, COUNT(*) AS count
    FROM music_approvals
    WHERE organization_id = $1
      AND status = 'pending'
      AND submitted_at < $2
    GROUP BY entity_type
  `, [orgId, addDays(now(), -3)]);

  if (overdueApprovals.length > 0) {
    risks.push({
      type: 'approval',
      severity: 'medium',
      description: `Aprovações pendentes há mais de 3 dias`,
      affected_projects: [],
      recommended_action: 'Revisar inbox de aprovações e processar itens urgentes'
    });
  }

  return risks;
}
```

### **Formato de Mensagem**

**WhatsApp:**
```
📊 *OPS REVIEW SEMANAL*
_Semana de 21 a 27 de outubro_

⚠️ *RISCOS (3)*
• 🔴 5 tarefas críticas vencem em 7 dias
• 🔴 2 projetos com orçamento > 95%
• 🟡 12 aprovações pendentes há 3+ dias

📅 *PRÓXIMOS PRAZOS (Top 5)*
• [23/10] Aprovar setlist - Show SP (Ana Carol)
• [24/10] Master final - Single "Vem Dançar"
• [25/10] Contratar transporte - Turnê Sul
• [26/10] Enviar material gráfico - Festival
• [27/10] Review orçamento Q4

💰 *ORÇAMENTOS*
• Projeto Single Ana Carol: 87% utilizado
• Projeto DVD Ao Vivo: 65% utilizado
• Projeto Turnê 2025: 42% utilizado

✅ *DESTAQUES*
• 3 projetos concluídos
• 45 tarefas finalizadas
• 2 shows esta semana

📱 Acesse o dashboard completo: link
```

### **Aceite**
✅ Job executa segunda às 09:00
✅ Sumário com riscos, prazos, orçamentos
✅ Pendências agrupadas por responsável
✅ WhatsApp + e-mail enviados
✅ Relatório arquivado em `weekly_ops_reports`

---

## 9. Perfis & Permissões

### **Visão Geral**
Sistema de papéis granulares com permissões específicas por entidade e RLS refinado.

### **Rota:** `/admin/permissions`

### **Papéis Disponíveis**

```typescript
type UserRole =
  | 'owner'        // Dono da organização (acesso total)
  | 'admin'        // Administrador (quase total)
  | 'conteudo'     // Gestão de conteúdo e produção
  | 'shows'        // Gestão comercial e eventos
  | 'financeiro'   // Gestão financeira
  | 'juridico'     // Gestão de contratos
  | 'producao'     // Produção musical
  | 'marketing'    // Marketing e redes sociais
  | 'musico'       // Músico (acesso restrito)
  ;
```

### **Matriz de Permissões**

| Entidade | Owner | Admin | Conteúdo | Shows | Financeiro | Jurídico | Produção | Marketing | Músico |
|----------|-------|-------|----------|-------|------------|----------|----------|-----------|--------|
| Projetos | CRUD | CRUD | CRUD | CRUD | R | R | CRUD | CRUD | R |
| Tarefas | CRUD | CRUD | CRUD | CRUD | R | R | CRUD | CRUD | R (próprias) |
| Artistas | CRUD | CRUD | CRUD | CRUD | R | R | R | CRUD | - |
| Shows | CRUD | CRUD | R | CRUD | R | R | R | CRUD | - |
| Financeiro | CRUD | CRUD | - | R | CRUD | R | - | R | - |
| Contratos | CRUD | CRUD | R | R | R | CRUD | - | R | - |
| CRM | CRUD | CRUD | R | CRUD | - | - | - | CRUD | - |
| Setlists | CRUD | CRUD | R | R | - | - | CRUD | - | R |
| Arranjos | CRUD | CRUD | R | - | - | - | CRUD | - | R (próprias partes) |
| Automações | CRUD | CRUD | - | - | - | - | - | - | - |
| Usuários | CRUD | CRUD | - | - | - | - | - | - | - |

**Legenda:**
- C: Create (criar)
- R: Read (ler)
- U: Update (atualizar)
- D: Delete (deletar)
- -: Sem acesso

### **Implementação RLS**

**Exemplo: Músico só vê suas partes:**
```sql
CREATE POLICY "Musicians can view their parts"
  ON parts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'musico'
      AND EXISTS (
        SELECT 1 FROM musician_profiles mp
        WHERE mp.user_id = auth.uid()
        AND parts.instrument = ANY(mp.instruments)
      )
    )
  );
```

**Exemplo: Financeiro acessa apenas dados financeiros:**
```sql
CREATE POLICY "Financial users access financial data"
  ON financial_transactions FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'financeiro')
    )
  );
```

### **Delegação Temporária**

```typescript
interface TemporaryPermission {
  id: string;
  user_id: string;
  granted_by: string;
  permission: string; // Ex: 'approve_arrangements'
  entity_type?: string;
  entity_id?: string;
  expires_at: string;
  reason: string;
}
```

### **Aceite**
✅ Usuário "Músico" só vê setlists e partes
✅ Usuário "Financeiro" só acessa módulo financeiro
✅ Usuário "Shows" gerencia CRM e propostas
✅ RLS bloqueia acesso a dados de outras orgs
✅ Auditoria registra mudanças de permissão

---

## 10. Ajuda in-app & Templates

### **Visão Geral**
Sistema de ajuda contextual, biblioteca de templates e tour guiado por persona.

### **Rota:** `/help` e `/templates`

### **Biblioteca de Templates**

**Categorias:**
- Projetos (Single D-30, Álbum D-120, DVD D-90)
- Checklists (Pré-produção, Logística, Pós-show)
- Setlists (Show solo, Festival, Acústico)
- Contratos (Show, Artista, Patrocínio)
- Automações (Follow-ups, Lembretes, Alertas)

**Criação a Partir de Template:**
```typescript
async function createFromTemplate(templateId: string, variables: Record<string, any>) {
  const template = await getTemplate(templateId);

  // Substitui variáveis
  const projectData = replaceVariables(template.project_structure, variables);

  // Cria projeto
  const project = await createProject({
    name: projectData.name,
    description: projectData.description,
    project_type: template.project_type,
    artist_id: variables.artist_id,
    launch_date: variables.launch_date
  });

  // Cria fases
  for (const phase of projectData.phases) {
    await createPhase({
      project_id: project.id,
      ...phase
    });
  }

  // Cria tarefas com dependências
  const taskMap = new Map();
  for (const task of projectData.tasks) {
    const newTask = await createTask({
      project_id: project.id,
      ...task,
      due_date: calculateDueDate(variables.launch_date, task.offset_days)
    });
    taskMap.set(task.id, newTask.id);
  }

  // Configura dependências
  for (const task of projectData.tasks) {
    if (task.depends_on) {
      for (const depId of task.depends_on) {
        await createTaskDependency({
          task_id: taskMap.get(task.id),
          depends_on_task_id: taskMap.get(depId)
        });
      }
    }
  }

  return project;
}
```

### **Tour Guiado por Persona**

```typescript
interface GuidedTour {
  persona: 'gestor' | 'produtor' | 'financeiro' | 'musico';
  steps: Array<{
    title: string;
    description: string;
    element_selector: string; // CSS selector
    action?: 'click' | 'input';
    position: 'top' | 'bottom' | 'left' | 'right';
    next_button_text: string;
  }>;
}

// Tour para Gestor
const gestorTour: GuidedTour = {
  persona: 'gestor',
  steps: [
    {
      title: 'Bem-vindo ao TaskMaster!',
      description: 'Vamos fazer um tour rápido pelas funcionalidades principais.',
      element_selector: '#command-center',
      position: 'bottom',
      next_button_text: 'Começar'
    },
    {
      title: 'Command Center',
      description: 'Aqui você vê todas as pendências críticas: aprovações, tarefas atrasadas e alertas.',
      element_selector: '#approvals-widget',
      position: 'right',
      next_button_text: 'Próximo'
    },
    {
      title: 'Criar Projeto',
      description: 'Use o Planning Copilot para criar projetos completos com IA em segundos.',
      element_selector: '#planning-copilot-button',
      action: 'click',
      position: 'bottom',
      next_button_text: 'Ver Exemplo'
    },
    // ... mais steps
  ]
};
```

### **Pesquisa "Como faço..."**

```typescript
interface HelpArticle {
  id: string;
  title: string;
  category: string;
  tags: string[];
  content: string;
  steps?: Array<{
    step: number;
    instruction: string;
    screenshot?: string;
  }>;
  related_articles: string[];
  helpful_count: number;
}

// Busca inteligente
async function searchHelp(query: string) {
  // Busca exata
  const exactMatches = await searchArticles({
    query: query,
    match_type: 'exact'
  });

  // Busca por similaridade
  const similarMatches = await searchArticles({
    query: query,
    match_type: 'similarity',
    threshold: 0.7
  });

  // Busca por tags
  const tagMatches = await searchArticlesByTags(
    extractTags(query)
  );

  // Combina e ranqueia
  return rankResults([
    ...exactMatches,
    ...similarMatches,
    ...tagMatches
  ]);
}
```

### **Aceite**
✅ Primeiro acesso mostra tour guiado
✅ Tour específico por papel (gestor/músico)
✅ Criar projeto Single em 2 cliques
✅ Pesquisa "como aprovar arranjo" retorna artigo
✅ Template aplicado com todas as tarefas

---

## 11. PWA/Offline - Hardening

### **Visão Geral**
Melhorias no PWA para garantir funcionamento offline robusto com pré-cache e indicadores visuais.

### **Estratégia de Cache**

```typescript
// service-worker.ts
const CACHE_VERSION = 'v2.0.0';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const CRITICAL_CACHE = `critical-${CACHE_VERSION}`;

// Assets críticos (sempre em cache)
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/index.css',
  '/assets/index.js',
  '/assets/vendor.js',
  '/offline.html'
];

// Install: Cache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CRITICAL_CACHE)
      .then(cache => cache.addAll(CRITICAL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Fetch: Cache-first for static, network-first for API
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API calls: network-first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      networkFirstStrategy(request)
    );
  }
  // Static assets: cache-first
  else {
    event.respondWith(
      cacheFirstStrategy(request)
    );
  }
});
```

### **Pré-cache para Stage Mode**

```typescript
async function preCacheSetlistForOffline(setlistId: string) {
  const setlist = await getSetlist(setlistId);
  const songs = await getSetlistSongs(setlistId);
  const arrangements = await getArrangements(songs.map(s => s.arrangement_id));
  const parts = await getParts(arrangements.map(a => a.id));

  // Armazena no IndexedDB
  await stageModeDB.setlist.put({
    id: setlistId,
    data: setlist,
    items: songs,
    cached_at: now(),
    version: 1
  });

  for (const song of songs) {
    await stageModeDB.songs.put({
      id: song.id,
      data: song,
      cached_at: now()
    });
  }

  for (const arrangement of arrangements) {
    await stageModeDB.arrangements.put({
      id: arrangement.id,
      data: arrangement,
      parts: parts.filter(p => p.arrangement_id === arrangement.id),
      cached_at: now()
    });
  }

  // Cache assets (PDFs, imagens)
  const assets = parts.map(p => p.url_pdf).filter(Boolean);
  const cache = await caches.open('stage-mode-assets');
  await cache.addAll(assets);

  // Atualiza status
  await updateSetlist(setlistId, {
    offline_ready: true,
    last_cached_at: now()
  });

  return {
    songs_cached: songs.length,
    arrangements_cached: arrangements.length,
    parts_cached: parts.length,
    assets_cached: assets.length
  };
}
```

### **Badge "Pronto para Offline"**

```typescript
// Component: OfflineReadyBadge
function OfflineReadyBadge({ setlistId }: { setlistId: string }) {
  const [status, setStatus] = useState<{
    ready: boolean;
    progress: number;
    last_sync: string;
  }>({ ready: false, progress: 0, last_sync: null });

  useEffect(() => {
    checkOfflineStatus();
  }, [setlistId]);

  async function checkOfflineStatus() {
    const cached = await stageModeDB.setlist.get(setlistId);

    if (cached) {
      const age = now() - cached.cached_at;
      const needsUpdate = age > 24 * 60 * 60 * 1000; // 24h

      setStatus({
        ready: !needsUpdate,
        progress: 100,
        last_sync: cached.cached_at
      });
    } else {
      setStatus({
        ready: false,
        progress: 0,
        last_sync: null
      });
    }
  }

  async function downloadForOffline() {
    setStatus(prev => ({ ...prev, progress: 10 }));

    try {
      const result = await preCacheSetlistForOffline(setlistId);
      setStatus({
        ready: true,
        progress: 100,
        last_sync: now()
      });

      showNotification({
        title: 'Pronto para offline!',
        message: `${result.songs_cached} músicas e ${result.parts_cached} partes em cache.`,
        type: 'success'
      });
    } catch (error) {
      showNotification({
        title: 'Erro ao fazer cache',
        message: error.message,
        type: 'error'
      });
    }
  }

  if (status.ready) {
    return (
      <div className="badge badge-success">
        <CheckCircle size={16} />
        <span>Pronto para offline</span>
        <span className="text-xs">Última sinc: {formatRelative(status.last_sync)}</span>
      </div>
    );
  }

  return (
    <button onClick={downloadForOffline} className="btn btn-sm">
      <Download size={16} />
      <span>Baixar para offline</span>
      {status.progress > 0 && (
        <div className="progress-bar" style={{ width: `${status.progress}%` }} />
      )}
    </button>
  );
}
```

### **Indicador de Status Online/Offline**

```typescript
// Component: OnlineStatusIndicator
function OnlineStatusIndicator() {
  const [online, setOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      syncWhenOnline();
    };

    const handleOffline = () => {
      setOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  async function syncWhenOnline() {
    setSyncStatus('syncing');

    try {
      // Sincroniza dados locais com servidor
      await syncLocalChanges();
      setSyncStatus('idle');
    } catch (error) {
      setSyncStatus('error');
    }
  }

  return (
    <div className={`status-indicator ${online ? 'online' : 'offline'}`}>
      {online ? (
        <>
          <Wifi size={16} />
          <span>Online</span>
          {syncStatus === 'syncing' && <Loader2 size={14} className="animate-spin" />}
        </>
      ) : (
        <>
          <WifiOff size={16} />
          <span>Offline</span>
        </>
      )}
    </div>
  );
}
```

### **Aceite**
✅ Simular modo avião
✅ StageMode funciona 100% offline
✅ Badge mostra "Pronto para offline"
✅ Indicador visual online/offline
✅ Sincronização automática quando volta online

---

## 12. Telemetria & Auditoria

### **Visão Geral**
Sistema completo de monitoramento, auditoria e telemetria para análise de performance e segurança.

### **Rota:** `/admin/telemetry` e `/admin/audit`

### **Tipos de Eventos**

```typescript
type TelemetryEventType =
  | 'page_view'
  | 'api_call'
  | 'error'
  | 'performance'
  | 'user_action'
  ;

interface TelemetryEvent {
  id: string;
  organization_id?: string;
  user_id?: string;
  event_type: TelemetryEventType;
  event_name: string;
  properties: {
    [key: string]: any;
  };
  duration_ms?: number;
  error_message?: string;
  stack_trace?: string;
  created_at: string;
}
```

### **Coleta Automática**

```typescript
// Global error handler
window.addEventListener('error', (event) => {
  logTelemetry({
    event_type: 'error',
    event_name: 'unhandled_error',
    error_message: event.message,
    stack_trace: event.error?.stack,
    properties: {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    }
  });
});

// API call interceptor
supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    // Intercepta chamadas API
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const start = performance.now();
      const [url] = args;

      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - start;

        logTelemetry({
          event_type: 'api_call',
          event_name: 'fetch',
          duration_ms: Math.round(duration),
          properties: {
            url: url.toString(),
            status: response.status,
            method: args[1]?.method || 'GET'
          }
        });

        return response;
      } catch (error) {
        logTelemetry({
          event_type: 'error',
          event_name: 'api_call_failed',
          error_message: error.message,
          properties: {
            url: url.toString()
          }
        });
        throw error;
      }
    };
  }
});

// Performance monitoring
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.entryType === 'navigation') {
      logTelemetry({
        event_type: 'performance',
        event_name: 'page_load',
        duration_ms: Math.round(entry.loadEventEnd - entry.loadEventStart),
        properties: {
          dns_time: entry.domainLookupEnd - entry.domainLookupStart,
          tcp_time: entry.connectEnd - entry.connectStart,
          ttfb: entry.responseStart - entry.requestStart,
          dom_interactive: entry.domInteractive - entry.fetchStart
        }
      });
    }
  }
});
observer.observe({ entryTypes: ['navigation'] });
```

### **Painel de Telemetria**

```typescript
interface TelemetryDashboard {
  errors: {
    total_last_24h: number;
    by_type: Record<string, number>;
    top_errors: Array<{
      message: string;
      count: number;
      last_occurrence: string;
    }>;
  };
  sessions: {
    active_users: number;
    avg_session_duration: number;
    total_sessions_today: number;
  };
  performance: {
    avg_page_load_time: number;
    avg_api_response_time: number;
    slow_queries: Array<{
      endpoint: string;
      avg_duration: number;
      count: number;
    }>;
  };
  usage: {
    top_features: Array<{
      feature: string;
      usage_count: number;
    }>;
    active_organizations: number;
  };
}
```

**Query de Exemplo:**
```sql
-- Erros críticos nas últimas 24h
SELECT
  event_name,
  error_message,
  COUNT(*) AS occurrences,
  MAX(created_at) AS last_occurrence
FROM telemetry_events
WHERE event_type = 'error'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY event_name, error_message
HAVING COUNT(*) > 10
ORDER BY occurrences DESC
LIMIT 10;

-- Performance médio por endpoint
SELECT
  properties->>'url' AS endpoint,
  AVG(duration_ms) AS avg_duration,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) AS p95_duration,
  COUNT(*) AS requests
FROM telemetry_events
WHERE event_type = 'api_call'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY properties->>'url'
HAVING AVG(duration_ms) > 1000  -- Mais de 1s
ORDER BY avg_duration DESC;
```

### **Sistema de Auditoria**

```typescript
interface AuditLogEntry {
  id: string;
  organization_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  changes: {
    before: any;
    after: any;
  };
  reason: string; // OBRIGATÓRIO para ações críticas
  ip_address: string;
  user_agent: string;
  created_at: string;
}

// Ações críticas que requerem reason
const CRITICAL_ACTIONS = [
  'delete_project',
  'delete_contract',
  'change_budget',
  'revoke_permissions',
  'export_data'
];

async function logAudit(params: {
  action: string;
  entity_type: string;
  entity_id: string;
  changes?: any;
  reason?: string;
}) {
  // Valida reason para ações críticas
  if (CRITICAL_ACTIONS.includes(params.action) && !params.reason) {
    throw new Error(`Ação crítica "${params.action}" requer justificativa.`);
  }

  await supabase.from('audit_log').insert({
    organization_id: currentOrg.id,
    user_id: currentUser.id,
    action: params.action,
    entity_type: params.entity_type,
    entity_id: params.entity_id,
    changes: params.changes,
    reason: params.reason,
    ip_address: await getClientIP(),
    user_agent: navigator.userAgent
  });
}
```

**Auditoria em Tempo Real:**
```typescript
// Subscription para eventos críticos
const auditSubscription = supabase
  .channel('audit-log')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'audit_log',
    filter: `action=in.(delete_project,delete_contract,revoke_permissions)`
  }, (payload) => {
    // Alerta em tempo real para ações críticas
    if (isCriticalAction(payload.new.action)) {
      sendAlertToAdmins({
        title: 'Ação Crítica Executada',
        message: `${payload.new.action} por ${payload.new.user_id}`,
        reason: payload.new.reason,
        timestamp: payload.new.created_at
      });
    }
  })
  .subscribe();
```

### **Alertas Automáticos**

```typescript
// Automation Rule para erros críticos
{
  "name": "Alerta: Múltiplos erros críticos",
  "trigger_type": "telemetry_threshold",
  "trigger_config": {
    "event_type": "error",
    "threshold": 50,
    "window_minutes": 5
  },
  "actions": [
    {
      "type": "sendEmail",
      "config": {
        "to": "tech@example.com",
        "subject": "ALERTA: Múltiplos erros detectados",
        "template": "critical_errors_alert"
      }
    },
    {
      "type": "sendWhatsApp",
      "config": {
        "to": "admin_phone",
        "message": "🚨 ALERTA: {{error_count}} erros nos últimos 5min"
      }
    }
  ]
}
```

### **Aceite**
✅ Erros capturados e logados automaticamente
✅ Painel mostra erros/sessões/latência
✅ Incidente crítico dispara alerta por email
✅ Auditoria mostra "quem, quando, por quê"
✅ Ações críticas bloqueadas sem justificativa

---

## 📚 Rituais Operacionais

### **Monday Morning Ops Review**

**Quem:** Gestor + Leads de cada departamento
**Quando:** Segunda, 09:00
**Duração:** 30min

**Agenda:**
1. Revisar relatório semanal (5min)
2. Discutir riscos críticos (10min)
3. Ajustar prioridades (10min)
4. Definir ações da semana (5min)

**Checklist:**
- [ ] Relatório recebido por WhatsApp/Email
- [ ] Riscos críticos identificados
- [ ] Plano de ação definido
- [ ] Responsáveis atribuídos

### **Daily Stand-up (Assíncrono)**

**Quem:** Toda a equipe
**Quando:** Diariamente até 10:00
**Formato:** Mensagem WhatsApp ou Slack

**Template:**
```
✅ Ontem: [o que fiz]
🎯 Hoje: [o que vou fazer]
🚧 Bloqueios: [se houver]
```

### **Sprint Planning (Quinzenal)**

**Quem:** Gestor + Equipe de produção
**Quando:** A cada 15 dias
**Duração:** 2h

**Agenda:**
1. Review do sprint anterior (30min)
2. Planejamento do próximo sprint (60min)
3. Definição de metas (30min)

### **Monthly Financial Review**

**Quem:** Gestor + Financeiro + Artista (opcional)
**Quando:** Primeira sexta do mês
**Duração:** 1h

**Agenda:**
1. DRE do mês anterior (20min)
2. Projeção do mês corrente (20min)
3. Ajustes orçamentários (20min)

---

## 🎯 Melhores Práticas por Departamento

### **Conteúdo**

✅ **Use Templates:** Single D-30, Álbum D-120
✅ **Automatize:** Tarefas repetitivas via Automations
✅ **Documente:** Todas as decisões criativas
✅ **Aprove Rápido:** Inbox de aprovações diariamente

### **Shows**

✅ **CRM Atualizado:** Contatos e follow-ups em dia
✅ **Propostas Rápidas:** Use templates pré-aprovados
✅ **Pipeline Limpo:** Mova deals ganhos/perdidos
✅ **Contratos:** Sempre com assinatura digital

### **Financeiro**

✅ **DRE Mensal:** Sempre até dia 5 do mês
✅ **Centro de Custos:** Classifique tudo corretamente
✅ **Alertas:** Configure para orçamento > 80%
✅ **Importação:** CSV semanal de extratos

### **Produção Musical**

✅ **Versionamento:** Todo arranjo tem versão
✅ **Aprovação:** Nunca pule o fluxo de aprovação
✅ **Setlist D-1:** Sempre trave 24h antes
✅ **Offline Ready:** Pré-cache obrigatório

### **Jurídico**

✅ **Templates:** Revise e atualize trimestralmente
✅ **Assinaturas:** Colete sempre digitalmente
✅ **Versionamento:** Compare versões antes de assinar
✅ **Compliance:** Auditoria mensal de contratos

---

## 📞 Suporte

**Documentação Completa:** https://docs.taskmaster.works
**Email:** suporte@taskmaster.works
**WhatsApp:** +55 11 9xxxx-xxxx
**Status:** https://status.taskmaster.works

---

**TaskMaster Pro - Transformando a indústria musical através de tecnologia enterprise! 🎵**
