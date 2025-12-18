# 🐛 BUGS CONHECIDOS - BETA FECHADO

**Versão:** 1.0.2-beta
**Data:** 20 de Novembro de 2025
**Status:** Em Teste Beta Fechado

---

## ⚠️ BUGS CONHECIDOS (NÃO CRÍTICOS)

### 🟡 BUG #1: Real-time Pode Duplicar Itens Temporariamente
- **Descrição:** Ao criar tarefa ou evento, item pode aparecer duplicado por 1-2 segundos
- **Onde:** TaskBoard, CalendarView
- **Impacto:** 🟡 BAIXO - Visual apenas, não perde dados
- **Workaround:** Aguarde 2 segundos, duplicata desaparece automaticamente
- **Status:** Identificado, não afeta uso normal

### 🟡 BUG #2: Filtros Não Persistem Entre Páginas
- **Descrição:** Ao navegar entre páginas, filtros aplicados resetam
- **Onde:** TaskBoard (filtro workstream), CalendarView (filtro tipo evento)
- **Impacto:** 🟡 BAIXO - Precisa reaplicar filtro ao voltar
- **Workaround:** Aplicar filtro novamente após navegar
- **Status:** Identificado, será corrigido no próximo release

### 🟡 BUG #3: Modal de Edição Pode Abrir Vazio
- **Descrição:** Ocasionalmente modal de edição abre sem dados preenchidos
- **Onde:** TaskBoard → Editar tarefa
- **Impacto:** 🟡 BAIXO - Fechar e abrir novamente resolve
- **Workaround:** Fechar modal (ESC) e clicar editar novamente
- **Status:** Identificado, ocorre em <5% das vezes

---

## ✅ BUGS CORRIGIDOS NESTA VERSÃO

### ✅ Sistema de Toasts Implementado
- **Antes:** Usava `alert()` nativo do browser (bloqueante)
- **Agora:** Usa Sonner com toasts modernos e não-bloqueantes
- **Módulos corrigidos:** TaskBoard, CalendarView, PlanningDashboard, Auth

### ✅ Validações Frontend Adicionadas
- **Antes:** Erros SQL apareciam diretamente ao usuário
- **Agora:** Validações impedem envio de dados inválidos
- **Módulos corrigidos:**
  - TaskBoard: Valida título, workstream obrigatório
  - CalendarView: Valida título, data obrigatória
  - LoginForm: Valida email formato correto, senha mínimo 6 chars
  - RegisterForm: Valida todos campos obrigatórios, senhas coincidem

### ✅ Mensagens de Sucesso Adicionadas
- **Antes:** Ações silenciosas, sem feedback claro
- **Agora:** Toast de sucesso em toda ação (criar, editar, deletar)
- **Exemplos:**
  - "Tarefa criada com sucesso!"
  - "Evento atualizado!"
  - "Login realizado com sucesso!"

### ✅ Botão Atualizar em Reports
- **Antes:** Sem forma de recarregar métricas
- **Agora:** Botão "Atualizar" com ícone animado
- **Localização:** ReportsPage (canto superior direito)

---

## 🚧 LIMITAÇÕES CONHECIDAS (POR DESIGN)

### 📋 Funcionalidades Não Implementadas

#### **Gestão de Equipe**
- ❌ Não é possível convidar membros para organização
- ❌ Sem controle de permissões (admin, membro, viewer)
- **Uso Beta:** Cada usuário opera individualmente

#### **Módulo Financeiro**
- ❌ Completamente não implementado
- **Uso Beta:** Não tentar acessar funcionalidades financeiras

#### **Notificações**
- ❌ Sem push notifications
- ❌ Sem email notifications
- **Uso Beta:** Verificar manualmente atualizações na plataforma

#### **Integrações Externas**
- ❌ WhatsApp não integrado
- ❌ Google Calendar não sincroniza
- ❌ Sem webhooks
- **Uso Beta:** Usar plataforma standalone

#### **Subtarefas e Comentários**
- ❌ Tarefas não suportam subtarefas
- ❌ Sem sistema de comentários em tarefas
- **Uso Beta:** Usar campo "descrição" para detalhes

#### **Anexos**
- ❌ Não é possível fazer upload de arquivos
- ❌ Sem anexos em tarefas ou eventos
- **Uso Beta:** Adicionar links externos na descrição

---

## 🎯 FUNCIONALIDADES TESTADAS E ESTÁVEIS

### ✅ Autenticação
- ✅ Login com email/senha
- ✅ Registro de novos usuários
- ✅ Logout
- ✅ Sessão persistente
- ⚠️ Reset de senha (funcional mas email pode demorar)

### ✅ TaskBoard
- ✅ Criar, editar, deletar tarefas
- ✅ Drag & Drop entre colunas
- ✅ 4 Workstreams (Conteúdo, Shows, Logística, Estratégia)
- ✅ Filtro por workstream
- ✅ Real-time sync entre abas
- ✅ Badges de origem (Planejamento)

### ✅ CalendarView
- ✅ Visualização mensal
- ✅ Criar, editar, deletar eventos
- ✅ 6 tipos de eventos (Task, Meeting, Event, Show, Deadline, Planning)
- ✅ Filtro por tipo de evento
- ✅ Cores por tipo
- ✅ Real-time sync

### ✅ Planejamento com IA
- ✅ Geração de planejamentos via OpenAI
- ✅ Import de arquivos (CSV, JSON, TXT)
- ✅ Distribuição automática para TaskBoard/Calendar
- ✅ Timeline visual
- ✅ Progresso calculado automaticamente
- ⚠️ Requer API key OpenAI configurada

### ✅ Reports
- ✅ Métricas em tempo real do banco
- ✅ Cards: Tarefas, Eventos, Planejamentos
- ✅ Taxa de conclusão
- ✅ Botão atualizar
- ✅ Gráficos básicos

### ✅ Módulo Música
- ✅ Gestão de artistas
- ✅ Setlists
- ✅ Arranjos
- ✅ Stage Mode básico
- ⚠️ QR Code join não funcional

---

## 🔥 COMO REPORTAR BUGS NO BETA

### **Durante o Teste:**

1. **Anotar o problema:**
   - O que você estava fazendo?
   - O que aconteceu?
   - O que você esperava que acontecesse?

2. **Print/vídeo (se possível):**
   - Screenshot da tela
   - Abrir console (F12) e tirar print de erros em vermelho

3. **Enviar feedback:**
   - Usar widget de feedback (canto inferior direito)
   - Ou enviar email para: [SEU-EMAIL]

### **Informações Úteis:**
- ✅ Navegador usado (Chrome, Firefox, Safari)
- ✅ Horário aproximado que ocorreu
- ✅ Se consegue reproduzir novamente
- ✅ Mensagem de erro (se houver)

---

## 📊 PERFORMANCE ESPERADA

### **Tempos de Carregamento:**
- Login → Dashboard: <2 segundos
- Criar tarefa: <1 segundo
- Carregar Calendar: <2 segundos
- Gerar planejamento IA: 10-30 segundos

### **Limites Conhecidos:**
- Máximo de tarefas testado: 500 (funciona bem)
- Máximo de eventos testado: 300 (funciona bem)
- Usuários simultâneos testado: 10 (funciona bem)

### **Compatibilidade:**
- ✅ Chrome 120+
- ✅ Firefox 120+
- ✅ Safari 17+
- ✅ Edge 120+
- ⚠️ Mobile: Funciona mas não otimizado

---

## 🎯 FOCO DO BETA FECHADO

**O que queremos validar:**
1. ✅ Fluxo de cadastro e login está claro?
2. ✅ TaskBoard é intuitivo?
3. ✅ Planejamento com IA é útil?
4. ✅ Calendar cobre necessidades básicas?
5. ✅ Reports mostram dados relevantes?
6. ✅ Navegação entre módulos faz sentido?

**O que NÃO precisa testar:**
- ❌ Módulo Financeiro (não existe)
- ❌ WhatsApp (não integrado)
- ❌ Convites de equipe (não implementado)
- ❌ Notificações (não implementado)

---

## 🆘 PROBLEMAS CRÍTICOS?

**Se encontrar algo que:**
- 🔴 Impede uso da plataforma
- 🔴 Perde dados do usuário
- 🔴 Trava completamente

**Contato urgente:**
- Email: [SEU-EMAIL]
- WhatsApp: [SEU-WHATSAPP]

---

## 📅 PRÓXIMOS PASSOS

### **Após Beta Fechado:**
1. Corrigir bugs reportados
2. Ajustar UI/UX baseado em feedback
3. Implementar funcionalidades prioritárias
4. Abrir Beta Público (100+ usuários)

### **Previsão:**
- Beta Fechado: Agora → +1 semana
- Correções: +1 semana
- Beta Aberto: +2 semanas
- Lançamento Oficial: +2 meses

---

**Última atualização:** 20/11/2025 20:00
**Responsável:** Equipe TaskMaster
**Versão:** 1.0.2-beta
