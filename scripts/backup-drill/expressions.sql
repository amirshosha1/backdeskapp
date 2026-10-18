-- Backdesk · backup drill: the source's CHECK constraints and RLS policy
-- expressions, one JSON object per line. Read-only; runs on the source with
-- search_path = pg_catalog so every name is schema-qualified.
--
-- Why a separate check: Postgres stores these as parse trees and prints them
-- back. A dump prints them, a restore parses that text again, and the
-- restored tree may print differently (nested ANDs come back flattened)
-- while meaning the same thing. Comparing the printed text would report a
-- false difference; stripping parentheses or spaces could hide a real one
-- (`a and (b or c)` against `(a and b) or c`). Instead drill.sh parses each
-- source definition on the restore server itself (canonicalize.sql) and
-- compares that with what was restored: same parser, same printer, so only a
-- real difference remains.
with target_schemas (nspname) as (values ('auth'), ('public'), ('private'))
select json_build_object(
         'kind', 'check',
         'tbl', format('%I.%I', n.nspname, c.relname),
         'name', k.conname,
         'def', pg_get_constraintdef(k.oid))::text as line
from pg_constraint k
join pg_class c on c.oid = k.conrelid
join pg_namespace n on n.oid = c.relnamespace
join target_schemas s on s.nspname = n.nspname
where k.contype = 'c'
union all
select json_build_object(
         'kind', 'policy',
         'tbl', format('%I.%I', p.schemaname, p.tablename),
         'name', p.policyname,
         'permissive', p.permissive,
         'cmd', p.cmd,
         'roles', p.roles,
         'qual', p.qual,
         'with_check', p.with_check)::text
from pg_policies p
join target_schemas s on s.nspname = p.schemaname
order by 1;
