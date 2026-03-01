-- ============================================================
-- CORRIGIR RECURSÃO INFINITA NAS POLÍTICAS RLS
-- Rodar no SQL Editor do Supabase
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- PASSO 1: Remover TODAS as políticas antigas das duas tabelas
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_select_own"              ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin"            ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own"              ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"              ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin"            ON public.profiles;

DROP POLICY IF EXISTS "agendamentos_select_own"          ON public.agendamentos;
DROP POLICY IF EXISTS "agendamentos_select_admin"        ON public.agendamentos;
DROP POLICY IF EXISTS "agendamentos_insert_own"          ON public.agendamentos;
DROP POLICY IF EXISTS "agendamentos_update_own"          ON public.agendamentos;
DROP POLICY IF EXISTS "agendamentos_update_admin"        ON public.agendamentos;
DROP POLICY IF EXISTS "agendamentos_delete_admin"        ON public.agendamentos;
DROP POLICY IF EXISTS "agendamentos_delete_own_pendente" ON public.agendamentos;

-- ────────────────────────────────────────────────────────────
-- PASSO 2: Criar função helper que verifica perfil SEM acionar RLS
-- SECURITY DEFINER = executa como owner da função, ignorando RLS
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
-- PASSO 3: Recriar políticas de profiles (sem auto-referência)
-- ────────────────────────────────────────────────────────────

-- Usuário vê o próprio perfil
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Admin vê todos — usa a função helper (sem recursão!)
CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  USING (public.get_my_perfil() = 'administrador');

-- Usuário pode inserir apenas o próprio perfil (signup)
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Usuário atualiza o próprio perfil
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin atualiza qualquer perfil — usa helper
CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  USING (public.get_my_perfil() = 'administrador');

-- ────────────────────────────────────────────────────────────
-- PASSO 4: Recriar políticas de agendamentos (usando helper)
-- ────────────────────────────────────────────────────────────

-- Usuário vê os próprios agendamentos
CREATE POLICY "agendamentos_select_own"
  ON public.agendamentos FOR SELECT
  USING (auth.uid() = user_id);

-- Admin vê todos
CREATE POLICY "agendamentos_select_admin"
  ON public.agendamentos FOR SELECT
  USING (public.get_my_perfil() = 'administrador');

-- Usuário cria agendamento para si mesmo
CREATE POLICY "agendamentos_insert_own"
  ON public.agendamentos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuário edita os próprios agendamentos
CREATE POLICY "agendamentos_update_own"
  ON public.agendamentos FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admin edita qualquer agendamento (incluindo mudar status)
CREATE POLICY "agendamentos_update_admin"
  ON public.agendamentos FOR UPDATE
  USING (public.get_my_perfil() = 'administrador');

-- Usuário pode excluir os próprios agendamentos pendentes
CREATE POLICY "agendamentos_delete_own_pendente"
  ON public.agendamentos FOR DELETE
  USING (auth.uid() = user_id AND status = 'pendente');

-- Admin pode excluir qualquer agendamento
CREATE POLICY "agendamentos_delete_admin"
  ON public.agendamentos FOR DELETE
  USING (public.get_my_perfil() = 'administrador');

-- ────────────────────────────────────────────────────────────
-- VERIFICAÇÃO: Confirmar que as políticas foram criadas
-- ────────────────────────────────────────────────────────────
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('profiles', 'agendamentos')
ORDER BY tablename, policyname;
