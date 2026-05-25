-- Trigger que cria perfil automaticamente ao cadastrar novo usuário.
-- Aplicado manualmente no dashboard em 2026-05-25.
-- Username padrão: parte local do email (antes do @).
-- Archetype padrão: EXPLORADOR.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, archetype)
  values (
    new.id,
    split_part(new.email, '@', 1),
    'EXPLORADOR'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
