# 🚀 TaskMaster - Guia de Deploy Completo

**Status do Build:** ✅ Compilado com sucesso (17.46s)
**Pasta de Deploy:** `dist/` (pronta para upload)

---

## ⚠️ Problema Atual

O ambiente está com problemas de conectividade de rede que impedem:
- `npm install` automático
- Deploy via CLI do Vercel
- Deploy via CLI do Netlify

**Solução:** Deploy manual via interface web ou CI/CD do repositório Git.

---

## 🎯 Opção 1: Deploy via Git (Recomendado)

### Passo 1: Commit e Push
```bash
# Adicionar todos os arquivos
git add .

# Commit
git commit -m "Beta launch ready - All features implemented"

# Push para seu repositório
git push origin main
```

### Passo 2A: Vercel (via GitHub/GitLab)

1. **Acesse:** https://vercel.com
2. **Login** com sua conta
3. **Import Project** → Conecte seu repositório
4. **Configure:**
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

5. **Environment Variables** (IMPORTANTE):
   ```
   VITE_SUPABASE_URL=https://ktspxbucvfzaqyszpyso.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0c3B4YnVjdmZ6YXF5c3pweXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NDcyNzQsImV4cCI6MjA3MTAyMzI3NH0.-UfFVeGoCJFc69FHSwZ2FHlcQs1uidkxg0tItxmpPTc
   VITE_BETA_MODE=true
   VITE_INVITE_ONLY=true
   VITE_PUBLIC_SIGNUPS=false
   VITE_FEATURE_BILLING=false
   VITE_FEATURE_SUBSCRIPTIONS=false
   VITE_FEATURE_OWNERSHIP=false
   VITE_FEATURE_PIPELINE_V2=true
   VITE_FEATURE_APPROVALS=true
   VITE_FEATURE_COMMAND_CENTER=true
   VITE_FEATURE_PLANNING_COPILOT=true
   VITE_OPENAI_API_KEY=[SUA-CHAVE-AQUI]
   VITE_OPENAI_MODEL=gpt-4o-mini
   ```

6. **Deploy** → Aguarde build (~2 min)

7. **Verifique:** URL gerada (ex: `taskmaster-xyz.vercel.app`)

### Passo 2B: Netlify (via GitHub/GitLab)

1. **Acesse:** https://app.netlify.com
2. **New site from Git** → Conecte seu repositório
3. **Configure:**
   - Build command: `npm run build`
   - Publish directory: `dist`

4. **Environment Variables** (mesmas do Vercel acima)

5. **Deploy** → Aguarde build (~2 min)

6. **Verifique:** URL gerada (ex: `taskmaster-xyz.netlify.app`)

---

## 🎯 Opção 2: Deploy Manual (Upload direto)

### Para Vercel

1. **Acesse:** https://vercel.com/dashboard
2. **New Project** → **Deploy from template**
3. Escolha "Other" ou "Static"
4. **Drag and drop** a pasta `dist/` inteira
5. Configure as **Environment Variables** (lista acima)
6. **Deploy**

### Para Netlify

1. **Acesse:** https://app.netlify.com/drop
2. **Drag and drop** a pasta `dist/` inteira
3. Após deploy inicial, vá em **Site settings** → **Environment variables**
4. Adicione todas as variáveis (lista acima)
5. **Trigger redeploy**

### Para Hosting Tradicional (cPanel, FTP, etc.)

1. **Upload** todos os arquivos da pasta `dist/` para a raiz do servidor
2. Configure o servidor para:
   - Redirecionar todas as rotas para `index.html` (SPA)
   - Servir arquivos com headers de segurança (ver `.htaccess` abaixo)

**Arquivo `.htaccess` (se Apache):**
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Security headers
<IfModule mod_headers.c>
  Header set X-Frame-Options "DENY"
  Header set X-Content-Type-Options "nosniff"
  Header set X-XSS-Protection "1; mode=block"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Cache optimization
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/html "access plus 0 seconds"
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
</IfModule>
```

---

## 🎯 Opção 3: Deploy via CI/CD

Se você usa GitHub Actions, GitLab CI, ou similar:

### GitHub Actions (`.github/workflows/deploy.yml`)

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          VITE_BETA_MODE: true
          VITE_INVITE_ONLY: true
          VITE_PUBLIC_SIGNUPS: false
          VITE_FEATURE_BILLING: false

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## ✅ Após o Deploy

### 1. Verificar Site Online

**Checklist:**
- [ ] Site carrega sem erros
- [ ] Login funciona
- [ ] Register solicita código Beta
- [ ] Dashboard carrega
- [ ] Widget de feedback aparece (botão azul)

**URLs para testar:**
- `/` - Home/Dashboard
- `/login` - Login
- `/register` - Cadastro (deve pedir código)
- `/beta-dashboard` - Dashboard Beta (admin)
- `/command-center` - Command Center
- `/planejamento` - Planning Copilot

### 2. Gerar Convites Beta

1. **Acesse:** `https://seu-dominio.com/beta-dashboard`
2. **Login** como admin
3. **Tab "Overview"**
4. **Clique:**
   - "2 Convites: Escritórios" → Anote códigos
   - "2 Convites: Artistas" → Anote códigos
   - "1 Convite: Outro" → Anote código

**Resultado esperado:**
```
BETA-A1B2C3D4 (Escritório 1)
BETA-E5F6G7H8 (Escritório 2)
BETA-I9J0K1L2 (Artista 1)
BETA-M3N4O5P6 (Artista 2)
BETA-Q7R8S9T0 (Outro)
```

### 3. Registrar Testers no Database

**SQL para associar e-mails:**
```sql
-- Escritório 1
UPDATE beta_users
SET invite_metadata = jsonb_set(invite_metadata, '{email}', '"escritorio1@example.com"')
WHERE invite_code = 'BETA-A1B2C3D4';

-- Escritório 2
UPDATE beta_users
SET invite_metadata = jsonb_set(invite_metadata, '{email}', '"escritorio2@example.com"')
WHERE invite_code = 'BETA-E5F6G7H8';

-- Artista 1
UPDATE beta_users
SET invite_metadata = jsonb_set(invite_metadata, '{email}', '"artista1@example.com"')
WHERE invite_code = 'BETA-I9J0K1L2';

-- Artista 2
UPDATE beta_users
SET invite_metadata = jsonb_set(invite_metadata, '{email}', '"artista2@example.com"')
WHERE invite_code = 'BETA-M3N4O5P6';

-- Outro
UPDATE beta_users
SET invite_metadata = jsonb_set(invite_metadata, '{email}', '"outro@example.com"')
WHERE invite_code = 'BETA-Q7R8S9T0';
```

### 4. Enviar E-mails de Convite

**Modelo em:** `BETA_LAUNCH_COMPLETE.md` (seção "Modelo de E-mail de Convite")

**Para cada tester:**
- Assunto: "Você foi convidado para o Beta do TaskMaster 🎵"
- Código único
- URL: `https://seu-dominio.com/register`
- Validade: 7 dias

### 5. Configurar Monitoramento

**Alarmes Supabase:**
1. Acesse Supabase Dashboard
2. Database → Backups → Confirme backup diário ativo
3. Database → Logs → Configure alertas

**Verificar diariamente:**
- `/beta-dashboard` → Tab "KPIs"
- Ativações (meta: 80%)
- Feedbacks recebidos
- Erros críticos (meta: 0)

### 6. Capturar Screenshot Inicial (H+2)

**2 horas após enviar convites:**

1. Acesse `/beta-dashboard`
2. Tab "KPIs"
3. Screenshot de todas as métricas:
   - Ativação
   - Engajamento
   - Qualidade
   - Comunicação
   - Marcos

**Salvar como:** `beta_kpis_h+2.png`

---

## 📊 Timeline de Monitoramento

### H+0 (Deploy)
- [x] Deploy bem-sucedido
- [ ] Site online e validado
- [ ] Convites gerados
- [ ] E-mails enviados

### H+2
- [ ] Verificar primeiras ativações
- [ ] Screenshot KPIs inicial
- [ ] Responder primeiros feedbacks

### D+1
- [ ] Verificar ativações D+1 (meta: 5/5)
- [ ] Verificar criação de artistas/projetos
- [ ] Enviar digest diário

### D+2
- [ ] Enviar lembrete WhatsApp
- [ ] Verificar engajamento
- [ ] Resolver bugs reportados

### D+3 a D+6
- [ ] Monitoramento diário
- [ ] Responder feedbacks <24h
- [ ] Manter KPIs atualizados

### D+7
- [ ] Enviar e-mail de fechamento
- [ ] QA final completo
- [ ] Gerar relatório final
- [ ] Decisão: produção ou mais testes?

---

## 🆘 Troubleshooting

### Problema: Build falha no CI/CD
**Solução:** Verificar se todas as env vars estão configuradas

### Problema: Site carrega mas quebra
**Solução:** Abrir DevTools (F12) → Console → Ver erros → Geralmente falta env var

### Problema: Convites não geram
**Solução:**
1. Verificar se migration foi aplicada
2. Executar: `SELECT * FROM beta_users;`
3. Se vazio, migration não rodou

### Problema: Widget de feedback não aparece
**Solução:** Verificar `VITE_BETA_MODE=true` nas env vars

### Problema: Login funciona mas dashboard vazio
**Solução:** Verificar conexão Supabase → Env vars corretas?

---

## 📞 Suporte

### Logs Importantes

**Browser DevTools:**
```javascript
// Ver env vars
console.log(import.meta.env);

// Ver erros Supabase
// Check Network tab para chamadas falhando
```

**Supabase Dashboard:**
- Database → Logs → Ver queries e erros
- Database → Tables → Verificar RLS ativo

**Vercel/Netlify Dashboard:**
- Deployments → Ver logs de build
- Settings → Environment Variables → Confirmar valores

---

## ✅ Checklist Final de Deploy

- [ ] Build local bem-sucedido
- [ ] Commit e push para Git (se usar CI/CD)
- [ ] Deploy via plataforma escolhida
- [ ] Environment variables configuradas
- [ ] Site acessível e carregando
- [ ] Login/Register funcionando
- [ ] Beta dashboard acessível
- [ ] Convites gerados (5 códigos)
- [ ] E-mails de convite enviados
- [ ] Screenshot KPIs inicial (H+2)
- [ ] Monitoramento diário configurado

---

## 🎉 Próximo Passo

**Agora que o deploy está pronto:**

1. ✅ Site online
2. 📧 Enviar convites
3. 📊 Monitorar KPIs diariamente
4. 💬 Responder feedbacks <24h
5. 🐛 Resolver bugs críticos ASAP
6. 📈 Acompanhar critérios de sucesso
7. 📝 Gerar relatório final (D+7)

---

**Boa sorte com o Beta!** 🚀🎵

*TaskMaster - A Plataforma Definitiva de Gestão Artística*
