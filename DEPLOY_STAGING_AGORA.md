# 🚀 DEPLOY STAGING - GUIA EXECUTIVO RÁPIDO

**Data:** 08 de Novembro de 2025
**Versão:** 1.0.1
**Objetivo:** Deploy em staging.taskmaster.app

---

## ⚡ RESUMO: 7 PASSOS PARA DEPLOY

1. ✅ Build local (já validado)
2. 🚀 Login Vercel
3. 🚀 Deploy
4. ⚙️ Configurar variáveis de ambiente
5. 🌐 Configurar domínio custom
6. 👤 Criar conta admin
7. ✅ Validar staging

**Tempo Total:** 30-40 minutos

---

## 📋 PASSO 1: BUILD LOCAL (JÁ FEITO ✅)

```bash
✓ npm run build executado com sucesso
✓ Bundle: 407 KB (113 KB gzipped)
✓ Zero erros
✓ dist/ folder gerado
```

**Status:** ✅ **COMPLETO**

---

## 🚀 PASSO 2: LOGIN VERCEL

### **Opção A: Se você já tem conta Vercel**

```bash
# 1. Instalar Vercel CLI (se ainda não tiver)
npm install -g vercel

# 2. Login
vercel login
```

**Escolher método:**
- GitHub (recomendado)
- Email
- GitLab

### **Opção B: Se NÃO tem conta Vercel**

1. Acessar: https://vercel.com/signup
2. Criar conta (GitHub, GitLab ou Email)
3. Voltar ao terminal e executar: `vercel login`

---

## 🚀 PASSO 3: DEPLOY

### **Método Recomendado: Vercel CLI**

```bash
# Na pasta raiz do projeto (onde está package.json)
cd /tmp/cc-agent/40021165/project

# Deploy para produção
vercel --prod
```

**Perguntas que o Vercel fará:**

1. **"Set up and deploy?"** → `y` (yes)
2. **"Which scope?"** → Selecionar sua conta
3. **"Link to existing project?"** → `n` (no - criar novo)
4. **"Project name?"** → `taskmaster-staging`
5. **"In which directory?"** → `.` (pasta atual)
6. **"Override settings?"** → `n` (no - usar detecção automática)

**Saída Esperada:**
```
🔗 Linked to your-account/taskmaster-staging
🔍 Inspect: https://vercel.com/your-account/taskmaster-staging/xxx
✅ Production: https://taskmaster-staging-xxx.vercel.app
```

**✨ Copiar a URL gerada!**

---

## ⚙️ PASSO 4: CONFIGURAR VARIÁVEIS DE AMBIENTE

### **4.1 Acessar Dashboard Vercel**

1. Abrir: https://vercel.com/dashboard
2. Selecionar projeto: `taskmaster-staging`
3. Click em **"Settings"** (menu superior)
4. Click em **"Environment Variables"** (menu lateral)

### **4.2 Adicionar Variáveis (COPIAR E COLAR)**

**IMPORTANTE:** Adicionar cada variável individualmente.

Para cada variável:
- Click em "Add New"
- Colar **Key** (nome)
- Colar **Value** (valor)
- Marcar: ✅ **Production** e ✅ **Preview**
- Click "Save"

---

#### **VARIÁVEIS OBRIGATÓRIAS (COPIAR EXATAMENTE):**

```env
Key: VITE_SUPABASE_URL
Value: https://fcmxljhckrztingxecss.supabase.co
Environments: ✅ Production ✅ Preview

Key: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjbXhsamhja3J6dGluZ3hlY3NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MjA5MjQsImV4cCI6MjA3NzQ5NjkyNH0.weUKjuJdRTyLtPrSCt2gTNI52kUzjYkVwV_F_Y1FHNU
Environments: ✅ Production ✅ Preview

Key: VITE_APP_ENV
Value: staging
Environments: ✅ Production ✅ Preview

Key: VITE_BETA_MODE
Value: true
Environments: ✅ Production ✅ Preview

Key: VITE_INVITE_ONLY
Value: true
Environments: ✅ Production ✅ Preview

Key: VITE_PUBLIC_SIGNUPS
Value: false
Environments: ✅ Production ✅ Preview

Key: VITE_FEATURE_PIPELINE_V2
Value: true
Environments: ✅ Production ✅ Preview

Key: VITE_FEATURE_APPROVALS
Value: true
Environments: ✅ Production ✅ Preview

Key: VITE_FEATURE_COMMAND_CENTER
Value: true
Environments: ✅ Production ✅ Preview

Key: VITE_FEATURE_PLANNING_COPILOT
Value: true
Environments: ✅ Production ✅ Preview

Key: VITE_FEATURE_BILLING
Value: false
Environments: ✅ Production ✅ Preview

Key: VITE_FEATURE_SUBSCRIPTIONS
Value: false
Environments: ✅ Production ✅ Preview

Key: VITE_FEATURE_OWNERSHIP
Value: false
Environments: ✅ Production ✅ Preview

Key: VITE_ENABLE_CLASSIC_ROUTES
Value: false
Environments: ✅ Production ✅ Preview
```

---

### **4.3 Redeploy com Variáveis**

Após adicionar TODAS as variáveis:

```bash
# Forçar redeploy para aplicar variáveis
vercel --prod --force
```

**OU** no Dashboard Vercel:
- Deployments tab
- Últim deployment → ⋯ (três pontos)
- "Redeploy"

---

## 🌐 PASSO 5: CONFIGURAR DOMÍNIO CUSTOM (OPCIONAL)

### **5.1 Adicionar Domínio no Vercel**

1. No projeto: Settings → **Domains**
2. Click "Add"
3. Digitar: `staging.taskmaster.app`
4. Click "Add"

### **5.2 Configurar DNS**

**No provedor do domínio taskmaster.app:**

Adicionar registro:
```
Type: CNAME
Name: staging
Value: cname.vercel-dns.com
TTL: 3600
```

**Aguardar propagação:** 5-30 minutos

**Verificar propagação:**
```bash
dig staging.taskmaster.app
# ou
nslookup staging.taskmaster.app
```

### **5.3 SSL Automático**

- ✅ Vercel provisiona SSL automaticamente
- ✅ Let's Encrypt
- ✅ Renovação automática

**Após propagação DNS:**
- Acessar: https://staging.taskmaster.app
- Verificar cadeado verde (HTTPS)

---

## 👤 PASSO 6: CRIAR CONTA ADMIN

### **6.1 Acessar URL Staging**

**Opção 1:** Domínio custom (se configurado)
```
https://staging.taskmaster.app
```

**Opção 2:** URL Vercel
```
https://taskmaster-staging-xxx.vercel.app
```

### **6.2 Cadastrar Admin**

1. Acessar URL do staging
2. Click em **"Cadastrar"** (ou navegar para `/register`)
3. Preencher formulário:

```
Email: balmarcos@hotmail.com
Senha: bal@123456
Confirmar Senha: bal@123456
```

4. Click em **"Criar Conta"**

### **6.3 Confirmar Email (Se Necessário)**

**Se email confirmation estiver ATIVO:**
- Checar inbox: balmarcos@hotmail.com
- Abrir email do Supabase
- Click no link de confirmação

**Se email confirmation estiver DESATIVADO:**
- Conta criada automaticamente
- Prosseguir para login

### **6.4 Fazer Login**

1. Navegar para `/login` (ou será redirecionado automaticamente)
2. Login:
```
Email: balmarcos@hotmail.com
Senha: bal@123456
```
3. Click em **"Entrar"**
4. **Aguardar redirecionamento** para dashboard (`/`)

### **6.5 Validar Sessão**

- [ ] Dashboard carrega corretamente
- [ ] Menu lateral visível
- [ ] Nome/email do usuário aparece
- [ ] F5 (reload) → Sessão persiste (não desloga)

---

## ✅ PASSO 7: VALIDAÇÃO COMPLETA

### **7.1 Validação Rápida (5 minutos)**

**Abrir DevTools (F12) → Console**

#### **✅ Teste 1: Dashboard**
- [ ] URL carrega sem erros
- [ ] HTTPS ativo (cadeado verde)
- [ ] 4 cards superiores renderizam
- [ ] Tabela "Nossos Talentos" renderiza
- [ ] Menu lateral completo
- [ ] Console sem erros em vermelho

#### **✅ Teste 2: Navegação**
- [ ] Click em "Tarefas" → `/tasks` carrega
- [ ] Click em "Agenda" → `/calendar` carrega
- [ ] Click em "Artistas" (menu) → `/artists` carrega
- [ ] Click em "Perfil" → `/profile` carrega
- [ ] Zero telas brancas

#### **✅ Teste 3: TaskBoard**
- [ ] Navegar para `/tasks`
- [ ] 4 colunas renderizam
- [ ] Click "+ Nova Tarefa"
- [ ] Tarefa aparece em "A Fazer"
- [ ] F5 → Tarefa persiste (se implementado)

#### **✅ Teste 4: Calendar**
- [ ] Navegar para `/calendar`
- [ ] Calendário mensal renderiza
- [ ] Click "← Anterior" navega
- [ ] Click "Próximo →" navega
- [ ] Click "+ Novo Evento" cria evento
- [ ] Evento aparece no calendário
- [ ] F5 → Evento persiste

#### **✅ Teste 5: ArtistManager**
- [ ] Navegar para `/artists`
- [ ] Estado vazio ou grid de artistas
- [ ] Click "+ Novo Artista"
- [ ] Modal abre
- [ ] Preencher e salvar
- [ ] Artista aparece no grid
- [ ] Busca funciona
- [ ] F5 → Artista persiste

#### **✅ Teste 6: UserProfile**
- [ ] Navegar para `/profile`
- [ ] Dados do usuário exibem
- [ ] Click "Editar Perfil"
- [ ] Alterar nome
- [ ] Salvar
- [ ] Dados atualizam
- [ ] F5 → Alterações persistem

#### **✅ Teste 7: Console Logs**

**No Console do navegador (F12):**
```javascript
// Verificar database disponível
console.log('DB:', window.taskmaster_db);

// Ver estatísticas
window.taskmaster_db.getStats();

// Ver logs
window.taskmaster_db.getLogs();

// Validar persistência
window.taskmaster_db.validatePersistence();
```

**Esperado:**
- [ ] `window.taskmaster_db` definido
- [ ] `getStats()` retorna contadores corretos
- [ ] `getLogs()` mostra histórico de ações
- [ ] `validatePersistence()` retorna "healthy"

#### **✅ Teste 8: Backup/Restore**

**No Console:**
```javascript
// Criar backup
const backup = window.taskmaster_db.createBackup();
console.log('Backup size:', backup.length);

// Limpar dados
window.taskmaster_db.clearAll();

// Verificar vazio
window.taskmaster_db.getStats();

// Restaurar
window.taskmaster_db.restoreBackup(backup);

// Verificar restaurado
window.taskmaster_db.getStats();
```

- [ ] Backup gera JSON válido
- [ ] `clearAll()` remove dados
- [ ] `restoreBackup()` recupera tudo
- [ ] Dados restaurados corretamente

---

### **7.2 Screenshots Necessários**

**Tirar screenshots de:**

1. **Dashboard (`/`)**
   - Capturar tela completa
   - Mostrar 4 cards superiores
   - Mostrar tabela de artistas
   - Mostrar menu lateral

2. **TaskBoard (`/tasks`)**
   - Capturar tela completa
   - Mostrar 4 colunas
   - Mostrar tarefas (se houver)

3. **Calendar (`/calendar`)**
   - Capturar tela completa
   - Mostrar calendário mensal
   - Mostrar eventos (se houver)

4. **ArtistManager (`/artists`)**
   - Capturar tela completa
   - Mostrar grid de artistas (ou estado vazio)
   - Mostrar campo de busca

5. **UserProfile (`/profile`)**
   - Capturar tela completa
   - Mostrar dados do usuário

6. **Console Logs**
   - F12 → Console
   - Executar: `window.taskmaster_db.getStats()`
   - Capturar saída

7. **URL Bar**
   - Mostrar `staging.taskmaster.app` com cadeado HTTPS

---

### **7.3 Validação de Variáveis de Ambiente**

**No Console (F12):**
```javascript
// Verificar variáveis
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('App Env:', import.meta.env.VITE_APP_ENV);
console.log('Beta Mode:', import.meta.env.VITE_BETA_MODE);
console.log('Billing:', import.meta.env.VITE_FEATURE_BILLING);
console.log('Subscriptions:', import.meta.env.VITE_FEATURE_SUBSCRIPTIONS);
```

**Valores Esperados:**
```javascript
Supabase URL: "https://fcmxljhckrztingxecss.supabase.co"
App Env: "staging"
Beta Mode: "true"
Billing: "false"
Subscriptions: "false"
```

**Screenshot:** Capturar saída do console

---

## 📊 CHECKLIST FINAL

### **Infraestrutura:**
- [ ] URL staging.taskmaster.app (ou Vercel) acessível
- [ ] HTTPS ativo (cadeado verde)
- [ ] SSL válido (não expirado)
- [ ] Sem warnings de segurança

### **Autenticação:**
- [ ] Cadastro de admin funciona
- [ ] Login com balmarcos@hotmail.com funciona
- [ ] Sessão persiste após F5
- [ ] Logout funciona

### **Rotas (15 módulos):**
- [ ] `/` - Dashboard Organização
- [ ] `/tasks` - TaskBoard
- [ ] `/calendar` - Calendário
- [ ] `/artists` - Artistas
- [ ] `/profile` - Perfil
- [ ] `/planejamento` - Planning Copilot
- [ ] `/templates` - Templates
- [ ] `/music` - Music Hub
- [ ] `/reports` - Relatórios
- [ ] `/shows` - Shows
- [ ] `/whatsapp` - WhatsApp
- [ ] `/google` - Google
- [ ] `/meetings` - Reuniões
- [ ] `/marketing` - Marketing
- [ ] `/production` - Produção

### **Funcionalidades Core:**
- [ ] TaskBoard: 4 colunas + criar tarefa
- [ ] Calendar: Calendário + criar evento
- [ ] ArtistManager: Grid + criar artista
- [ ] ProjectDashboard: Métricas + progresso
- [ ] UserProfile: Edição + persistência

### **Persistência:**
- [ ] localStorage funciona
- [ ] Dados persistem após F5
- [ ] Backup/restore funcional
- [ ] validatePersistence() OK

### **Console:**
- [ ] Zero erros críticos (vermelho)
- [ ] `window.taskmaster_db` disponível
- [ ] Logs formatados aparecem
- [ ] Variáveis de ambiente corretas

### **Telas Brancas:**
- [ ] Zero telas brancas nos 15 módulos
- [ ] Todos os componentes renderizam

---

## 📄 PASSO 8: GERAR RELATÓRIO

Após completar validação, preencher:

**`STAGING_VALIDATION_REPORT_v1.0.1.md`**

Incluir:
- ✅ URL do staging
- ✅ Confirmação de SSL
- ✅ Conta admin criada e validada
- ✅ Screenshots das 7 telas
- ✅ Screenshot do console com logs
- ✅ Confirmação de variáveis de ambiente
- ✅ Checklist preenchido
- ✅ Lista de problemas encontrados (se houver)
- ✅ Aprovação final (SIM/NÃO)

---

## 🎯 RESULTADO ESPERADO

```
╔═══════════════════════════════════════════════════╗
║                                                   ║
║     STAGING VALIDADO E APROVADO                   ║
║                                                   ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║  ✅ URL: staging.taskmaster.app                   ║
║  ✅ SSL: Ativo e válido                           ║
║  ✅ Admin: balmarcos@hotmail.com                  ║
║  ✅ Rotas: 15/15 funcionando                      ║
║  ✅ Core: 6/6 componentes OK                      ║
║  ✅ Telas brancas: 0                              ║
║  ✅ Erros críticos: 0                             ║
║  ✅ Persistência: 100%                            ║
║                                                   ║
║  APROVADO PARA TESTES BETA                        ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
```

---

## 🆘 PROBLEMAS COMUNS

### **Problema: Build Failed no Vercel**
```
Solução:
1. Verificar npm run build local funciona
2. Verificar variáveis de ambiente
3. Limpar cache: vercel --force
```

### **Problema: Tela Branca após Deploy**
```
Solução:
1. Verificar Console (F12) para erros
2. Confirmar variáveis de ambiente no Vercel
3. Verificar VITE_SUPABASE_URL está definida
4. Redeploy: vercel --prod --force
```

### **Problema: Autenticação não funciona**
```
Solução:
1. Verificar Supabase está online
2. Confirmar VITE_SUPABASE_ANON_KEY correta
3. Testar Auth no Supabase Dashboard
4. Verificar RLS policies
```

### **Problema: SSL não ativa**
```
Solução:
1. Aguardar propagação DNS (até 30min)
2. Verificar CNAME correto no DNS
3. Forçar renovação SSL no Vercel
4. Contatar suporte Vercel
```

---

## ✅ CONFIRMAÇÃO

Após executar todos os passos:

- [ ] Deploy staging concluído
- [ ] Variáveis de ambiente configuradas
- [ ] Domínio staging.taskmaster.app ativo (ou URL Vercel)
- [ ] Conta admin criada e validada
- [ ] Validação completa executada
- [ ] Screenshots capturados
- [ ] Relatório gerado
- [ ] Zero telas brancas confirmado
- [ ] Zero erros críticos confirmado

**Pronto para:** Aprovação e testes beta

---

**Data de Execução:** ___/___/2025
**Executado por:** _______________
**URL Staging:** _______________
**Status:** [ ] APROVADO / [ ] REPROVADO

---

**FIM DO GUIA EXECUTIVO**
