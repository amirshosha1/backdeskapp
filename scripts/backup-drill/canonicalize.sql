-- Backdesk · backup drill: compare the source's CHECK constraints and policy
-- expressions with the restored copy, on the restore server only.
--
-- Runs inside ONE transaction that drill.sh always rolls back, in the
-- throwaway container: each source definition is attached to its restored
-- table as a scratch constraint or policy, printed back by the same server
-- that restored the dump, and compared with the restored object. Nothing it
-- creates survives the rollback. Prints one line per mismatch
-- (kind, table, name, what differs) and nothing when everything matches.
--
-- Input: temp table drill_src(line text), one JSON object per line, from
-- expressions.sql run on the source.

create temp table drill_canon (kind text, tbl text, name text, def text, qual text, with_check text, error text) on commit drop;

do $$
declare
  s jsonb;
  v_def text;
  v_qual text;
  v_wc text;
  v_roles text;
begin
  for s in select line::jsonb from drill_src loop
    begin
      if s->>'kind' = 'check' then
        execute format('alter table %s add constraint drill_canon %s not valid', s->>'tbl', s->>'def');
        select regexp_replace(pg_get_constraintdef(k.oid), ' NOT VALID$', '') into v_def
        from pg_constraint k where k.conname = 'drill_canon' and k.conrelid = (s->>'tbl')::regclass;
        execute format('alter table %s drop constraint drill_canon', s->>'tbl');
        insert into drill_canon (kind, tbl, name, def) values ('check', s->>'tbl', s->>'name', v_def);
      else
        select string_agg(case when r = 'public' then 'public' else quote_ident(r) end, ', ')
          into v_roles from jsonb_array_elements_text(s->'roles') as r;
        execute format('create policy drill_canon on %s as %s for %s to %s%s%s',
                       s->>'tbl', s->>'permissive', s->>'cmd', v_roles,
                       case when s->>'qual' is not null then format(' using (%s)', s->>'qual') else '' end,
                       case when s->>'with_check' is not null then format(' with check (%s)', s->>'with_check') else '' end);
        select p.qual, p.with_check into v_qual, v_wc
        from pg_policies p
        where p.policyname = 'drill_canon' and format('%I.%I', p.schemaname, p.tablename) = s->>'tbl';
        execute format('drop policy drill_canon on %s', s->>'tbl');
        insert into drill_canon (kind, tbl, name, qual, with_check) values ('policy', s->>'tbl', s->>'name', v_qual, v_wc);
      end if;
    exception when others then
      insert into drill_canon (kind, tbl, name, error) values (s->>'kind', s->>'tbl', s->>'name', sqlstate);
    end;
  end loop;
end;
$$;

with
restored_checks as (
  select format('%I.%I', n.nspname, c.relname) as tbl, k.conname as name, pg_get_constraintdef(k.oid) as def
  from pg_constraint k
  join pg_class c on c.oid = k.conrelid
  join pg_namespace n on n.oid = c.relnamespace
  where k.contype = 'c' and n.nspname in ('auth', 'public', 'private')
),
restored_policies as (
  select format('%I.%I', schemaname, tablename) as tbl, policyname as name, qual, with_check
  from pg_policies
  where schemaname in ('auth', 'public', 'private')
),
checks as (
  select 'check' as kind, coalesce(s.tbl, r.tbl) as tbl, coalesce(s.name, r.name) as name,
         case
           when s.error is not null then 'source definition did not parse here (SQLSTATE ' || s.error || ')'
           when r.name is null then 'missing from the restored copy'
           when s.name is null then 'only in the restored copy'
           when s.def is distinct from r.def then 'definition differs'
         end as problem
  from (select * from drill_canon where kind = 'check') s
  full join restored_checks r on r.tbl = s.tbl and r.name = s.name
),
policies as (
  select 'policy' as kind, coalesce(s.tbl, r.tbl) as tbl, coalesce(s.name, r.name) as name,
         case
           when s.error is not null then 'source definition did not parse here (SQLSTATE ' || s.error || ')'
           when r.name is null then 'missing from the restored copy'
           when s.name is null then 'only in the restored copy'
           when s.qual is distinct from r.qual then 'USING expression differs'
           when s.with_check is distinct from r.with_check then 'WITH CHECK expression differs'
         end as problem
  from (select * from drill_canon where kind = 'policy') s
  full join restored_policies r on r.tbl = s.tbl and r.name = s.name
)
select kind, tbl, name, problem from checks where problem is not null
union all
select kind, tbl, name, problem from policies where problem is not null
union all
select 'count', (select count(*) from drill_canon)::text, '', ''
order by 1, 2, 3;
