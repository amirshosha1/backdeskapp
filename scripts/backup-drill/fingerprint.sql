-- Backdesk · database fingerprint for the backup drill (scripts/backup-drill/drill.sh)
--
-- ONE read-only SELECT over the system catalogs and the backed-up tables. It
-- writes nothing and prints no row data: only object names, counts and md5
-- hashes. Run on the source (production, inside a READ ONLY transaction) and
-- on the restored copy; the drill passes only when every compared row matches.
--
-- Covered schemas: auth, public, private (what the drill dumps). Per object:
--   table      owner, RLS flags, columns (name, type, not null, default)
--   constraint every constraint's definition, per table
--   index      every index definition, per table
--   trigger    every user trigger definition, per table
--   policy     every RLS policy (command, roles, using, with check), per table
--   acl        table and column privileges, per table
--   function   definition, SECURITY DEFINER, settings (search_path), owner, ACL
--   type       enums and their labels; other user types by name and kind
--   sequence   owner, ACL and current value (is_called), per sequence
--   schema     owner, ACL and default privileges, per schema
--   rows       row count, per table
--   data       md5 of every row's text form in a fixed order, per table
-- `info` rows (server version, extensions) are reported, never compared: the
-- restore image is not the hosted server.
--
-- Comparable across databases: privileges are normalised (an empty ACL is
-- its default; entries sorted), roles are compared by name, never by OID, and
-- drill.sh runs this with search_path = pg_catalog so every definition is
-- printed fully schema-qualified whichever role runs it. CHECK constraints and
-- policy USING / WITH CHECK expressions appear here by name (and policies by
-- mode, command and roles) only: their expressions are compared separately,
-- by re-parsing on the restore server (expressions.sql, canonicalize.sql),
-- because their printed text legitimately changes across a dump and restore.

with
target_schemas (nspname) as (values ('auth'), ('public'), ('private')),
ns as (
  select n.oid, n.nspname
  from pg_namespace n join target_schemas t using (nspname)
),
tbl as (
  select c.oid, ns.nspname, c.relname, c.relkind, c.relrowsecurity, c.relforcerowsecurity,
         pg_get_userbyid(c.relowner) as owner, (select string_agg(x::text, ',' order by x::text) from unnest(coalesce(c.relacl, acldefault('r', c.relowner))) x) as relacl
  from pg_class c join ns on ns.oid = c.relnamespace
  where c.relkind in ('r', 'p')
),
cols as (
  select t.oid,
         md5(string_agg(
           format('%s %s %s %s', a.attname, format_type(a.atttypid, a.atttypmod), a.attnotnull,
                  coalesce(pg_get_expr(d.adbin, d.adrelid), '')),
           '|' order by a.attnum)) as h
  from tbl t
  join pg_attribute a on a.attrelid = t.oid and a.attnum > 0 and not a.attisdropped
  left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
  group by t.oid
),
col_acl as (
  select t.oid, md5(coalesce(string_agg(format('%s=%s', a.attname,
                                                  (select string_agg(x::text, ',' order by x::text) from unnest(a.attacl) x)),
                                           '|' order by a.attname), '')) as h
  from tbl t
  join pg_attribute a on a.attrelid = t.oid and a.attnum > 0 and not a.attisdropped and a.attacl is not null
  group by t.oid
),
rows as (
  -- Table identity and structure.
  select 'table' as section, format('%s.%s', t.nspname, t.relname) as object,
         md5(format('owner=%s kind=%s rls=%s force=%s cols=%s', t.owner, t.relkind, t.relrowsecurity,
                    t.relforcerowsecurity, c.h)) as value
  from tbl t join cols c on c.oid = t.oid

  union all
  select 'constraint', format('%s.%s', t.nspname, t.relname),
         md5(string_agg(format('%s %s', k.conname, case when k.contype = 'c' then 'CHECK' else pg_get_constraintdef(k.oid) end), '|' order by k.conname))
  from tbl t join pg_constraint k on k.conrelid = t.oid
  group by t.nspname, t.relname

  union all
  select 'index', format('%s.%s', t.nspname, t.relname),
         md5(string_agg(pg_get_indexdef(i.indexrelid), '|' order by pg_get_indexdef(i.indexrelid)))
  from tbl t join pg_index i on i.indrelid = t.oid
  group by t.nspname, t.relname

  union all
  select 'trigger', format('%s.%s', t.nspname, t.relname),
         md5(string_agg(format('%s %s', g.tgenabled, pg_get_triggerdef(g.oid)), '|' order by g.tgname))
  from tbl t join pg_trigger g on g.tgrelid = t.oid and not g.tgisinternal
  group by t.nspname, t.relname

  union all
  select 'policy', format('%s.%s', p.schemaname, p.tablename),
         md5(string_agg(format('%s %s %s %s using=%s check=%s', p.policyname, p.permissive, p.cmd, p.roles::text,
                               p.qual is not null, p.with_check is not null), '|' order by p.policyname))
  from pg_policies p join target_schemas s on s.nspname = p.schemaname
  group by p.schemaname, p.tablename

  union all
  select 'acl', format('%s.%s', t.nspname, t.relname),
         md5(format('table=%s columns=%s', coalesce(t.relacl, ''), coalesce(ca.h, '')))
  from tbl t left join col_acl ca on ca.oid = t.oid

  union all
  select 'function', format('%s.%s(%s)', ns.nspname, p.proname, pg_get_function_identity_arguments(p.oid)),
         md5(format('def=%s definer=%s config=%s owner=%s acl=%s',
                    case when p.prokind in ('f', 'p', 'w') then pg_get_functiondef(p.oid) else p.prosrc end,
                    p.prosecdef, coalesce(p.proconfig::text, ''), pg_get_userbyid(p.proowner), coalesce((select string_agg(x::text, ',' order by x::text) from unnest(coalesce(p.proacl, acldefault('f', p.proowner))) x), '')))
  from pg_proc p join ns on ns.oid = p.pronamespace
  where p.prokind <> 'a'

  union all
  select 'type', format('%s.%s', ns.nspname, ty.typname),
         md5(format('kind=%s labels=%s', ty.typtype,
                    coalesce((select string_agg(e.enumlabel, ',' order by e.enumsortorder) from pg_enum e where e.enumtypid = ty.oid), '')))
  from pg_type ty join ns on ns.oid = ty.typnamespace
  where ty.typtype in ('e', 'd', 'c')
    and not exists (select 1 from pg_class c where c.reltype = ty.oid and c.relkind <> 'c')

  union all
  select 'sequence', format('%s.%s', ns.nspname, c.relname),
         md5(format('owner=%s acl=%s value=%s', pg_get_userbyid(c.relowner), coalesce((select string_agg(x::text, ',' order by x::text) from unnest(coalesce(c.relacl, acldefault('s', c.relowner))) x), ''),
                    (xpath('/row/v/text()', query_to_xml(
                      format('select last_value || '':'' || is_called as v from %I.%I', ns.nspname, c.relname),
                      false, true, '')))[1]::text))
  from pg_class c join ns on ns.oid = c.relnamespace
  where c.relkind = 'S'

  union all
  select 'schema', ns.nspname,
         md5(format('owner=%s acl=%s defaults=%s', pg_get_userbyid(n.nspowner), coalesce((select string_agg(x::text, ',' order by x::text) from unnest(coalesce(n.nspacl, acldefault('n', n.nspowner))) x), ''),
                    coalesce((select string_agg(format('%s %s %s', pg_get_userbyid(d.defaclrole), d.defaclobjtype,
                                                       (select string_agg(x::text, ',' order by x::text) from unnest(d.defaclacl) x)),
                                                '|' order by pg_get_userbyid(d.defaclrole), d.defaclobjtype)
                              from pg_default_acl d where d.defaclnamespace = n.oid), '')))
  from ns join pg_namespace n on n.oid = ns.oid

  union all
  select 'rows', format('%s.%s', t.nspname, t.relname),
         (xpath('/row/n/text()', query_to_xml(format('select count(*) as n from %I.%I', t.nspname, t.relname), false, true, '')))[1]::text
  from tbl t

  union all
  select 'data', format('%s.%s', t.nspname, t.relname),
         (xpath('/row/h/text()', query_to_xml(
           format('select md5(coalesce(string_agg(r::text, E''\n'' order by r::text), '''')) as h from %I.%I r', t.nspname, t.relname),
           false, true, '')))[1]::text
  from tbl t

  union all
  select 'info', 'server_version', current_setting('server_version')
  union all
  select 'info', 'extensions', (select string_agg(format('%s %s', extname, extversion), ', ' order by extname) from pg_extension)
)
select section, object, value from rows order by section, object;
