-- Permissões para a view ranking e tabela sessions.
-- Aplicadas manualmente no dashboard em 2026-05-24.
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.ranking TO authenticated;
GRANT INSERT ON public.sessions TO authenticated;
GRANT SELECT ON public.sessions TO authenticated;
