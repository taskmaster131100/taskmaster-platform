# 🔧 SPRINT DE CORREÇÕES DO BETA - PLANO COMPLETO

**Data:** 21 de Novembro de 2025
**Objetivo:** Corrigir bugs críticos e ajustes de UX para operacionalização real

---

## 📋 PROBLEMAS IDENTIFICADOS (9 PONTOS)

### ✅ **PRIORIDADE CRÍTICA**

#### 1️⃣ **Biblioteca - Erro React #306**
**Status:** 🔴 CRÍTICO - Página quebrada
**Causa identificada:** Lazy loading com Suspense boundary faltando
**Solução:**
- Adicionar ErrorBoundary específico para FileLibrary
- Garantir que Suspense boundary existe no App.tsx
- Verificar RLS da tabela `file_library` e bucket `files`

#### 2️⃣ **Planejamento - Botão "Gerar Plano" não funciona**
**Status:** 🟠 ALTO - Feature principal quebrada
**Causa provável:** Service de IA não configurado em produção
**Solução:**
- Verificar se `planningAI.ts` está funcionando
- Adicionar loading states adequados
- Fallback caso IA falhe

---

### 🟡 **PRIORIDADE ALTA**

#### 3️⃣ **Planejamento - Botão "Anexar Projeto" não aparece**
**Status:** ✅ JÁ EXISTE - Precisa apenas ser mais visível
**Observação:** O botão "Anexar Projeto" JÁ ESTÁ implementado na linha 364-370 do PlanningDashboard.tsx
**Solução:**
- Deixar botão mais destacado visualmente
- Adicionar tooltip explicativo

#### 4️⃣ **Cadastro - Fluxo de confirmação de e-mail**
**Status:** 🟡 IMPORTANTE - Segurança e experiência
**Solução:**
- Configurar Auth do Supabase para exigir confirmação
- Criar template de e-mail com branding TaskMaster
- Página de "Aguardando confirmação"

---

### 🟢 **PRIORIDADE MÉDIA**

#### 5️⃣ **Layout - Menu lateral fixo (sem collapse)**
**Status:** 🟢 UX Enhancement
**Solução:**
- Adicionar estado `collapsed` no MainLayout
- Botão de toggle no header
- Salvar preferência no localStorage
- Animações suaves de transição

#### 6️⃣ **Cadastro de Artista - Gêneros limitados**
**Status:** 🟢 UX Enhancement
**Solução atual:** Pop, Rock, Hip Hop, MPB, Sertanejo
**Solução:**
- Adicionar: Samba, Pagode, Funk, Eletrônica, Jazz, Blues, Reggae, Country
- Campo "Outro" com input text livre
- (Futuro) Sistema País + Gênero

#### 7️⃣ **Cadastro de Artista - Fluxo pós-criação**
**Status:** 🟢 UX Enhancement
**Problema atual:** Modal fecha, lista não atualiza
**Solução:**
- Após salvar: atualizar lista automaticamente
- Opção de redirecionar para página de detalhes do artista
- Página de detalhes com campos adicionais:
  - Tipo de contrato (prestador, exclusivo, percentual)
  - Datas início/fim
  - Redes sociais
  - Contatos principais
  - Release/Bio
  - Foto/Thumbnail
  - Observações internas

#### 8️⃣ **Dashboard - Cards não clicáveis**
**Status:** 🟢 UX Enhancement
**Solução:**
- Artistas → `/artistas`
- Projetos → `/projetos`
- Faturamento → `/relatorios` (filtro financeiro)
- Próximos Shows → `/shows`
- Nome do artista → Página de detalhes

#### 9️⃣ **Relatórios - Exportação com window.print()**
**Status:** 🟢 Feature Enhancement
**Problema atual:** Exporta tela inteira com sidebar
**Solução:**
- Modal de escolha antes de exportar:
  - **Tipo de relatório:** Produtividade, Financeiro, Lançamentos, Shows, Turnê, Geral por Artista
  - **Período:** Últimos 7 dias, 30 dias, Período personalizado
  - **Formato:** PDF, Excel, CSV
- PDF limpo sem UI da aplicação
- Biblioteca: `jspdf` + `jspdf-autotable` (já é leve)

#### 🔟 **Produção Musical - Sem botões de criação**
**Status:** 🟢 Feature MVP
**Problema atual:** Tabs existem mas sem ações
**Solução:**
- Tab Repertório: Botão "Nova Música" → Modal simples (nome, artista, observações)
- Tab Arranjos: Botão "Novo Arranjo" → Modal simples
- Tab Ensaios: Botão "Novo Ensaio" → Modal com data/hora
- Tab Setlists: Botão "Novo Setlist" → Modal simples
- Listagem básica do cadastrado

---

## 🎯 ORDEM DE IMPLEMENTAÇÃO

### **FASE 1 - BUGS CRÍTICOS** (Hoje)
1. ✅ Biblioteca (React error #306)
2. ✅ Planejamento - Gerar Plano

### **FASE 2 - UX ESSENCIAL** (Hoje)
3. ✅ Dashboard clicável
4. ✅ Cadastro artista - Gêneros + Fluxo
5. ✅ Menu lateral collapse

### **FASE 3 - FEATURES FALTANTES** (Amanhã)
6. ✅ Produção Musical MVP
7. ✅ Relatórios - Exportação
8. ✅ Cadastro - E-mail confirmation

---

## 📝 CHECKLIST DE VALIDAÇÃO

Antes de chamar concluído, testar:

- [ ] Biblioteca carrega sem erros
- [ ] Upload de arquivo funciona
- [ ] Download de arquivo funciona
- [ ] Planejamento - Gerar Plano funciona
- [ ] Planejamento - Anexar Projeto funciona
- [ ] Cadastro de artista atualiza lista
- [ ] Gêneros musicais expandidos
- [ ] Dashboard todos os cards clicáveis
- [ ] Menu lateral colapsa/expande
- [ ] Produção Musical - Criar música
- [ ] Produção Musical - Listar músicas
- [ ] Relatórios - Modal de exportação
- [ ] Build passa sem erros
- [ ] Deploy em staging funciona

---

## 🚀 RESULTADO ESPERADO

Após este sprint:
- ✅ Zero bugs críticos
- ✅ UX refinada para uso real
- ✅ Todos os módulos funcionais
- ✅ Plataforma 100% operacional para artistas reais

---

**Próximo passo:** Abrir beta para mais artistas com confiança! 🎸🎤

