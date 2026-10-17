# Stabilization step 4 — account deletion acceptance

Use a disposable Google test account on the PR Preview. Do not delete a real customer account or run deletion on the hosted Supabase project through automation.

1. Sign in, add a test apartment, and note its name. Confirm the deletion sheet clearly says what will be removed.
2. Cancel once. The account and apartment must remain.
3. Confirm deletion. The app must sign out and clear its browser copy only after the server succeeds.
4. Try returning with browser Back/Reload and the old unit URL. No account or unit data should appear.
5. Sign in with the second test account. Its data must be unchanged.

Record the Preview URL, date, and pass/fail for each step in the PR. CI's disposable database tests in `tests/db/rls.test.ts` prove the SQL behavior, including shared-org preservation and a stale token. They cannot prove Supabase Auth and Google behavior on the hosted project. Keep the PR draft and block private beta until both checks pass.

The shared-org test also guards `created_by`: deleting the original author must leave the apartment with a null author, as its foreign key specifies. Migration `20261012100000_preserve_fk_set_null.sql` permits that internal referential action while keeping ordinary client edits to `created_by` blocked.

Before an authorized merge, agree on a production backup and restore procedure. The migration is forward-only and must not be edited after push. After an authorized deployment, run the read-only `docs/verify_after_migration.sql` and `docs/verify_preserve_fk_set_null.sql` in the SQL editor and record every result. The second file checks the installed foreign key, update trigger, function guard, and direct column grant; it does not delete a user or prove hosted Auth behavior.
