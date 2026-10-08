-- A minimal stand-in for the parts of Supabase the migrations depend on,
-- for `pnpm test:db` (scripts/test-db.sh). Run as `supabase_admin`, the
-- cluster's superuser, before any migration.
--
-- It mirrors Supabase where it matters for access control:
--   * the roles: `postgres` (owns the app's objects, not a superuser),
--     `anon`, `authenticated`, `service_role`, `authenticator` (the Data
--     API's login role, which switches to anon/authenticated per request)
--     and `supabase_auth_admin` (the role Supabase Auth writes users as);
--   * `auth.users` owned by `supabase_auth_admin`, and `auth.uid()`,
--     `auth.role()` and `auth.jwt()` defined as Supabase defines them;
--   * the permissive default grants older Supabase projects give every new
--     table and function in `public` to anon and authenticated. They are
--     the worst case: the migrations must revoke them, and the tests prove
--     that they do.
--
-- Assumptions checked on the real project by docs/verify_after_migration.sql:
-- `postgres` may delete from, and create triggers on, `auth.users`.
-- Not mirrored: PostgREST itself, Postgres 17 (this runs on the local major
-- version), Supabase's other schemas (storage, realtime, extensions).

-- Roles ---------------------------------------------------------------------
create role postgres with login createrole createdb replication bypassrls;
create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;
create role authenticator with login noinherit;
create role supabase_auth_admin with login noinherit createrole;
grant anon, authenticated, service_role to authenticator;
grant anon, authenticated, service_role to postgres;

-- The database belongs to `postgres`, as on Supabase; so does `public`
-- (owned by pg_database_owner since Postgres 15).
alter database backdesk_test owner to postgres;
grant usage on schema public to anon, authenticated, service_role;

-- auth ------------------------------------------------------------------------
create schema auth authorization supabase_auth_admin;
grant usage on schema auth to anon, authenticated, service_role, postgres;

create table auth.users (
  instance_id uuid,
  id uuid primary key,
  aud varchar(255),
  role varchar(255),
  email varchar(255),
  raw_app_meta_data jsonb,
  raw_user_meta_data jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table auth.users owner to supabase_auth_admin;

-- Two of the tables Supabase Auth cascades from auth.users: deleting a user
-- must take the Google identity and the sessions with it.
create table auth.identities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null,
  identity_data jsonb
);
alter table auth.identities owner to supabase_auth_admin;

create table auth.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade
);
alter table auth.sessions owner to supabase_auth_admin;

grant select, insert, update, delete, references, trigger on auth.users to postgres;
grant select, insert, update, delete on auth.identities, auth.sessions to postgres;

create function auth.uid() returns uuid
language sql stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;

create function auth.role() returns text
language sql stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;

create function auth.jwt() returns jsonb
language sql stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')
  )::jsonb
$$;

alter function auth.uid() owner to supabase_auth_admin;
alter function auth.role() owner to supabase_auth_admin;
alter function auth.jwt() owner to supabase_auth_admin;

-- The old permissive defaults (worst case) -----------------------------------
alter default privileges for role postgres in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  grant all on functions to anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  grant all on sequences to anon, authenticated, service_role;

-- The Supabase CLI's migration history -----------------------------------------
create schema supabase_migrations;
create table supabase_migrations.schema_migrations (
  version text primary key,
  statements text[],
  name text
);
grant usage on schema supabase_migrations to postgres;
grant select, insert on supabase_migrations.schema_migrations to postgres;
