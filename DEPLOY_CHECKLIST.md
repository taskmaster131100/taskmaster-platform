# ✅ CHECKLIST DE DEPLOY - TaskMaster Beta

## 🎯 OBJETIVO
Colocar TaskMaster Beta em produção no Vercel em 15 minutos.

---

## 📋 PRÉ-DEPLOY

- [x] Código compilado sem erros (`npm run build` ✅)
- [x] Build size: ~200 KB (otimizado ✅)
- [x] vercel.json configurado
- [x] Environment variables preparadas
- [x] Supabase ativo e conectado
- [x] Migrations aplicadas no banco
- [x] Sistema Beta configurado

**Status:** 🟢 PRONTO PARA DEPLOY

---

## 🚀 ETAPAS DE DEPLOY

### **Etapa 1: Git Repository**
- [ ] Código no GitHub/GitLab
- [ ] Branch `main` atualizada
- [ ] Último commit: "TaskMaster Beta - Production ready"

**Comandos:**
```bash
git add .
git commit -m "TaskMaster Beta - Production ready"
git push origin main
```

**Tempo:** 2 minutos

---

### **Etapa 2: Criar Conta Vercel**
- [ ] Conta criada em https://vercel.com
- [ ] GitHub conectado
- [ ] Permissões autorizadas

**Tempo:** 3 minutos

---

### **Etapa 3: Importar Projeto**
- [ ] Projeto "taskmaster" encontrado
- [ ] Clicado em "Import"
- [ ] Framework auto-detectado como "Vite"

**Configurações esperadas (auto):**
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`
- Node.js Version: 20.x

**Tempo:** 1 minuto

---

### **Etapa 4: Environment Variables**
- [ ] VITE_SUPABASE_URL
- [ ] VITE_SUPABASE_ANON_KEY
- [ ] VITE_BETA_MODE
- [ ] VITE_INVITE_ONLY
- [ ] VITE_PUBLIC_SIGNUPS
- [ ] VITE_FEATURE_PIPELINE_V2
- [ ] VITE_FEATURE_APPROVALS
- [ ] VITE_FEATURE_COMMAND_CENTER
- [ ] VITE_FEATURE_PLANNING_COPILOT
- [ ] VITE_FEATURE_BILLING
- [ ] VITE_FEATURE_SUBSCRIPTIONS
- [ ] VITE_FEATURE_OWNERSHIP

**Total:** 12 variáveis
**Arquivo:** `VERCEL_ENV_VARIABLES.txt`

**Tempo:** 5 minutos

---

### **Etapa 5: Deploy**
- [ ] Clicado em "Deploy"
- [ ] Build iniciado
- [ ] Build concluído (2-3 min)
- [ ] URL gerada

**URL esperada:** `https://taskmaster-XXXX.vercel.app`

**Tempo:** 3 minutos

---

## ✅ TESTES PÓS-DEPLOY

### **Teste 1: Landing Page**
- [ ] https://SUA-URL.vercel.app → Carrega
- [ ] Logo aparece
- [ ] Texto legível
- [ ] Botão "Começar" funciona

### **Teste 2: Autenticação**
- [ ] `/login` → Formulário aparece
- [ ] `/register` → Pede código Beta
- [ ] Criar conta teste → Sucesso
- [ ] Login → Dashboard carrega

### **Teste 3: Dashboard**
- [ ] Menu lateral aparece
- [ ] Widgets carregam
- [ ] Navegação funciona
- [ ] Botão azul de feedback aparece (canto inferior direito)

### **Teste 4: Beta Dashboard (Admin)**
- [ ] `/beta-dashboard` → Carrega
- [ ] Tab "Usuários" mostra lista
- [ ] Tab "KPIs" mostra métricas
- [ ] Tab "Feedbacks" mostra formulários
- [ ] Tab "Convites" permite gerar códigos

### **Teste 5: Performance**
- [ ] F12 → Console → Sem erros vermelhos
- [ ] Network → Todas requests 200 OK
- [ ] Lighthouse → Score >85

**Tempo total de testes:** 10 minutos

---

## 🎯 PÓS-DEPLOY IMEDIATO

### **A. Gerar 5 Convites Beta**
- [ ] Acessar `/beta-dashboard`
- [ ] Gerar 2x Escritórios
- [ ] Gerar 2x Artistas
- [ ] Gerar 1x Outro
- [ ] Anotar códigos (formato: `BETA-XXXXXXXX`)

**Tempo:** 2 minutos

---

### **B. Enviar Convites**
- [ ] E-mail 1: Escritório/Produtora A
- [ ] E-mail 2: Escritório/Produtora B
- [ ] E-mail 3: Artista/Músico A
- [ ] E-mail 4: Artista/Músico B
- [ ] E-mail 5: Outro perfil

**Template:** Ver arquivo `DEPLOY_VERCEL_RAPIDO.md`

**Tempo:** 10 minutos

---

### **C. Monitoramento Diário**
- [ ] Dia 1: Verificar ativações
- [ ] Dia 2: Responder feedbacks
- [ ] Dia 3: Verificar métricas
- [ ] Dia 4: Responder feedbacks
- [ ] Dia 5: Análise intermediária
- [ ] Dia 6: Responder feedbacks
- [ ] Dia 7: Relatório final

**Tempo:** 15 min/dia

---

## 📊 MÉTRICAS DE SUCESSO

**Beta de 7 dias - Metas:**
- ✅ Taxa de ativação: >80% (4/5 ativam)
- ✅ Tarefas criadas: >50
- ✅ Feedbacks recebidos: >10
- ✅ Bugs críticos: 0
- ✅ Uptime: >99%
- ✅ Tempo de resposta: <2s

---

## 🆘 TROUBLESHOOTING RÁPIDO

### **Problema: Build Failed**
**Solução:**
1. Localmente: `npm run build`
2. Se funcionar: Node version no Vercel
3. Settings → General → Node 20.x

### **Problema: Tela Branca**
**Solução:**
1. F12 → Console
2. Erro de env variable
3. Settings → Env Variables → Adicionar faltante
4. Redeploy

### **Problema: 404 em Rotas**
**Solução:**
- `vercel.json` já tem rewrites
- Se não funcionar: Settings → Rewrites → `/*` → `/index.html`

### **Problema: Erro Supabase**
**Solução:**
1. Verificar env variables
2. Testar ANON_KEY no Supabase Dashboard
3. Confirmar projeto ativo

---

## 🎉 CONCLUSÃO

**Tempo total estimado:** 30-35 minutos

**Resultado esperado:**
✅ TaskMaster Beta online
✅ 5 convites enviados
✅ Monitoramento configurado
✅ Sistema Beta ativo

**Próximos 7 dias:**
- Coletar feedbacks
- Ajustar bugs
- Melhorar UX
- Preparar lançamento público

---

## 📞 SUPORTE

**Documentação:**
- Vercel: https://vercel.com/docs
- Supabase: https://supabase.com/docs
- React Router: https://reactrouter.com

**Status:**
- Vercel: https://www.vercel-status.com
- Supabase: https://status.supabase.com

**Projeto GitHub:**
- Issues: Abra no seu repositório
- Discussões: GitHub Discussions

---

**Última atualização:** 2025-10-18
**Versão:** Beta 1.0
**Build size:** ~200 KB
**Supabase:** Conectado ✅
