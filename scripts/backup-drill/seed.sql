-- Synthetic data for the backup drill's self-test (drill.sh self-test). Never
-- runs against production: drill.sh loads it only into the throwaway source
-- container it has just created and migrated. No real person's data.
--
-- Two users sign up (the sign-up trigger creates profile, org, membership and
-- entitlements), each adds apartments as themselves through the units
-- trigger, and one answers the apartment-count question. Arabic text and an
-- apostrophe exercise the data hashes.

insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated',
   'drill-a@example.invalid', '{"provider":"google"}', '{"name":"Drill A"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated',
   'drill-b@example.invalid', '{"provider":"google"}', '{"name":"Drill B"}', now(), now());

do $$
declare
  u record;
  v_org uuid;
begin
  for u in select id from auth.users where email like 'drill-%@example.invalid' order by email loop
    select m.org_id into v_org from public.org_members m where m.user_id = u.id;
    perform set_config('request.jwt.claims', json_build_object('sub', u.id, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', u.id::text, true);
    set local role authenticated;
    insert into public.units (org_id, name, operating_model, calculator_inputs, engine_version)
    values
      (v_org, 'شقة التجمع ١', 'rental_arbitrage', '{"form": {}, "assumed": ["deposit"]}', '1.0.0'),
      (v_org, 'Drill''s chalet', 'managed_for_owner', '{"form": {}, "assumed": []}', '1.0.0');
    reset role;
  end loop;
end;
$$;

update public.profiles set apartment_count_answer = '2-3'
where user_id = '11111111-1111-4111-8111-111111111111';
