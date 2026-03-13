-- Rodar no Supabase Dashboard → SQL Editor
-- Cria tabela de aprovação de novos usuários

CREATE TABLE IF NOT EXISTS public.pending_approvals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  email text NOT NULL,
  name text NOT NULL,
  account_type text DEFAULT 'artist',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Index para queries rápidas por status
CREATE INDEX IF NOT EXISTS idx_pending_approvals_status ON public.pending_approvals(status);
CREATE INDEX IF NOT EXISTS idx_pending_approvals_user_id ON public.pending_approvals(user_id);

-- RLS: apenas usuários autenticados podem ler
ALTER TABLE public.pending_approvals ENABLE ROW LEVEL SECURITY;

-- Leitura: apenas autenticados (admin verifica no frontend)
CREATE POLICY "Authenticated read" ON public.pending_approvals
  FOR SELECT USING (auth.role() = 'authenticated');

-- Escrita: apenas via service_role (API do Vercel)
-- INSERT sem policy = bloqueado para authenticated, liberado para service_role
-- UPDATE/DELETE igual

-- Permite INSERT via anon (notify-signup usa anon key)
CREATE POLICY "Anon insert" ON public.pending_approvals
  FOR INSERT WITH CHECK (true);
