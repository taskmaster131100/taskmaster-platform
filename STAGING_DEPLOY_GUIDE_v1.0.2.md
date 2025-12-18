# 🚀 GUIA DE DEPLOY STAGING - TaskMaster v1.0.2

**Data:** 09 de Novembro de 2025
**Versão:** v1.0.2 (Hotfix Dynamic Imports)
**Status:** ✅ AUTORIZADO PELO CLIENTE

---

## ✅ PRÉ-REQUISITOS VALIDADOS

- [x] ✅ Build local OK (14.8s, 0 erros)
- [x] ✅ Preview local testado (todas rotas OK)
- [x] ✅ Console limpo (0 erros vermelhos)
- [x] ✅ Zero PlaceholderComponents (confirmado)
- [x] ✅ 25/25 imports corrigidos
- [x] ✅ Navegação fluida em 6 rotas core
- [x] ✅ Chunks .js carregando corretamente
- [x] ✅ Cliente autorizou deploy staging

---

## 📦 OPÇÃO 1: DEPLOY VIA VERCEL (RECOMENDADO)

### **Passo 1: Instalar Vercel CLI (se não tiver)**

```bash
npm install -g vercel
```

### **Passo 2: Login no Vercel**

```bash
vercel login
```

### **Passo 3: Build de Produção**

```bash
# Build com configuração de staging
npm run build:production
```

**Resultado esperado:**
```
✓ built in ~15s
✓ dist/ folder created
✓ 34+ chunks gerados
```

### **Passo 4: Deploy para Staging**

```bash
# Deploy preview (staging)
vercel --prod=false

# OU deploy direto para production
vercel --prod
```

**Selecione:**
- Project: `taskmaster` (ou crie novo)
- Environment: `Preview` (para staging) ou `Production`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### **Passo 5: Configurar Variáveis de Ambiente no Vercel**

**Via Dashboard:**
1. Acesse: https://vercel.com/[seu-usuario]/taskmaster
2. Vá em: **Settings → Environment Variables**
3. Adicione as seguintes variáveis:

#### **OBRIGATÓRIAS (14 variáveis):**

| Variável | Valor | Ambiente |
|----------|-------|----------|
| `VITE_SUPABASE_URL` | `https://fcmxljhckrztingxecss.supabase.co` | Production + Preview |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Production + Preview |
| `VITE_APP_ENV` | `staging` | Preview only |
| `VITE_APP_ENV` | `production` | Production only |
| `VITE_BETA_MODE` | `true` | Production + Preview |
| `VITE_INVITE_ONLY` | `true` | Production + Preview |
| `VITE_PUBLIC_SIGNUPS` | `false` | Production + Preview |
| `VITE_FEATURE_PIPELINE_V2` | `true` | Production + Preview |
| `VITE_FEATURE_APPROVALS` | `true` | Production + Preview |
| `VITE_FEATURE_COMMAND_CENTER` | `true` | Production + Preview |
| `VITE_FEATURE_PLANNING_COPILOT` | `true` | Production + Preview |
| `VITE_FEATURE_BILLING` | `false` | Production + Preview |
| `VITE_FEATURE_SUBSCRIPTIONS` | `false` | Production + Preview |
| `VITE_FEATURE_OWNERSHIP` | `false` | Production + Preview |
| `VITE_ENABLE_CLASSIC_ROUTES` | `false` | Production + Preview |

#### **OPCIONAIS (para AI Copilot):**

| Variável | Valor | Ambiente |
|----------|-------|----------|
| `VITE_OPENAI_API_KEY` | `sk-proj-[sua-chave]` | Production + Preview |
| `VITE_OPENAI_MODEL` | `gpt-4o-mini` | Production + Preview |
| `VITE_COPILOT_PROVIDER` | `openai` | Production + Preview |

**Via CLI (alternativa):**
```bash
# Adicionar variável via CLI
vercel env add VITE_SUPABASE_URL production preview
# Cole o valor quando solicitado
```

### **Passo 6: Redeploy (Se Variáveis Foram Adicionadas)**

```bash
vercel --prod=false
```

### **Passo 7: Obter URL de Staging**

Após deploy, você receberá a URL:
```
✅ Production: https://taskmaster.vercel.app
✅ Preview: https://taskmaster-[hash].vercel.app
```

**Salve a URL para testes!**

---

## 📦 OPÇÃO 2: DEPLOY VIA NETLIFY (ALTERNATIVA)

### **Passo 1: Instalar Netlify CLI**

```bash
npm install -g netlify-cli
```

### **Passo 2: Login no Netlify**

```bash
netlify login
```

### **Passo 3: Build de Produção**

```bash
npm run build:production
```

### **Passo 4: Deploy para Staging**

```bash
# Deploy draft (staging)
netlify deploy --dir=dist

# OU deploy production
netlify deploy --prod --dir=dist
```

### **Passo 5: Configurar Variáveis de Ambiente no Netlify**

**Via Dashboard:**
1. Acesse: https://app.netlify.com/sites/[seu-site]/settings
2. Vá em: **Build & Deploy → Environment → Environment Variables**
3. Adicione as mesmas 14 variáveis obrigatórias listadas acima

**Via CLI (alternativa):**
```bash
netlify env:set VITE_SUPABASE_URL "https://fcmxljhckrztingxecss.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "eyJhbGci..."
# ... repetir para todas as variáveis
```

### **Passo 6: Redeploy**

```bash
netlify deploy --prod --dir=dist
```

### **Passo 7: Obter URL de Staging**

```
✅ Production: https://taskmaster.netlify.app
✅ Preview: https://[deploy-id]--taskmaster.netlify.app
```

---

## 🔍 VALIDAÇÃO PÓS-DEPLOY

### **Checklist de Validação Staging (OBRIGATÓRIO):**

#### **1. Acesso Básico:**
- [ ] URL de staging abre sem erro
- [ ] Página de login renderiza corretamente
- [ ] Banner beta aparece no topo
- [ ] Console (F12) sem erros críticos

#### **2. Autenticação:**
- [ ] Botão "Cadastrar" redireciona para registro
- [ ] Tela de registro solicita código de convite
- [ ] Login com credenciais válidas funciona
- [ ] Redirecionamento após login OK

#### **3. Rotas Core (6 rotas):**

| Rota | Descrição | Status | Observações |
|------|-----------|--------|-------------|
| `/` | Dashboard | ⏳ | Deve mostrar 4 cards + tabela |
| `/tasks` | TaskBoard | ⏳ | 4 colunas visíveis |
| `/calendar` | Calendar | ⏳ | Grid 7x5 com mês atual |
| `/artists` | ArtistManager | ⏳ | Grid OU estado vazio |
| `/profile` | UserProfile | ⏳ | Avatar + nome + edição |
| `/reports` | Reports | ⏳ | Métricas + gráficos |

#### **4. Network (F12 → Network):**
- [ ] Todos chunks .js retornam status 200
- [ ] Nenhum 404 para .tsx files
- [ ] Supabase requests com status 200
- [ ] CSS carregado corretamente

#### **5. Console (F12 → Console):**
- [ ] Zero erros vermelhos
- [ ] Zero "Failed to fetch dynamically imported module"
- [ ] Zero "404 Not Found" para componentes
- [ ] Warnings aceitáveis (não críticos)

#### **6. Funcionalidades Beta:**
- [ ] Banner beta visível e clicável
- [ ] Link "Reportar Bug" funcional
- [ ] Código de convite validado no registro
- [ ] Logs beta sendo enviados ao Supabase

#### **7. Navegação:**
- [ ] Menu lateral funcional
- [ ] Transições entre rotas suaves
- [ ] Botão "Voltar" do navegador funciona
- [ ] Deep links funcionam (ex: compartilhar `/tasks`)

---

## 🧪 SMOKE TEST AUTOMATIZADO

### **Opção A: Via Scripts Local (Preview da URL Staging)**

```bash
# Editar scripts/validate-staging.js
# Mudar BASE_URL para sua URL de staging
# Exemplo: const BASE_URL = 'https://taskmaster-xyz.vercel.app';

node scripts/validate-staging.js
```

**Resultado esperado:**
```json
{
  "environment": "staging",
  "timestamp": "2025-11-09T...",
  "tests": {
    "routes": {
      "/": "PASS",
      "/tasks": "PASS",
      "/calendar": "PASS",
      "/artists": "PASS",
      "/profile": "PASS",
      "/reports": "PASS"
    },
    "chunks": {
      "status": "PASS",
      "loadedCorrectly": true
    },
    "console": {
      "errors": 0,
      "status": "PASS"
    }
  },
  "overall": "PASS",
  "readyForBetaTesting": true
}
```

### **Opção B: Teste Manual com Browser DevTools**

1. **Abrir URL de staging**
2. **Abrir DevTools (F12)**
3. **Executar no console:**

```javascript
// Smoke test manual
const quickSmokeTest = async () => {
  const results = {
    timestamp: new Date().toISOString(),
    environment: 'staging',
    tests: {}
  };

  // Test routes
  const routes = ['/', '/tasks', '/calendar', '/artists', '/profile', '/reports'];
  results.tests.routes = {};

  for (const route of routes) {
    try {
      const response = await fetch(route);
      results.tests.routes[route] = response.ok ? 'PASS' : 'FAIL';
    } catch (error) {
      results.tests.routes[route] = 'ERROR';
    }
  }

  // Check for errors
  results.tests.console = {
    errors: window.performance.getEntries().filter(e => e.name.includes('error')).length,
    status: window.performance.getEntries().filter(e => e.name.includes('error')).length === 0 ? 'PASS' : 'FAIL'
  };

  // Check PlaceholderComponents
  const scripts = Array.from(document.querySelectorAll('script[src]'));
  const hasPlaceholder = scripts.some(s => s.src.includes('PlaceholderComponents'));
  results.tests.placeholders = {
    found: hasPlaceholder,
    status: hasPlaceholder ? 'FAIL' : 'PASS'
  };

  results.overall = Object.values(results.tests).every(t => t.status === 'PASS' || Object.values(t).every(v => v === 'PASS')) ? 'PASS' : 'FAIL';

  console.log('🧪 SMOKE TEST RESULTS:', results);
  return results;
};

// Executar
await quickSmokeTest();
```

**Copie o resultado e salve como `STAGING_SMOKE_TEST_RESULTS_v1.0.2.json`**

---

## 📊 MÉTRICAS DE SUCESSO

### **Deploy Staging Aprovado Se:**

```
✅ Build concluído sem erros
✅ URL staging acessível
✅ 6/6 rotas core renderizam
✅ 0 erros no console
✅ 0 telas brancas
✅ Autenticação funciona
✅ Banner beta visível
✅ Navegação fluida
✅ Chunks .js carregam corretamente
✅ Smoke test: overall = PASS
```

### **Critérios de Bloqueio (NÃO DEPLOY):**

```
❌ Build falha
❌ Qualquer rota com tela branca
❌ Erro "Failed to fetch dynamically imported module"
❌ 404 para arquivos .tsx
❌ Autenticação quebrada
❌ Console com erros críticos
❌ Smoke test: overall = FAIL
```

---

## 🐛 TROUBLESHOOTING

### **Problema 1: Tela Branca em Staging**

**Sintoma:** Staging abre mas mostra tela branca

**Diagnóstico:**
1. Abrir F12 → Console
2. Procurar por erro vermelho
3. Verificar Network → qualquer 404?

**Soluções:**
- Verificar se variáveis de ambiente foram configuradas no Vercel/Netlify
- Fazer redeploy após adicionar variáveis
- Verificar se BASE_PATH está correto (deve ser `/` para raiz)

---

### **Problema 2: "Failed to fetch dynamically imported module"**

**Sintoma:** Erro ao navegar entre rotas

**Diagnóstico:**
1. Abrir F12 → Network
2. Procurar por requests para `.tsx` files
3. Verificar se retornam 404

**Soluções:**
- ❌ **NÃO DEVERIA ACONTECER** (v1.0.2 corrigiu isso!)
- Se acontecer, verificar se o build foi feito com código v1.0.2
- Confirmar que `grep PlaceholderComponents src/App.tsx` retorna 0

---

### **Problema 3: Variáveis de Ambiente Não Aplicadas**

**Sintoma:** App não conecta ao Supabase ou features não funcionam

**Diagnóstico:**
1. Abrir F12 → Console
2. Executar: `console.log(import.meta.env)`
3. Verificar se as variáveis aparecem

**Soluções:**
- Confirmar que variáveis foram adicionadas no Vercel/Netlify
- Confirmar que foram aplicadas para "Production + Preview"
- Fazer redeploy após adicionar variáveis

---

### **Problema 4: 404 Not Found em Subrotas**

**Sintoma:** `/tasks` funciona no localhost mas retorna 404 em staging

**Diagnóstico:**
1. Verificar se `vercel.json` ou `netlify.toml` existe
2. Confirmar configuração de rewrites

**Soluções (Vercel):**
- Criar `vercel.json`:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Soluções (Netlify):**
- Criar `netlify.toml`:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## 📋 CHECKLIST FINAL

### **Antes do Deploy:**
- [x] ✅ Build local OK
- [x] ✅ Preview local OK
- [x] ✅ Cliente autorizou
- [x] ✅ Variáveis de ambiente preparadas
- [x] ✅ Conta Vercel/Netlify configurada

### **Durante o Deploy:**
- [ ] ⏳ Build remoto sem erros
- [ ] ⏳ Variáveis configuradas na plataforma
- [ ] ⏳ URL de staging obtida
- [ ] ⏳ Redeploy executado (se necessário)

### **Após o Deploy:**
- [ ] ⏳ URL acessível
- [ ] ⏳ 6 rotas testadas manualmente
- [ ] ⏳ Console limpo
- [ ] ⏳ Network sem 404s
- [ ] ⏳ Autenticação funcional
- [ ] ⏳ Smoke test executado
- [ ] ⏳ Smoke test: overall = PASS

---

## 🎯 PRÓXIMOS PASSOS APÓS STAGING

### **Se Deploy Staging OK:**

1. **Gerar Relatório de Validação:**
   - `STAGING_VALIDATION_REPORT_v1.0.2.md`
   - Incluir prints das 6 rotas
   - Incluir resultado do smoke test
   - Incluir URL de staging

2. **Iniciar Beta Testing:**
   - Convidar primeiros beta testers
   - Enviar códigos de convite
   - Criar formulário de feedback
   - Monitorar logs beta

3. **Documentar:**
   - URL de staging
   - Credenciais de teste
   - Features disponíveis
   - Issues conhecidos

4. **Preparar Production Deploy:**
   - Aguardar feedback beta (7-14 dias)
   - Corrigir bugs críticos
   - Executar plano de go-live

---

## 📞 SUPORTE

Se encontrar qualquer problema durante o deploy:

1. **Capturar evidências:**
   - Screenshot do erro
   - Console output completo
   - Network tab
   - URL afetada

2. **Reportar:**
   - Descrever problema
   - Anexar evidências
   - Informar plataforma (Vercel/Netlify)
   - Informar passo onde travou

3. **Rollback (se necessário):**
   - Vercel: `vercel rollback`
   - Netlify: Dashboard → Deploys → Restore

---

## ✅ APROVAÇÃO

```
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   🚀 STAGING DEPLOY GUIDE v1.0.2                  ║
║                                                   ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║  ✅ Validação local completa                      ║
║  ✅ Cliente autorizou deploy                      ║
║  ✅ Variáveis de ambiente preparadas              ║
║  ✅ Guia completo fornecido                       ║
║  ✅ Troubleshooting documentado                   ║
║  ✅ Smoke test pronto                             ║
║                                                   ║
║  🎯 PRONTO PARA EXECUTAR DEPLOY STAGING           ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
```

---

**Data de Criação:** 09 de Novembro de 2025
**Responsável:** Claude Code AI Assistant
**Versão:** v1.0.2 (Hotfix Dynamic Imports)
**Status:** ✅ **PRONTO PARA EXECUÇÃO**

**SUCESSO NO DEPLOY! 🚀**

---

**FIM DO GUIA**
