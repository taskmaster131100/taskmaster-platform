# 🧪 GUIA DE TESTES BETA - TaskMaster v1.0.0

**Versão:** 1.0.0 Stable
**Ambiente:** Staging (https://staging.taskmaster.app)
**Período:** 7 dias de testes intensivos
**Objetivo:** Validar usabilidade, performance e experiência real de operação

---

## 👋 BEM-VINDO, BETA TESTER!

Você foi selecionado para testar a versão beta do **TaskMaster**, a plataforma completa de gestão para artistas e produtoras musicais.

Sua opinião é **fundamental** para aprimorarmos o produto antes do lançamento público.

---

## 🎯 OBJETIVOS DOS TESTES

### O que vamos validar:

1. **Usabilidade** - O sistema é intuitivo e fácil de usar?
2. **Performance** - As páginas carregam rapidamente?
3. **Persistência** - Os dados são salvos e mantidos corretamente?
4. **Funcionalidades** - Todos os módulos funcionam como esperado?
5. **Bugs** - Identificar e reportar qualquer erro ou comportamento inesperado
6. **Experiência Real** - O TaskMaster resolve problemas reais do seu dia a dia?

---

## 🔐 ACESSO AO SISTEMA

### Credenciais de Teste

**URL:** https://staging.taskmaster.app

**Suas credenciais foram enviadas por email:**
- Email: `seu-email@exemplo.com`
- Senha: `[senha temporária]`
- Código Beta: `[código exclusivo]`

### Primeiro Acesso

1. Acesse a URL do staging
2. Faça login com suas credenciais
3. Complete o onboarding (5 passos)
4. Explore o dashboard

**⚠️ IMPORTANTE:** Não compartilhe suas credenciais com terceiros.

---

## 📅 CRONOGRAMA DE TESTES (7 DIAS)

### **DIA 1: Onboarding e Configuração** 🚀

**Tempo estimado:** 30-45 minutos

**Tarefas:**
- [ ] Fazer login pela primeira vez
- [ ] Completar os 5 passos do onboarding
- [ ] Explorar o dashboard principal
- [ ] Navegar pelos 15 módulos do menu lateral
- [ ] Criar seu primeiro projeto
- [ ] Cadastrar seu primeiro artista

**Foco de Observação:**
- O onboarding é claro e intuitivo?
- O dashboard apresenta informações úteis?
- A navegação é fluida?

**Reportar:**
- Qualquer dificuldade no primeiro uso
- Informações confusas ou faltantes
- Sugestões de melhoria no onboarding

---

### **DIA 2-3: Uso Diário Básico** 📊

**Tempo estimado:** 1-2 horas por dia

**Tarefas:**
- [ ] Criar 3-5 tarefas no TaskBoard
- [ ] Mover tarefas entre colunas (drag & drop)
- [ ] Adicionar 3-5 eventos na agenda
- [ ] Criar 2-3 projetos diferentes
- [ ] Cadastrar 2-3 artistas
- [ ] Testar edição de projetos e artistas
- [ ] Explorar módulo de Comunicação (WhatsApp, Google, Reuniões)
- [ ] Fechar o navegador e reabrir (testar persistência)

**Foco de Observação:**
- Os dados são salvos corretamente?
- Após recarregar a página, tudo continua lá?
- O drag & drop funciona suavemente?
- A agenda sincroniza com as tarefas?

**Reportar:**
- Qualquer perda de dados
- Lentidão ou travamentos
- Features que não funcionaram como esperado

---

### **DIA 4-5: Features Avançadas** 🎵

**Tempo estimado:** 2-3 horas ao longo dos dias

**Tarefas:**
- [ ] Usar o Planning Copilot (módulo de IA)
- [ ] Explorar Produção Musical (Music Hub)
- [ ] Testar módulo de Marketing
- [ ] Acessar Relatórios e KPIs
- [ ] Gerenciar Shows e eventos
- [ ] Testar módulo de Análise
- [ ] Criar múltiplos projetos simultâneos
- [ ] Organizar vários artistas

**Foco de Observação:**
- O Planning Copilot é útil?
- O Music Hub atende às necessidades de produção?
- Os relatórios são relevantes?
- A organização de múltiplos projetos é eficiente?

**Reportar:**
- Features que mais gostou
- Features que menos usaria
- Funcionalidades que estão faltando
- Melhorias sugeridas

---

### **DIA 6: Testes de Estresse** 💪

**Tempo estimado:** 1-2 horas

**Tarefas:**
- [ ] Criar 10+ projetos
- [ ] Cadastrar 10+ artistas
- [ ] Criar 20+ tarefas
- [ ] Adicionar 15+ eventos na agenda
- [ ] Abrir múltiplas abas do sistema
- [ ] Navegar rapidamente entre módulos
- [ ] Testar todos os botões e links
- [ ] Tentar ações não convencionais

**Foco de Observação:**
- O sistema fica lento com muitos dados?
- Há limites de armazenamento?
- Algum módulo trava ou para de responder?
- Erros aparecem no console do navegador?

**Reportar:**
- Qualquer erro ou crash
- Lentidão perceptível
- Limites encontrados
- Comportamentos inesperados

---

### **DIA 7: Feedback Final** 📝

**Tempo estimado:** 30-60 minutos

**Tarefas:**
- [ ] Preencher formulário de feedback completo (link abaixo)
- [ ] Usar o widget de feedback flutuante (botão azul)
- [ ] Acessar `/beta-dashboard` e revisar suas métricas
- [ ] Responder pesquisa de satisfação
- [ ] Sugerir melhorias prioritárias

**Perguntas Chave:**
- Você usaria o TaskMaster no seu dia a dia?
- Qual seria um preço justo para este produto?
- O que mais gostou?
- O que mais faltou?
- Recomendaria para colegas?

---

## 🔧 FERRAMENTAS DE DEBUGGING

### Console do Navegador (F12)

Durante os testes, mantenha o console aberto para ver os logs do sistema.

**Abrir Console:**
- **Windows/Linux:** `F12` ou `Ctrl + Shift + I`
- **Mac:** `Cmd + Option + I`

**Aba Console:**
Você verá mensagens como:
```
✅ [TaskMaster] Projeto criado com sucesso: Nome do Projeto
✅ [TaskMaster] Artista criado com sucesso: Nome do Artista
[TaskMaster DB] CREATE: { timestamp, collection, data }
```

### Comandos Úteis no Console

Abra o console e digite estes comandos para debugar:

```javascript
// Ver estatísticas de dados
window.taskmaster_db.getStats()

// Ver últimos logs do sistema
window.taskmaster_db.getLogs()

// Criar backup dos seus dados
const backup = window.taskmaster_db.createBackup()
console.log(backup) // Copiar e salvar

// Validar integridade dos dados
window.taskmaster_db.validatePersistence()

// Ver todos os projetos
window.taskmaster_db.getCollection('projects')

// Ver todos os artistas
window.taskmaster_db.getCollection('artists')

// Ver todas as tarefas
window.taskmaster_db.getCollection('tasks')
```

### Tirar Screenshots de Erros

Sempre que encontrar um erro:
1. Tire screenshot da tela completa
2. Tire screenshot do console (F12)
3. Anote o horário exato
4. Descreva o que você estava fazendo

---

## 🐛 COMO REPORTAR BUGS

### Método 1: Widget de Feedback (Recomendado)

1. Clique no botão azul flutuante no canto inferior direito
2. Selecione "Reportar Bug"
3. Preencha:
   - Título do bug
   - Descrição detalhada
   - Passos para reproduzir
   - Anexar screenshots (se possível)
4. Enviar

### Método 2: Beta Dashboard

1. Acesse `/beta-dashboard`
2. Vá para seção "Reportar Problemas"
3. Preencha formulário detalhado
4. Enviar

### Método 3: Email Direto

Envie para: `beta@taskmaster.app`

**Formato sugerido:**
```
Assunto: [BUG] Título curto do problema

Descrição:
- O que aconteceu?
- O que você esperava que acontecesse?
- Como reproduzir o problema? (passo a passo)

Ambiente:
- Navegador: Chrome/Firefox/Safari
- Sistema: Windows/Mac/Linux
- Data/Hora: DD/MM/YYYY HH:MM

Screenshots:
[anexar imagens]
```

---

## 📋 CHECKLIST COMPLETO DE TESTES

### **Módulo: Organização (Dashboard)**
- [ ] Dashboard carrega corretamente
- [ ] 4 cards superiores exibem dados
- [ ] Tabela "Nossos Talentos" renderiza
- [ ] Botão "+ Criar Projeto" funciona
- [ ] Modal de projeto abre e fecha
- [ ] Projeto salva e aparece na lista
- [ ] Botão "Novo Talento" funciona
- [ ] Modal de artista abre e fecha
- [ ] Artista salva e aparece na tabela

### **Módulo: Tarefas**
- [ ] TaskBoard carrega com colunas
- [ ] Botão "Nova Tarefa" funciona
- [ ] Tarefas podem ser criadas
- [ ] Drag & drop funciona
- [ ] Tarefas persistem após reload
- [ ] Filtros de departamento funcionam
- [ ] Edição de tarefas funciona
- [ ] Deleção de tarefas funciona

### **Módulo: Agenda**
- [ ] Calendar view carrega
- [ ] Mês correto exibido
- [ ] Botão "Novo Evento" funciona
- [ ] Eventos podem ser criados
- [ ] Eventos aparecem no calendário
- [ ] Eventos persistem após reload
- [ ] Navegação entre meses funciona
- [ ] Edição de eventos funciona

### **Módulo: Relatórios**
- [ ] Página de relatórios carrega
- [ ] Gráficos renderizam (se houver)
- [ ] Dados são exibidos corretamente
- [ ] Filtros funcionam (se houver)

### **Módulo: Planning Copilot**
- [ ] Página carrega corretamente
- [ ] Interface de IA responde
- [ ] Sugestões são úteis
- [ ] Integração com projetos funciona

### **Módulo: Produção Musical**
- [ ] Music Hub carrega
- [ ] Componentes renderizam
- [ ] Funcionalidades básicas operacionais

### **Módulo: Comunicação**
- [ ] Submenu expande e retrai
- [ ] WhatsApp Manager carrega
- [ ] Google Integration carrega
- [ ] Meetings Manager carrega
- [ ] Integração WhatsApp funcional (se implementada)

### **Módulo: Shows**
- [ ] Página de shows carrega
- [ ] Lista de shows exibida
- [ ] Criar novo show funciona
- [ ] Edição funciona
- [ ] Deleção funciona

### **Módulo: Marketing**
- [ ] Marketing Manager carrega
- [ ] Ferramentas disponíveis
- [ ] Funcionalidades básicas operacionais

### **Módulo: Produção**
- [ ] Production Manager carrega
- [ ] Interface funcional
- [ ] Recursos disponíveis

### **Módulo: Análise e KPIs**
- [ ] AI Insights carrega
- [ ] KPI Manager carrega
- [ ] Métricas exibidas
- [ ] Dados relevantes

### **Módulo: Admin**
- [ ] User Management carrega
- [ ] Lista de usuários (se houver)
- [ ] Permissões funcionam

### **Módulo: Perfil**
- [ ] User Profile carrega
- [ ] Dados do usuário exibidos
- [ ] Edição de perfil funciona
- [ ] Salvamento persiste

---

## 🎯 CENÁRIOS DE TESTE REAIS

### **Cenário 1: Lançamento de Single**

**Contexto:** Você está lançando um single de um artista.

**Fluxo:**
1. Criar projeto "Lançamento - [Nome da Música]"
2. Cadastrar ou selecionar o artista
3. Criar tarefas:
   - Masterização (Produção)
   - Criar capa (Marketing)
   - Enviar para DSPs (Produção)
   - Planejar divulgação (Marketing)
   - Agendar posts (Comunicação)
4. Adicionar eventos:
   - Data de lançamento
   - Reunião com artista
   - Deadline de entrega
5. Usar Planning Copilot para sugestões
6. Monitorar progresso no TaskBoard

**Validar:**
- Fluxo completo funciona sem erros?
- É fácil organizar tudo?
- Falta alguma funcionalidade?

---

### **Cenário 2: Gerenciar Múltiplos Artistas**

**Contexto:** Você gerencia 3 artistas diferentes simultaneamente.

**Fluxo:**
1. Cadastrar 3 artistas com perfis diferentes
2. Criar 1 projeto para cada artista
3. Adicionar tarefas específicas de cada um
4. Organizar agenda com eventos dos 3
5. Usar filtros para focar em um artista por vez
6. Navegar entre os projetos

**Validar:**
- É fácil alternar entre artistas?
- Os dados não se misturam?
- Filtros ajudam na organização?

---

### **Cenário 3: Planejamento de Turnê**

**Contexto:** Planejar uma turnê com 5 shows.

**Fluxo:**
1. Criar projeto "Turnê 2025"
2. Adicionar 5 shows no módulo Shows
3. Adicionar datas na agenda
4. Criar tarefas de logística:
   - Contratar transporte
   - Reservar hotéis
   - Produzir rider técnico
   - Divulgar shows
5. Acompanhar progresso

**Validar:**
- Módulo de Shows atende a necessidade?
- Agenda ajuda na visualização?
- Falta alguma feature específica para turnês?

---

## 📊 FORMULÁRIO DE FEEDBACK FINAL

### **Link do Formulário:**
[Será fornecido por email]

### **Perguntas do Formulário:**

#### **1. Dados Gerais**
- Nome:
- Email:
- Perfil: [ ] Artista [ ] Gestor [ ] Produtor [ ] Outro
- Quantos dias testou: ___
- Quantas horas aproximadas: ___

#### **2. Experiência Geral (1-10)**
- Facilidade de uso: ___
- Design e layout: ___
- Performance (velocidade): ___
- Funcionalidades: ___
- Satisfação geral: ___

#### **3. Perguntas Abertas**
- O que mais gostou no TaskMaster?
- O que menos gostou?
- Que funcionalidade fez mais falta?
- Encontrou algum bug? Descreva:
- O TaskMaster resolveria problemas reais do seu dia a dia?

#### **4. Módulos (Nota de 1-10)**
- Organização (Dashboard): ___
- Tarefas (TaskBoard): ___
- Agenda: ___
- Planning Copilot: ___
- Produção Musical: ___
- Comunicação: ___
- Shows: ___
- Relatórios: ___

#### **5. Usabilidade**
- Foi fácil encontrar as funcionalidades? [ ] Sim [ ] Não [ ] Parcialmente
- O onboarding foi claro? [ ] Sim [ ] Não
- A navegação é intuitiva? [ ] Sim [ ] Não
- Teve dificuldade em algum momento? Onde?

#### **6. Performance**
- Páginas carregam rapidamente? [ ] Sim [ ] Não [ ] Às vezes
- Teve algum travamento? [ ] Sim [ ] Não
- Notou lentidão em algum módulo? Qual?

#### **7. Persistência de Dados**
- Seus dados foram salvos corretamente? [ ] Sim [ ] Não [ ] Tive problemas
- Perdeu algum dado durante os testes? [ ] Sim [ ] Não
- Se sim, descreva quando e o quê:

#### **8. Monetização**
- Você pagaria por este produto? [ ] Sim [ ] Não [ ] Talvez
- Qual seria um preço justo (mensal)?
  - [ ] Até R$ 50
  - [ ] R$ 50 - R$ 100
  - [ ] R$ 100 - R$ 200
  - [ ] R$ 200+
- Preferiria: [ ] Mensal [ ] Trimestral [ ] Anual

#### **9. Recomendação**
- Recomendaria o TaskMaster? [ ] Sim [ ] Não [ ] Talvez
- Para quem você recomendaria?
- Que argumento usaria para recomendar?

#### **10. Comentários Finais**
- Sugestões de melhorias prioritárias:
- Comentários adicionais:
- Gostaria de continuar usando após o beta? [ ] Sim [ ] Não

---

## 🏆 BENEFÍCIOS PARA BETA TESTERS

Por participar dos testes beta, você receberá:

### **Benefícios Imediatos:**
- ✅ Acesso antecipado ao TaskMaster
- ✅ Influência direta no desenvolvimento do produto
- ✅ Suporte prioritário da equipe
- ✅ Certificado de Beta Tester

### **Benefícios Futuros:**
- 🎁 3 meses de plano Pro **GRATUITO** no lançamento oficial
- 🎁 50% de desconto permanente no plano anual
- 🎁 Créditos exclusivos para usar no sistema
- 🎁 Badge "Founding Member" no seu perfil
- 🎁 Acesso vitalício a features exclusivas

### **Reconhecimento:**
- 🌟 Nome na página "Agradecimentos" do site
- 🌟 Menção em posts de lançamento (se autorizar)
- 🌟 Acesso a grupo VIP de early adopters

---

## 📞 SUPORTE DURANTE OS TESTES

### **Canais de Suporte:**

#### **1. Grupo WhatsApp Beta**
- Link de convite enviado por email
- Resposta em até 2 horas (horário comercial)
- Compartilhe dúvidas e experiências

#### **2. Email Beta**
- beta@taskmaster.app
- Resposta em até 24 horas
- Para questões mais detalhadas

#### **3. Widget de Feedback**
- Botão azul flutuante no sistema
- Feedback direto e instantâneo
- Para sugestões rápidas

#### **4. Beta Dashboard**
- Acesse `/beta-dashboard`
- Veja suas métricas de teste
- Acompanhe status de bugs reportados

---

## ⚠️ AVISOS IMPORTANTES

### **Ambiente de Staging**

⚠️ Este é um ambiente de **TESTES**:
- Dados podem ser resetados periodicamente
- Algumas features estão em desenvolvimento
- Podem ocorrer instabilidades pontuais
- **NÃO use para dados críticos de produção**

### **Backup Recomendado**

Se estiver criando dados importantes durante os testes:
```javascript
// Abra o console (F12) e execute:
const backup = window.taskmaster_db.createBackup()
console.log(backup)
// Copie o JSON e salve em arquivo .txt
```

### **Privacidade**

- Seus dados são criptografados
- Não compartilharemos informações pessoais
- Feedback é anônimo (exceto se autorizar menção)
- Você pode solicitar exclusão de dados a qualquer momento

---

## 🎯 METAS DE TESTE

### **Meta Coletiva (Todos os Testers):**
- 50+ projetos criados
- 50+ artistas cadastrados
- 200+ tarefas organizadas
- 100+ eventos agendados
- 50+ feedbacks enviados
- 20+ bugs reportados e corrigidos

### **Meta Individual (Você):**
- Testar por 7 dias completos
- Usar pelo menos 10 dos 15 módulos
- Criar pelo menos 3 projetos
- Enviar pelo menos 5 feedbacks
- Preencher formulário final

---

## ✅ CHECKLIST FINAL DO TESTER

Antes de encerrar os testes, confirme:

- [ ] Testei todos os módulos principais
- [ ] Criei múltiplos projetos e artistas
- [ ] Testei TaskBoard e Agenda extensivamente
- [ ] Reportei todos os bugs encontrados
- [ ] Enviei feedbacks ao longo dos testes
- [ ] Testei em diferentes navegadores (se possível)
- [ ] Fiz backup dos meus dados de teste
- [ ] Preenchi o formulário de feedback final
- [ ] Respondi pesquisa de satisfação
- [ ] Dei sugestões de melhorias

---

## 🚀 APÓS OS TESTES

### **O que acontece depois:**

1. **Análise de Dados (Semana 2)**
   - Equipe analisa todos os feedbacks
   - Priorização de correções e melhorias
   - Relatório consolidado gerado

2. **Implementação de Melhorias (Semanas 3-4)**
   - Correção de bugs críticos
   - Implementação de sugestões viáveis
   - Preparação da v1.1.0

3. **Convite para Testes v1.1.0 (Semana 5)**
   - Beta testers terão acesso prioritário
   - Validação das correções implementadas
   - Novos testes com features de monetização

4. **Lançamento Oficial (Semana 6-8)**
   - Lançamento público do TaskMaster
   - Ativação dos benefícios para beta testers
   - Celebração de lançamento!

---

## 💬 MENSAGEM FINAL

**Obrigado por participar dos testes beta do TaskMaster!**

Sua contribuição é **essencial** para construirmos a melhor plataforma de gestão para a indústria musical.

Cada bug reportado, cada sugestão enviada, cada minuto dedicado aos testes nos aproxima de um produto **extraordinário**.

Estamos construindo isso **juntos**!

**Vamos revolucionar a gestão musical! 🎵**

---

**Equipe TaskMaster**
Email: beta@taskmaster.app
WhatsApp: [número do grupo]
Site: https://taskmaster.app

---

**Versão do Guia:** 1.0
**Última Atualização:** 08/11/2025
**Validade:** Fase Beta (7 dias)

---

**FIM DO GUIA - BOM TESTE! 🚀**
