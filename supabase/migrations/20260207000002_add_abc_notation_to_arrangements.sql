-- Adicionar coluna abc_notation para partituras visuais
ALTER TABLE user_arrangements ADD COLUMN IF NOT EXISTS abc_notation TEXT;
