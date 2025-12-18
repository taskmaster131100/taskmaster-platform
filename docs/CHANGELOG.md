# TaskMaster - Changelog

Todas as mudanças notáveis do projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [Unreleased]

### Added
- Sistema completo de documentação técnica e funcional
- READINESS_REPORT.md com status de prontidão para go-live
- GO_LIVE_CHECKLIST.md com 62 critérios de aceite
- Mapeamento completo de 58 gaps e 10 bugs

### Fixed
- **[CRÍTICO]** Landing institucional agora é o ponto de entrada padrão (não Produção Musical)
- **[CRÍTICO]** Feature flag `VITE_ENABLE_CLASSIC_ROUTES` agora funciona corretamente em produção
- HashRouter/BrowserRouter alternado corretamente baseado em feature flag
- .env.example atualizado com todas as variáveis necessárias

---

## [1.0.0-beta] - 2025-10-22

### Added

#### Infraestrutura
- Setup completo de Vite + React + TypeScript
- Integração com Supabase (Database + Auth + Storage)
- Deploy configurado para Vercel (production) e Netlify (staging)
- SPA fallback em vercel.json e netlify.toml
- PWA manifest.json
- Feature flags system
- HashRouter para rotas de preview (dev only)

#### Autenticação
- Sistema completo de auth com Supabase
- Página de login com "Lembrar de mim"
- Página de registro com validação de invite codes
- Recuperação de senha funcional
- Onboarding interativo de 5 slides
- Welcome Modal para usuários retornando
- Suporte multi-idioma (PT/EN/ES) estrutural

#### Core Features - Projetos
- CRUD completo de projetos
- Templates de projeto (DVD D-120, Tour D-90, Lançamento D-45, Show D-30)
- Planning Copilot com OpenAI GPT-4o-mini
- Suporte a projetos de artistas
- Dashboard de projetos

#### Core Features - Tarefas
- CRUD completo de tarefas
- Quadro Kanban com drag & drop (@hello-pangea/dnd)
- Prioridades (Baixa, Média, Alta, Urgente)
- Status (To Do, In Progress, Review, Done)
- Assignees e datas de vencimento
- Tags e anexos

#### Sistema de Aprovações
- Criação de aprovações (orçamento, contrato, conteúdo)
- Workflow de aprovação (aprovar/rejeitar/solicitar mudanças)
- Múltiplos aprovadores
- Histórico completo de aprovações
- Integração com tabela `approval_items`

#### Produção Musical
- **Biblioteca de Músicas (Songs)**
  - CRUD completo com metadados (tom, BPM, compasso, estrutura)
  - Upload de assets (PDF, MusicXML, MIDI, áudio)
  - Versionamento de arquivos
  - Letra, cifra, notas

- **Arranjos**
  - CRUD de arranjos por música
  - Versionamento de arranjos
  - Status (Draft, Review, Approved, Rejected)
  - Partes por instrumento
  - Sistema de aprovação integrado

- **Ensaios**
  - Agendamento de ensaios
  - Pauta (músicas a ensaiar)
  - Controle de presença (rehearsal_attendance)
  - Anotações por ensaio

- **Setlists**
  - Setlist builder com drag & drop
  - Configurações por música (tom, BPM)
  - Duração total calculada
  - Trava automática D-1 antes do show
  - Cache offline completo

- **Stage Mode**
  - Visualização otimizada para palco
  - Música atual + próximas 3
  - Letra + cifra em tela cheia
  - Navegação por gestos (swipe)
  - Modo offline funcional
  - Dark mode padrão
  - Fonte ajustável

- **QR Code Access**
  - Geração de tokens de acesso
  - Links temporários (7 dias)
  - Acesso sem login para músicos convidados

- **Documentos Técnicos**
  - Stage Plot
  - Patch List
  - Input List
  - Mic Map
  - Rider Técnico
  - Upload de PDFs com versionamento

- **Perfis de Músicos**
  - Preferências de transposição
  - Instrumentos
  - Configurações pessoais

#### Database
- 6 migrations aplicadas:
  1. `20250903112322_polished_king.sql` - Invite codes e feedback
  2. `20250903113836_frosty_cell.sql` - Core tables
  3. `20251011170308_create_approval_system_complete.sql` - Sistema de aprovações
  4. `20251017154947_create_beta_testing_infrastructure_v2.sql` - Beta testing
  5. `20251021163000_create_music_production_system.sql` - Produção musical (30+ tabelas)
  6. `20251021210000_create_enterprise_systems.sql` - Enterprise features

- RLS (Row Level Security) ativado em todas as tabelas
- Políticas de acesso por organização e usuário
- Isolamento de dados entre organizações

#### Offline & PWA
- IndexedDB wrapper (idb 8.0)
- Sync service para offline-first
- Service Worker configurado
- Stage Mode totalmente offline após cache

#### Beta Testing
- Sistema de invite codes
- Feedback widget flutuante
- Beta dashboard para admins
- Tracking de usuários beta

#### Rotas de Preview (Feature Flag)
- `/welcome` - Onboarding de 5 slides
- `/lobby` - Dashboard mockado
- `/mail` - Landing page completa
- Visíveis apenas quando `VITE_ENABLE_CLASSIC_ROUTES=true`
- Menu "Preview" no sidebar (apenas dev)

#### UI/UX
- MainLayout com sidebar responsivo
- Beta banner no topo
- Error Boundary para captura de erros
- Loading states e suspense boundaries
- Tailwind CSS com design system
- Lucide React icons
- Animações suaves com Tailwind

### Changed
- Refatorado App.tsx para separar concerns
- Criado App-Music.tsx focado em produção musical
- Melhorada estrutura de componentes
- Otimizado bundle size com lazy loading
- Code splitting por rota

### Deprecated
- (Nenhum item deprecated nesta versão)

### Removed
- (Nenhum item removido nesta versão)

### Fixed
- Drag & drop funciona em desktop (bug mobile permanece)
- RLS policies ajustadas para prevenir leaks
- Performance otimizada com React.lazy
- Build time reduzido para ~7-8 segundos

### Security
- RLS ativado em 100% das tabelas
- Políticas restritivas por padrão
- Headers de segurança configurados (X-Frame-Options, CSP, etc.)
- JWT tokens com 7 dias de validade
- Validação de input em todos os forms
- Sanitização de dados do usuário

---

## [0.9.0-alpha] - 2025-09-03

### Added
- Setup inicial do projeto
- Estrutura básica de componentes
- Integração com Supabase
- Sistema de autenticação básico
- Primeiras migrations (invite codes, feedback)

---

## Versões Futuras Planejadas

### [1.1.0] - Previsto para Dez/2025
**Tema:** Billing, CRM e Comunicação

#### Planned Features
- Sistema completo de Billing & Subscriptions
  - Integração Stripe
  - Planos (Individual, Studio, Enterprise)
  - Checkout flow
  - Webhooks de pagamento
  - Limites de plano enforced
  - Tela "Meu Plano"
  - Invoices e histórico

- CRM de Leads
  - CRUD de contatos
  - Pipeline Kanban (5 estágios)
  - Propostas PDF
  - Follow-ups automatizados
  - Relatório de conversão

- Comunicação Automatizada
  - WhatsApp Business API integration
  - Email automation (SendGrid)
  - Fila de envios com retry
  - Templates por evento
  - Fallback WhatsApp → Email

- Melhorias
  - Dependências de tarefas
  - Comentários em tarefas
  - Mentions (@usuario)
  - Notificações push

### [1.2.0] - Previsto para Jan/2026
**Tema:** Analytics, Integrações e Financeiro

#### Planned Features
- Financeiro Completo
  - CRUD de receitas e despesas
  - Categorização automática
  - Relatórios detalhados
  - Projeção de fluxo de caixa
  - Export Excel/PDF

- Integrações
  - Google Calendar sync
  - Spotify API (metadados)
  - Trello import
  - Notion import

- Analytics Avançado
  - Dashboard customizável
  - KPIs por artista
  - Relatórios automáticos
  - Insights com IA

- Melhorias
  - Dark mode global
  - Multi-idioma completo
  - Atalhos de teclado
  - Timeline visual (Gantt)

### [2.0.0] - Previsto para Mar/2026
**Tema:** Mobile, API e Marketplace

#### Planned Features
- Mobile Apps (React Native)
  - iOS e Android nativos
  - Offline-first
  - Push notifications
  - Camera integration

- API Pública
  - REST API documentada
  - Webhooks configuráveis
  - Rate limiting
  - Developer dashboard

- Marketplace
  - Templates pagos
  - Plugins de terceiros
  - Integrações custom
  - White-label options

---

## Notas de Migração

### Para 1.0.0-beta
Nenhuma ação necessária. Fresh install.

### Para 1.1.0 (quando lançado)
- Rodar novas migrations de billing
- Configurar Stripe credentials
- Atualizar environment variables

---

## Links

- [Repositório](https://github.com/[your-org]/taskmaster)
- [Issues](https://github.com/[your-org]/taskmaster/issues)
- [Releases](https://github.com/[your-org]/taskmaster/releases)
- [Documentação](./README.md)

---

**Mantido por:** Tech Lead Team
**Formato:** Keep a Changelog 1.0.0
**Versionamento:** Semantic Versioning 2.0.0
