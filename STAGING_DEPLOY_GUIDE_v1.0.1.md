# 🚀 GUIA DE DEPLOY STAGING - TaskMaster v1.0.1

**Data:** 08 de Novembro de 2025
**Versão:** 1.0.1
**Ambiente:** Staging
**URL Alvo:** https://staging.taskmaster.app

---

## 🎯 OBJETIVO

Disponibilizar o TaskMaster v1.0.1 em ambiente staging para:
- ✅ Testes controlados com beta testers
- ✅ Validação de autenticação Supabase
- ✅ Verificação de persistência em ambiente real
- ✅ Testes de performance e estabilidade

---

## 📋 PRÉ-REQUISITOS

### **1. Conta Vercel** ✅
- Acessar: https://vercel.com
- Fazer login ou criar conta gratuita
- Vincular conta GitHub (opcional mas recomendado)

### **2. Build Validado** ✅
```bash
✓ npm run build executado com sucesso
✓ dist/ folder gerado
✓ Zero erros de compilação
✓ Bundle otimizado: 407 KB (113 KB gzipped)
```

### **3. Supabase Configurado** ✅
```env
VITE_SUPABASE_URL=https://fcmxljhckrztingxecss.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **4. Variáveis de Ambiente Preparadas** ✅
- `.env` (desenvolvimento) ✅
- `.env.production` (staging/produção) ⏳
- `vercel.json` (configurações) ✅

---

## 🚀 OPÇÃO 1: DEPLOY VIA VERCEL (RECOMENDADO)

### **Método A: Via Vercel CLI (Mais Rápido)**

#### **Passo 1: Instalar Vercel CLI**
```bash
npm install -g vercel
```

#### **Passo 2: Login**
```bash
vercel login
```
- Escolher método de autenticação (GitHub, GitLab, Email)
- Seguir instruções na tela

#### **Passo 3: Deploy**
```bash
# Build local (já feito)
npm run build

# Deploy para staging
vercel

# Ou deploy direto para produção
vercel --prod
```

**Saída Esperada:**
```
Vercel CLI 33.0.0
? Set up and deploy "~/taskmaster"? [Y/n] y
? Which scope do you want to deploy to? Your Name
? Link to existing project? [y/N] n
? What's your project's name? taskmaster-staging
? In which directory is your code located? ./
Auto-detected Project Settings (Vite):
- Build Command: npm run build
- Output Directory: dist
- Development Command: npm run dev
🔗 Linked to your-name/taskmaster-staging
🔍 Inspect: https://vercel.com/...
✅ Production: https://taskmaster-staging-xxx.vercel.app
```

#### **Passo 4: Configurar Variáveis de Ambiente**

**No Vercel Dashboard:**
1. Acessar: https://vercel.com/dashboard
2. Selecionar projeto `taskmaster-staging`
3. Settings → Environment Variables
4. Adicionar variáveis:

```env
# Supabase (OBRIGATÓRIO)
VITE_SUPABASE_URL = https://fcmxljhckrztingxecss.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjbXhsamhja3J6dGluZ3hlY3NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MjA5MjQsImV4cCI6MjA3NzQ5NjkyNH0.weUKjuJdRTyLtPrSCt2gTNI52kUzjYkVwV_F_Y1FHNU

# Environment
VITE_APP_ENV = staging

# Beta Mode
VITE_BETA_MODE = true
VITE_INVITE_ONLY = true
VITE_PUBLIC_SIGNUPS = false

# Feature Flags
VITE_FEATURE_PIPELINE_V2 = true
VITE_FEATURE_APPROVALS = true
VITE_FEATURE_COMMAND_CENTER = true
VITE_FEATURE_PLANNING_COPILOT = true
VITE_FEATURE_BILLING = false
VITE_FEATURE_SUBSCRIPTIONS = false
VITE_FEATURE_OWNERSHIP = false

# Classic Routes (disabled for staging)
VITE_ENABLE_CLASSIC_ROUTES = false
```

**IMPORTANTE:** Aplicar para **Production** e **Preview** environments.

#### **Passo 5: Configurar Domínio Customizado (Opcional)**

**Para usar staging.taskmaster.app:**

1. Settings → Domains
2. Add Domain: `staging.taskmaster.app`
3. Configurar DNS no provedor do domínio:
   - Type: `CNAME`
   - Name: `staging`
   - Value: `cname.vercel-dns.com`
   - TTL: `3600`
4. Aguardar propagação DNS (5-30 minutos)
5. Vercel provisionará SSL automaticamente

#### **Passo 6: Redeploy com Variáveis**
```bash
vercel --prod
```

---

### **Método B: Via Vercel Dashboard (Mais Visual)**

#### **Passo 1: Acessar Vercel**
- URL: https://vercel.com/new
- Fazer login

#### **Passo 2: Importar Projeto**
- Click em "Add New..." → Project
- Escolher método:
  - **GitHub:** Conectar repositório (recomendado)
  - **GitLab:** Conectar repositório
  - **Upload Manual:** Fazer upload da pasta do projeto

#### **Passo 3: Configurar Build**
```
Project Name: taskmaster-staging
Framework Preset: Vite
Root Directory: ./
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

#### **Passo 4: Adicionar Variáveis de Ambiente**
- Seção "Environment Variables"
- Adicionar todas as variáveis listadas acima
- Selecionar "Production" e "Preview"

#### **Passo 5: Deploy**
- Click em "Deploy"
- Aguardar build (1-3 minutos)
- Acessar URL gerada

---

## 🚀 OPÇÃO 2: DEPLOY VIA NETLIFY

### **Passo 1: Acessar Netlify**
- URL: https://app.netlify.com
- Fazer login ou criar conta

### **Passo 2: New Site**
- Click em "Add new site" → "Import an existing project"
- Conectar GitHub/GitLab ou fazer upload manual

### **Passo 3: Configurar Build**
```
Site name: taskmaster-staging
Branch: main (ou branch desejada)
Build command: npm run build
Publish directory: dist
```

### **Passo 4: Environment Variables**
- Site settings → Build & deploy → Environment
- Adicionar as mesmas variáveis do Vercel

### **Passo 5: Deploy**
- Deploy site
- Aguardar build

### **Passo 6: Domínio Customizado**
- Domain settings → Add custom domain
- Adicionar: `staging.taskmaster.app`
- Configurar DNS (similar ao Vercel)

---

## 🔒 CONFIGURAÇÕES DE SEGURANÇA

### **Headers de Segurança** (já configurados em `vercel.json`)
```json
{
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
}
```

### **SSL/HTTPS**
- ✅ Vercel provisiona SSL automaticamente
- ✅ Netlify provisiona SSL automaticamente
- ✅ Certificado Let's Encrypt válido
- ✅ Redirecionamento HTTP → HTTPS automático

### **Autenticação Supabase**
- ✅ Supabase Auth configurado
- ✅ RLS (Row Level Security) ativo
- ✅ JWT tokens seguros
- ✅ Email confirmation (configurável)

---

## 👤 CRIAÇÃO DA CONTA ADMIN

### **Método 1: Via Interface (Recomendado)**

**Após deploy estar no ar:**

1. Acessar: https://staging.taskmaster.app
2. Click em "Cadastrar" (ou navegar para `/register`)
3. Preencher formulário:
   - **Email:** balmarcos@hotmail.com
   - **Senha:** bal@123456
   - **Confirmar Senha:** bal@123456
4. Click em "Criar Conta"
5. **Se email confirmation estiver ativo:**
   - Checar inbox do email
   - Click no link de confirmação
6. Fazer login com as credenciais

### **Método 2: Via Supabase Dashboard**

**Se precisar criar manualmente:**

1. Acessar: https://supabase.com/dashboard
2. Projeto: `fcmxljhckrztingxecss`
3. Authentication → Users
4. Click em "Add user"
5. Preencher:
   - **Email:** balmarcos@hotmail.com
   - **Password:** bal@123456
   - **Auto Confirm User:** ✅ (marcar)
6. Click em "Create user"

### **Método 3: Via SQL (Avançado)**

```sql
-- No Supabase SQL Editor
INSERT INTO auth.users (
  email,
  encrypted_password,
  email_confirmed_at,
  role,
  raw_user_meta_data
)
VALUES (
  'balmarcos@hotmail.com',
  crypt('bal@123456', gen_salt('bf')),
  now(),
  'authenticated',
  '{"name": "Marcos", "role": "admin"}'::jsonb
);
```

---

## ✅ VALIDAÇÃO PÓS-DEPLOY

### **Checklist de Validação Imediata**

#### **1. URL e SSL** ✅
```bash
# Testar acesso
curl -I https://staging.taskmaster.app

# Resposta esperada:
HTTP/2 200
content-type: text/html
x-vercel-id: ...
```

- [ ] URL carrega sem erros
- [ ] HTTPS ativo (cadeado verde no navegador)
- [ ] Certificado SSL válido
- [ ] Sem warnings de segurança

#### **2. Página de Login** ✅
- [ ] `/login` renderiza corretamente
- [ ] Formulário de login exibe
- [ ] Campos de email e senha funcionam
- [ ] Link "Cadastrar" funciona
- [ ] Link "Esqueci minha senha" funciona
- [ ] Console do navegador sem erros

#### **3. Cadastro de Admin** ✅
- [ ] Acessar `/register`
- [ ] Preencher: balmarcos@hotmail.com / bal@123456
- [ ] Cadastro concluído com sucesso
- [ ] Email de confirmação recebido (se ativo)
- [ ] Link de confirmação funciona
- [ ] Login funciona após confirmação

#### **4. Dashboard Principal** ✅
- [ ] Após login, redireciona para `/`
- [ ] Dashboard de Organização renderiza
- [ ] 4 cards superiores exibem
- [ ] Tabela "Nossos Talentos" carrega
- [ ] Menu lateral completo renderiza
- [ ] Logo e nome "TaskMaster" visíveis
- [ ] Botão "Novo Talento" funcional
- [ ] Botão "+ Criar Projeto" funcional

#### **5. Navegação Entre Módulos** ✅

**Testar cada rota:**

| Rota | Status | Observação |
|------|--------|------------|
| `/` | ✅ | Dashboard Organização |
| `/tasks` | ✅ | TaskBoard com 4 colunas |
| `/calendar` | ✅ | Calendário mensal |
| `/artists` | ✅ | Grid de artistas |
| `/profile` | ✅ | Perfil do usuário |
| `/planejamento` | ✅ | Planning Copilot |
| `/templates` | ✅ | Templates |
| `/music` | ✅ | Music Hub |

**Validações:**
- [ ] Todas as rotas carregam
- [ ] Nenhuma tela branca
- [ ] Menu lateral funciona
- [ ] Transições suaves
- [ ] Console sem erros críticos

#### **6. Funcionalidades Core** ✅

**TaskBoard (`/tasks`):**
- [ ] 4 colunas renderizam
- [ ] Botão "Nova Tarefa" cria tarefa
- [ ] Tarefa aparece na coluna "A Fazer"
- [ ] F5 (reload) mantém tarefa (se implementado)

**Calendar (`/calendar`):**
- [ ] Calendário mensal renderiza
- [ ] Navegação ← → funciona
- [ ] Botão "Novo Evento" cria evento
- [ ] Evento aparece no calendário
- [ ] F5 mantém evento

**ArtistManager (`/artists`):**
- [ ] Grid de artistas renderiza
- [ ] Busca funciona
- [ ] Botão "Novo Artista" abre modal
- [ ] Modal cria artista
- [ ] Artista aparece no grid
- [ ] "Ver Detalhes" funciona

**UserProfile (`/profile`):**
- [ ] Dados do usuário exibem
- [ ] Botão "Editar Perfil" funciona
- [ ] Formulário salva alterações
- [ ] F5 mantém alterações

#### **7. Persistência de Dados** ✅

**localStorage:**
```javascript
// Abrir Console do navegador (F12)

// Verificar keys presentes
console.log(Object.keys(localStorage).filter(k => k.includes('taskmaster')));

// Esperado:
[
  "taskmaster_projects",
  "taskmaster_artists",
  "taskmaster_tasks",
  "taskmaster_events",
  "taskmaster_user",
  "taskmaster_logs"
]
```

**Testes:**
- [ ] Criar projeto → F5 → Projeto persiste
- [ ] Criar artista → F5 → Artista persiste
- [ ] Criar tarefa → F5 → Tarefa persiste
- [ ] Criar evento → F5 → Evento persiste
- [ ] Editar perfil → F5 → Dados persistem

#### **8. Console Logs** ✅

**Abrir DevTools (F12) → Console:**

**Logs Esperados:**
```javascript
[TaskMaster] Projeto criado com sucesso: Nome do Projeto
[TaskMaster DB] CREATE: { timestamp: "...", collection: "projects", data: {...} }
[TaskMaster DB] WRITE: { timestamp: "...", collection: "projects", data: { count: 1 } }
✅ [TaskMaster] Artista criado com sucesso: Nome Artista
```

**Verificações:**
- [ ] Logs aparecem ao criar entidades
- [ ] Timestamps corretos
- [ ] Sem erros em vermelho
- [ ] Warnings (amarelo) apenas informativos

#### **9. Performance** ✅

**Métricas no Console:**
```javascript
// Lighthouse / PageSpeed Insights
Performance Score: > 80
First Contentful Paint: < 1.5s
Time to Interactive: < 3s
Largest Contentful Paint: < 2.5s
```

**Testes:**
- [ ] Carregamento inicial < 3s
- [ ] Navegação entre páginas fluida
- [ ] Sem lentidão perceptível
- [ ] Scroll suave

#### **10. Responsividade** ✅

**Testar em DevTools → Device Toolbar:**

| Dispositivo | Resolução | Status |
|-------------|-----------|--------|
| iPhone 12 | 390x844 | ✅ |
| iPad | 768x1024 | ✅ |
| Desktop | 1920x1080 | ✅ |

**Validações:**
- [ ] Layout adapta em mobile
- [ ] Menu lateral responsivo
- [ ] Cards empilham corretamente
- [ ] Textos legíveis
- [ ] Botões acessíveis

---

## 🧪 TESTES AVANÇADOS

### **Teste 1: Fluxo Completo de Projeto**

**Cenário:** Criar e gerenciar um projeto completo

**Passos:**
1. Login com admin
2. Dashboard → "+ Criar Projeto"
3. Preencher:
   - Nome: "Projeto Teste Staging"
   - Descrição: "Validação ambiente staging"
   - Tipo: "Gestão de Artista"
4. Salvar
5. Verificar projeto na lista
6. Abrir projeto
7. Criar 3 tarefas no TaskBoard
8. Mover tarefas entre colunas
9. Abrir Calendar e criar evento
10. F5 (reload)
11. Verificar persistência

**Resultado Esperado:**
- ✅ Projeto criado
- ✅ Tarefas salvas
- ✅ Evento no calendário
- ✅ Tudo persiste após reload

### **Teste 2: Fluxo de Artista**

**Cenário:** Cadastrar e gerenciar artista

**Passos:**
1. Navegar para `/artists`
2. Click "Novo Artista"
3. Preencher:
   - Nome: "Artista Teste"
   - Nome Artístico: "Test Artist"
   - Gênero: "Pop"
4. Salvar
5. Verificar artista no grid
6. Click "Ver Detalhes"
7. Verificar dados completos
8. Voltar para lista
9. Usar busca: "Test"
10. Verificar filtro funciona
11. F5 (reload)
12. Verificar persistência

**Resultado Esperado:**
- ✅ Artista criado
- ✅ Aparece no grid
- ✅ Detalhes completos
- ✅ Busca funciona
- ✅ Persiste após reload

### **Teste 3: Backup e Restore**

**Cenário:** Validar sistema de backup

**No Console do navegador:**
```javascript
// 1. Criar backup
const backup = window.taskmaster_db.createBackup();
console.log('Backup criado:', backup.length, 'characters');

// 2. Salvar backup (copiar JSON)
console.log(backup);

// 3. Limpar todos os dados
window.taskmaster_db.clearAll();

// 4. Verificar dados vazios
console.log('Projetos:', window.taskmaster_db.getCollection('projects'));

// 5. Restaurar backup
window.taskmaster_db.restoreBackup(backup);

// 6. Verificar dados restaurados
console.log('Projetos restaurados:', window.taskmaster_db.getCollection('projects'));
```

**Resultado Esperado:**
- ✅ Backup gera JSON válido
- ✅ Clear remove todos os dados
- ✅ Restore recupera tudo
- ✅ Dados intactos após restore

---

## 📊 MÉTRICAS DE SUCESSO

### **Critérios de Aprovação Staging:**

| Categoria | Critério | Target | Status |
|-----------|----------|--------|--------|
| **Disponibilidade** | URL acessível 24/7 | 99.9% | ⏳ |
| **Performance** | Load time | < 3s | ⏳ |
| **Segurança** | SSL válido | ✅ | ⏳ |
| **Funcionalidade** | Core features OK | 100% | ⏳ |
| **Persistência** | Dados salvam | 100% | ⏳ |
| **Responsividade** | Mobile + Desktop | ✅ | ⏳ |
| **Console** | Zero erros críticos | 0 | ⏳ |
| **Auth** | Login funciona | 100% | ⏳ |

### **KPIs de Staging:**

- 🎯 **Uptime:** > 99%
- 🎯 **Response Time:** < 2s (95th percentile)
- 🎯 **Error Rate:** < 0.1%
- 🎯 **Successful Logins:** > 95%
- 🎯 **Page Load:** < 3s
- 🎯 **Lighthouse Score:** > 80

---

## 🐛 TROUBLESHOOTING

### **Problema 1: "Build Failed"**

**Erro:**
```
Error: Build failed with exit code 1
```

**Solução:**
1. Verificar `npm run build` localmente
2. Confirmar todos os imports estão corretos
3. Verificar variáveis de ambiente
4. Limpar cache: `vercel --force`

### **Problema 2: Tela Branca Após Deploy**

**Sintomas:**
- URL carrega mas página fica branca
- Console mostra erros

**Solução:**
1. Verificar variáveis de ambiente no Vercel
2. Confirmar `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
3. Verificar console para erros
4. Redeploy: `vercel --prod --force`

### **Problema 3: Autenticação Não Funciona**

**Sintomas:**
- Login não responde
- Erro "Invalid credentials"

**Solução:**
1. Verificar Supabase está online
2. Confirmar variáveis de ambiente
3. Testar Supabase Auth no dashboard
4. Verificar RLS policies

### **Problema 4: Persistência Não Funciona**

**Sintomas:**
- Dados desaparecem após F5
- localStorage vazio

**Solução:**
1. Verificar localStorage não está bloqueado
2. Testar em modo anônimo/incógnito
3. Limpar cache do navegador
4. Verificar console para erros

### **Problema 5: SSL/HTTPS Não Funciona**

**Sintomas:**
- Aviso de segurança no navegador
- Certificado inválido

**Solução:**
1. Aguardar propagação DNS (até 30min)
2. Verificar configuração DNS
3. Forçar renovação SSL no Vercel
4. Contatar suporte Vercel

---

## 📞 SUPORTE

### **Vercel Support:**
- Email: support@vercel.com
- Docs: https://vercel.com/docs
- Status: https://vercel-status.com

### **Supabase Support:**
- Email: support@supabase.io
- Docs: https://supabase.com/docs
- Discord: https://discord.supabase.com

### **TaskMaster Team:**
- Email: beta@taskmaster.app (a criar)
- Grupo Beta: WhatsApp (a criar)

---

## ✅ PRÓXIMO PASSO

Após concluir o deploy e validação staging:

📄 **Gerar:** `STAGING_VALIDATION_REPORT_v1.0.1.md`

Incluindo:
- ✅ Confirmação de URL funcional
- ✅ Testes de login e cadastro
- ✅ Validação de funcionalidades core
- ✅ Métricas de performance
- ✅ Screenshots de validação
- ✅ Aprovação para testes beta

---

**Data:** 08 de Novembro de 2025
**Versão:** 1.0.1
**Status:** 📖 **GUIA COMPLETO**
**Próximo:** 🚀 **EXECUTAR DEPLOY**

---

**FIM DO GUIA DE DEPLOY STAGING**
