-- Constraint UNIQUE para idempotência do upsert de sessões.
-- Evita duplicatas ao re-migrar sessões locais no login.
-- Aplicada manualmente no dashboard em 2026-05-24.
ALTER TABLE public.sessions
  ADD CONSTRAINT sessions_user_played_mode_unique UNIQUE (user_id, played_at, mode);
