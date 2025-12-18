# TaskMaster - Especificação Funcional

**Versão:** 1.0.0-beta
**Data:** 22 de outubro de 2025
**Target Go-Live:** 01 de novembro de 2025

---

## 📋 Visão Geral do Produto

TaskMaster é uma plataforma completa de gestão para artistas e produtores musicais, integrando produção musical, gestão de projetos, CRM, comunicação e financeiro em uma única solução moderna e intuitiva.

### Proposta de Valor
- **Para Artistas:** Organize shows, gerencia equipe, controle financeiro
- **Para Produtores Musicais:** Repertório, arranjos, setlists, modo palco
- **Para Equipes:** Colaboração, aprovações, comunicação centralizada

---

## 👥 Personas e Papéis

### 1. Owner (Proprietário)
- Cria e gerencia organização
- Controla billing e assinaturas
- Acesso total a todos os módulos
- Gerencia membros e permissões

### 2. Admin (Administrador)
- Gerencia artistas e projetos
- Aprova orçamentos e contratos
- Configura templates e automações
- Visualiza relatórios completos

### 3. Manager (Gerente de Projeto)
- Cria e gerencia projetos
- Atribui tarefas
- Acompanha progresso
- Comunica com equipe

### 4. Musician (Músico)
- Acessa repertório e setlists
- Visualiza agenda de ensaios
- Modo palco (Stage Mode)
- Submete feedback

### 5. Guest (Convidado)
- Acesso read-only via link compartilhado
- Visualiza projetos específicos
- Sem permissão de edição

---

## 🎨 Módulos Funcionais

---

## 1️⃣ Autenticação e Onboarding

### 1.1 Registro (/register)

**Fluxo:**
1. Usuário acessa página de registro
2. Preenche: nome, email, senha, idioma (PT/EN/ES)
3. ⚠️ **Beta:** Requer código de convite válido
4. Sistema valida invite code (max_uses, expires_at)
5. Cria conta + organização automática
6. Envia email de boas-vindas (opcional)
7. Redireciona para onboarding

**Validações:**
- Email único no sistema
- Senha mínima 8 caracteres
- Invite code válido e não expirado
- Nome obrigatório

**Estados:**
- ✅ Loading (enviando dados)
- ✅ Success (conta criada)
- ❌ Error (email já existe, invite inválido)

### 1.2 Login (/login)

**Fluxo:**
1. Usuário insere email e senha
2. Sistema valida credenciais
3. Gera JWT token (7 dias validade)
4. Carrega dados da organização
5. Redireciona para última página ou dashboard

**Features:**
- ✅ "Lembrar de mim" (30 dias)
- ✅ Link "Esqueci minha senha"
- ✅ Suporte multi-idioma
- ⏳ 2FA (planejado)

### 1.3 Recuperação de Senha (/reset-password)

**Fluxo:**
1. Usuário insere email
2. Sistema envia link de reset
3. Link válido por 1 hora
4. Usuário define nova senha
5. Redireciona para login

### 1.4 Onboarding Interativo

**Slides:**
1. **Boas-vindas** - Logo + mensagem personalizada
2. **4 Pilares** - Planejamento, Colaboração, Automação, Insights
3. **Funcionalidades** - Tour rápido dos módulos
4. **Configuração Inicial** - Nome da organização, timezone
5. **Call to Action** - "Criar Primeiro Projeto"

**Características:**
- ✅ Aparece apenas no primeiro login
- ✅ Pode ser pulado (botão "Skip")
- ✅ Navegação por slides (Anterior/Próximo)
- ✅ Salva progresso em localStorage

### 1.5 Welcome Modal (Retorno)

**Quando:**
- Aparece para usuários que já completaram onboarding
- Uma vez por dia no primeiro acesso

**Conteúdo:**
- Mensagem de boas-vindas personalizada
- Resumo de atividades pendentes
- Tarefas atrasadas (se houver)
- Aprovações pendentes
- Botão "Começar o Dia"

---

## 2️⃣ Gestão de Organizações

### 2.1 Criar Organização

**Fluxo:**
- Criada automaticamente no registro
- Owner é o criador
- Pode criar múltiplas organizações (plano Enterprise)

**Dados:**
- Nome
- Timezone
- Moeda padrão (BRL, USD, EUR)
- Logo (upload)
- Configurações de notificação

### 2.2 Convidar Membros

**Fluxo:**
1. Owner/Admin gera invite code
2. Define: papel (role), validade, max_uses
3. Compartilha código
4. Novo membro registra com código
5. Auto-associa à organização

**Papéis Disponíveis:**
- Owner (apenas 1 por org)
- Admin (ilimitado)
- Manager (ilimitado)
- Musician (limite por plano)
- Guest (temporário)

### 2.3 Gerenciar Membros

**Ações:**
- Visualizar lista de membros
- Alterar papel (role)
- Remover membro
- Suspender acesso
- Ver histórico de atividades

---

## 3️⃣ Gestão de Artistas

### 3.1 Cadastro de Artistas

**Dados:**
- Nome artístico
- Nome real (opcional)
- Bio
- Gênero musical
- Foto/Logo
- Links sociais (Instagram, YouTube, Spotify)
- Contrato vigente (upload PDF)
- Data de início/término de contrato

**Features:**
- ✅ CRUD completo
- ✅ Upload de documentos
- ✅ Histórico de projetos
- ⏳ Integração com Spotify API (buscar metadados)

### 3.2 Dashboard do Artista

**Visualizações:**
- Projetos ativos
- Próximos shows
- Tarefas pendentes
- Financeiro (receitas, despesas)
- KPIs (streams, engajamento)

**Filtros:**
- Por período (7d, 30d, 90d, ano)
- Por status (ativo, concluído, cancelado)
- Por tipo de projeto

---

## 4️⃣ Gestão de Projetos

### 4.1 Criar Projeto

**Métodos:**
1. **Do Zero:** Formulário manual
2. **De Template:** Seleciona template (DVD, Tour, Lançamento)
3. **Com IA Copilot:** Gera projeto com GPT-4o-mini

**Dados Essenciais:**
- Nome do projeto
- Artista associado
- Data de início/término
- Orçamento total
- Descrição/Objetivos
- Tags

### 4.2 Templates de Projeto

**Templates Incluídos:**
- **DVD (D-120):** 120 dias de pré-produção
- **Tour (D-90):** Planejamento de turnê
- **Lançamento (D-45):** Single/EP/Album
- **Show (D-30):** Show individual

**Estrutura do Template:**
- Fases (Pré, Produção, Pós)
- Tarefas padrão com prazos relativos
- Checklists
- Documentos necessários
- Aprovações obrigatórias

### 4.3 Planejamento com IA (Planning Copilot)

**Fluxo:**
1. Usuário descreve projeto em texto livre
2. GPT-4o-mini analisa e sugere:
   - Fases do projeto
   - Tarefas por fase
   - Prazos (D-120, D-90, D-45, D-30, D-7, D-1)
   - Dependências
   - Recursos necessários
3. Usuário revisa e edita
4. Sistema cria projeto completo

**Cache:**
- Respostas cacheadas localmente (90 dias)
- Reduz custos de API
- Sincroniza entre sessões

### 4.4 Gestão de Tarefas

**Criação de Tarefa:**
- Título
- Descrição (markdown)
- Assignee (responsável)
- Prioridade (Baixa, Média, Alta, Urgente)
- Status (To Do, In Progress, Review, Done)
- Data de vencimento
- Tags
- Anexos

**Quadro Kanban:**
- ✅ Drag & drop entre colunas
- ✅ Filtros (assignee, prioridade, tags)
- ✅ Busca
- ✅ Agrupamento por projeto/artista

**Dependências:**
- Tarefa A depende de Tarefa B
- Bloqueia início até conclusão da dependência
- Visualização gráfica (grafo)

**Notificações:**
- Tarefa atribuída
- Vencimento em 24h
- Tarefa atrasada (D+1, D+3, D+7)
- Comentário/menção

---

## 5️⃣ Sistema de Aprovações

### 5.1 Criar Aprovação

**Tipos de Aprovação:**
- Orçamento (>R$5.000)
- Contrato (qualquer valor)
- Conteúdo (post, vídeo)
- Técnico (rider, stage plot)
- Arranjo musical
- Setlist

**Workflow:**
1. Solicitante cria aprovação
2. Define aprovadores (1-5 pessoas)
3. Sistema notifica aprovadores
4. Cada aprovador: Aprovar / Rejeitar / Solicitar Mudanças
5. Quórum: maioria simples (>50%)
6. Resultado final notificado

**Estados:**
- 🟡 Pendente
- 🔵 Em Revisão
- ✅ Aprovado
- ❌ Rejeitado
- 🟠 Mudanças Solicitadas

### 5.2 Histórico de Aprovações

- Linha do tempo completa
- Comentários de aprovadores
- Versões do documento
- Auditoria (quem aprovou/rejeitou quando)

---

## 6️⃣ Produção Musical

### 6.1 Biblioteca de Músicas (Songs)

**Cadastro de Música:**
- Título
- Artista original
- Tom original
- BPM
- Compasso (4/4, 3/4, etc.)
- Estrutura (Intro, Verso, Refrão, etc.)
- Letra completa
- Cifra/Acordes
- Gênero
- Idioma
- Duração

**Assets:**
- PDF (partitura)
- MusicXML
- MIDI
- Áudio de referência
- Vídeo

**Versionamento:**
- Cada upload cria nova versão
- Histórico completo
- Aprovação por versão

### 6.2 Arranjos (Arrangements)

**Criar Arranjo:**
- Baseado em música existente
- Versão (1.0, 1.1, 2.0)
- Título do arranjo
- Descrição
- Arranjador
- Status (Draft, Review, Approved, Rejected)

**Partes Individuais:**
- Por instrumento (Voz, Guitarra, Baixo, Bateria, Teclado)
- Transposição automática
- PDF individual por parte
- Anotações específicas

**Workflow de Aprovação:**
1. Arranjador submete arranjo
2. Líder musical revisa
3. Aprova ou solicita mudanças
4. Aprovado → disponível para ensaios

### 6.3 Ensaios (Rehearsals)

**Agendamento:**
- Data/hora
- Local
- Duração
- Pauta (músicas a ensaiar)
- Músicos convocados
- Materiais necessários

**Presença:**
- Check-in automático (GPS)
- Marcação manual (Admin)
- Relatório de faltas

**Anotações:**
- Por música ensaiada
- Problemas/ajustes necessários
- Próximos passos

### 6.4 Setlists

**Criar Setlist:**
- Nome do show/evento
- Data do show
- Local
- Duração total prevista
- Músicas (drag & drop para ordenar)

**Configurações por Música:**
- Tom (pode ser diferente do original)
- Tempo (BPM ajustado)
- Observações (intro especial, solo estendido)
- Responsável pela intro

**Trava de Setlist (D-1):**
- 24h antes do show, setlist é travada
- Não permite mais edições (exceto Admin)
- Cache offline completo gerado
- Notificação para todos os músicos

**Estatísticas:**
- Duração total
- Distribuição por gênero
- Músicas mais tocadas
- Últimas inclusões

### 6.5 Stage Mode (Modo Palco)

**Acesso:**
- QR code gerado por setlist
- Link temporário (válido por 7 dias)
- Não requer login (para músicos convidados)

**Funcionalidades:**
- ✅ Visualização de setlist completo
- ✅ Música atual destacada
- ✅ Próximas 3 músicas visíveis
- ✅ Letra + cifra em tela cheia
- ✅ Navegação por gestos (swipe)
- ✅ Modo offline (após download)
- ✅ Anotações rápidas

**Layout:**
- Responsivo (mobile-first)
- Dark mode (padrão para palco)
- Tamanho de fonte ajustável
- Scroll automático (opcional)

**Sincronização:**
- Admin controla posição atual
- Todos os músicos veem em tempo real
- Funciona offline (última posição cacheada)

### 6.6 Documentos Técnicos (Stage Docs)

**Tipos:**
- Stage Plot (planta do palco)
- Patch List (lista de conexões)
- Input List (lista de entradas)
- Mic Map (mapa de microfones)
- Rider Técnico

**Features:**
- Upload de PDF
- Versionamento
- Compartilhamento via link
- Template por tipo de evento

---

## 7️⃣ Financeiro (Básico)

### 7.1 Receitas

**Fontes:**
- Show / Evento
- Streaming
- Venda física
- Merchandise
- Licenciamento

**Dados:**
- Valor
- Data
- Fonte
- Projeto associado
- Observações
- Anexo (comprovante)

### 7.2 Despesas

**Categorias:**
- Produção
- Marketing
- Transporte
- Hospedagem
- Alimentação
- Equipamento
- Cachê (músicos/técnicos)

**Workflow:**
- Criação de despesa
- Aprovação (se >R$1.000)
- Comprovante obrigatório
- Categorização

### 7.3 Relatórios

**Visualizações:**
- Receitas vs. Despesas (mensal)
- Lucro por projeto
- Despesas por categoria
- Projeção de fluxo de caixa

**Exportação:**
- PDF
- Excel/CSV
- Google Sheets (integração)

---

## 8️⃣ CRM de Leads (Básico)

### 8.1 Cadastro de Contatos

**Dados:**
- Nome
- Email
- Telefone
- Empresa/Local
- Tipo (produtor, casa de show, festival)
- Tags
- Notas

### 8.2 Pipeline de Vendas

**Estágios:**
1. Prospecção
2. Contato Inicial
3. Proposta Enviada
4. Negociação
5. Fechado (Ganho)
6. Fechado (Perdido)

**Movimentação:**
- Drag & drop entre estágios
- Anotação de motivo ao mover
- Data de cada movimentação

### 8.3 Propostas

**Criar Proposta:**
- Template base (PDF)
- Preencher: cliente, valores, datas, escopo
- Gerar PDF final
- Enviar por email
- Rastreamento de visualizações

### 8.4 Follow-ups Automatizados

**Regras:**
- D+2: "Viu nossa proposta?"
- D+7: "Alguma dúvida?"
- D+14: "Ainda tem interesse?"

**Canais:**
- WhatsApp (preferencial)
- Email (fallback)
- SMS (emergencial)

### 8.5 Relatório de Conversão

**Métricas:**
- Taxa de conversão por estágio
- Tempo médio no pipeline
- Ticket médio
- Receita prevista vs. realizada

---

## 9️⃣ Comunicação Automatizada

### 9.1 WhatsApp Business

**Casos de Uso:**
- Notificação de tarefa atribuída
- Lembrete de tarefa vencendo
- Alerta de tarefa atrasada
- Convocação de ensaio
- Lembrete de show (D-1)
- Confirmação de presença
- Follow-up de proposta

**Templates:**
- Pré-aprovados pela Meta
- Variáveis dinâmicas (nome, data, etc.)
- Botões de ação (Confirmar, Ver Detalhes)

**Status:**
- Enviado
- Entregue
- Lido
- Respondido
- Falhou

### 9.2 Email

**Funcionalidade:**
- Fallback quando WhatsApp falhar
- Emails transacionais (senhas, convites)
- Newsletters (opcional)
- Relatórios semanais

**Provider:**
- SendGrid (planejado)
- SMTP padrão (alternativa)

### 9.3 Fila de Envios

**Características:**
- Retry automático (3 tentativas)
- Priorização (urgente > normal > baixa)
- Rate limiting (respeita limites da API)
- Log completo de envios

---

## 🔟 Relatórios e KPIs

### 10.1 Dashboard Executivo

**Métricas Principais:**
- Projetos ativos vs. concluídos
- Tarefas concluídas (vs. meta)
- Taxa de aprovação (%)
- Receita mensal (vs. meta)
- Custos por projeto
- ROI por artista

**Gráficos:**
- Linha: receita/despesas ao longo do tempo
- Barra: projetos por status
- Pizza: despesas por categoria
- Funil: pipeline de vendas

### 10.2 Relatório de Produtividade

**Individual:**
- Tarefas concluídas
- Tempo médio por tarefa
- Taxa de entrega no prazo
- Aprovações dadas/recebidas

**Equipe:**
- Tarefas por membro
- Gargalos (tarefas travadas)
- Projetos atrasados
- Ensaios realizados vs. planejados

### 10.3 Relatório Musical

**Repertório:**
- Músicas cadastradas
- Arranjos aprovados
- Setlists criadas
- Shows realizados

**Ensaios:**
- Frequência média
- Faltas por músico
- Músicas mais ensaiadas
- Tempo total de ensaio

---

## 1️⃣1️⃣ Configurações e Preferências

### 11.1 Perfil do Usuário

**Dados:**
- Foto de perfil
- Nome completo
- Email (não editável)
- Telefone
- Timezone
- Idioma (PT, EN, ES)
- Biografia

### 11.2 Notificações

**Preferências:**
- Email: Sim/Não
- WhatsApp: Sim/Não
- Push: Sim/Não
- Frequência: Imediato / Diário / Semanal

**Tipos:**
- Tarefas
- Aprovações
- Financeiro
- Ensaios
- Shows

### 11.3 Integrações

**Disponíveis:**
- ✅ Google Calendar (planejado)
- ✅ Spotify (planejado)
- ⏳ Trello (importação)
- ⏳ Notion (importação)

---

## 1️⃣2️⃣ Beta Testing

### 12.1 Feedback Widget

**Localização:**
- Botão flutuante (canto inferior direito)
- Disponível em todas as páginas

**Formulário:**
- Área (Login, Projetos, Música, etc.)
- Severidade (Baixa, Média, Alta)
- Mensagem (texto livre)
- Screenshot (automático)

**Resposta:**
- Confirmação imediata
- Email com número de ticket
- Resposta em até 48h

### 12.2 Beta Dashboard

**Métricas:**
- Usuários beta ativos
- Feedbacks recebidos
- Bugs críticos abertos
- Taxa de conclusão de onboarding
- Features mais usadas

**Acesso:**
- Apenas Admin/Owner
- Rota: /beta-dashboard

---

## 🎯 Casos de Uso Principais

### Caso 1: Planejar DVD com IA
1. Manager acessa "Planning Copilot"
2. Descreve: "DVD ao vivo em novembro, orçamento R$500k"
3. IA sugere projeto D-120 com 47 tarefas
4. Manager revisa, ajusta prazos
5. Sistema cria projeto completo
6. Notifica equipe automaticamente

### Caso 2: Aprovar Orçamento
1. Manager solicita R$15k para locação
2. Sistema notifica Admin por WhatsApp
3. Admin abre app, revisa detalhes
4. Aprova ou rejeita com comentário
5. Manager recebe notificação
6. Auditoria registra decisão

### Caso 3: Travar Setlist D-1
1. Sistema detecta show em 24h
2. Valida setlist completo (músicas, PDFs)
3. Trava setlist (read-only)
4. Gera QR codes de acesso
5. Cache offline criado
6. Notifica músicos: "Setlist pronto, baixe offline"

### Caso 4: Stage Mode no Show
1. Músico abre link via QR code
2. Stage Mode carrega (offline)
3. Líder avança músicas no app admin
4. Todos veem mudança em tempo real
5. Músico anota observação rápida
6. Pós-show, anotações sincronizam

### Caso 5: Follow-up CRM
1. Proposta enviada D+0
2. D+2: Sistema envia WhatsApp automático
3. Cliente não responde
4. D+7: Novo follow-up automático
5. Cliente responde "preciso mais tempo"
6. Manager marca "Negociação" manualmente
7. Sistema agenda novo follow-up D+14

---

## 📊 Métricas de Sucesso (Go-Live)

### Adoção
- **Target:** 50 usuários ativos (primeiros 30 dias)
- **Métrica:** DAU (Daily Active Users)

### Engajamento
- **Target:** 70% de taxa de conclusão de onboarding
- **Métrica:** Onboarding completions / Signups

### Funcionalidade
- **Target:** 80% dos projetos criados com templates
- **Métrica:** Template usage rate

### Satisfação
- **Target:** NPS ≥ 50
- **Métrica:** Pesquisa quinzenal

### Performance
- **Target:** 95% de disponibilidade
- **Métrica:** Uptime monitoring

---

## 🚫 Fora do Escopo (Go-Live)

- Integrações com redes sociais (Instagram, TikTok)
- Integração com DSPs (Spotify, Apple Music)
- Planos e billing (funcionalidade completa)
- Mobile apps nativo
- API pública
- White-label
- Multi-idioma completo (apenas PT no go-live)

---

**Última Atualização:** 22 de outubro de 2025
**Próxima Revisão:** Pós go-live (30 dias)
