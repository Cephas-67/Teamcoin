-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ Migration : cree automatiquement un profil dans public.profiles a         ║
-- ║ chaque nouvel utilisateur inscrit dans auth.users.                        ║
-- ║                                                                          ║
-- ║ Sans ce trigger, apres verifyEmailOtp() le user existe dans auth.users   ║
-- ║ mais fetchRole() renvoie null -> SmartDashboard bloque sur                ║
-- ║ "Compte en attente de configuration".                                    ║
-- ║                                                                          ║
-- ║ Le role peut ensuite etre modifie via UPDATE si l'utilisateur passe par  ║
-- ║ l'ecran /onboarding en choisissant "Chef quartier" ou "Agent Mairie".    ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- Fonction : cree un profil miroir a chaque insert dans auth.users.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, email)
  values (
    new.id,
    -- Role par defaut : chef_quartier. Modifiable ensuite via
    -- /onboarding ou une page settings.
    coalesce(new.raw_user_meta_data ->> 'role', 'chef_quartier'),
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      split_part(new.email, '@', 1)
    ),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Trigger : declenche apres chaque insert dans auth.users.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Backfill : cree des profils pour les users deja existants qui n'en ont pas.
insert into public.profiles (id, role, full_name, email)
select
  u.id,
  'chef_quartier',
  coalesce(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1)),
  u.email
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
