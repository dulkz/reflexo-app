-- RLS Policies ativas no Supabase (aplicadas manualmente no dashboard).
-- Versionadas aqui para referência e reprodução em ambiente limpo.
-- Data de versionamento: 2026-05-25

-- TABELA: profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_public_read" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "profiles_own_insert" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_own_update" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- TABELA: sessions
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions_own_read" ON public.sessions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "sessions_own_insert" ON public.sessions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sessions_public_ranking" ON public.sessions
  FOR SELECT TO authenticated USING (true);

-- NOTA: sessions_public_ranking sobrepõe sessions_own_read intencionalmente
-- para permitir que a view ranking leia sessões de todos os usuários.
