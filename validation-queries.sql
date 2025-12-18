-- ============================================================================
-- TaskMaster Beta — Queries de Validação Pós-Deploy
-- Data: October 23, 2025
-- ============================================================================

-- ============================================================================
-- 1. VERIFICAR CADASTRO EM BETA_USER_LOGS
-- ============================================================================
-- Valida que o registro foi gravado corretamente
-- Resultado esperado: 1 registro com action_type='signup'

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

-- Resultado Esperado:
-- id: [UUID]
-- user_id: [UUID válido]
-- action_type: 'signup'
-- module: 'auth'
-- metadata: {"email": "beta01@...", "invite_code": "BETA-TEAM-DEV", ...}
-- created_at: [timestamp recente]


-- ============================================================================
-- 2. VERIFICAR INCREMENTO DO CÓDIGO DE CONVITE
-- ============================================================================
-- Valida que used_count foi incrementado após o registro
-- Resultado esperado: used_count = 1 (ou mais se houve múltiplos cadastros)

SELECT 
  code,
  used_count,
  max_uses,
  (max_uses - used_count) as remaining_uses,
  expires_at,
  created_at
FROM invite_codes 
WHERE code = 'BETA-TEAM-DEV';

-- Resultado Esperado:
-- code: 'BETA-TEAM-DEV'
-- used_count: 1 (incrementado de 0)
-- max_uses: 999
-- remaining_uses: 998
-- expires_at: 2026-10-22 ...


-- ============================================================================
-- 3. VERIFICAR USUÁRIO EM AUTH.USERS
-- ============================================================================
-- Valida que o usuário foi criado no Supabase Auth
-- Resultado esperado: 1 usuário com email correto e metadados

SELECT 
  id,
  email,
  created_at,
  confirmed_at,
  raw_user_meta_data->>'name' as name,
  raw_user_meta_data->>'account_type' as account_type,
  raw_user_meta_data->>'language' as language,
  raw_user_meta_data->>'beta_user' as is_beta_user
FROM auth.users
ORDER BY created_at DESC
LIMIT 1;

-- Resultado Esperado:
-- id: [UUID - deve corresponder ao user_id em beta_user_logs]
-- email: 'beta01@taskmaster.test'
-- name: 'Beta Tester 01'
-- account_type: 'artist'
-- language: 'pt'
-- is_beta_user: 'true'


-- ============================================================================
-- QUERIES ADICIONAIS DE OBSERVABILIDADE
-- ============================================================================

-- 4. Total de Cadastros por Dia
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_signups,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT (metadata->>'invite_code')) as unique_codes_used
FROM beta_user_logs
WHERE action_type = 'signup'
GROUP BY DATE(created_at)
ORDER BY date DESC;


-- 5. Conversão de Códigos de Convite
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


-- 6. Últimas 10 Ações no Sistema
SELECT 
  action_type,
  module,
  metadata->>'email' as user_email,
  metadata->>'invite_code' as invite_code,
  created_at
FROM beta_user_logs
ORDER BY created_at DESC
LIMIT 10;


-- 7. Verificar RLS Ativo em Tabelas Core
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'projects', 'tasks', 'invite_codes', 
    'beta_user_logs', 'feedback'
  )
ORDER BY tablename;


-- 8. Contagem de Políticas RLS por Tabela
SELECT
  tablename,
  COUNT(*) as policy_count,
  STRING_AGG(policyname, ', ' ORDER BY policyname) as policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;


-- 9. Estatísticas Gerais do Beta
SELECT
  'Total Beta Users' as metric,
  COUNT(DISTINCT user_id)::text as value
FROM beta_user_logs
WHERE action_type = 'signup'

UNION ALL

SELECT
  'Total Invite Codes Available',
  COUNT(*)::text
FROM invite_codes
WHERE used_count < max_uses

UNION ALL

SELECT
  'Total Codes Used',
  SUM(used_count)::text
FROM invite_codes

UNION ALL

SELECT
  'Active Beta Users Today',
  COUNT(DISTINCT user_id)::text
FROM beta_user_logs
WHERE created_at >= CURRENT_DATE;


-- ============================================================================
-- CRITÉRIOS DE SUCESSO
-- ============================================================================
-- Para considerar a validação 100% bem-sucedida, verificar:
-- 
-- Query 1 (beta_user_logs): 1 registro retornado ✅
-- Query 2 (invite_codes): used_count = 1 ✅
-- Query 3 (auth.users): 1 usuário criado ✅
-- Query 7 (RLS): todas as tabelas com rls_enabled = true ✅
-- 
-- Se TODOS os critérios acima forem atendidos:
-- 🟢 SISTEMA VALIDADO E PRONTO PARA FASE 1 DO BETA
-- ============================================================================
