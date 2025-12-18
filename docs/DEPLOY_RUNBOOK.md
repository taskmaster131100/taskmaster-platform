# TaskMaster - Deploy Runbook

**Versão:** 1.0
**Data:** 22 de outubro de 2025
**Target Go-Live:** 01 de novembro de 2025

---

## 📋 Pré-Requisitos

### Acesso Necessário
- [ ] GitHub repository (push access)
- [ ] Vercel account (deployment access)
- [ ] Supabase dashboard (admin access)
- [ ] DNS management (se custom domain)

### Variáveis de Ambiente
- [ ] `.env.production` configurado
- [ ] Vercel environment variables configuradas
- [ ] Supabase service role key segura

---

## 🚀 Deploy Process

### Development → Staging

#### 1. Preparação (Local)
```bash
# Atualizar dependencies
npm install

# Rodar build local
npm run build

# Verificar output
ls -lh dist/

# Testar preview local
npm run preview
```

#### 2. Validações Pré-Deploy
- [ ] Todos os testes passando (quando implementados)
- [ ] No console errors em dev
- [ ] Lighthouse score > 90
- [ ] Feature flags corretas em `.env.production`

#### 3. Deploy para Netlify (Staging)
```bash
# Via Git push (automatic)
git push origin main

# Ou via CLI
netlify deploy --prod
```

#### 4. Smoke Test (Staging)
Acessar: https://taskmaster-staging.netlify.app

**Checklist:**
- [ ] Página carrega (<3s)
- [ ] Login funciona
- [ ] Onboarding aparece (primeiro login)
- [ ] Criar projeto
- [ ] Criar tarefa
- [ ] Produção Musical acessível via menu
- [ ] Rotas preview OCULTAS (se flag=false)
- [ ] Mobile responsivo

---

### Staging → Production

#### 1. Final Checks
- [ ] Smoke test passou em staging
- [ ] Beta testers approval
- [ ] Product Manager sign-off
- [ ] Changelog atualizado

#### 2. Database Migration
```bash
# Conectar ao Supabase Production
# Dashboard: https://supabase.com/dashboard/project/ktspxbucvfzaqyszpyso

# Aplicar migrations pendentes
# SQL Editor → Run migration files in order
```

#### 3. Deploy para Vercel (Production)
```bash
# Via Git (automatic)
git push origin production

# Ou via CLI
vercel --prod
```

#### 4. Smoke Test (Production)
Acessar: https://taskmaster.works

**Critical Path:**
1. **Landing Page**
   - [ ] Gradiente azul-roxo-rosa visível
   - [ ] Logo carregado
   - [ ] CTA "Começar" funciona

2. **Registro**
   - [ ] /register carrega
   - [ ] Invite code validado
   - [ ] Conta criada com sucesso

3. **Onboarding**
   - [ ] 5 slides aparecem
   - [ ] Navegação funciona
   - [ ] Skip funciona

4. **Dashboard**
   - [ ] Redireciona após onboarding
   - [ ] Sidebar carregada
   - [ ] Menu "Preview" OCULTO (production)

5. **Criar Projeto**
   - [ ] Modal abre
   - [ ] Template visível
   - [ ] Projeto criado

6. **Criar Tarefa**
   - [ ] Formulário abre
   - [ ] Tarefa criada
   - [ ] Aparece no board

7. **Produção Musical**
   - [ ] Acessível via menu lateral "Conteúdo"
   - [ ] Não é landing inicial
   - [ ] Repertório carrega

8. **Stage Mode**
   - [ ] Setlist visível
   - [ ] Offline mode funciona
   - [ ] QR code gerado

---

## 🔙 Rollback Procedure

### Se Deploy Falhar

#### Opção 1: Rollback Git
```bash
# Reverter commit
git revert HEAD
git push origin production

# Vercel redeploy automático
```

#### Opção 2: Rollback Vercel Dashboard
1. Acessar Vercel Dashboard
2. Deployments → Select previous
3. Click "Promote to Production"

#### Opção 3: Rollback Database
```bash
# Se migration causou problema
# Rodar migration de rollback (criar antes!)

-- Example: 20251022_rollback_migration.sql
DROP TABLE IF EXISTS new_table;
ALTER TABLE old_table ADD COLUMN old_column text;
```

### Rollback Checklist
- [ ] Rollback aplicado
- [ ] Smoke test passou
- [ ] Usuários notificados (se necessário)
- [ ] Post-mortem agendado

---

## 📊 Post-Deploy Verification

### Imediatamente (0-15min)
- [ ] Health check endpoint (quando implementado)
- [ ] Error rate normal (<1%)
- [ ] Response time normal (<500ms)
- [ ] No 500 errors em logs

### Primeira Hora
- [ ] 10 novos logins bem-sucedidos
- [ ] 5 projetos criados
- [ ] Database queries normais
- [ ] No spike em errors

### Primeiro Dia
- [ ] Beta testers reportam sucesso
- [ ] No bugs críticos reportados
- [ ] Analytics funcionando
- [ ] Backup rodou com sucesso

---

## 🔧 Troubleshooting

### Deploy Falha no Build
```bash
# Verificar logs
vercel logs [deployment-url]

# Testar local
npm run build

# Verificar node version
node --version  # Deve ser >= 20.0.0
```

### 404 em Subrotas
**Causa:** SPA fallback não configurado
**Fix:** Verificar `vercel.json` rewrites

### Environment Variables Não Carregam
**Causa:** Vercel não rebuild após mudar env
**Fix:** Trigger redeploy manual

### Database Connection Failed
**Causa:** Wrong credentials ou IP whitelist
**Fix:** Verificar `.env` e Supabase settings

---

## 📝 Environment Variables Checklist

### Production (Vercel)
```bash
VITE_SUPABASE_URL=https://ktspxbucvfzaqyszpyso.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_ENABLE_CLASSIC_ROUTES=false  # ⚠️ Critical!
VITE_FEATURE_PIPELINE_V2=true
VITE_FEATURE_APPROVALS=true
VITE_FEATURE_COMMAND_CENTER=true
VITE_FEATURE_PLANNING_COPILOT=true
VITE_FEATURE_BILLING=false  # Not ready yet
VITE_BETA_MODE=true
VITE_INVITE_ONLY=true
VITE_PUBLIC_SIGNUPS=false
```

---

## 🎯 Go-Live Day Checklist (01/Nov)

### D-1 (31/Out)
- [ ] Final staging deploy
- [ ] Full smoke test
- [ ] Beta testers notification
- [ ] Backup production database
- [ ] Prepare rollback plan

### D-Day (01/Nov)
**08:00** - Team standup
- [ ] Review checklist
- [ ] Assign roles (deployer, tester, comms)

**09:00** - Deploy
- [ ] Push to production branch
- [ ] Monitor Vercel deploy
- [ ] Run smoke tests

**10:00** - Verification
- [ ] All smoke tests passed
- [ ] Beta testers testing
- [ ] Monitor error rates

**12:00** - Go/No-Go Decision
- [ ] Product Manager approval
- [ ] Tech Lead approval
- [ ] No critical bugs

**14:00** - Public Announcement
- [ ] Social media posts
- [ ] Email to waitlist
- [ ] Update website

**18:00** - End of Day Review
- [ ] Metrics dashboard
- [ ] Bug triage
- [ ] Plan for D+1

### D+1 (02/Nov)
- [ ] Check overnight metrics
- [ ] Review user feedback
- [ ] Triage new bugs
- [ ] Hotfix if needed

---

## 📞 Emergency Contacts

- **Tech Lead:** [Your Name] - [Phone]
- **Product Manager:** [Name] - [Phone]
- **DevOps:** [Name] - [Phone]
- **Supabase Support:** support@supabase.com

---

## 📊 Success Metrics (First Week)

- **Uptime:** > 99.5%
- **Error Rate:** < 1%
- **Page Load:** < 3s (p95)
- **New Signups:** 50+ users
- **NPS:** > 40
- **Critical Bugs:** 0

---

**Última Atualização:** 22 de outubro de 2025
**Owner:** DevOps Team
