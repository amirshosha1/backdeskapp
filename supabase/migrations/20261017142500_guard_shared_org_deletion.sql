-- Follow-up to 20261012100000_preserve_fk_set_null.sql. Keep the old migration
-- immutable: this one narrows the author exception and serializes account
-- deletion for every org the caller belongs to.

create or replace function private.units_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- A foreign-key SET NULL runs inside an auth.users trigger, after the
  -- referenced user has gone. An unrelated nested writer must not clear
  -- authorship while that user still exists.
  if pg_trigger_depth() > 1
     and old.created_by is not null
     and new.created_by is null then
    if not exists (select 1 from auth.users where id = old.created_by) then
      new.created_at := old.created_at;
      new.updated_at := now();
      return new;
    end if;
  end if;

  new.created_by := old.created_by;
  new.created_at := old.created_at;
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function private.units_before_update() from public, anon, authenticated;

create or replace function public.delete_my_account()
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

  -- Serialize deletion of members of the same org. After a waiting caller
  -- obtains the lock, later statements see the prior deletion at READ
  -- COMMITTED, so the last member deletes the org instead of orphaning it.
  perform 1
  from public.orgs o
  where exists (
    select 1 from public.org_members m
    where m.org_id = o.id and m.user_id = v_uid
  )
  order by o.id
  for update of o;

  -- Do not leave a shared org without an owner or admin. There is no
  -- self-service role transfer yet, so the caller must arrange one first.
  if exists (
    select 1
    from public.org_members mine
    where mine.user_id = v_uid
      and mine.role in ('owner', 'admin')
      and exists (
        select 1 from public.org_members other
        where other.org_id = mine.org_id and other.user_id <> v_uid
      )
      and not exists (
        select 1 from public.org_members manager
        where manager.org_id = mine.org_id
          and manager.user_id <> v_uid
          and manager.role in ('owner', 'admin')
      )
  ) then
    raise exception using errcode = 'P0001', message = 'shared_org_requires_owner_transfer';
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
  'Deletes the signed-in caller and sole-member orgs; serializes shared-org deletion and requires another owner or admin to remain.';
