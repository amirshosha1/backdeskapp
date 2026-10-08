-- Backdesk · migration 1: accounts (Google sign-in) and apartments saved to the account.
-- Phase 0a/0b, slice 1 (docs/BUILD_PLAN.md). Forward-only: never edit this file
-- after it has been pushed; change things in a new migration.
--
-- What it creates:
--   profiles          one per user: the first-run answer "how many apartments"
--   orgs              one personal org per user, created at sign-up
--   org_members       who belongs to which org, with a role
--   org_entitlements  plan, apartment limit, trial and paid-until dates.
--                     Users read it; only the project owner changes it
--                     (Supabase dashboard). No user can insert, update or
--                     delete it.
--   units             the user's apartments: name, operating model and the
--                     calculator's inputs. At most `max_units` per org (5).
--
-- How access is controlled (proved by tests/db/, checked on the real
-- project by docs/verify_after_migration.sql):
--   1. Grants decide which columns a role may touch at all. anon gets nothing.
--      authenticated gets SELECT, plus INSERT/UPDATE on named content columns
--      only. Plan, trial and paid-until dates, ownership (org_id on update,
--      created_by), ids and timestamps are never writable by a user: Postgres
--      rejects the statement with 42501 before any row is read.
--   2. Row Level Security on every table decides which rows: only the rows of
--      orgs the user is a member of, resolved from auth.uid().
--   3. Triggers set ownership and timestamps themselves and enforce the
--      apartment limit, so a request cannot supply them.
--   4. Helper functions live in the `private` schema, which the Data API does
--      not expose. The one callable function, public.delete_my_account(), acts
--      only on the caller (auth.uid()) and only signed-in users may run it.

-- 1. Nothing new in `public` is reachable by default -------------------------
-- Older Supabase projects grant every new table and function in `public` to
-- anon and authenticated automatically. Remove those defaults so exposure is
-- always an explicit GRANT in a migration.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on functions from anon, authenticated;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;
comment on schema private is
  'Helper and trigger functions. Not exposed by the Data API.';

-- 2. Tables --------------------------------------------------------------------
create table public.orgs (
  id uuid primary key default gen_random_uuid(),
  name text check (name is null or (char_length(btrim(name)) between 1 and 100)),
  type text not null default 'individual' check (type in ('individual', 'company')),
  country char(2) not null default 'EG',
  default_currency char(3) not null default 'EGP' check (default_currency ~ '^[A-Z]{3}$'),
  timezone text not null default 'Africa/Cairo',
  created_at timestamptz not null default now()
);
comment on table public.orgs is
  'An account''s books. Every user gets a personal org at sign-up (name null). Read-only for users.';

create table public.org_members (
  org_id uuid not null references public.orgs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member', 'accountant')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);
create index org_members_user_id_idx on public.org_members (user_id);
comment on table public.org_members is
  'Org membership and role. Unit owners are never members (CLAUDE.md §6.10). Read-only for users.';

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  apartment_count_answer text check (apartment_count_answer in ('1', '2-3', '4-10', '10+')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is
  'One row per user, created at sign-up. The Google name and email stay in auth.users; nothing personal is copied here.';
comment on column public.profiles.apartment_count_answer is
  'The first-run answer to "how many apartments do you have?" (a range). The only column a user may change.';

create table public.org_entitlements (
  org_id uuid primary key references public.orgs (id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  max_units smallint not null default 5 check (max_units between 1 and 1000),
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  paid_until timestamptz,
  is_founding boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (trial_started_at is null or trial_ends_at is null or trial_ends_at > trial_started_at)
);
comment on table public.org_entitlements is
  'What an org may use. Created at sign-up (free, 5 apartments, no trial clock). Users can read it; only the project owner changes it, in the Supabase dashboard. Gating and the trial clock arrive in Phase 7.';
comment on column public.org_entitlements.max_units is
  'The most apartments the org can hold. 5 is the self-serve maximum; raise it here for a custom plan.';

create table public.units (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  name text not null check (
    char_length(name) between 1 and 60
    and btrim(name) <> ''
    and name !~ '[[:cntrl:]]'
  ),
  operating_model text not null check (
    operating_model in ('owner_operated', 'rental_arbitrage', 'managed_for_owner')
  ),
  currency char(3) not null default 'EGP' check (currency ~ '^[A-Z]{3}$'),
  calculator_inputs jsonb not null check (
    jsonb_typeof(calculator_inputs) = 'object'
    and octet_length(calculator_inputs::text) <= 8192
  ),
  engine_version text not null check (engine_version ~ '^[0-9]{1,4}\.[0-9]{1,4}\.[0-9]{1,4}$'),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index units_org_id_idx on public.units (org_id);
create index units_created_by_idx on public.units (created_by);
comment on table public.units is
  'An apartment. Created minimal here; Phase 3 and Phase 5 extend this same table (never a second units table).';
comment on column public.units.calculator_inputs is
  'The feasibility calculator''s inputs for this apartment ({form, assumed}), validated by the app (Zod) before it is written. Inputs only, never results.';
comment on column public.units.engine_version is
  'ENGINE_VERSION (src/lib/finance/version.ts) the inputs were saved with.';

-- 3. Membership helpers (used by the RLS policies) --------------------------------
-- SECURITY DEFINER so a policy can read org_members without recursing into
-- org_members' own policy. Both act only on auth.uid().
create function private.member_org_ids()
returns setof uuid
language sql stable security definer
set search_path = ''
as $$
  select m.org_id from public.org_members m where m.user_id = (select auth.uid());
$$;

create function private.editor_org_ids()
returns setof uuid
language sql stable security definer
set search_path = ''
as $$
  select m.org_id from public.org_members m
  where m.user_id = (select auth.uid()) and m.role in ('owner', 'admin', 'member');
$$;

revoke all on function private.member_org_ids() from public;
revoke all on function private.editor_org_ids() from public;
grant execute on function private.member_org_ids() to authenticated;
grant execute on function private.editor_org_ids() to authenticated;

-- 4. Row Level Security -------------------------------------------------------------
alter table public.orgs enable row level security;
alter table public.org_members enable row level security;
alter table public.profiles enable row level security;
alter table public.org_entitlements enable row level security;
alter table public.units enable row level security;

create policy "members read their orgs" on public.orgs
  for select to authenticated
  using (id in (select private.member_org_ids()));

create policy "users read their own memberships" on public.org_members
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "users read their own profile" on public.profiles
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "users update their own profile" on public.profiles
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "members read their org's entitlements" on public.org_entitlements
  for select to authenticated
  using (org_id in (select private.member_org_ids()));

create policy "members read their org's apartments" on public.units
  for select to authenticated
  using (org_id in (select private.member_org_ids()));

create policy "editors add apartments to their org" on public.units
  for insert to authenticated
  with check (org_id in (select private.editor_org_ids()));

create policy "editors change their org's apartments" on public.units
  for update to authenticated
  using (org_id in (select private.editor_org_ids()))
  with check (org_id in (select private.editor_org_ids()));

create policy "editors delete their org's apartments" on public.units
  for delete to authenticated
  using (org_id in (select private.editor_org_ids()));

-- No other policies: org_entitlements, org_members and orgs have no write
-- policy for anyone, and authenticated has no write grant on them either.

-- 5. Grants: which columns a role may touch ---------------------------------------
revoke all on table public.orgs, public.org_members, public.profiles, public.org_entitlements, public.units
  from public, anon, authenticated;

grant select on table public.orgs, public.org_members, public.org_entitlements to authenticated;

grant select on table public.profiles to authenticated;
grant update (apartment_count_answer) on table public.profiles to authenticated;

grant select, delete on table public.units to authenticated;
grant insert (org_id, name, operating_model, calculator_inputs, engine_version) on table public.units to authenticated;
grant update (name, operating_model, calculator_inputs, engine_version) on table public.units to authenticated;

-- 6. Triggers: timestamps, ownership and the apartment limit ------------------------
create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.created_at := old.created_at;
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

create trigger org_entitlements_set_updated_at
  before update on public.org_entitlements
  for each row execute function private.set_updated_at();

-- On insert: ownership and timestamps come from the session, never the
-- request; then the apartment limit. SECURITY DEFINER because it reads
-- org_entitlements and locks the org row, which users cannot do themselves.
create function private.units_before_insert()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_limit integer;
  v_count integer;
begin
  new.created_by := v_uid;
  new.created_at := now();
  new.updated_at := now();

  -- The RLS policy checks membership again after this trigger. Checking it
  -- here first means the lock below is never taken on someone else's org and
  -- the limit error never reveals another org's apartment count.
  if v_uid is not null and not exists (select 1 from private.editor_org_ids() as e(org_id) where e.org_id = new.org_id) then
    raise exception using
      errcode = '42501',
      message = 'new row violates row-level security policy for table "units"';
  end if;

  -- Serialise inserts per org: two requests at 4 apartments cannot both pass.
  perform 1 from public.orgs o where o.id = new.org_id for update;

  select e.max_units into v_limit from public.org_entitlements e where e.org_id = new.org_id;
  select count(*) into v_count from public.units u where u.org_id = new.org_id;

  if v_count >= coalesce(v_limit, 0) then
    raise exception using
      errcode = 'P0001',
      message = 'unit_limit_reached',
      detail = format('This account can hold %s apartments.', coalesce(v_limit, 0)),
      hint = 'More than 5 apartments is a custom plan, agreed by contact.';
  end if;

  return new;
end;
$$;

create trigger units_before_insert
  before insert on public.units
  for each row execute function private.units_before_insert();

create function private.units_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.created_by := old.created_by;
  new.created_at := old.created_at;
  new.updated_at := now();
  return new;
end;
$$;

create trigger units_before_update
  before update on public.units
  for each row execute function private.units_before_update();

revoke all on function private.set_updated_at() from public;
revoke all on function private.units_before_insert() from public;
revoke all on function private.units_before_update() from public;

-- 7. Sign-up: profile, personal org, owner membership, entitlements ---------------
-- Org creation is its own function so Phase 5 can change when it happens
-- (invited users may not need a personal org) in a new migration.
create function private.create_personal_org(p_user_id uuid)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_org_id uuid;
begin
  insert into public.orgs default values returning id into v_org_id;
  insert into public.org_members (org_id, user_id, role) values (v_org_id, p_user_id, 'owner');
  insert into public.org_entitlements (org_id) values (v_org_id);
  return v_org_id;
end;
$$;

create function private.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id) values (new.id) on conflict (user_id) do nothing;
  if not exists (select 1 from public.org_members m where m.user_id = new.id) then
    perform private.create_personal_org(new.id);
  end if;
  return new;
end;
$$;

revoke all on function private.create_personal_org(uuid) from public;
revoke all on function private.handle_new_user() from public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Users who signed up before this migration get the same rows.
do $$
declare
  u record;
begin
  for u in select id from auth.users loop
    insert into public.profiles (user_id) values (u.id) on conflict (user_id) do nothing;
    if not exists (select 1 from public.org_members m where m.user_id = u.id) then
      perform private.create_personal_org(u.id);
    end if;
  end loop;
end;
$$;

-- 8. Account deletion, without a service-role key -----------------------------------
-- Called by the signed-in user through the Data API (rpc/delete_my_account).
-- Takes no argument: it can only ever delete the caller. Orgs where the caller
-- is the only member go with them (their apartments and entitlements cascade);
-- then the auth user, which cascades to the profile, memberships, the Google
-- identity and the sessions. The caller's current access token stays valid
-- until it expires (at most an hour) but no longer matches any row; the app
-- signs out right after.
create function public.delete_my_account()
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception using errcode = '42501', message = 'not_authenticated';
  end if;

  delete from public.orgs o
  where o.id in (select m.org_id from public.org_members m where m.user_id = v_uid)
    and not exists (
      select 1 from public.org_members other
      where other.org_id = o.id and other.user_id <> v_uid
    );

  delete from auth.users where id = v_uid;
end;
$$;

revoke all on function public.delete_my_account() from public, anon, authenticated;
grant execute on function public.delete_my_account() to authenticated;
comment on function public.delete_my_account() is
  'Deletes the signed-in caller''s account and everything that belongs only to them. No arguments: it acts on auth.uid() alone.';
