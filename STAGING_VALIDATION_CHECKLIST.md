# ✅ CHECKLIST DE VALIDAÇÃO STAGING - TaskMaster v1.0.1

**Data:** 08 de Novembro de 2025
**Versão:** 1.0.1
**Ambiente:** Staging
**URL:** https://staging.taskmaster.app

---

## 🎯 INSTRUÇÕES DE USO

Este checklist deve ser preenchido **APÓS** o deploy staging estar completo.

Cada item deve ser testado manualmente e marcado com ✅ (passou) ou ❌ (falhou).

**Formato:**
- [x] ✅ Item passou
- [ ] ❌ Item falhou
- [ ] ⏳ Item não testado ainda

---

## 📦 SEÇÃO 1: INFRAESTRUTURA E DEPLOY

### **1.1 URL e Acesso**
- [ ] URL `https://staging.taskmaster.app` carrega
- [ ] HTTPS ativo (cadeado verde)
- [ ] Certificado SSL válido (não expirado)
- [ ] Sem warnings de segurança no navegador
- [ ] Página inicial renderiza (não tela branca)

### **1.2 Performance**
- [ ] Carregamento inicial < 3 segundos
- [ ] Lighthouse Performance Score > 80
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Time to Interactive < 3s

### **1.3 Console do Navegador**
- [ ] Sem erros críticos em vermelho
- [ ] Warnings (amarelo) apenas informativos
- [ ] Logs do TaskMaster aparecem formatados
- [ ] Supabase conecta sem erros

### **1.4 Variáveis de Ambiente**
```javascript
// No console (F12):
console.log(import.meta.env.VITE_SUPABASE_URL);
console.log(import.meta.env.VITE_APP_ENV);
console.log(import.meta.env.VITE_BETA_MODE);
```
- [ ] `VITE_SUPABASE_URL` definida
- [ ] `VITE_APP_ENV` = "staging"
- [ ] `VITE_BETA_MODE` = "true"
- [ ] Nenhuma variável `undefined`

---

## 🔐 SEÇÃO 2: AUTENTICAÇÃO

### **2.1 Página de Login (`/login`)**
- [ ] Rota `/login` carrega corretamente
- [ ] Formulário renderiza completo
- [ ] Campo "Email" funcional
- [ ] Campo "Senha" funcional
- [ ] Botão "Entrar" visível
- [ ] Link "Cadastrar" funciona
- [ ] Link "Esqueci minha senha" funciona
- [ ] BetaBanner aparece (se ativo)

### **2.2 Cadastro de Usuário (`/register`)**
- [ ] Rota `/register` carrega
- [ ] Formulário de cadastro completo
- [ ] Campo "Email" valida formato
- [ ] Campo "Senha" valida força
- [ ] Campo "Confirmar Senha" valida igualdade
- [ ] Botão "Criar Conta" funciona
- [ ] Mensagem de sucesso aparece
- [ ] Redirecionamento após cadastro

### **2.3 Criar Conta Admin**
**Email:** balmarcos@hotmail.com
**Senha:** bal@123456

- [ ] Cadastro concluído com sucesso
- [ ] Email de confirmação recebido (se ativo)
- [ ] Link de confirmação funciona (se ativo)
- [ ] Conta confirmada no Supabase
- [ ] Login funciona com as credenciais

### **2.4 Login com Admin**
- [ ] Login com `balmarcos@hotmail.com` / `bal@123456` funciona
- [ ] Redirecionamento para `/` (dashboard)
- [ ] Sessão persiste (não desloga após F5)
- [ ] Token JWT válido (verificar no DevTools)
- [ ] Supabase Auth atualiza corretamente

### **2.5 Logout**
- [ ] Botão de logout visível
- [ ] Click em logout funciona
- [ ] Redirecionamento para `/login`
- [ ] Sessão encerrada (não consegue acessar rotas protegidas)
- [ ] localStorage limpo de tokens

---

## 🏠 SEÇÃO 3: DASHBOARD PRINCIPAL

### **3.1 Dashboard de Organização (`/`)**
- [ ] Após login, redireciona para `/`
- [ ] Header com logo "TaskMaster" visível
- [ ] 4 cards superiores renderizam:
  - [ ] 🎵 Artistas (Cyan)
  - [ ] 🚀 Projetos (Orange)
  - [ ] 💰 Faturamento (Green)
  - [ ] 📅 Próximos Shows (Yellow)
- [ ] Tabela "Nossos Talentos" renderiza
- [ ] Botão "Novo Talento" visível e funcional
- [ ] Botão "+ Criar Projeto" visível e funcional

### **3.2 Menu Lateral**
- [ ] Menu lateral renderiza completo
- [ ] Seção PRINCIPAL:
  - [ ] Início
  - [ ] Organização
  - [ ] Tarefas
  - [ ] Agenda
  - [ ] Relatórios
- [ ] Seção PLANEJAMENTO:
  - [ ] Planning Copilot
- [ ] Seção CONTEÚDO (expansível):
  - [ ] Produção Musical
  - [ ] Marketing
  - [ ] Produção
- [ ] Seção SHOWS:
  - [ ] Shows
- [ ] Seção COMUNICAÇÃO (expansível):
  - [ ] WhatsApp
  - [ ] Google
  - [ ] Reuniões
- [ ] Seção ANÁLISE:
  - [ ] Análise
  - [ ] KPIs
- [ ] Seção ADMIN:
  - [ ] Admin
- [ ] Seção PERFIL:
  - [ ] Perfil
- [ ] Logo no topo do menu
- [ ] Seções expansíveis abrem/fecham corretamente

---

## 📋 SEÇÃO 4: FUNCIONALIDADES CORE

### **4.1 TaskBoard (`/tasks`)**
- [ ] Navegar para `/tasks` funciona
- [ ] 4 colunas renderizam:
  - [ ] Backlog (Cinza)
  - [ ] A Fazer (Azul)
  - [ ] Em Progresso (Amarelo)
  - [ ] Concluído (Verde)
- [ ] Botão "+ Nova Tarefa" visível
- [ ] Click em "+ Nova Tarefa" cria tarefa
- [ ] Tarefa aparece na coluna correta
- [ ] Card da tarefa exibe nome, descrição, data
- [ ] Contador de tarefas por coluna correto
- [ ] Layout responsivo (1-2-4 colunas)
- [ ] Mensagem "Nenhuma tarefa" quando vazio

**Teste de Persistência:**
- [ ] Criar 3 tarefas
- [ ] F5 (reload da página)
- [ ] Tarefas ainda aparecem (se implementado)

### **4.2 Calendar (`/calendar`)**
- [ ] Navegar para `/calendar` funciona
- [ ] Calendário mensal renderiza
- [ ] Mês e ano corretos exibidos
- [ ] Grid de 7 colunas (Dom-Sáb)
- [ ] Dia atual destacado (fundo azul)
- [ ] Botão "← Anterior" navega para mês anterior
- [ ] Botão "Próximo →" navega para próximo mês
- [ ] Botão "+ Novo Evento" visível
- [ ] Click em "+ Novo Evento" cria evento
- [ ] Evento aparece no dia correto
- [ ] Lista "Eventos do Mês" renderiza abaixo
- [ ] Eventos têm ícone de calendário

**Teste de Persistência:**
- [ ] Criar 2 eventos
- [ ] F5 (reload da página)
- [ ] Eventos aparecem no calendário
- [ ] Eventos aparecem na lista

### **4.3 ArtistManager (`/artists`)**
- [ ] Navegar para `/artists` funciona
- [ ] Grid de cards renderiza (se houver artistas)
- [ ] Estado vazio renderiza (se não houver artistas)
- [ ] Botão "+ Novo Artista" visível
- [ ] Campo de busca funcional
- [ ] Contador "X artistas cadastrados" correto

**Se houver artistas:**
- [ ] Avatar com iniciais e gradiente
- [ ] Nome completo exibido
- [ ] Nome artístico exibido (se houver)
- [ ] Gênero musical exibido
- [ ] Badge de status (Ativo/Inativo)
- [ ] Badge de exclusividade (se aplicável)
- [ ] Botão "Ver Detalhes" em cada card
- [ ] Layout responsivo (1-2-3 colunas)

**Teste de Criação:**
- [ ] Click em "+ Novo Artista"
- [ ] Modal de cadastro abre
- [ ] Preencher campos obrigatórios
- [ ] Salvar artista
- [ ] Artista aparece no grid
- [ ] Avatar gerado corretamente
- [ ] F5 (reload) → Artista persiste

**Teste de Busca:**
- [ ] Digitar nome de artista na busca
- [ ] Grid filtra e mostra apenas resultados relevantes
- [ ] Limpar busca → Todos os artistas voltam

**Teste de Detalhes:**
- [ ] Click em "Ver Detalhes" de um artista
- [ ] Rota muda (ou modal abre)
- [ ] Todas as informações do artista exibidas
- [ ] Botão "← Voltar" funciona

### **4.4 ArtistDetails**
- [ ] Página de detalhes renderiza
- [ ] Avatar grande com iniciais
- [ ] Nome completo exibido
- [ ] Nome artístico exibido
- [ ] Status com badge colorido
- [ ] Exclusividade com badge (se aplicável)
- [ ] Seção "Informações":
  - [ ] Gênero musical
  - [ ] Email (se houver)
  - [ ] Telefone (se houver)
- [ ] Seção "Contrato":
  - [ ] Data de início (se houver)
  - [ ] Data de fim (se houver)
  - [ ] Taxa de comissão (se houver)
- [ ] Biografia exibida (se houver)
- [ ] Seção "Projetos do Artista" renderiza
- [ ] Botão "← Voltar para Artistas" funciona

### **4.5 ProjectDashboard**
**Pré-requisito:** Criar um projeto primeiro

- [ ] Criar projeto via "+ Criar Projeto"
- [ ] Modal de criação abre
- [ ] Preencher nome e descrição
- [ ] Salvar projeto
- [ ] Projeto aparece na lista
- [ ] Click no projeto abre dashboard
- [ ] Nome do projeto exibido no topo
- [ ] Descrição exibida
- [ ] Badge de status correto
- [ ] 4 cards de métricas renderizam:
  - [ ] Tarefas Totais (Azul)
  - [ ] Concluídas (Verde)
  - [ ] Progresso % (Roxo)
  - [ ] Orçamento (Laranja)
- [ ] Card "Progresso do Projeto":
  - [ ] Barra de progresso visual
  - [ ] Percentual correto
  - [ ] Texto "X de Y tarefas concluídas"
- [ ] Card "Tarefas Recentes":
  - [ ] Lista das tarefas mais recentes
  - [ ] Estado vazio se sem tarefas

**Teste de Métricas:**
- [ ] Criar 5 tarefas no TaskBoard
- [ ] Marcar 2 como concluídas
- [ ] Voltar ao ProjectDashboard
- [ ] "Tarefas Totais" = 5
- [ ] "Concluídas" = 2
- [ ] "Progresso" = 40%

### **4.6 UserProfile (`/profile`)**
- [ ] Navegar para `/profile` funciona
- [ ] Avatar com iniciais do usuário
- [ ] Nome exibido
- [ ] Email exibido
- [ ] Função/papel exibido
- [ ] Botão "Editar Perfil" visível
- [ ] Click em "Editar Perfil" abre formulário
- [ ] Formulário de edição renderiza:
  - [ ] Campo "Nome Completo"
  - [ ] Campo "Função"
  - [ ] Campo "Telefone"
  - [ ] Campo "Sobre você"
- [ ] Botões "Cancelar" e "Salvar Alterações"
- [ ] Cards inferiores renderizam:
  - [ ] Estatísticas (mock)
  - [ ] Preferências

**Teste de Edição:**
- [ ] Click em "Editar Perfil"
- [ ] Alterar nome para "Marcos Admin"
- [ ] Alterar função para "Gestor Musical"
- [ ] Click em "Salvar Alterações"
- [ ] Dados atualizam na tela
- [ ] F5 (reload) → Dados persistem

---

## 🔄 SEÇÃO 5: PERSISTÊNCIA E BACKUP

### **5.1 localStorage**
**Abrir Console (F12):**
```javascript
// Verificar keys presentes
Object.keys(localStorage).filter(k => k.includes('taskmaster'))
```

- [ ] `taskmaster_projects` existe
- [ ] `taskmaster_artists` existe
- [ ] `taskmaster_tasks` existe
- [ ] `taskmaster_events` existe
- [ ] `taskmaster_user` existe
- [ ] `taskmaster_logs` existe

### **5.2 Teste de Persistência Completo**

**Criar dados:**
- [ ] Criar 1 projeto
- [ ] Criar 2 artistas
- [ ] Criar 3 tarefas
- [ ] Criar 2 eventos
- [ ] Editar perfil

**Validar persistência:**
- [ ] F5 (reload) na página
- [ ] Projeto ainda aparece
- [ ] Artistas ainda aparecem
- [ ] Tarefas ainda aparecem
- [ ] Eventos ainda aparecem
- [ ] Perfil mantém alterações

**Fechar e reabrir:**
- [ ] Fechar aba do navegador
- [ ] Reabrir `https://staging.taskmaster.app`
- [ ] Fazer login
- [ ] Todos os dados criados ainda existem

### **5.3 Sistema de Backup**
**No Console (F12):**
```javascript
// Criar backup
const backup = window.taskmaster_db.createBackup();
console.log('Backup size:', backup.length, 'characters');

// Validar backup
window.taskmaster_db.validatePersistence();

// Obter estatísticas
window.taskmaster_db.getStats();

// Ver logs
window.taskmaster_db.getLogs();
```

- [ ] `window.taskmaster_db` disponível
- [ ] `createBackup()` gera JSON válido
- [ ] Backup contém todos os dados
- [ ] `validatePersistence()` retorna "healthy"
- [ ] `getStats()` mostra contagem correta
- [ ] `getLogs()` retorna histórico de ações

**Teste de Restore:**
```javascript
// 1. Criar backup
const backup = window.taskmaster_db.createBackup();

// 2. Limpar dados
window.taskmaster_db.clearAll();

// 3. Verificar vazio
window.taskmaster_db.getStats();

// 4. Restaurar
window.taskmaster_db.restoreBackup(backup);

// 5. Verificar restaurado
window.taskmaster_db.getStats();
```

- [ ] Backup salva estado atual
- [ ] `clearAll()` remove todos os dados
- [ ] `restoreBackup()` recupera tudo
- [ ] Dados restaurados idênticos aos originais

---

## 📱 SEÇÃO 6: RESPONSIVIDADE

### **6.1 Mobile (390x844 - iPhone 12)**
**DevTools → Device Toolbar → iPhone 12**

- [ ] Dashboard renderiza corretamente
- [ ] Cards empilham em coluna única
- [ ] Menu lateral adaptado (hamburger?)
- [ ] Botões acessíveis e clicáveis
- [ ] Textos legíveis (não cortados)
- [ ] Formulários funcionam
- [ ] Modals ocupam tela adequadamente
- [ ] TaskBoard empilha colunas
- [ ] Calendar renderiza completo
- [ ] Grid de artistas 1 coluna

### **6.2 Tablet (768x1024 - iPad)**
**DevTools → Device Toolbar → iPad**

- [ ] Layout adapta para 2 colunas
- [ ] Menu lateral visível
- [ ] Cards em grid 2 colunas
- [ ] TaskBoard mostra 2 colunas
- [ ] Navegação fluida
- [ ] Toque funciona corretamente

### **6.3 Desktop (1920x1080)**
**Janela maximizada:**

- [ ] Layout completo renderiza
- [ ] Sidebar sempre visível
- [ ] Cards em grid 4 colunas
- [ ] TaskBoard 4 colunas lado a lado
- [ ] Espaçamento adequado
- [ ] Textos não esticados demais

---

## 🎨 SEÇÃO 7: DESIGN E UX

### **7.1 Paleta de Cores**
- [ ] Gradiente principal cyan → orange → yellow presente
- [ ] Cards com cores consistentes:
  - [ ] Cyan (Artistas, Calendar)
  - [ ] Orange (Projetos, Orçamento)
  - [ ] Green (Faturamento, Concluído)
  - [ ] Yellow (Shows, Em Progresso)
  - [ ] Purple/Pink (Artistas detalhes)
  - [ ] Blue (Tarefas, A Fazer)
- [ ] Status badges coloridos (verde = ativo)
- [ ] Exclusividade badge roxo

### **7.2 Efeitos e Transições**
- [ ] Cards têm shadow e hover effects
- [ ] Botões têm transições suaves
- [ ] Hover em botões muda cor/shadow
- [ ] Navegação entre páginas fluida
- [ ] Modals abrem com animação
- [ ] Estados vazios bem formatados

### **7.3 Ícones e Tipografia**
- [ ] Ícones Lucide React renderizam
- [ ] Ícones corretos em cada seção
- [ ] Hierarquia de títulos clara
- [ ] Fonte legível e profissional
- [ ] Tamanhos de texto consistentes

---

## 🧪 SEÇÃO 8: TESTES DE INTEGRAÇÃO

### **8.1 Fluxo Completo: Projeto**

**Cenário:** Criar e gerenciar projeto com tarefas

**Passos:**
1. [ ] Login como admin
2. [ ] Dashboard → "+ Criar Projeto"
3. [ ] Preencher:
   - Nome: "Projeto Validação Staging"
   - Descrição: "Teste completo do fluxo"
   - Tipo: "Gestão de Artista"
4. [ ] Salvar projeto
5. [ ] Verificar projeto na lista
6. [ ] Abrir projeto (dashboard)
7. [ ] Navegar para `/tasks`
8. [ ] Criar 5 tarefas
9. [ ] Verificar tarefas em "A Fazer"
10. [ ] Navegar de volta ao dashboard
11. [ ] Verificar métrica "Tarefas Totais" = 5
12. [ ] F5 (reload)
13. [ ] Verificar tudo persiste

**Resultado:**
- [ ] Fluxo completo funciona
- [ ] Sem erros em console
- [ ] Dados persistem

### **8.2 Fluxo Completo: Artista**

**Cenário:** Cadastrar artista e criar projeto

**Passos:**
1. [ ] Navegar para `/artists`
2. [ ] Click "+ Novo Artista"
3. [ ] Preencher:
   - Nome: "Maria Silva"
   - Nome Artístico: "Mari Voz"
   - Gênero: "Pop"
4. [ ] Salvar
5. [ ] Verificar artista no grid
6. [ ] Click "Ver Detalhes"
7. [ ] Verificar todos os dados
8. [ ] Voltar para lista
9. [ ] Buscar "Mari"
10. [ ] Verificar filtro funciona
11. [ ] Criar projeto para este artista
12. [ ] Vincular no projeto (se implementado)
13. [ ] F5 (reload)
14. [ ] Verificar tudo persiste

**Resultado:**
- [ ] Fluxo completo funciona
- [ ] Busca funciona
- [ ] Dados persistem

### **8.3 Fluxo Completo: Calendar**

**Cenário:** Criar eventos e navegar

**Passos:**
1. [ ] Navegar para `/calendar`
2. [ ] Verificar mês atual
3. [ ] Criar evento hoje: "Reunião Staging"
4. [ ] Verificar evento aparece no dia
5. [ ] Navegar para mês anterior (←)
6. [ ] Verificar calendário mudou
7. [ ] Navegar para próximo mês (→)
8. [ ] Voltar para mês atual
9. [ ] Verificar evento ainda está lá
10. [ ] Criar evento semana que vem: "Review Beta"
11. [ ] Verificar 2 eventos na lista abaixo
12. [ ] F5 (reload)
13. [ ] Verificar ambos os eventos persistem

**Resultado:**
- [ ] Navegação funciona
- [ ] Eventos aparecem
- [ ] Persistência OK

---

## 🔒 SEÇÃO 9: SEGURANÇA

### **9.1 Headers de Segurança**
**Verificar no DevTools → Network → Headers:**

- [ ] `X-Frame-Options: DENY`
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-XSS-Protection: 1; mode=block`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Permissions-Policy` presente

### **9.2 SSL/TLS**
- [ ] HTTPS forçado (HTTP → HTTPS redirect)
- [ ] Certificado válido (não expirado)
- [ ] Sem warnings de mixed content
- [ ] Cadeado verde no navegador

### **9.3 Autenticação Supabase**
- [ ] JWT tokens são httpOnly (verificar)
- [ ] Refresh token funciona
- [ ] Logout limpa tokens
- [ ] RLS policies ativas no Supabase
- [ ] Sem dados sensíveis em localStorage

### **9.4 XSS e Injection**
**Testar inputs maliciosos:**

**Criar projeto com nome:**
```html
<script>alert('XSS')</script>
```
- [ ] Script não executa
- [ ] Texto escapa HTML

**Criar artista com nome:**
```html
<img src=x onerror=alert('XSS')>
```
- [ ] Imagem não renderiza
- [ ] Texto escapa HTML

---

## 📊 SEÇÃO 10: PERFORMANCE E MÉTRICAS

### **10.1 Lighthouse Audit**
**DevTools → Lighthouse → Run audit:**

| Categoria | Score | Status |
|-----------|-------|--------|
| Performance | > 80 | [ ] |
| Accessibility | > 90 | [ ] |
| Best Practices | > 90 | [ ] |
| SEO | > 80 | [ ] |

### **10.2 Core Web Vitals**

| Métrica | Target | Resultado | Status |
|---------|--------|-----------|--------|
| LCP (Largest Contentful Paint) | < 2.5s | ___s | [ ] |
| FID (First Input Delay) | < 100ms | ___ms | [ ] |
| CLS (Cumulative Layout Shift) | < 0.1 | ___ | [ ] |

### **10.3 Bundle Analysis**
```bash
# Verificar no Vercel/Netlify deployment logs
Total Bundle Size: ~407 KB
Gzipped: ~113 KB
```
- [ ] Bundle size < 500 KB
- [ ] Gzipped < 150 KB
- [ ] Code splitting ativo
- [ ] Lazy loading funcionando

### **10.4 Métricas de Carregamento**
**DevTools → Network → Reload (Cmd+R):**

- [ ] DOMContentLoaded < 2s
- [ ] Load event < 3s
- [ ] Finish (all resources) < 5s
- [ ] Total requests < 50

---

## ✅ SEÇÃO 11: APROVAÇÃO FINAL

### **11.1 Critérios de Aceitação**

| Critério | Target | Status |
|----------|--------|--------|
| URL acessível | 100% | [ ] |
| SSL válido | ✅ | [ ] |
| Login funciona | 100% | [ ] |
| Core features OK | 6/6 | [ ] |
| Telas brancas | 0 | [ ] |
| Console erros críticos | 0 | [ ] |
| Persistência | 100% | [ ] |
| Responsividade | ✅ | [ ] |
| Performance score | > 80 | [ ] |

### **11.2 Decisão**

**Staging está aprovado para testes beta?**

- [ ] ✅ **SIM** - Prosseguir para Fase Beta Testing
- [ ] ❌ **NÃO** - Corrigir problemas identificados

**Problemas Críticos Encontrados:**
```
[Listar aqui qualquer problema bloqueante]

1.
2.
3.
```

**Observações Adicionais:**
```
[Comentários, sugestões, melhorias]


```

---

## 📄 PRÓXIMO PASSO

**Se aprovado:**
- 📧 Enviar convites beta para 5 testers
- 📖 Distribuir `BETA_TESTING_GUIDE.md`
- 📊 Configurar monitoramento de logs
- 🎯 Iniciar coleta de feedback

**Se reprovado:**
- 🐛 Corrigir bugs críticos
- 🔄 Redeploy staging
- ✅ Executar checklist novamente

---

**Data de Preenchimento:** ___/___/2025
**Responsável:** _______________
**Status:** [ ] APROVADO / [ ] REPROVADO

---

**FIM DO CHECKLIST DE VALIDAÇÃO STAGING**
