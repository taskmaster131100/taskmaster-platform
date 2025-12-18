# 🚀 COMO FAZER DEPLOY - GUIA RÁPIDO

**Versão:** 1.0.2-beta
**Tempo estimado:** 5-10 minutos

---

## 📋 PRÉ-REQUISITOS

Você já tem:
- ✅ Conta Vercel (gratuita)
- ✅ Conta Supabase (gratuita)
- ✅ Repositório Git (GitHub, GitLab, etc)

---

## 🎯 OPÇÃO 1: DEPLOY VERCEL (RECOMENDADO)

### **Passo 1: Conectar Repositório**

```bash
# No seu computador, fazer commit das mudanças
git add .
git commit -m "feat: sprint beta fechado - toasts, validações, correções"
git push origin main
```

### **Passo 2: Deploy no Vercel**

1. Ir para: https://vercel.com
2. Clicar "New Project"
3. Importar repositório do GitHub
4. Configurar:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`

### **Passo 3: Adicionar Variáveis de Ambiente**

No Vercel Dashboard → Settings → Environment Variables:

```env
VITE_SUPABASE_URL=https://fcmxljhckrztingxecss.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjbXhsamhja3J6dGluZ3hlY3NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MjA5MjQsImV4cCI6MjA3NzQ5NjkyNH0.weUKjuJdRTyLtPrSCt2gTNI52kUzjYkVwV_F_Y1FHNU

VITE_FEATURE_PIPELINE_V2=true
VITE_FEATURE_APPROVALS=true
VITE_FEATURE_COMMAND_CENTER=true
VITE_FEATURE_PLANNING_COPILOT=true
VITE_FEATURE_BILLING=false
VITE_FEATURE_SUBSCRIPTIONS=false
VITE_FEATURE_OWNERSHIP=false

VITE_ENABLE_CLASSIC_ROUTES=false

VITE_BETA_MODE=true
VITE_INVITE_ONLY=false
VITE_PUBLIC_SIGNUPS=true

# OPCIONAL: Se quiser usar IA
VITE_OPENAI_API_KEY=sk-proj-your-key-here
VITE_OPENAI_MODEL=gpt-4o-mini
VITE_COPILOT_PROVIDER=openai
```

**IMPORTANTE:**
- Adicionar para: `Production`, `Preview`, `Development`
- Clicar "Save"

### **Passo 4: Deploy!**

1. Clicar "Deploy"
2. Aguardar ~2-3 minutos
3. Vercel mostra link: `https://taskmaster-xxx.vercel.app`
4. **Copiar esse link!**

---

## 🎯 OPÇÃO 2: DEPLOY MANUAL VIA CLI

### **Passo 1: Instalar Vercel CLI**

```bash
npm install -g vercel
```

### **Passo 2: Login**

```bash
vercel login
```

### **Passo 3: Deploy**

```bash
# Na pasta do projeto
vercel --prod
```

### **Passo 4: Adicionar Environment Variables**

```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_BETA_MODE
# ... adicionar todas as variáveis acima
```

### **Passo 5: Redeploy**

```bash
vercel --prod
```

---

## ✅ VALIDAR DEPLOY

### **Teste 1: Acessar URL**
1. Abrir URL do Vercel no navegador
2. Deve carregar a tela de login
3. Sem erros no console (F12)

### **Teste 2: Criar Conta**
1. Clicar "Criar conta"
2. Preencher formulário
3. Cadastro deve funcionar
4. Redirect para dashboard

### **Teste 3: Criar Tarefa**
1. Ir para TaskBoard
2. Clicar "Nova Tarefa"
3. Criar tarefa
4. Toast verde "Tarefa criada com sucesso!"

### **Teste 4: Verificar Supabase**
1. Abrir Supabase Dashboard
2. Ir para Table Editor → `tasks`
3. Tarefa deve aparecer na tabela

**Se todos os testes passarem: ✅ DEPLOY COMPLETO!**

---

## 🔧 PROBLEMAS COMUNS

### **Erro: "Failed to fetch"**
**Causa:** Variáveis de ambiente não configuradas
**Solução:** Verificar se todas as variáveis VITE_* estão no Vercel

### **Erro: "Network error" no Supabase**
**Causa:** VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY incorretos
**Solução:** Copiar novamente do Supabase Dashboard → Settings → API

### **Página branca após deploy**
**Causa:** Build falhou ou SPA routing não configurado
**Solução:** Verificar se existe `vercel.json` na raiz:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### **Módulo não encontrado**
**Causa:** Dependências não instaladas
**Solução:** Verificar se `package.json` tem todas as deps
```bash
npm install
npm run build
git commit -am "fix: update dependencies"
git push
```

---

## 🌐 DOMÍNIO CUSTOMIZADO (OPCIONAL)

### **Se você tem um domínio próprio:**

1. Vercel Dashboard → Settings → Domains
2. Adicionar domínio: `app.seudominio.com`
3. Configurar DNS:
   - Type: `CNAME`
   - Name: `app`
   - Value: `cname.vercel-dns.com`
4. Aguardar propagação (5-30 minutos)

---

## 📊 MONITORAMENTO

### **Vercel Dashboard:**
- Analytics: Ver acessos
- Logs: Ver erros de runtime
- Deployments: Histórico de deploys

### **Supabase Dashboard:**
- Auth → Users: Ver cadastros
- Table Editor: Ver dados criados
- Logs: Ver queries executadas

---

## 🔄 ATUALIZAÇÕES FUTURAS

### **Como atualizar a plataforma:**

```bash
# Fazer mudanças no código
git add .
git commit -m "feat: nova funcionalidade"
git push origin main

# Vercel detecta push e faz deploy automático!
```

**Tempo de deploy automático:** ~2-3 minutos

---

## ✅ CHECKLIST PÓS-DEPLOY

- [ ] URL de produção acessível
- [ ] Login funciona
- [ ] Cadastro funciona
- [ ] TaskBoard carrega
- [ ] Calendar carrega
- [ ] Planejamento carrega
- [ ] Reports carrega
- [ ] Toasts aparecem
- [ ] Sem erros no console
- [ ] Dados salvam no Supabase

---

## 🆘 SUPORTE

**Se algo der errado:**

1. Verificar logs no Vercel: `vercel logs`
2. Verificar console do navegador (F12)
3. Verificar Supabase Dashboard → Logs
4. Checar se todas as variáveis de ambiente estão corretas

**Se ainda assim não funcionar:**
- Enviar screenshot do erro
- Copiar logs
- Descrever o problema

---

## 🎉 DEPLOY COMPLETO!

**Agora você tem:**
- ✅ URL de produção
- ✅ Build otimizado
- ✅ HTTPS automático
- ✅ Deploy contínuo (git push = deploy)
- ✅ Pronto para compartilhar!

**Link para compartilhar:**
```
https://seu-projeto.vercel.app
```

**Próximo passo:** Compartilhar com testers beta! 🚀

---

**Última atualização:** 20/11/2025
**Suporte:** Vercel + Supabase (planos free)
