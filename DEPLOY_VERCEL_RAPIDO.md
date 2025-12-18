# 🚀 TaskMaster Beta — Deploy Vercel (Guia Rápido)

**Data**: October 23, 2025 16:00 UTC
**Status**: Pronto para Deploy Final

---

## ✅ PRÉ-REQUISITOS VALIDADOS

### Build de Produção
```
✅ npm run build concluído (6.75s)
✅ dist/ gerado (315 KB otimizado)
✅ Sem erros de compilação
✅ RegisterForm corrigido (RPC try/catch)
```

### Variáveis de Ambiente (.env.production)
```
✅ VITE_SUPABASE_URL: https://ktspxbucvfzaqyszpyso.supabase.co
✅ VITE_SUPABASE_ANON_KEY: eyJhbGciOiJI... (válido)
✅ VITE_BETA_MODE: true
✅ VITE_INVITE_ONLY: true
✅ VITE_PUBLIC_SIGNUPS: false
```

### Database Supabase
```
✅ PostgreSQL 17.4 online
✅ RLS ativo em todas as tabelas
✅ 1,103 códigos de convite disponíveis
✅ Função increment_invite_code_usage criada
✅ Políticas anon para validação ativas
```

---

## 🚀 DEPLOY PARA VERCEL

### Comando de Deploy

```bash
vercel --prod
```

### O que o Vercel fará:

1. Upload do projeto para Vercel
2. Detecção automática: Framework = Vite
3. Build command: `npm run build`
4. Output directory: `dist`
5. Injeção de variáveis de ambiente (do vercel.json)
6. Deploy para domínio de produção
7. Retorno da URL pública

### Tempo Estimado
- Upload: ~30 segundos
- Build: ~10 segundos
- Deploy: ~20 segundos
- **Total**: ~1 minuto

---

## 📋 VALIDAÇÃO PÓS-DEPLOY (CHECKLIST)

### 1. URL Pública Acessível

```bash
curl -I https://[seu-projeto].vercel.app
```

**Resultado Esperado**:
```
HTTP/2 200
content-type: text/html
```

✅ **Critério**: Status 200 retornado

---

### 2. Health Check Funcional

```bash
curl https://[seu-projeto].vercel.app/health.json
```

**Resultado Esperado**:
```json
{
  "status": "healthy",
  "service": "TaskMaster Beta",
  "timestamp": "2025-10-23T16:00:00.000Z",
  "version": "1.0.0-beta",
  "environment": "production"
}
```

✅ **Critério**: JSON retornado com status "healthy"

---

### 3. Demo Mode (Browser Test)

**URL**: `https://[seu-projeto].vercel.app/login`

**Credenciais**:
- Email: `usuario@exemplo.com`
- Senha: `senha123`

**Checklist**:
```
[ ] Página de login carrega
[ ] Campos de email e senha visíveis
[ ] Submit do formulário
[ ] Banner âmbar "Modo Demonstração" aparece
[ ] Redirecionamento para dashboard
[ ] Dashboard carrega sem erros
```

✅ **Critério**: Login demo funcional

---

### 4. Registro com Convite (Browser Test - PRINCIPAL)

**URL**: `https://[seu-projeto].vercel.app/register?invite=BETA-TEAM-DEV`

**Passo a Passo Completo**:

1. **Acesso à URL**
   - [ ] Página de registro carrega
   - [ ] Campo "Código de Convite" pré-preenchido com `BETA-TEAM-DEV`

2. **Validação Automática**
   - [ ] Aguardar 2-3 segundos
   - [ ] Checkmark verde aparece ao lado do campo
   - [ ] Mensagem: "Código válido! Você pode prosseguir com o cadastro."

3. **Preenchimento do Formulário**
   - [ ] Nome Completo: `Beta Tester 01`
   - [ ] Email: `beta01@taskmaster.test`
   - [ ] Senha: `SenhaForte@2025`
   - [ ] Confirmar Senha: `SenhaForte@2025`
   - [ ] Idioma: `Português (PT)`
   - [ ] Tipo de Conta: `Artist`

4. **Submit**
   - [ ] Clicar em "Criar Conta"
   - [ ] Aguardar processamento (3-5 segundos)
   - [ ] **VERIFICAR**: Console do navegador (F12) SEM erros RPC
   - [ ] Redirecionamento para dashboard (`/`)

5. **Dashboard**
   - [ ] Command Center carrega
   - [ ] Nome do usuário aparece no canto superior direito
   - [ ] Sem erros visíveis

✅ **Critério**: Cadastro completo sem erros

---

### 5. Validação no Supabase (SQL Queries)

Após o cadastro bem-sucedido, execute as queries abaixo no Supabase SQL Editor:

#### a) Verificar Cadastro em beta_user_logs

```sql
SELECT 
  id,
  user_id,
  action_type,
  module,
  metadata,
  created_at
FROM beta_user_logs 
WHERE action_type = 'signup'
ORDER BY created_at DESC 
LIMIT 1;
```

**Resultado Esperado**:
```
id: [UUID]
user_id: [UUID válido]
action_type: 'signup'
module: 'auth'
metadata: {
  "email": "beta01@taskmaster.test",
  "account_type": "artist",
  "language": "pt",
  "signup_source": "web",
  "invite_code": "BETA-TEAM-DEV"
}
created_at: [timestamp recente]
```

✅ **Critério**: 1 registro retornado com dados corretos

---

#### b) Verificar Incremento do Código

```sql
SELECT 
  code,
  used_count,
  max_uses,
  (max_uses - used_count) as remaining
FROM invite_codes 
WHERE code = 'BETA-TEAM-DEV';
```

**Resultado Esperado**:
```
code: 'BETA-TEAM-DEV'
used_count: 1 (incrementado de 0)
max_uses: 999
remaining: 998
```

✅ **Critério**: `used_count = 1`

---

#### c) Verificar Usuário em auth.users

```sql
SELECT 
  id,
  email,
  created_at,
  raw_user_meta_data->>'name' as name,
  raw_user_meta_data->>'account_type' as account_type,
  raw_user_meta_data->>'language' as language
FROM auth.users
ORDER BY created_at DESC
LIMIT 1;
```

**Resultado Esperado**:
```
id: [UUID - mesmo do beta_user_logs]
email: 'beta01@taskmaster.test'
name: 'Beta Tester 01'
account_type: 'artist'
language: 'pt'
created_at: [timestamp recente]
```

✅ **Critério**: 1 usuário criado com metadados corretos

---

## 📊 MÉTRICAS DE OBSERVABILIDADE

### Query: Cadastros por Dia

```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as signups,
  COUNT(DISTINCT (metadata->>'invite_code')) as unique_codes_used
FROM beta_user_logs
WHERE action_type = 'signup'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Query: Conversão de Convites

```sql
SELECT 
  code,
  used_count,
  max_uses,
  ROUND((used_count::decimal / max_uses * 100), 2) as usage_percent,
  expires_at
FROM invite_codes
WHERE used_count > 0
ORDER BY used_count DESC
LIMIT 10;
```

### Query: Últimas 10 Ações

```sql
SELECT 
  action_type,
  module,
  metadata->>'email' as user_email,
  created_at
FROM beta_user_logs
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🔒 VERIFICAÇÃO DE SEGURANÇA

### RLS Ativo em Todas as Tabelas

```sql
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'projects', 'tasks', 'invite_codes', 
    'beta_user_logs', 'feedback'
  )
ORDER BY tablename;
```

**Resultado Esperado**: `rowsecurity = true` para todas

---

### Políticas RLS por Tabela

```sql
SELECT
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

**Resultado Esperado**:
```
invite_codes: 5 políticas
beta_user_logs: 4-5 políticas
projects: 3+ políticas
tasks: 3+ políticas
```

---

## 📸 PRINTS ESPERADOS (EVIDÊNCIAS)

### 1. Vercel Deploy Success
```
✓ Production: https://taskmaster-xyz.vercel.app [1m]
```

### 2. Health Check Response
```json
{"status":"healthy","service":"TaskMaster Beta",...}
```

### 3. Registro Completo
- Screenshot da página de registro com checkmark verde
- Screenshot do dashboard após login
- Screenshot do console sem erros

### 4. Query Results
- Print da query beta_user_logs (1 registro)
- Print da query invite_codes (used_count = 1)
- Print da query auth.users (1 usuário)

---

## ✅ CRITÉRIOS DE SUCESSO FINAL

Para considerar o deploy **100% validado**, todos os itens abaixo devem estar ✅:

```
[ ] URL pública acessível (status 200)
[ ] /health.json retorna JSON válido
[ ] Demo login funciona (usuario@exemplo.com)
[ ] Registro com BETA-TEAM-DEV completa sem erros
[ ] Console do navegador SEM erros RPC
[ ] beta_user_logs contém 1 registro de signup
[ ] invite_codes.used_count = 1
[ ] auth.users contém 1 novo usuário
[ ] RLS ativo em todas as tabelas
[ ] Variáveis de ambiente corretas
```

---

## 🎯 PRÓXIMOS PASSOS PÓS-VALIDAÇÃO

### Fase 1 do Beta (50 Convites)

1. **Distribuir Códigos Especiais** (3 códigos):
   - `BETA-TEAM-ADMIN` (uso interno - 999 usos)
   - `BETA-TEAM-DEV` (desenvolvedores - 999 usos)
   - `BETA-VIP-2025` (VIP testers - 50 usos)

2. **Distribuir Primeiros 50 Códigos Standard**:
   - Selecionar da lista: `exports/BETA_INVITE_CODES_2025-10-22.csv`
   - Códigos formato: `BETA-2025-XXXXXX`
   - 1 uso por código

3. **Monitoramento Diário**:
   - Executar queries de métricas (cadastros/dia)
   - Acompanhar conversão de convites
   - Coletar feedbacks via widget
   - Gerar relatório semanal

4. **Planejar Fase 2** (100 usuários):
   - Após 7 dias de Fase 1
   - Avaliar KPIs (retenção, NPS, bugs)
   - Expandir para 100 códigos ativos

---

## 🚨 TROUBLESHOOTING

### Se Deploy Falhar
1. Verificar logs do Vercel: `vercel logs`
2. Confirmar vercel.json está correto
3. Verificar package.json scripts
4. Tentar deploy via dashboard

### Se Health Check Retornar 404
1. Verificar `dist/health.json` existe
2. Verificar `vercel.json` rewrites
3. Re-deploy: `vercel --prod --force`

### Se Registro Falhar
1. Abrir console do navegador (F12)
2. Verificar erro específico
3. Testar com BETA-TEAM-ADMIN (sempre válido)
4. Verificar Supabase Auth configurado

### Se RPC Ainda Falhar
1. Verificar função existe: SQL Editor Supabase
2. Verificar permissões: `GRANT EXECUTE TO anon`
3. Testar função manualmente no SQL Editor

---

**Preparado por**: System Deployment  
**Data**: October 23, 2025 16:00 UTC  
**Status**: PRONTO PARA DEPLOY  
**Build**: RegisterForm-BuNLkp3L.js  

🚀 **COMANDO DE DEPLOY**: `vercel --prod`
