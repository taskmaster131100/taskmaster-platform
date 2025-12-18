# 📄 UPLOAD DE PROJETO COM IA - GUIA DE USO

**Versão:** 1.0.0-mvp
**Data:** 20 de Novembro de 2025
**Status:** ✅ FUNCIONAL (Sprint 1 completo)

---

## 🎯 O QUE É ESTE RECURSO?

Permite que você **anexe um arquivo de projeto** (Word, bloco de notas, etc.) e a **IA do TaskMaster automaticamente:**
- Identifica fases do projeto
- Extrai tarefas mencionadas
- Organiza tudo em um planejamento estruturado
- Permite revisar e ajustar antes de salvar

**Benefício:** Transforme seu projeto em texto em um planejamento executável em minutos!

---

## 📍 ONDE ENCONTRAR

1. Faça login no TaskMaster
2. Navegue para: **`/planejamento/dashboard`** (ou clique em "Planejamento" no menu)
3. Procure o botão verde **"Anexar Projeto"** no canto superior direito
4. Está ao lado do botão azul "Novo Planejamento"

---

## 📝 PASSO A PASSO DE USO

### **PASSO 1: Preparar seu projeto em texto**

Crie um arquivo de texto (.txt) com seu projeto. Exemplo:

```
Projeto: Lançamento do EP "Sabor do Samba"
Artista: João da Silva

Objetivo: Gravar e lançar um EP com 5 músicas autorais de samba,
com lançamento previsto para março de 2026.

Músicas do EP:
1. Meu Samba de Raiz
2. Batuque na Cozinha
3. Samba do Amor
4. Roda de Malandro
5. Pagode da Madrugada

Fases do Projeto:

PRÉ-PRODUÇÃO (Janeiro 2026)
- Escolher repertório final
- Contratar produtor musical
- Definir orçamento total
- Montar equipe (estúdio, músicos, engenheiro)

GRAVAÇÃO (Fevereiro 2026)
- Gravar todas as 5 faixas
- Mixagem e masterização
- Aprovar versões finais

MARKETING (Fevereiro-Março 2026)
- Criar artes para redes sociais
- Gravar clipe da música principal
- Agendar entrevistas em podcasts
- Fazer campanha de pré-save

LANÇAMENTO (15 de Março 2026)
- Disponibilizar em todas as plataformas (Spotify, Deezer, etc)
- Show de lançamento no Bar do João
- Live no Instagram

PÓS-LANÇAMENTO (Março-Abril 2026)
- Monitorar métricas (streams, engajamento)
- Criar relatório de performance
- Planejar próximos singles
```

**Dicas para melhor resultado:**
- Seja específico nas tarefas
- Mencione datas quando souber ("Lançamento em 15 de março")
- Liste as músicas claramente
- Divida em fases lógicas

---

### **PASSO 2: Fazer Upload**

1. Clique no botão **"Anexar Projeto"** (verde, canto superior direito)
2. Modal de upload abre

**Você pode:**
- **Arrastar e soltar** o arquivo na área indicada
- **Clicar em "Selecionar Arquivo"** e escolher manualmente

**Tipos aceitos (MVP):**
- ✅ `.txt` - Arquivo de texto simples
- ⏳ `.md` - Markdown (funciona como .txt)
- ⏳ `.docx` - Word (em breve, Sprint 2)
- ⏳ `.pdf` - PDF (em breve, Sprint 2)

**Tamanho máximo:** 10MB

---

### **PASSO 3: Processar com IA**

1. Arquivo aparece listado
2. Leia a caixa amarela:
   - "A IA lerá seu projeto e identificará fases e tarefas"
   - "Você poderá revisar antes de salvar"
   - "Nada será criado automaticamente sem sua confirmação"
3. Clique em **"Processar com IA"**
4. Aguarde 5-15 segundos enquanto a IA processa

**Com OpenAI API configurada:**
- IA lê o texto completo
- Identifica fases, tarefas, prioridades
- Sugere datas baseadas no contexto

**Sem OpenAI API (fallback):**
- Sistema gera estrutura básica
- Você pode ajustar manualmente depois

---

### **PASSO 4: Revisar Pré-Visualização**

**Tela de Preview mostra:**
- Nome do projeto (IA extrai do texto)
- Descrição resumida
- Todas as fases sugeridas
- Todas as tarefas dentro de cada fase

**Você pode:**
- ✅ **Marcar/Desmarcar fases inteiras** (checkbox ao lado do nome da fase)
- ✅ **Marcar/Desmarcar tarefas individuais** (checkbox em cada tarefa)
- ✅ **Ver detalhes:** prioridade, tipo de módulo, prazo

**Exemplo de fase sugerida:**
```
📆 Pré-Produção
   🟣 Cor roxa
   📅 2025-11-20 → 2025-12-20
   📋 3 tarefas

   ✅ Revisar projeto completo
      Descrição: Analisar documento e validar informações
      Módulo: general | Prioridade: high | Prazo: 2025-11-27

   ✅ Montar equipe de produção
      Descrição: Contratar profissionais necessários
      Módulo: general | Prioridade: high | Prazo: 2025-12-04
```

**Módulos disponíveis:**
- `content` - Gravação, produção, vídeos
- `shows` - Shows, eventos, turnês
- `communication` - Marketing, mídia, redes sociais
- `analysis` - Análise de dados
- `kpis` - Indicadores e metas
- `finance` - Orçamento e custos
- `general` - Tarefas gerais

---

### **PASSO 5: Confirmar e Criar**

1. Revise tudo
2. Ajuste seleções se necessário
3. Veja o resumo:
   - **X fases selecionadas**
   - **Y tarefas selecionadas**
4. Clique em **"Confirmar e Criar Planejamento"**
5. Toast verde: "Planejamento criado com sucesso!"

**O que foi criado:**
- ✅ Planejamento salvo como **rascunho** em `plannings`
- ✅ Fases organizadas em ordem em `planning_phases`
- ✅ Arquivo original salvo em `planning_attachments`
- ✅ Log de auditoria em `planning_logs`
- ✅ Tarefas prontas para distribuir aos módulos

---

## 🔄 O QUE ACONTECE DEPOIS?

### **Planejamento criado, e agora?**

1. **Voltar para PlanningDashboard**
   - Seu planejamento aparece na lista
   - Status: "Rascunho"
   - Tipo: "TXT Importado"

2. **Abrir detalhes do planejamento**
   - Clique no card do planejamento
   - Veja timeline visual
   - Veja todas as fases e tarefas

3. **Distribuir tarefas para módulos** (em breve)
   - Botão "Distribuir Tarefas"
   - Cria automaticamente:
     - Tarefas no TaskBoard
     - Eventos no Calendar
     - Metas em KPIs

4. **Editar e ajustar**
   - Adicionar/remover fases
   - Editar tarefas
   - Mudar datas
   - Atualizar status

---

## ❌ TRATAMENTO DE ERROS

### **"Tipo de arquivo não suportado"**
- Você tentou enviar .docx ou .pdf (Sprint 2)
- **Solução:** Use .txt por enquanto

### **"Arquivo muito grande"**
- Máximo: 10MB
- **Solução:** Reduza o tamanho do texto ou divida em partes

### **"Arquivo vazio ou muito curto"**
- Arquivo tem menos de 10 caracteres
- **Solução:** Escreva mais detalhes no projeto

### **"Erro ao processar arquivo"**
- Problema na leitura ou IA
- **Solução:** Toast vermelho aparece, tente novamente

### **"Erro ao criar planejamento"**
- Problema no banco de dados
- **Solução:** Toast vermelho, verifique conexão

**IMPORTANTE:** Nenhum erro causa tela branca. Sempre há feedback visual (toast).

---

## 🧪 COMO TESTAR (BETA TESTERS)

### **Teste Básico:**
1. Crie um arquivo `projeto-teste.txt`:
```
Projeto Teste Beta
Lançar uma música single em dezembro.

Tarefas:
- Gravar música
- Fazer arte de capa
- Enviar para distribuição
```
2. Vá em Planejamento
3. Clique "Anexar Projeto"
4. Envie o arquivo
5. Processe com IA
6. Revise preview
7. Confirme

**Resultado esperado:**
- Planejamento criado
- Pelo menos 1 fase
- Pelo menos 3 tarefas
- Toast verde de sucesso

---

### **Teste Sem IA (Fallback):**
1. Mesmo processo acima
2. Se não tiver OpenAI API key configurada
3. Sistema usa fallback mock
4. Estrutura básica é criada

**Resultado esperado:**
- Planejamento criado mesmo sem IA
- Fases genéricas (Pré-Produção, Produção, Lançamento)
- Você ajusta manualmente depois

---

### **Teste de Erro:**
1. Tente enviar .docx ou .pdf
2. **Esperado:** Toast vermelho "Tipo não suportado"
3. Tente enviar arquivo > 10MB
4. **Esperado:** Toast vermelho "Arquivo muito grande"

---

## 📊 LIMITAÇÕES CONHECIDAS (MVP)

### ⚠️ **Sprint 1 (Atual):**
- ✅ Aceita apenas `.txt` e `.md`
- ❌ `.docx` e `.pdf` virão no Sprint 2
- ✅ IA processa texto em português
- ✅ Fallback funciona sem IA
- ⚠️ Tarefas não são criadas automaticamente no TaskBoard (você distribui depois)

### 🔮 **Sprint 2 (Em breve):**
- ⏳ Suporte `.docx` (Word)
- ⏳ Suporte `.pdf`
- ⏳ Leitura de tabelas e formatação
- ⏳ Extração melhorada de datas

### 🔮 **Sprint 3 (Futuro):**
- ⏳ Drag & drop melhorado
- ⏳ Preview do arquivo antes de processar
- ⏳ Edição inline na pré-visualização
- ⏳ Múltiplos arquivos por planejamento

---

## 🐛 BUGS CONHECIDOS

**Nenhum bug crítico identificado no MVP.**

Se encontrar algo, reporte:
- Widget de feedback (canto inferior direito)
- Email: [SEU-EMAIL]

---

## 📈 MÉTRICAS DE SUCESSO

**Para considerar o MVP um sucesso, precisamos ver:**
- ✅ 80%+ dos uploads processam sem erro
- ✅ IA identifica pelo menos 70% das tarefas mencionadas
- ✅ Usuários confirmam (não cancelam) 80%+ dos previews
- ✅ Feedback positivo sobre tempo economizado

---

## 💡 CASOS DE USO REAIS

### **1. Produtor Musical**
"Tenho um projeto de EP no Word. Copiei para .txt, subi no TaskMaster, a IA identificou todas as 15 tarefas que eu tinha escrito. Revisei, confirmei, e em 2 minutos tinha meu planejamento estruturado!"

### **2. Artista Indie**
"Escrevo meus planos em bloco de notas. Agora só subo direto no TaskMaster. A IA até sugere prioridades que eu não tinha pensado."

### **3. Gestor de Carreira**
"Trabalho com 3 artistas. Tenho projetos em Word de cada um. Transformo tudo em planejamento no TaskMaster e gerencio tudo centralizado."

---

## 🎓 VÍDEO TUTORIAL (EM BREVE)

⏳ Tutorial em vídeo mostrando passo a passo será disponibilizado em breve.

---

## 🚀 ROADMAP

**Sprint 1 (Atual):** ✅ Upload .txt + IA + Preview
**Sprint 2 (Próximo):** ⏳ Suporte .docx e .pdf (2-3 dias)
**Sprint 3:** ⏳ UX melhorado (1 dia)
**Sprint 4:** ⏳ Distribuição automática para TaskBoard/Calendar (2 dias)

---

## 📞 SUPORTE

**Problemas? Dúvidas?**
- Widget de Feedback no app
- Email: [SEU-EMAIL]
- WhatsApp: [SEU-WHATSAPP]

---

**Última atualização:** 20/11/2025
**Versão:** 1.0.0-mvp (Sprint 1 completo)
**Status:** ✅ FUNCIONAL EM BETA
