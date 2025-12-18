-- =====================================================
-- GERAÇÃO DE INVITE CODES PARA BETA (1.100 CÓDIGOS)
-- =====================================================
-- Execute este script no Supabase SQL Editor
-- Dashboard > SQL Editor > New Query

-- 1. Criar lote principal de 1.100 códigos únicos
DO $$
DECLARE
  i INTEGER := 1;
  code_prefix TEXT := 'BETA-2025-';
  random_suffix TEXT;
  total_codes INTEGER := 1100;
BEGIN
  WHILE i <= total_codes LOOP
    -- Gerar sufixo aleatório (6 caracteres alfanuméricos)
    random_suffix := UPPER(
      SUBSTR(
        MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT),
        1, 6
      )
    );

    -- Inserir código com configurações específicas
    INSERT INTO invite_codes (
      code,
      created_by,
      organization_id,
      max_uses,
      used_count,
      expires_at,
      created_at
    ) VALUES (
      code_prefix || random_suffix,
      NULL,  -- Código gerado pelo sistema
      NULL,  -- Sem organização específica (beta público)
      1,     -- 1 uso por código (exclusivo)
      0,     -- Ainda não usado
      NOW() + INTERVAL '90 days',  -- Válido por 90 dias
      NOW()
    )
    ON CONFLICT (code) DO NOTHING;  -- Ignora se duplicado (improvável)

    i := i + 1;
  END LOOP;

  RAISE NOTICE 'Gerados % códigos de convite', total_codes;
END $$;

-- 2. Criar alguns códigos especiais para equipe (uso ilimitado)
INSERT INTO invite_codes (code, max_uses, expires_at, created_at) VALUES
  ('BETA-TEAM-ADMIN', 999, NOW() + INTERVAL '1 year', NOW()),
  ('BETA-TEAM-DEV', 999, NOW() + INTERVAL '1 year', NOW()),
  ('BETA-VIP-2025', 50, NOW() + INTERVAL '180 days', NOW())
ON CONFLICT (code) DO NOTHING;

-- 3. Verificar quantos códigos foram criados
SELECT
  COUNT(*) as total_codes,
  COUNT(CASE WHEN used_count = 0 THEN 1 END) as unused_codes,
  COUNT(CASE WHEN used_count > 0 THEN 1 END) as used_codes,
  MIN(expires_at) as earliest_expiry,
  MAX(expires_at) as latest_expiry
FROM invite_codes;

-- 4. Exemplo de consulta para pegar os primeiros 10 códigos
SELECT code, max_uses, used_count, expires_at
FROM invite_codes
WHERE used_count < max_uses
  AND (expires_at IS NULL OR expires_at > NOW())
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- QUERIES ÚTEIS PARA GESTÃO
-- =====================================================

-- Ver estatísticas de uso
-- SELECT
--   COUNT(*) as total,
--   SUM(used_count) as total_usages,
--   AVG(used_count) as avg_usage,
--   COUNT(CASE WHEN used_count >= max_uses THEN 1 END) as exhausted_codes
-- FROM invite_codes;

-- Encontrar códigos disponíveis
-- SELECT code FROM invite_codes
-- WHERE used_count < max_uses
--   AND (expires_at IS NULL OR expires_at > NOW())
-- ORDER BY RANDOM()
-- LIMIT 100;

-- Invalidar códigos (exemplo)
-- UPDATE invite_codes
-- SET expires_at = NOW()
-- WHERE code LIKE 'BETA-2025-%'
--   AND used_count = 0;
