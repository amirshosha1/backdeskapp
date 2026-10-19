-- Read-only post-deployment check for 20261012100000_preserve_fk_set_null.sql
-- and 20261017142500_guard_shared_org_deletion.sql.
-- Run after an authorized migration, alongside verify_after_migration.sql.
-- One catalog-only SELECT; no account data, DML, or migration execution.
with facts as (
  select
    (select count(*) from pg_constraint c
      where c.conrelid = 'public.units'::regclass
        and c.confrelid = 'auth.users'::regclass
        and c.contype = 'f' and c.confdeltype = 'n'
        and c.conkey = array[(select a.attnum from pg_attribute a
          where a.attrelid = 'public.units'::regclass and a.attname = 'created_by')]::smallint[]) as fk_count,
    (select count(*) from pg_trigger t
      where t.tgrelid = 'public.units'::regclass
        and t.tgname = 'units_before_update'
        and not t.tgisinternal and t.tgenabled in ('O', 'A')
        and (t.tgtype & 1) = 1 and (t.tgtype & 2) = 2 and (t.tgtype & 16) = 16
        and t.tgfoid = 'private.units_before_update()'::regprocedure) as trigger_count,
    (select pg_get_functiondef('private.units_before_update()'::regprocedure)) as body,
    (select p.prosecdef from pg_proc p where p.oid = 'private.units_before_update()'::regprocedure) as security_definer,
    (select p.proconfig from pg_proc p where p.oid = 'private.units_before_update()'::regprocedure) as function_config,
    (select pg_get_functiondef('public.delete_my_account()'::regprocedure)) as delete_body
), checks (check_name, result, detail) as (
  select 'created_by FK sets NULL when auth user is deleted',
    case when fk_count = 1 then 'PASS' else 'FAIL' end,
    'matching FK count: ' || fk_count from facts
  union all
  select 'units BEFORE UPDATE row trigger is enabled',
    case when trigger_count = 1 then 'PASS' else 'FAIL' end,
    'matching trigger count: ' || trigger_count from facts
  union all
  select 'update trigger allows only a deleted author to be cleared by a nested update',
    case when body ~* 'pg_trigger_depth\(\)\s*>\s*1'
           and body ~* 'old\.created_by\s+is\s+not\s+null'
           and body ~* 'new\.created_by\s+is\s+null'
           and body ~* 'not\s+exists\s*\(\s*select\s+1\s+from\s+auth\.users'
           and body ~* 'new\.created_by\s*:=\s*old\.created_by'
           and body ~* 'new\.created_at\s*:=\s*old\.created_at'
           and body ~* 'new\.updated_at\s*:=\s*now\(\)'
      then 'PASS' else 'FAIL' end,
    'installed function has expected guard and assignments' from facts
  union all
  select 'trigger function uses invoker rights and empty search path',
    case when security_definer = false and function_config @> array['search_path=""']
      then 'PASS' else 'FAIL' end,
    'invoker rights; search_path pinned' from facts
  union all
  select 'authenticated cannot update created_by directly',
    case when not has_column_privilege('authenticated', 'public.units', 'created_by', 'UPDATE')
      then 'PASS' else 'FAIL' end,
    'created_by UPDATE grant denied'
  union all
  select 'account deletion serializes orgs and requires a remaining manager',
    case when delete_body ~* 'for\s+update\s+of\s+o'
           and delete_body ~* 'shared_org_requires_owner_transfer'
      then 'PASS' else 'FAIL' end,
    'installed function locks orgs and checks remaining owner/admin' from facts
)
select check_name, result, detail from checks;
