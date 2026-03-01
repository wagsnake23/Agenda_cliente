-- ============================================================
-- ATUALIZAÇÃO DE SEGURANÇA E VISIBILIDADE (RLS)
-- Rodar no SQL Editor do Supabase
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- PASSO 1: Limpeza Completa (Remover Políticas Antigas)
-- ────────────────────────────────────────────────────────────
DO $$ 
BEGIN
    -- Limpa políticas de profiles
    DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
    DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
    DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
    DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
    DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
    DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
    DROP POLICY IF EXISTS "profiles_all_admin" ON public.profiles;
    
    -- Limpa políticas de agendamentos
    DROP POLICY IF EXISTS "agendamentos_select_own" ON public.agendamentos;
    DROP POLICY IF EXISTS "agendamentos_select_admin" ON public.agendamentos;
    DROP POLICY IF EXISTS "agendamentos_insert_own" ON public.agendamentos;
    DROP POLICY IF EXISTS "agendamentos_update_own" ON public.agendamentos;
    DROP POLICY IF EXISTS "agendamentos_update_admin" ON public.agendamentos;
    DROP POLICY IF EXISTS "agendamentos_delete_admin" ON public.agendamentos;
    DROP POLICY IF EXISTS "agendamentos_delete_own_pendente" ON public.agendamentos;
    DROP POLICY IF EXISTS "agendamentos_select_authenticated" ON public.agendamentos;
    DROP POLICY IF EXISTS "agendamentos_all_own" ON public.agendamentos;
    DROP POLICY IF EXISTS "agendamentos_all_admin" ON public.agendamentos;
    DROP POLICY IF EXISTS "agendamentos_update_delete_own" ON public.agendamentos;
END $$;

-- ────────────────────────────────────────────────────────────
-- PASSO 2: Função Helper para Perfil
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_perfil()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER             -- ignora RLS ao consultar a tabela
SET search_path = public
AS $$
  SELECT perfil
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- ────────────────────────────────────────────────────────────
-- PASSO 3: Políticas da Tabela 'profiles'
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- VISIBILIDADE: Todos os usuários autenticados (Conferentes e Admins) podem ver todos os perfis
-- Isso permite ver os avatars e nomes dos outros usuários no sistema.
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- EDIÇÃO: Usuário só edita o próprio perfil
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ADMIN: Admin pode gerenciar qualquer perfil
CREATE POLICY "profiles_all_admin"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.get_my_perfil() = 'administrador');

-- ────────────────────────────────────────────────────────────
-- PASSO 4: Políticas da Tabela 'agendamentos'
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

-- VISIBILIDADE: Todos os usuários autenticados podem ver todos os agendamentos registrados
-- Garante que Conferentes visualizem o mapa completo de escalas.
CREATE POLICY "agendamentos_select_authenticated"
  ON public.agendamentos FOR SELECT
  TO authenticated
  USING (true);

-- CRIAÇÃO: Usuário pode criar agendamentos apenas para si mesmo
CREATE POLICY "agendamentos_insert_authenticated"
  ON public.agendamentos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- EDIÇÃO/EXCLUSÃO PRÓPRIA: Usuários podem gerenciar seus próprios agendamentos
CREATE POLICY "agendamentos_manage_own"
  ON public.agendamentos FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- ADMIN: Admin pode gerenciar TUDO (mudar status de qualquer um, excluir qualquer um)
CREATE POLICY "agendamentos_all_admin"
  ON public.agendamentos FOR ALL
  TO authenticated
  USING (public.get_my_perfil() = 'administrador');

-- ────────────────────────────────────────────────────────────
-- VERIFICAÇÃO FINAL
-- ────────────────────────────────────────────────────────────
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('profiles', 'agendamentos')
ORDER BY tablename, policyname;
