-- Auto-creates a row in public.profiles whenever a new user signs up via Supabase Auth.
-- Without this, a user can sign up but have no profiles row, which silently breaks
-- any logic that reads/updates token_balance or last_login_bonus (e.g. daily login bonus).

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, token_balance, last_login_bonus)
  values (new.id, 0, null)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
