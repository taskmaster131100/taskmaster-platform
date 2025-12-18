# TaskMaster - Arquitetura Técnica

**Versão:** 1.0.0-beta
**Data:** 22 de outubro de 2025
**Status:** Beta Testing
**Go-Live Target:** 01 de novembro de 2025

---

## 📋 Sumário Executivo

TaskMaster é uma plataforma SaaS de gestão completa para artistas e produtores musicais, construída com React, TypeScript, Supabase e Vite. A arquitetura foi projetada para escalabilidade, segurança e performance, com suporte offline-first e PWA.

---

## 🏗️ Stack Tecnológica

### Frontend
- **Framework:** React 18.3.1
- **Language:** TypeScript 5.0
- **Build Tool:** Vite 5.4.6
- **Router:** React Router DOM 6.26
- **Styling:** Tailwind CSS 3.3
- **Icons:** Lucide React 0.301
- **Drag & Drop:** @hello-pangea/dnd 16.6
- **State Management:** React Context + Hooks

### Backend & Database
- **BaaS:** Supabase (PostgreSQL 15)
- **Auth:** Supabase Auth (email/password)
- **Storage:** Supabase Storage
- **Real-time:** Supabase Realtime
- **Edge Functions:** Deno runtime

### Offline & PWA
- **Local Database:** IndexedDB (via idb 8.0)
- **Service Worker:** Workbox (via Vite PWA)
- **Cache Strategy:** Cache-first for assets, Network-first for data
- **Sync:** Background sync with conflict resolution

### Integrations (Planned/Optional)
- **AI:** OpenAI GPT-4o-mini (Planning Copilot)
- **Payments:** Stripe (billing & subscriptions)
- **Communication:** WhatsApp Business API, SendGrid
- **QR Codes:** qrcode 1.5.3

---

## 📁 Estrutura de Diretórios

```
taskmaster/
├── docs/                          # Documentação técnica e funcional
│   ├── TECHNICAL_ARCHITECTURE.md
│   ├── FUNCTIONAL_SPEC.md
│   ├── OPEN_GAPS.md
│   ├── BUGLIST.md
│   ├── DEPLOY_RUNBOOK.md
│   ├── SECURITY_CHECKLIST.md
│   ├── CHANGELOG.md
│   └── GO_LIVE_CHECKLIST.md
│
├── public/                        # Assets estáticos
│   ├── manifest.json              # PWA manifest
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── _redirects                 # Netlify SPA fallback
│   └── _headers                   # Security headers
│
├── src/
│   ├── components/                # Componentes React
│   │   ├── auth/                  # Autenticação
│   │   │   ├── AuthProvider.tsx
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── ResetPassword.tsx
│   │   ├── beta/                  # Beta testing
│   │   │   ├── BetaDashboard.tsx
│   │   │   └── BetaFeedbackWidget.tsx
│   │   ├── music/                 # Produção musical
│   │   │   ├── MusicHub.tsx
│   │   │   ├── ArrangementEditor.tsx
│   │   │   ├── SetlistBuilder.tsx
│   │   │   ├── StageMode.tsx
│   │   │   └── QRJoinButton.tsx
│   │   ├── organization/
│   │   │   └── OrganizationContext.tsx
│   │   ├── BetaBanner.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── MainLayout.tsx
│   │   ├── Onboarding.tsx
│   │   ├── OrganizationDashboard.tsx
│   │   ├── PlaceholderComponents.tsx
│   │   ├── SupabaseConnection.tsx
│   │   └── WelcomeModal.tsx
│   │
│   ├── pages/                     # Páginas/Views
│   │   ├── ApprovalsPage.tsx
│   │   ├── CommandCenter.tsx
│   │   ├── LobbyPreview.tsx       # Feature flag: VITE_ENABLE_CLASSIC_ROUTES
│   │   ├── MailPreview.tsx        # Feature flag: VITE_ENABLE_CLASSIC_ROUTES
│   │   ├── Planejamento.tsx
│   │   ├── RedirectPages.tsx
│   │   ├── Templates.tsx
│   │   └── WelcomePreview.tsx     # Feature flag: VITE_ENABLE_CLASSIC_ROUTES
│   │
│   ├── services/                  # Lógica de negócio
│   │   ├── music/
│   │   │   ├── aiSuggestions.ts
│   │   │   ├── arrangementService.ts
│   │   │   ├── notifications.ts
│   │   │   ├── setlistService.ts
│   │   │   ├── songService.ts
│   │   │   └── stageModeService.ts
│   │   └── localDatabase.ts       # IndexedDB wrapper
│   │
│   ├── lib/
│   │   └── supabase.ts            # Supabase client
│   │
│   ├── App.tsx                    # Main app (Music-focused)
│   ├── App-Music.tsx              # Music production app
│   ├── App-Simple.tsx             # Simplified app
│   ├── main.tsx                   # Entry point
│   ├── types.ts                   # TypeScript types
│   └── index.css                  # Global styles
│
├── supabase/
│   └── migrations/                # Database migrations
│       ├── 20250903112322_polished_king.sql
│       ├── 20250903113836_frosty_cell.sql
│       ├── 20251011170308_create_approval_system_complete.sql
│       ├── 20251017154947_create_beta_testing_infrastructure_v2.sql
│       ├── 20251021163000_create_music_production_system.sql
│       └── 20251021210000_create_enterprise_systems.sql
│
├── server/                        # API routes (legacy/optional)
│   └── api/
│
├── .env                           # Development environment
├── .env.production                # Production environment
├── .env.example                   # Environment template
├── vercel.json                    # Vercel deployment config
├── netlify.toml                   # Netlify deployment config
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

---

## 🔐 Segurança

### Autenticação
- **Provider:** Supabase Auth
- **Método:** Email/Password (email confirmation disabled for beta)
- **Session:** JWT tokens (7 dias de validade)
- **Storage:** localStorage (httpOnly cookies not available in Supabase)

### Row Level Security (RLS)
- ✅ Ativado em **todas** as tabelas
- ✅ Políticas por organização e usuário
- ✅ Isolamento de dados entre organizações
- ✅ Controle de acesso por papel (role)

### Edge Functions Security
- CORS configurado com headers restritivos
- Validação de JWT em todas as funções
- Rate limiting (planejado)
- Input sanitization

### Headers de Segurança
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

---

## 💾 Modelo de Dados

### Core Tables

#### Users & Organizations
- `auth.users` (Supabase Auth)
- `organizations` - Multi-tenant organizations
- `organization_members` - Users in organizations
- `roles` - User roles (owner, admin, member, musician)

#### Projects & Tasks
- `projects` - Projects with timelines and budgets
- `tasks` - Tasks with status, priority, assignees
- `task_dependencies` - Task relationships
- `milestones` - Project milestones
- `approvals` - Approval workflow
- `approval_items` - Individual approval items

#### Artists & Departments
- `artists` - Artist profiles
- `departments` - Organization departments
- `team_members` - Department members

#### Music Production
- `songs` - Song library with metadata
- `song_assets` - PDFs, MusicXML, MIDI files
- `arrangements` - Song arrangements with versioning
- `parts` - Instrument parts with transposition
- `rehearsals` - Rehearsal scheduling
- `rehearsal_attendance` - Attendance tracking
- `setlists` - Show setlists (locked D-1)
- `setlist_items` - Setlist songs with order
- `stage_docs` - Stage plots, patch lists
- `show_access_tokens` - QR code access tokens
- `musician_profiles` - Musician preferences
- `music_approvals` - Approval system for music content

#### Beta & Feedback
- `invite_codes` - Beta invite codes
- `feedback` - User feedback with severity

#### Templates & Planning
- `pipeline_templates` - Project templates
- `pipeline_phases` - Template phases
- `pipeline_tasks` - Template tasks

---

## 🚀 Deployment

### Hosting
- **Primary:** Vercel (production)
- **Secondary:** Netlify (staging)
- **CDN:** Cloudflare (optional)

### Deployment Strategy
1. **Development:** Local + Supabase Dev
2. **Staging:** Netlify + Supabase Staging
3. **Production:** Vercel + Supabase Production

### Build Process
```bash
npm install --prefer-offline
npm run build
# Output: dist/ (7.44 kB HTML, 33 kB CSS, 155 kB JS gzipped)
```

### Environment Variables
- Managed via Vercel/Netlify dashboard
- Never committed to repo
- See `.env.example` for required vars

### SPA Fallback
- **Vercel:** `vercel.json` rewrites
- **Netlify:** `netlify.toml` redirects
- All routes → `/index.html` (200 status)

---

## ⚡ Performance

### Metrics Target
- **TTFB:** < 200ms
- **LCP:** < 2.5s
- **FID:** < 100ms
- **CLS:** < 0.1

### Optimizations
- ✅ Code splitting (React.lazy)
- ✅ Route-based lazy loading
- ✅ Gzip compression
- ✅ Asset caching (31536000s)
- ✅ Image optimization (planned)
- ⏳ Bundle size optimization (ongoing)

### PWA Features
- ✅ Manifest.json
- ✅ Service Worker (workbox)
- ✅ Offline support (Stage Mode)
- ✅ Install prompt
- ⏳ Push notifications (planned)

---

## 🔧 Feature Flags

### Development (.env)
```
VITE_ENABLE_CLASSIC_ROUTES=true
VITE_FEATURE_PIPELINE_V2=true
VITE_FEATURE_APPROVALS=true
VITE_FEATURE_COMMAND_CENTER=true
VITE_FEATURE_PLANNING_COPILOT=true
VITE_FEATURE_BILLING=false
VITE_FEATURE_SUBSCRIPTIONS=false
VITE_FEATURE_OWNERSHIP=false
VITE_BETA_MODE=true
VITE_INVITE_ONLY=true
VITE_PUBLIC_SIGNUPS=false
```

### Production (.env.production)
```
VITE_ENABLE_CLASSIC_ROUTES=false  # ⚠️ Preview routes disabled
VITE_FEATURE_BILLING=false         # ⚠️ Not ready for go-live
VITE_FEATURE_SUBSCRIPTIONS=false   # ⚠️ Not ready for go-live
VITE_BETA_MODE=true                # ✅ Beta mode enabled
VITE_INVITE_ONLY=true              # ✅ Invite-only enabled
```

---

## 🤖 AI & Copilot

### OpenAI Integration
- **Model:** gpt-4o-mini (cost-effective)
- **Usage:** Project planning, template suggestions
- **Cache:** 90-day local cache for prompts/responses
- **Limits:** Tracked per organization (credits system planned)

### AI Features
- ✅ Project template generation
- ✅ Timeline suggestions (D-30/D-45/D-90/D-120)
- ⏳ Task suggestions
- ⏳ Setlist recommendations
- ⏳ Arrangement analysis

---

## 📊 Monitoring & Analytics

### Error Tracking
- **Tool:** Sentry (planned)
- **Coverage:** Frontend + Edge Functions

### Analytics
- **Tool:** Google Analytics 4 (optional)
- **Metrics:** Page views, user flows, conversions

### Performance
- **Tool:** Lighthouse CI
- **Frequency:** Every deploy
- **Thresholds:** See Performance section

### Audit Logs
- Database: `audit_logs` table (planned)
- Captures: Login, data changes, approval actions
- Retention: 90 days (30 days for non-critical)

---

## 🔄 Offline & Sync

### IndexedDB Schema
```typescript
Stores:
  - projects
  - tasks
  - artists
  - setlists (Stage Mode priority)
  - songs
  - arrangements
```

### Sync Strategy
1. **Download:** On login, sync recent data
2. **Offline:** All writes go to IndexedDB
3. **Online:** Queue uploads, handle conflicts
4. **Conflict Resolution:** Last-write-wins (with user prompt for critical data)

### Stage Mode Offline
- ✅ Setlist locked D-1 → full offline cache
- ✅ QR code access works offline
- ✅ Auto-sync when online
- ⏳ Offline annotations/notes

---

## 🧪 Testing

### Unit Tests
- **Framework:** Vitest (planned)
- **Coverage Target:** 70%

### Integration Tests
- **Framework:** Playwright (planned)
- **Critical Flows:** Login, Create Project, Approvals

### E2E Tests
- **Framework:** Playwright (planned)
- **Smoke Test:** See DEPLOY_RUNBOOK.md

---

## 📦 Dependencies

### Production
- @supabase/supabase-js: ^2.39.3
- react: ^18.3.1
- react-dom: ^18.3.1
- react-router-dom: ^6.26.0
- @hello-pangea/dnd: ^16.6.0
- idb: ^8.0.0
- qrcode: ^1.5.3
- lucide-react: ^0.301.0
- date-fns: ^2.30.0

### Dev Dependencies
- vite: ^5.4.6
- typescript: ^5.0.2
- tailwindcss: ^3.3.0
- @vitejs/plugin-react: ^4.3.1

---

## 🔗 External Services

### Required
- **Supabase:** Database, Auth, Storage, Realtime
  - Project: ktspxbucvfzaqyszpyso.supabase.co
  - Region: US East

### Optional (Not for Go-Live)
- **OpenAI:** AI Copilot
- **Stripe:** Billing & subscriptions
- **SendGrid:** Email notifications
- **Twilio:** WhatsApp integration

---

## 📝 API Endpoints

### Supabase REST API
```
GET    /rest/v1/projects
POST   /rest/v1/projects
PATCH  /rest/v1/projects/:id
DELETE /rest/v1/projects/:id
# ... (all tables exposed via PostgREST)
```

### Edge Functions (Planned)
```
POST /functions/v1/send-notification
POST /functions/v1/generate-pdf
POST /functions/v1/ai-suggest
POST /functions/v1/stripe-webhook
```

---

## 🎯 Current Architecture Status

### ✅ Implemented
- React + TypeScript + Vite setup
- Supabase integration (Auth + Database)
- RLS policies on all tables
- Music production system (songs, arrangements, setlists)
- Offline support (IndexedDB)
- Beta testing infrastructure
- Approval workflow
- Project templates
- PWA manifest
- SPA fallback (Vercel/Netlify)
- HashRouter for preview routes

### ⏳ In Progress
- Billing & subscriptions
- WhatsApp/Email notifications
- AI Copilot (OpenAI integration)
- CRM module
- Audit logs
- Performance optimizations

### ❌ Planned (Post Go-Live)
- E2E testing
- Error tracking (Sentry)
- Analytics (GA4)
- Push notifications
- Mobile apps (React Native)
- API rate limiting
- Advanced conflict resolution

---

## 📞 Support & Maintenance

### Development Team
- **Lead:** [Your Name]
- **Frontend:** React specialists
- **Backend:** Supabase/PostgreSQL experts
- **DevOps:** Vercel/Netlify

### On-Call Rotation
- **Beta Period:** 24/7 monitoring
- **Post-Launch:** Business hours (9am-6pm BRT)

### Incident Response
1. Detect (monitoring alerts)
2. Triage (severity assessment)
3. Fix (hotfix or rollback)
4. Communicate (status page + email)
5. Post-mortem (within 48h)

---

## 🔮 Roadmap

### Phase 1: Beta (Current)
- Core functionality
- Invite-only access
- Music production system
- Basic approvals

### Phase 2: Go-Live (Nov 1)
- Public signup (invite codes)
- Billing & subscriptions
- Communication automation
- CRM basic

### Phase 3: Scale (Q1 2026)
- Mobile apps
- Advanced analytics
- API for integrations
- Marketplace (templates)

---

**Última Atualização:** 22 de outubro de 2025
**Próxima Revisão:** 25 de outubro de 2025 (pré go-live)
