-- Backdesk · read-only checks after migration 20261008180000_accounts_and_units
--
-- Where: Supabase dashboard → SQL Editor → New query. Paste this whole file and Run.
-- What it does: ONE select statement over the system catalogs. It writes nothing,
-- and it prints only names, PASS/FAIL/INFO and counts: no emails, no keys, no data.
-- What to send back: the result table (every row). Each row should say PASS;
-- INFO rows are context. A FAIL row says what is wrong in the "detail" column.
--
-- The same file runs in `pnpm test:db` (tests/db/verify.test.ts) against
-- the local test database, where every row passes, and where deliberately
-- broken setups make the matching row FAIL.

with
expected_tables (table_name) as (
  values ('orgs'), ('org_members'), ('profiles'), ('org_entitlements'), ('units')
),
public_tables as (
  select c.oid, c.relname, c.relrowsecurity
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind in ('r', 'p')
),
app_columns as (
  select t.relname as table_name, a.attname as column_name, t.oid
  from public_tables t
  join expected_tables e on e.table_name = t.relname
  join pg_attribute a on a.attrelid = t.oid and a.attnum > 0 and not a.attisdropped
),
-- The only column writes a signed-in user may make. Every other INSERT or
-- UPDATE on these five tables must be denied: plan, limits, trial and paid-until
-- dates, ownership, ids and timestamps.
allowed_writes (table_name, column_name, privilege) as (
  values
    ('profiles', 'apartment_count_answer', 'UPDATE'),
    ('units', 'org_id', 'INSERT'),
    ('units', 'name', 'INSERT'),
    ('units', 'name', 'UPDATE'),
    ('units', 'operating_model', 'INSERT'),
    ('units', 'operating_model', 'UPDATE'),
    ('units', 'calculator_inputs', 'INSERT'),
    ('units', 'calculator_inputs', 'UPDATE'),
    ('units', 'engine_version', 'INSERT'),
    ('units', 'engine_version', 'UPDATE')
),
column_writes as (
  select c.table_name, c.column_name, p.privilege,
         has_column_privilege('authenticated', c.oid, c.column_name, p.privilege) as granted,
         exists (
           select 1 from allowed_writes w
           where w.table_name = c.table_name and w.column_name = c.column_name and w.privilege = p.privilege
         ) as allowed
  from app_columns c
  cross join (values ('INSERT'), ('UPDATE')) as p (privilege)
),
app_functions as (
  select p.oid, p.proname, n.nspname, p.prosecdef, p.proconfig, p.pronargs, p.proowner,
         coalesce(p.proacl, acldefault('f', p.proowner)) as acl
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('public', 'private')
),
auth_users_triggers as (
  select t.tgname, t.tgenabled, pn.nspname || '.' || p.proname as fn
  from pg_trigger t
  join pg_proc p on p.oid = t.tgfoid
  join pg_namespace pn on pn.oid = p.pronamespace
  where t.tgrelid = to_regclass('auth.users') and not t.tgisinternal
),
delete_fn as (
  select f.* from app_functions f where f.nspname = 'public' and f.proname = 'delete_my_account'
),
checks (sort, check_name, result, detail) as (
  select 10, 'the five tables exist',
         case when count(t.oid) = 5 then 'PASS' else 'FAIL' end,
         coalesce('missing: ' || string_agg(e.table_name, ', ') filter (where t.oid is null), 'orgs, org_members, profiles, org_entitlements, units')
  from expected_tables e
  left join public_tables t on t.relname = e.table_name

  union all
  select 20, 'Row Level Security is on for every table in public',
         case when count(*) filter (where not relrowsecurity) = 0 and count(*) > 0 then 'PASS' else 'FAIL' end,
         coalesce('RLS OFF: ' || string_agg(relname, ', ') filter (where not relrowsecurity), count(*) || ' tables, RLS on for all')
  from public_tables

  union all
  select 30, 'anon (signed out) has no privilege on any table or column in public',
         case when count(*) = 0 then 'PASS' else 'FAIL' end,
         coalesce('anon can reach: ' || string_agg(relname, ', '), 'none reachable')
  from public_tables
  where has_table_privilege('anon', oid, 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER')
     or has_any_column_privilege('anon', oid, 'SELECT, INSERT, UPDATE, REFERENCES')

  union all
  select 31, 'no function in public or private can be run by anon or by everyone (PUBLIC)',
         case when count(*) = 0 then 'PASS' else 'FAIL' end,
         coalesce('runnable: ' || string_agg(nspname || '.' || proname, ', '), 'none')
  from app_functions
  where has_function_privilege('anon', oid, 'EXECUTE')
     or exists (select 1 from aclexplode(acl) a where a.grantee = 0 and a.privilege_type = 'EXECUTE')

  union all
  select 40, 'signed-in users cannot write plan, limits, dates, ownership, ids or timestamps',
         case when count(*) filter (where granted and not allowed) = 0 and count(*) > 0 then 'PASS' else 'FAIL' end,
         coalesce('writable but must not be: ' || string_agg(table_name || '.' || column_name || ' ' || privilege, ', ') filter (where granted and not allowed),
                  count(*) filter (where not granted) || ' column writes denied')
  from column_writes

  union all
  select 41, 'signed-in users can write the apartment and profile fields the app needs',
         case when count(*) filter (where allowed and not granted) = 0 and count(*) filter (where allowed) = 10 then 'PASS' else 'FAIL' end,
         coalesce('missing grant: ' || string_agg(table_name || '.' || column_name || ' ' || privilege, ', ') filter (where allowed and not granted),
                  count(*) filter (where allowed and granted) || ' of 10 granted')
  from column_writes

  union all
  select 42, 'signed-in users can delete only apartments (and never truncate, reference or trigger)',
         case when count(*) filter (where bad) = 0 and count(*) = 5 then 'PASS' else 'FAIL' end,
         coalesce('wrong table privilege on: ' || string_agg(relname, ', ') filter (where bad), 'DELETE on units only')
  from (
    select t.relname,
           has_table_privilege('authenticated', t.oid, 'DELETE') <> (t.relname = 'units')
           or has_table_privilege('authenticated', t.oid, 'TRUNCATE, REFERENCES, TRIGGER') as bad
    from public_tables t
    join expected_tables e on e.table_name = t.relname
  ) x

  union all
  select 50, 'sign-up trigger on auth.users is installed and enabled',
         case when count(*) filter (where tgname = 'on_auth_user_created' and tgenabled in ('O', 'A') and fn = 'private.handle_new_user') = 1 then 'PASS' else 'FAIL' end,
         coalesce(string_agg(tgname || ' → ' || fn || ' (enabled: ' || tgenabled::text || ')', ', '), 'no trigger on auth.users')
  from auth_users_triggers

  union all
  select 51, 'apartment-limit trigger on units is installed and enabled',
         case when count(*) = 1 then 'PASS' else 'FAIL' end,
         coalesce(string_agg(t.tgname, ', '), 'missing')
  from pg_trigger t
  where t.tgrelid = to_regclass('public.units') and t.tgname = 'units_before_insert' and t.tgenabled in ('O', 'A')

  union all
  select 60, 'postgres holds DELETE on auth.users (needed by delete_my_account)',
         case when coalesce(has_table_privilege('postgres', to_regclass('auth.users'), 'DELETE'), false) then 'PASS' else 'FAIL' end,
         case when coalesce(has_table_privilege('postgres', to_regclass('auth.users'), 'DELETE'), false)
              then 'yes'
              else 'NO: account deletion as built cannot work; stop and choose another deletion method before PR B' end

  union all
  select 61, 'the owner of delete_my_account can delete from auth.users',
         case when count(*) = 1 and bool_and(coalesce(has_table_privilege(proowner, to_regclass('auth.users'), 'DELETE'), false)) then 'PASS' else 'FAIL' end,
         coalesce(string_agg('owner: ' || pg_get_userbyid(proowner), ', '), 'delete_my_account is missing')
  from delete_fn

  union all
  select 62, 'delete_my_account: no arguments, SECURITY DEFINER, runnable by signed-in users only',
         case when count(*) = 1
                   and bool_and(pronargs = 0 and prosecdef
                                and has_function_privilege('authenticated', oid, 'EXECUTE')
                                and not has_function_privilege('anon', oid, 'EXECUTE')
                                and not exists (select 1 from aclexplode(acl) a where a.grantee = 0 and a.privilege_type = 'EXECUTE'))
              then 'PASS' else 'FAIL' end,
         coalesce(string_agg('args: ' || pronargs || ', definer: ' || prosecdef
                             || ', authenticated: ' || has_function_privilege('authenticated', oid, 'EXECUTE')
                             || ', anon: ' || has_function_privilege('anon', oid, 'EXECUTE'), ', '), 'missing')
  from delete_fn

  union all
  select 70, 'every SECURITY DEFINER function pins an empty search_path',
         case when count(*) = 0 then 'PASS' else 'FAIL' end,
         coalesce('unpinned: ' || string_agg(nspname || '.' || proname, ', '), 'all pinned')
  from app_functions
  where prosecdef and not coalesce(proconfig @> array['search_path=""'], false)

  union all
  select 80, 'every user has a profile, an owner membership and an entitlements row',
         case when count(*) filter (where not complete) = 0 then 'PASS' else 'FAIL' end,
         'users: ' || count(*) || ', incomplete: ' || count(*) filter (where not complete)
  from (
    select exists (select 1 from public.profiles p where p.user_id = u.id)
           and exists (
             select 1 from public.org_members m
             join public.org_entitlements e on e.org_id = m.org_id
             where m.user_id = u.id and m.role = 'owner'
           ) as complete
    from auth.users u
  ) x

  union all
  select 90, 'Data API exposed schemas (the private schema must not be listed)',
         case when string_agg(c, ', ') ~ '\mprivate\M' then 'FAIL' else 'INFO' end,
         coalesce(string_agg(c, ', '), 'not stored in the database; check Settings → Data API → Exposed schemas')
  from pg_roles r, unnest(r.rolconfig) as c
  where r.rolname = 'authenticator' and c like 'pgrst.db_schemas=%'

  union all
  select 91, 'context', 'INFO',
         'Postgres ' || current_setting('server_version')
         || '; public.units owned by ' || coalesce((select pg_get_userbyid(c.relowner) from pg_class c where c.oid = to_regclass('public.units')), '?')
         || '; checked as ' || current_user
)
select check_name, result, detail
from checks
order by sort;
