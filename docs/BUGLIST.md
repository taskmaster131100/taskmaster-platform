# TaskMaster - Lista de Bugs

**Data:** 22 de outubro de 2025
**Status:** Pré Go-Live

---

## 🐛 Bugs Críticos

### BUG-001: HashRouter Quebra Navegação no Vercel
- **Severidade:** 🔴 Crítica
- **Ambiente:** Production (Vercel)
- **Reprodução:**
  1. Deploy para Vercel
  2. Acessar rota `/#/welcome`
  3. Recarregar página (F5)
  4. Resultado: 404
- **Causa:** Vercel não entende hash routing em rewrites
- **Fix:** Usar BrowserRouter + SPA fallback (já configurado em vercel.json)
- **Status:** ✅ Fix implementado, aguardando teste em prod

### BUG-002: Login Redireciona para /music em Vez de Dashboard
- **Severidade:** 🔴 Crítica
- **Ambiente:** Dev + Prod
- **Reprodução:**
  1. Fazer login
  2. Esperar carregamento
  3. Resultado: redireciona para `/music` (Produção Musical)
  4. Esperado: dashboard institucional
- **Causa:** `src/main.tsx` importa `App-Music.tsx` como default
- **Fix:** Mudar import para `App.tsx` (landing institucional)
- **Status:** ❌ Pendente (relacionado a GAP-001)

### BUG-003: Feature Flag VITE_ENABLE_CLASSIC_ROUTES Sempre True
- **Severidade:** 🔴 Crítica
- **Ambiente:** Production
- **Reprodução:**
  1. Fazer build com `.env.production`
  2. Verificar código compilado
  3. Resultado: rotas preview sempre presentes
- **Causa:** `.env.production` não tem a flag (default undefined → true)
- **Fix:** Adicionar `VITE_ENABLE_CLASSIC_ROUTES=false` em `.env.production`
- **Status:** ✅ Fix implementado, aguardando deploy

---

## 🐛 Bugs Altos

### BUG-004: RLS Policy em `setlists` Permite Leitura Cross-Org
- **Severidade:** 🟠 Alta (Segurança)
- **Ambiente:** Database
- **Reprodução:**
  1. User A (Org 1) cria setlist
  2. User B (Org 2) tenta SELECT * FROM setlists
  3. Resultado: vê setlist da Org 1
- **Causa:** Policy "Users can view setlists" não filtra por org
- **Fix:** Adicionar `organization_id = current_org_id` na policy
- **Status:** ⚠️ Crítico de segurança, fixar imediatamente

### BUG-005: Onboarding Aparece Sempre em Incognito
- **Severidade:** 🟠 Alta
- **Ambiente:** Todos
- **Reprodução:**
  1. Abrir em modo incognito
  2. Fazer login
  3. Completar onboarding
  4. Logout + Login
  5. Resultado: onboarding aparece novamente
- **Causa:** localStorage limpo em incognito
- **Fix:** Salvar flag no backend (`user_metadata.onboarding_completed`)
- **Status:** ⏳ Planejado

### BUG-006: Upload de Arquivo >5MB Trava UI
- **Severidade:** 🟠 Alta
- **Ambiente:** Todos
- **Causa:** Sem progress indicator + sem chunked upload
- **Fix:** Adicionar progress bar + Supabase resumable uploads
- **Status:** ⏳ Planejado

---

## 🐛 Bugs Médios

### BUG-007: Data Picker Não Aceita Formato DD/MM/YYYY
- **Severidade:** 🟡 Média
- **Fix:** Configurar date-fns com locale pt-BR
- **Status:** ⏳ Planejado

### BUG-008: Drag & Drop de Tarefas Não Funciona em Mobile
- **Severidade:** 🟡 Média
- **Causa:** @hello-pangea/dnd requer touch polyfill
- **Fix:** Adicionar touch backend
- **Status:** ⏳ Planejado

### BUG-009: Notificações de Tarefa Duplicadas
- **Severidade:** 🟡 Média
- **Causa:** Webhook disparando múltiplas vezes
- **Fix:** Idempotency key
- **Status:** ⏳ Planejado

---

## 🐛 Bugs Baixos

### BUG-010: Logo Pixelada em Retina Displays
- **Severidade:** 🟢 Baixa
- **Fix:** Usar SVG ou 2x resolution
- **Status:** ⏳ Backlog

---

**Total de Bugs:** 10 (3 críticos, 3 altos, 3 médios, 1 baixo)
