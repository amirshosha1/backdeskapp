-- Let the foreign key's ON DELETE SET NULL clear the author of a surviving
-- apartment when its former author deletes their account. Ordinary updates
-- still cannot change created_by or created_at.
create or replace function private.units_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not (pg_trigger_depth() > 1 and new.created_by is null) then
    new.created_by := old.created_by;
  end if;
  new.created_at := old.created_at;
  new.updated_at := now();
  return new;
end;
$$;
