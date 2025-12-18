# 🧪 GUIA PASSO A PASSO - TESTE DE INTEGRAÇÃO

**Objetivo:** Validar que Planejamento → TaskBoard → CalendarView → Reports funciona perfeitamente

---

## 📋 PRÉ-REQUISITOS

✅ Build compilado (27.96s)
✅ .env configurado
✅ Banco Supabase online
✅ Script de teste criado

---

## 🚀 MÉTODO 1: TESTE AUTOMATIZADO (RÁPIDO)

### **Passo 1: Iniciar o Dev Server**

```bash
npm run dev
```

**Aguarde até ver:**
```
➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

---

### **Passo 2: Fazer Login no Navegador**

1. Abra: `http://localhost:5173`
2. Faça login com suas credenciais
3. **IMPORTANTE:** Deixe o navegador aberto
4. **Não feche a aba!**

---

### **Passo 3: Executar Script de Teste**

**Em um NOVO terminal** (deixe o dev server rodando):

```bash
node scripts/test-planning-integration.js
```

**Output esperado:**
```
🚀 INICIANDO TESTE DE INTEGRAÇÃO PLANEJAMENTO

1️⃣ Verificando autenticação...
✅ Usuário autenticado: seu-email@exemplo.com

2️⃣ Criando planejamento de teste...
✅ Planejamento criado: abc-123-def-456

3️⃣ Criando fase do planejamento...
✅ Fase criada: xyz-789-uvw-012

4️⃣ Criando tarefas no TaskBoard...
  ✅ Tarefa criada: 📝 Criar roteiro do videoclipe
  ✅ Tarefa criada: 🎵 Agendar ensaio técnico
  ✅ Tarefa criada: 🚚 Reservar equipamento de som
  ✅ Tarefa criada: 📊 Definir orçamento da campanha

✅ 4/4 tarefas criadas com sucesso

5️⃣ Criando eventos no CalendarView...
  ✅ Evento criado: 🎬 Gravação do Videoclipe
  ✅ Evento criado: 🎤 Reunião com Produção
  ✅ Evento criado: 📅 Deadline: Aprovação do Mix

✅ 3/3 eventos criados com sucesso

6️⃣ Validando integração...

  📋 Tarefas no TaskBoard: 4
     • 📝 Criar roteiro do videoclipe [conteudo] [todo]
     • 🎵 Agendar ensaio técnico [shows] [todo]
     • 🚚 Reservar equipamento de som [logistica] [todo]
     • 📊 Definir orçamento da campanha [estrategia] [todo]

  📅 Eventos no CalendarView: 3
     • 🎬 Gravação do Videoclipe [2025-11-17]
     • 🎤 Reunião com Produção [2025-11-23]
     • 📅 Deadline: Aprovação do Mix [2025-11-23]

============================================================
✅ TESTE DE INTEGRAÇÃO CONCLUÍDO COM SUCESSO!
============================================================

📊 RESUMO:
   • Planejamento: 🧪 Teste de Integração - Lançamento EP
   • ID: abc-123-def-456
   • Tarefas criadas: 4
   • Eventos criados: 3

🎯 PRÓXIMOS PASSOS:
   1. Abra o TaskMaster no navegador
   2. Vá para TaskBoard e veja as tarefas com badge roxo
   3. Vá para CalendarView e veja os eventos agendados
   4. Vá para ReportsPage e veja as métricas atualizadas
```

---

### **Passo 4: Validar Visualmente no Navegador**

#### **4.1 TaskBoard**

1. No navegador, clique em **"TaskBoard"** no menu
2. **VALIDAR:**
   - ✅ Vê 4 novas tarefas na coluna "A Fazer"
   - ✅ Cada tarefa tem **badge roxo** com texto "📋 Criada pelo Planejamento"
   - ✅ Tarefas estão em workstreams diferentes:
     - "Criar roteiro..." → Conteúdo
     - "Agendar ensaio..." → Shows
     - "Reservar equipamento..." → Logística
     - "Definir orçamento..." → Estratégia
   - ✅ Pode arrastar tarefas entre colunas
   - ✅ Pode clicar e editar tarefas

**Screenshot esperado:**
```
┌─────────────────────────────────────────┐
│ A Fazer                                 │
├─────────────────────────────────────────┤
│ 📝 Criar roteiro do videoclipe          │
│ 📋 Criada pelo Planejamento  [Alta]     │
│ Workstream: Conteúdo                    │
├─────────────────────────────────────────┤
│ 🎵 Agendar ensaio técnico               │
│ 📋 Criada pelo Planejamento  [Alta]     │
│ Workstream: Shows                       │
└─────────────────────────────────────────┘
```

---

#### **4.2 CalendarView**

1. Clique em **"Calendar"** no menu
2. **VALIDAR:**
   - ✅ Vê 3 novos eventos no calendário
   - ✅ Eventos têm **cor roxa/índigo**
   - ✅ Eventos aparecem nas datas corretas:
     - Amanhã: "Gravação do Videoclipe"
     - Próxima semana: "Reunião" e "Deadline"
   - ✅ Clique no filtro "Planejamento" → mostra só esses 3 eventos
   - ✅ Pode clicar e ver detalhes dos eventos

**Screenshot esperado:**
```
┌─────────────────────────────────────────┐
│        Novembro 2025                    │
├─────────────────────────────────────────┤
│ Dom  Seg  Ter  Qua  Qui  Sex  Sáb       │
│                          16   17        │
│                          •    🎬        │
│                               Gravação  │
│                                         │
│  23   24   25   26   27   28   29      │
│  🎤                                     │
│  📅                                     │
└─────────────────────────────────────────┘
```

---

#### **4.3 ReportsPage**

1. Clique em **"Relatórios"** no menu
2. **VALIDAR:**
   - ✅ Card "Tarefas Totais" aumentou (+4)
   - ✅ Card "Eventos" aumentou (+3)
   - ✅ Card "Planejamentos" mostra "1 ativo"
   - ✅ Gráfico "Distribuição de Tarefas" atualizado
   - ✅ Clique "Atualizar Dados" → recarrega sem erro

---

#### **4.4 Real-Time (Teste Avançado)**

1. Abra **TaskBoard** em uma aba
2. Abra **outra aba** do navegador no mesmo localhost
3. Na segunda aba, vá para **PlanningDashboard**
4. **Ação:** Mova o TaskBoard para um lado da tela
5. **Ação:** Mova o PlanningDashboard para o outro lado
6. **Ação:** No Planning, crie um novo planejamento simples
7. **VALIDAR:** Tarefas aparecem **automaticamente** no TaskBoard (sem F5)

---

## ✅ CHECKLIST DE VALIDAÇÃO

### **Funcionalidades Core:**
- [ ] Script executou sem erros
- [ ] 4 tarefas criadas no banco
- [ ] 3 eventos criados no banco
- [ ] TaskBoard mostra tarefas
- [ ] TaskBoard mostra badges roxos
- [ ] CalendarView mostra eventos
- [ ] CalendarView mostra cor roxa
- [ ] ReportsPage mostra métricas corretas

### **Integrações:**
- [ ] metadata.source = 'planning' presente
- [ ] workstream correto em cada tarefa
- [ ] event_type = 'planning' nos eventos
- [ ] Filtro "Planejamento" funciona no Calendar
- [ ] Real-time updates funcionam

### **UX/UI:**
- [ ] Badge roxo visível e legível
- [ ] Cores apropriadas (roxo/índigo)
- [ ] Pode editar tarefas do planejamento
- [ ] Pode arrastar tarefas
- [ ] Pode ver detalhes dos eventos

---

## 🚨 RESOLUÇÃO DE PROBLEMAS

### **Erro: "User not authenticated"**

**Solução:**
1. Abra o navegador
2. Faça login no TaskMaster
3. Deixe a aba aberta
4. Execute o script novamente

---

### **Erro: "Cannot find module"**

**Solução:**
```bash
npm install
node scripts/test-planning-integration.js
```

---

### **Tarefas não aparecem no TaskBoard**

**Diagnóstico:**
```bash
# Verificar se tarefas foram criadas
psql <sua-connection-string> -c "SELECT count(*) FROM tasks WHERE metadata->>'source' = 'planning';"
```

**Solução:**
1. Verificar console do navegador (F12)
2. Verificar se RLS está ativo
3. Verificar se usuário tem permissão

---

### **Eventos não aparecem no Calendar**

**Diagnóstico:**
```bash
# Verificar se eventos foram criados
psql <sua-connection-string> -c "SELECT count(*) FROM calendar_events WHERE event_type = 'planning';"
```

**Solução:**
1. Verificar data do evento (futuro vs passado)
2. Verificar filtros ativos no Calendar
3. Limpar cache do navegador

---

## 🧹 LIMPEZA DE DADOS DE TESTE

**Após validar tudo:**

```bash
# Conectar ao banco
psql <sua-connection-string>

# Buscar ID do planejamento de teste
SELECT id, name FROM plannings WHERE name LIKE '%Teste de Integração%';

# Copiar o ID e executar
DELETE FROM plannings WHERE id = '<ID-AQUI>';

# Isso vai deletar em cascata:
# - planning_phases
# - planning_tasks
# - tasks vinculadas
# - calendar_events vinculados
```

**Ou via Supabase Dashboard:**
1. Abra Supabase Dashboard
2. Vá para Table Editor → plannings
3. Encontre "Teste de Integração - Lançamento EP"
4. Clique delete (vai deletar tudo relacionado)

---

## 🎯 MÉTODO 2: TESTE MANUAL (SEM SCRIPT)

Se preferir testar manualmente sem o script:

### **Passo 1: Abrir TaskMaster**
```bash
npm run dev
```

### **Passo 2: Ir para PlanningDashboard**
1. Login no navegador
2. Clicar "Planejamento" no menu
3. Clicar "Novo Planejamento"

### **Passo 3: Criar Planejamento com IA**
1. Selecionar "Gerar com IA"
2. Digite no prompt:
   ```
   Criar planejamento para lançamento de um single musical.
   Incluir tarefas de produção, marketing e logística.
   ```
3. Clicar "Gerar"
4. Aguardar processamento (10-30 segundos)
5. Ver mensagem: "Planejamento criado com sucesso!"

### **Passo 4: Validar nos Módulos**
- Ir para **TaskBoard** → Ver tarefas com badge roxo
- Ir para **Calendar** → Ver eventos roxos
- Ir para **Reports** → Ver métricas atualizadas

---

## 📊 CRITÉRIOS DE SUCESSO

### **✅ SUCESSO TOTAL:**
- Script executou sem erros
- 4 tarefas + 3 eventos criados
- Tudo visível nos módulos
- Badges roxos presentes
- Real-time funcionando

### **⚠️ SUCESSO PARCIAL:**
- Script executou mas com warnings
- Alguns dados criados, outros não
- Precisa investigar logs

### **❌ FALHA:**
- Script não executa
- Nenhum dado criado
- Erros no console
- Precisa debug

---

## 🆘 SUPORTE

**Se encontrar problemas:**

1. **Copie o output do script**
2. **Copie erros do console (F12)**
3. **Screenshot da tela**
4. **Me envie tudo**

Vou debugar e corrigir imediatamente!

---

## ✅ PRÓXIMO PASSO APÓS VALIDAÇÃO

**Quando tudo estiver funcionando:**

→ **Deploy para Staging**

```bash
npm run build
npm run deploy
```

---

**Última atualização:** 09/11/2025 18:15
**Status:** Pronto para iniciar testes
