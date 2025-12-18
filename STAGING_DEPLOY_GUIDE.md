# 🚀 GUIA DE DEPLOY - STAGING ENVIRONMENT

**Versão:** TaskMaster v1.0.0 Stable
**Ambiente:** Staging (https://staging.taskmaster.app)
**Data:** 08 de Novembro de 2025

---

## 🎯 OBJETIVO

Este guia documenta o processo completo de deploy do TaskMaster v1.0.0 Stable para o ambiente de staging, preparando o sistema para testes beta com usuários reais.

---

## 📋 PRÉ-REQUISITOS

### **1. Contas e Acessos Necessários**
- [ ] Conta Vercel (ou plataforma de deploy escolhida)
- [ ] Conta Supabase (já configurada)
- [ ] Domínio configurado (staging.taskmaster.app)
- [ ] Acesso ao repositório Git

### **2. Variáveis de Ambiente**
Todas as variáveis já estão configuradas no arquivo `.env`:

```bash
# Supabase (já configurado)
VITE_SUPABASE_URL=https://[seu-projeto].supabase.co
VITE_SUPABASE_ANON_KEY=[sua-chave-anon]

# Build Configuration
NODE_ENV=production
VITE_APP_ENV=staging
```

### **3. Validações Locais**
Antes de fazer deploy, confirmar:
- [ ] `npm run build` executa sem erros
- [ ] Bundle gerado em `/dist`
- [ ] Tamanho do bundle otimizado (< 500KB)
- [ ] Todos os testes passaram

---

## 🔧 PROCESSO DE DEPLOY

### **Opção 1: Deploy via Vercel (Recomendado)**

#### **Passo 1: Conectar Repositório**
```bash
# No terminal
npm install -g vercel

# Login
vercel login

# Link ao projeto
vercel link
```

#### **Passo 2: Configurar Projeto**
```bash
# Criar projeto staging
vercel --prod
```

**Configurações no Painel Vercel:**
- Project Name: `taskmaster-staging`
- Framework Preset: `Vite`
- Root Directory: `./`
- Build Command: `npm run build`
- Output Directory: `dist`

#### **Passo 3: Configurar Variáveis de Ambiente**

No painel Vercel → Settings → Environment Variables:

```
VITE_SUPABASE_URL = [seu-url-supabase]
VITE_SUPABASE_ANON_KEY = [sua-chave]
VITE_APP_ENV = staging
NODE_ENV = production
```

#### **Passo 4: Deploy**
```bash
# Deploy para staging
vercel --prod

# Output esperado:
# ✓ Production: https://staging.taskmaster.app [1m]
# 📝 Deployed to production
```

---

### **Opção 2: Deploy via Netlify**

#### **Passo 1: Conectar Repositório**
1. Acessar https://app.netlify.com
2. "Add new site" → "Import an existing project"
3. Conectar ao repositório Git
4. Autorizar acesso

#### **Passo 2: Configurar Build**
```
Build command: npm run build
Publish directory: dist
```

#### **Passo 3: Variáveis de Ambiente**
Site settings → Environment variables:
```
VITE_SUPABASE_URL = [seu-url-supabase]
VITE_SUPABASE_ANON_KEY = [sua-chave]
VITE_APP_ENV = staging
```

#### **Passo 4: Deploy**
- Clicar em "Deploy site"
- Aguardar build (1-2 minutos)
- Configurar domínio custom: staging.taskmaster.app

---

### **Opção 3: Deploy Manual (Backup)**

#### **Passo 1: Build Local**
```bash
npm run build
```

#### **Passo 2: Upload dos Arquivos**
Upload da pasta `dist/` via FTP ou painel de hospedagem para:
- Document root do domínio staging.taskmaster.app

#### **Passo 3: Configurar Servidor**
Criar arquivo `.htaccess` (Apache) ou `nginx.conf` (Nginx):

**Apache (.htaccess):**
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

**Nginx (nginx.conf):**
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

---

## 🔐 CONFIGURAÇÃO SUPABASE

### **1. Configurar CORS**

No painel Supabase → Settings → API:

**Allowed Origins:**
```
https://staging.taskmaster.app
http://localhost:5173
```

### **2. Configurar Auth**

Settings → Authentication → URL Configuration:

**Site URL:**
```
https://staging.taskmaster.app
```

**Redirect URLs:**
```
https://staging.taskmaster.app/auth/callback
https://staging.taskmaster.app/
```

### **3. Configurar Email Templates**

Settings → Authentication → Email Templates:

**Confirm Signup:**
```
Subject: Bem-vindo ao TaskMaster Beta!

Olá {{ .Email }},

Confirme seu email clicando no link abaixo:
{{ .ConfirmationURL }}

Equipe TaskMaster
```

**Reset Password:**
```
Subject: Redefinir Senha - TaskMaster

Olá,

Redefina sua senha clicando no link abaixo:
{{ .ConfirmationURL }}

Equipe TaskMaster
```

---

## ✅ VALIDAÇÃO PÓS-DEPLOY

### **Checklist de Validação:**

#### **1. Acesso e Carregamento**
- [ ] URL staging.taskmaster.app carrega
- [ ] HTTPS está ativo (SSL válido)
- [ ] Página de login aparece
- [ ] Logo e branding corretos
- [ ] Console sem erros críticos

#### **2. Autenticação**
- [ ] Login funciona
- [ ] Cadastro funciona
- [ ] Reset de senha funciona
- [ ] Logout funciona
- [ ] Sessão persiste após reload

#### **3. Funcionalidades Core**
- [ ] Dashboard carrega
- [ ] Menu lateral completo (15 módulos)
- [ ] Criar projeto funciona
- [ ] Criar artista funciona
- [ ] TaskBoard carrega
- [ ] Agenda carrega
- [ ] Todos os módulos renderizam

#### **4. Persistência de Dados**
- [ ] Dados salvam no localStorage
- [ ] Dados persistem após F5
- [ ] Dados persistem após logout/login
- [ ] Backup funciona via console

#### **5. Performance**
- [ ] Páginas carregam em < 3s
- [ ] Navegação é fluida
- [ ] Sem lentidão perceptível
- [ ] Bundle otimizado carregando

#### **6. Logs e Monitoramento**
- [ ] Logs aparecem no console
- [ ] `window.taskmaster_db` disponível
- [ ] Comandos de debug funcionam
- [ ] Histórico de logs mantido

---

## 📊 COMANDOS DE VALIDAÇÃO

### **Teste via Console (F12):**

```javascript
// 1. Verificar database
console.log('TaskMaster DB:', window.taskmaster_db);

// 2. Ver estatísticas
window.taskmaster_db.getStats();

// 3. Criar backup de teste
const backup = window.taskmaster_db.createBackup();
console.log('Backup size:', (backup.length / 1024).toFixed(2), 'KB');

// 4. Validar persistência
window.taskmaster_db.validatePersistence();

// 5. Ver logs
const logs = window.taskmaster_db.getLogs();
console.log('Total logs:', logs.length);

// 6. Criar projeto de teste
window.taskmaster_db.createProject({
  name: 'Projeto Teste Deploy',
  description: 'Validação do ambiente staging',
  project_type: 'single',
  status: 'active',
  startDate: new Date().toISOString(),
  budget: 5000
});

// 7. Verificar se salvou
const projects = window.taskmaster_db.getCollection('projects');
console.log('Projetos criados:', projects.length);
```

**Saída Esperada:**
```
TaskMaster DB: LocalDatabase {…}
✅ [TaskMaster] Projeto criado com sucesso: Projeto Teste Deploy
[TaskMaster DB] CREATE: {timestamp: "…", collection: "projects", …}
Projetos criados: 1
```

---

## 🔄 BACKUP AUTOMÁTICO

### **Implementar Backup Diário via Cron Job**

**Script de Backup (backup-daily.js):**
```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createDailyBackup() {
  try {
    // Simular coleta de dados (em produção, coletar do localStorage de todos os usuários)
    const backup = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      environment: 'staging',
      data: {
        projects: [],
        artists: [],
        tasks: [],
        // Dados seriam coletados aqui
      }
    };

    // Salvar no Supabase
    const { data, error } = await supabase
      .from('system_backups')
      .insert({
        version: backup.version,
        timestamp: backup.timestamp,
        environment: backup.environment,
        backup_data: backup.data,
        size_kb: JSON.stringify(backup).length / 1024
      });

    if (error) throw error;

    console.log('✅ Backup diário criado com sucesso');
    return data;
  } catch (error) {
    console.error('❌ Erro ao criar backup:', error);
    throw error;
  }
}

// Executar
createDailyBackup();
```

**Agendar com Vercel Cron:**
```json
// vercel.json
{
  "crons": [{
    "path": "/api/backup",
    "schedule": "0 3 * * *"
  }]
}
```

---

## 📈 MONITORAMENTO

### **Ferramentas Recomendadas:**

#### **1. Google Analytics**
```html
<!-- Adicionar no index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

#### **2. Sentry (Error Tracking)**
```bash
npm install @sentry/react

# Configurar em main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://[seu-dsn].ingest.sentry.io/[id]",
  environment: "staging",
  tracesSampleRate: 1.0,
});
```

#### **3. LogRocket (Session Replay)**
```bash
npm install logrocket

# Configurar
import LogRocket from 'logrocket';
LogRocket.init('app-id');
```

---

## 🚨 TROUBLESHOOTING

### **Problema: Página em Branco Após Deploy**

**Solução 1: Verificar Console**
```javascript
// Abrir DevTools (F12)
// Procurar por erros vermelhos
// Verificar mensagens de erro
```

**Solução 2: Verificar Variáveis de Ambiente**
```bash
# Confirmar que variáveis estão configuradas
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY
```

**Solução 3: Limpar Cache**
```bash
# Limpar cache do navegador
# Ou acessar em modo anônimo
```

---

### **Problema: Autenticação Não Funciona**

**Solução 1: Verificar CORS no Supabase**
- Acessar painel Supabase
- Settings → API → CORS
- Adicionar `https://staging.taskmaster.app`

**Solução 2: Verificar Redirect URLs**
- Settings → Authentication
- URL Configuration
- Adicionar URL correto

---

### **Problema: Dados Não Persistem**

**Solução 1: Verificar localStorage**
```javascript
// No console
localStorage.getItem('taskmaster_projects');
// Se retornar null, localStorage está limpo

// Criar dado de teste
window.taskmaster_db.createProject({name: 'Test'});

// Verificar novamente
localStorage.getItem('taskmaster_projects');
// Deve retornar JSON
```

**Solução 2: Verificar Cookies/Storage**
- Navegador pode estar bloqueando
- Verificar configurações de privacidade
- Tentar em outro navegador

---

## 📞 CONTATOS E SUPORTE

### **Equipe de Deploy:**
- **Tech Lead:** [nome]
- **Email:** deploy@taskmaster.app
- **Slack:** #deploys

### **Supabase Support:**
- **Dashboard:** https://app.supabase.com
- **Docs:** https://supabase.com/docs
- **Support:** support@supabase.io

### **Vercel Support:**
- **Dashboard:** https://vercel.com/dashboard
- **Docs:** https://vercel.com/docs
- **Support:** support@vercel.com

---

## ✅ CHECKLIST FINAL PRÉ-LANÇAMENTO BETA

Antes de liberar para beta testers:

### **Infraestrutura**
- [ ] Deploy staging concluído
- [ ] HTTPS ativo e válido
- [ ] Domínio configurado
- [ ] DNS propagado

### **Supabase**
- [ ] Auth configurado
- [ ] CORS configurado
- [ ] Email templates atualizados
- [ ] RLS policies ativas

### **Aplicação**
- [ ] Login funciona
- [ ] Cadastro funciona
- [ ] 15 módulos renderizam
- [ ] Persistência validada
- [ ] Logs ativos

### **Monitoramento**
- [ ] Google Analytics configurado
- [ ] Error tracking ativo
- [ ] Logs visíveis no console
- [ ] Backup manual testado

### **Documentação**
- [ ] BETA_TESTING_GUIDE.md criado
- [ ] STAGING_DEPLOY_GUIDE.md criado
- [ ] Credenciais de teste geradas
- [ ] Emails de convite preparados

### **Comunicação**
- [ ] Grupo WhatsApp criado
- [ ] Emails de boas-vindas prontos
- [ ] Formulário de feedback configurado
- [ ] Canal de suporte definido

---

## 🎯 MÉTRICAS DE SUCESSO

### **Objetivos Staging:**

**Performance:**
- ⚡ TTFB < 500ms
- ⚡ FCP < 2s
- ⚡ LCP < 3s
- ⚡ TTI < 5s

**Disponibilidade:**
- 🟢 Uptime > 99%
- 🟢 Zero downtime não planejado
- 🟢 Backup diário funcionando

**Usuários Beta:**
- 👥 5 beta testers ativos
- 👥 50+ projetos criados
- 👥 200+ tarefas organizadas
- 👥 50+ feedbacks recebidos

---

## 🚀 DEPLOY CHECKLIST RÁPIDO

```bash
# 1. Validar build local
npm run build

# 2. Testar localmente
npm run preview

# 3. Commit e push
git add .
git commit -m "chore: deploy v1.0.0 to staging"
git push origin main

# 4. Deploy (Vercel)
vercel --prod

# 5. Validar deploy
curl https://staging.taskmaster.app

# 6. Testar no navegador
# Abrir: https://staging.taskmaster.app
# Login de teste
# Criar projeto
# Verificar logs

# 7. Confirmar sucesso
echo "✅ Deploy concluído!"
```

---

## 📝 REGISTRO DE DEPLOYS

| Data | Versão | Deploy By | Status | Notas |
|------|--------|-----------|--------|-------|
| 08/11/2025 | v1.0.0 | [nome] | ✅ Success | Deploy inicial staging |
| - | - | - | - | - |

---

## 🎉 PRÓXIMOS PASSOS

Após deploy bem-sucedido:

1. ✅ **Enviar convites beta** (5 testers)
2. 📊 **Ativar monitoramento** (Analytics, Sentry)
3. 💾 **Configurar backup automático** (cron job)
4. 📧 **Email de boas-vindas** (beta testers)
5. 👥 **Criar grupo WhatsApp** (suporte)
6. 📅 **Agendar check-ins** (dias 1, 3, 5, 7)
7. 📊 **Preparar dashboard** (métricas beta)
8. 🎯 **Definir KPIs** (semana 1 de testes)

---

**Versão do Guia:** 1.0
**Última Atualização:** 08/11/2025
**Ambiente:** Staging
**Status:** Pronto para Deploy

---

**BOA SORTE COM O DEPLOY! 🚀**
